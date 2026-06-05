package legal

import "context"

// ClaudeEnumFunc is the cloud-backup classifier: a Claude structured-output call that
// returns the same Classification contract. Injected from the ai/classify package so
// the legal package stays provider-free. nil → the chain skips the Claude backup.
type ClaudeEnumFunc func(ctx context.Context, text string) (Classification, bool)

// Acceptance thresholds per tier. A tier result at/above its threshold (and not the
// catch-all "other") is trusted and stops the chain; otherwise it escalates.
const (
	tier1AcceptConfidence = 0.80
	tier2AcceptConfidence = 0.70
)

// Classifier orchestrates the real routing chain: on-device tier1 → tier2 → Claude
// cloud backup → deterministic keyword floor. It is the single source of truth for
// classification (shared by the /api/classify handler and the intake finalize step).
type Classifier struct {
	Tier1URL string         // CLASSIFIER_API_URL (bge-m3 + LogReg)
	Tier2URL string         // CLASSIFIER_TIER2_URL (Qwen-LoRA); "" → skip tier2
	Backup   ClaudeEnumFunc // Claude-enum; nil → skip (e.g. no API key)
}

// Classify runs the chain and always returns a valid Classification (keyword router is
// the floor). It keeps the best sub-threshold tier result so a confident-but-just-under
// tier still beats a keyword "other".
func (c *Classifier) Classify(ctx context.Context, text string) Classification {
	var best Classification
	haveBest := false
	consider := func(r Classification) {
		if !haveBest || r.Confidence > best.Confidence {
			best, haveBest = r, true
		}
	}

	if r, ok := classifyAt(ctx, c.Tier1URL, text); ok {
		r.Engine = "tier1"
		if r.Confidence >= tier1AcceptConfidence && r.CategoryCode != "other" {
			return withLevel(r)
		}
		consider(r)
	}

	if c.Tier2URL != "" {
		if r, ok := classifyAt(ctx, c.Tier2URL, text); ok {
			r.Engine = "tier2"
			if r.Confidence >= tier2AcceptConfidence && r.CategoryCode != "other" {
				return withLevel(r)
			}
			consider(r)
		}
	}

	if c.Backup != nil {
		if r, ok := c.Backup(ctx, text); ok && r.CategoryCode != "other" {
			r.Engine = "claude"
			return withLevel(r)
		}
	}

	// Deterministic floor. Prefer a confident sub-threshold tier hit over a keyword
	// "other" (the on-device model saw signal the keyword router missed).
	kw := ClassifyText(text)
	kw.Engine = "keyword"
	if haveBest && kw.CategoryCode == "other" && best.CategoryCode != "other" {
		return withLevel(best)
	}
	return kw
}
