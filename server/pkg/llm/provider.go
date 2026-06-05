// Package llm is Areeza's small provider interface over the Anthropic Go SDK:
// prompt caching, tool use, structured output, streaming (CLAUDE.md tech stack).
package llm

import (
	"context"
	"encoding/json"
	"errors"
	"os"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

// Model tiers (CLAUDE.md: sonnet for the interactive intake loop + soft-validation,
// opus ONLY for the final court document, haiku for cheap extraction / enum classify).
const (
	ModelSonnet = "claude-sonnet-4-6"
	ModelOpus   = "claude-opus-4-8"
	ModelHaiku  = "claude-haiku-4-5"
)

// DefaultModel is the provider default (the interactive intake loop model).
const DefaultModel = ModelSonnet

// ToolCall is one tool_use block surfaced from a model turn.
type ToolCall struct {
	ID    string
	Name  string
	Input json.RawMessage
}

// TurnResult is the accumulated output of one streamed model turn.
type TurnResult struct {
	Text       string
	ToolCalls  []ToolCall
	StopReason string
}

// Tool describes a custom tool the model may call.
type Tool struct {
	Name        string
	Description string
	// Schema is the raw JSON-schema "properties" object.
	Schema   map[string]any
	Required []string
}

// CallOpts selects model + budget + caching per call without mutating the provider
// default. Zero values fall back to the provider model and a 1024-token budget.
type CallOpts struct {
	Model       string // "" → provider default
	MaxTokens   int64  // 0 → 1024
	System      string
	CacheSystem bool // cache the system block
	CacheTools  bool // cache the tool block
}

// Provider wraps the Anthropic client with the Areeza defaults.
type Provider struct {
	client anthropic.Client
	model  anthropic.Model
}

// New builds a provider from ANTHROPIC_API_KEY (+ optional CLAUDE_MODEL override).
func New() (*Provider, error) {
	key := os.Getenv("ANTHROPIC_API_KEY")
	if key == "" {
		return nil, errors.New("ANTHROPIC_API_KEY not set")
	}
	model := os.Getenv("CLAUDE_MODEL")
	if model == "" {
		model = DefaultModel
	}
	return &Provider{
		client: anthropic.NewClient(option.WithAPIKey(key)),
		model:  anthropic.Model(model),
	}, nil
}

// CachedTextBlock is a user-content text block with an ephemeral cache breakpoint.
// Use it for the legal block (template skeleton + route rules + retrieved articles)
// so re-drafting / regenerating the same situation hits the prompt cache.
func CachedTextBlock(s string) anthropic.ContentBlockParamUnion {
	b := anthropic.NewTextBlock(s)
	if b.OfText != nil {
		b.OfText.CacheControl = anthropic.CacheControlEphemeralParam{}
	}
	return b
}

// toolParams converts our Tool list into the SDK union, optionally caching the whole
// tool block (cache breakpoint on the last tool, so tools + system cache together).
func toolParams(tools []Tool, cache bool) []anthropic.ToolUnionParam {
	out := make([]anthropic.ToolUnionParam, 0, len(tools))
	for _, t := range tools {
		schema := anthropic.ToolInputSchemaParam{
			Properties: t.Schema,
			Required:   t.Required,
		}
		u := anthropic.ToolUnionParamOfTool(schema, t.Name)
		if t.Description != "" {
			u.OfTool.Description = anthropic.String(t.Description)
		}
		out = append(out, u)
	}
	if cache {
		if n := len(out); n > 0 && out[n-1].OfTool != nil {
			out[n-1].OfTool.CacheControl = anthropic.CacheControlEphemeralParam{}
		}
	}
	return out
}

// params builds the SDK request from CallOpts. The model/budget come from opts (with
// provider/default fallbacks); system + tools are cached per the opts flags.
func (p *Provider) params(opts CallOpts, tools []Tool, messages []anthropic.MessageParam) anthropic.MessageNewParams {
	model := p.model
	if opts.Model != "" {
		model = anthropic.Model(opts.Model)
	}
	maxTokens := opts.MaxTokens
	if maxTokens == 0 {
		maxTokens = 1024
	}
	params := anthropic.MessageNewParams{
		Model:     model,
		MaxTokens: maxTokens,
		Messages:  messages,
	}
	if opts.System != "" {
		sys := anthropic.TextBlockParam{Text: opts.System}
		if opts.CacheSystem {
			sys.CacheControl = anthropic.CacheControlEphemeralParam{}
		}
		params.System = []anthropic.TextBlockParam{sys}
	}
	if len(tools) > 0 {
		params.Tools = toolParams(tools, opts.CacheTools)
	}
	return params
}

// StreamTurn runs a single intake-style model turn on the provider default model:
// streams text deltas to onText (may be nil) and returns the accumulated text + tool
// calls. The system prompt + tool block are cached.
func (p *Provider) StreamTurn(
	ctx context.Context,
	system string,
	tools []Tool,
	messages []anthropic.MessageParam,
	onText func(string),
) (*TurnResult, error) {
	return p.StreamTurnOpts(ctx, CallOpts{
		System:      system,
		CacheSystem: true,
		CacheTools:  true,
	}, tools, messages, onText)
}

// StreamTurnOpts is StreamTurn with explicit model/budget/caching (CallOpts).
func (p *Provider) StreamTurnOpts(
	ctx context.Context,
	opts CallOpts,
	tools []Tool,
	messages []anthropic.MessageParam,
	onText func(string),
) (*TurnResult, error) {
	params := p.params(opts, tools, messages)

	stream := p.client.Messages.NewStreaming(ctx, params)
	var acc anthropic.Message
	for stream.Next() {
		ev := stream.Current()
		_ = acc.Accumulate(ev)
		if ev.Type == "content_block_delta" && ev.Delta.Text != "" && onText != nil {
			onText(ev.Delta.Text)
		}
	}
	if err := stream.Err(); err != nil {
		return nil, err
	}

	res := &TurnResult{StopReason: string(acc.StopReason)}
	for _, block := range acc.Content {
		switch block.Type {
		case "text":
			res.Text += block.Text
		case "tool_use":
			res.ToolCalls = append(res.ToolCalls, ToolCall{
				ID:    block.ID,
				Name:  block.Name,
				Input: block.Input,
			})
		}
	}
	return res, nil
}

// CallStructured forces exactly one tool call and returns its raw JSON input — the
// single "structured output into a Go struct" primitive (classify backup, draft
// slot-fill, soft-validate). Callers json.Unmarshal the result into a typed struct
// (CLAUDE.md: no hand-rolled JSON parsing of model output).
func (p *Provider) CallStructured(
	ctx context.Context,
	opts CallOpts,
	tool Tool,
	messages []anthropic.MessageParam,
) (json.RawMessage, error) {
	params := p.params(opts, []Tool{tool}, messages)
	params.ToolChoice = anthropic.ToolChoiceParamOfTool(tool.Name)

	msg, err := p.client.Messages.New(ctx, params)
	if err != nil {
		return nil, err
	}
	for _, block := range msg.Content {
		if block.Type == "tool_use" && block.Name == tool.Name {
			return block.Input, nil
		}
	}
	return nil, errors.New("llm: no tool_use block in structured response")
}
