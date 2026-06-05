# Handoff — RAG `/retrieve` contract (legal grounding for the draft step)

> **Status (post-shipment, 5 Jun 2026): wired.** Live in [`server/internal/legal/rag.go`](../server/internal/legal/rag.go), called from the draft step (`server/internal/api/ws.go` `DraftWS`) and from the intake `sources_proposed` event (`server/internal/ai/intake/finalize.go`).

The **draft step** fetches real, cited Uzbek law articles from the local RAG service ([`services/rag`](../services/rag)) and injects them into the document-generation context — replacing the hardcoded `LegalBasis` in `server/internal/legal/routes.go` and the `[VERIFY]` placeholders in [`legal-domain.md`](legal-domain.md). Everything runs on-device.

## Contract

```
POST {RAG_API_URL}/retrieve
Request:  { "categoryCode"?: string, "query"?: string, "k"?: number = 5 }
Response: { "articles": [ { code, source, article, title, text, url, score, verbatim_verified } ] }
```

- `source` ∈ `fpk | mehnat_kodeksi | soliq_kodeksi`. `article` may be `null` (number pending advisor
  confirmation). `verbatim_verified=false` means `text` is an accurate summary, not official verbatim text.
- `RAG_API_URL` defaults to `http://localhost:8082` (the laptop running `services/rag/serve.py`).

## Where it plugs into the Go pipeline

In the **draft** stage (`server/internal/api/ws.go:DraftWS` / `/api/draft`), before calling the LLM:
retrieve once per case by `categoryCode`, build the legal block, and pass it into the (prompt-cached)
system context. This is a deterministic enrichment step, like routing — not a model decision.

```go
// server/internal/legal/grounding.go  (sketch)
type Article struct {
    Code, Source, Article, Title, Text, URL string
    Score            float64
    VerbatimVerified bool `json:"verbatim_verified"`
}

func RetrieveArticles(ctx context.Context, categoryCode string, k int) ([]Article, error) {
    base := os.Getenv("RAG_API_URL") // e.g. http://localhost:8082
    if base == "" {
        return nil, nil // graceful: caller falls back to routes.go LegalBasis
    }
    body, _ := json.Marshal(map[string]any{"categoryCode": categoryCode, "k": k})
    req, _ := http.NewRequestWithContext(ctx, "POST", base+"/retrieve", bytes.NewReader(body))
    req.Header.Set("content-type", "application/json")
    cl := &http.Client{Timeout: 3 * time.Second}
    resp, err := cl.Do(req)
    if err != nil {
        return nil, err // caller falls back
    }
    defer resp.Body.Close()
    var out struct{ Articles []Article `json:"articles"` }
    if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
        return nil, err
    }
    return out.Articles, nil
}
```

```go
// in the draft handler, before generating:
arts, err := legal.RetrieveArticles(ctx, c.CategoryCode, 5)
if err != nil || len(arts) == 0 {
    arts = legalBasisFallback(c.CategoryCode) // existing routes.go strings as fallback
}
legalBlock := buildLegalBlock(arts) // "FPK 189-modda — Arizaning mazmuni: …  (lex.uz/…)"
// → inject legalBlock into the cached system prompt; the model cites these articles.
```

## Usage rules (compliance)

- The model must cite **only** retrieved articles — never invent statute numbers.
- Render the lex.uz `url` next to each citation so it's human-verifiable.
- Articles with `verbatim_verified=false` are fine to cite by number/title, but the UI/document should
  treat the summary as guidance pending official text (matches the `[VERIFY]` discipline).

## Env

```
RAG_API_URL=http://localhost:8082     # local dev; unset → fall back to routes.go LegalBasis
```
A local index can't run on Vercel — on-device is the point (privacy). Production: move to pgvector and a
hosted retrieve endpoint.
