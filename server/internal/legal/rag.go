package legal

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"
)

// Article is one retrieved legal-grounding chunk (matches services/rag/serve.py).
type Article struct {
	Code             string  `json:"code"`
	Source           string  `json:"source"`
	Article          string  `json:"article"`
	Title            string  `json:"title"`
	Text             string  `json:"text"`
	URL              string  `json:"url"`
	Score            float64 `json:"score"`
	VerbatimVerified bool    `json:"verbatim_verified"`
}

type retrieveReq struct {
	Query        string `json:"query,omitempty"`
	CategoryCode string `json:"categoryCode,omitempty"`
	K            int    `json:"k"`
}

type retrieveResp struct {
	Articles []Article `json:"articles"`
}

// RetrieveArticles grounds a category/query in real lex.uz articles via the
// on-device RAG service (RAG_API_URL, e.g. http://localhost:8082). Returns
// (nil, false) on any error/timeout or when RAG_API_URL is unset, so callers
// degrade gracefully to the deterministic route alone. Mirrors ClassifyRemote.
func RetrieveArticles(categoryCode, query string, k int) ([]Article, bool) {
	base := os.Getenv("RAG_API_URL")
	if base == "" {
		return nil, false
	}
	if k <= 0 {
		k = 4
	}
	body, _ := json.Marshal(retrieveReq{Query: query, CategoryCode: categoryCode, K: k})
	ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, base+"/retrieve", bytes.NewReader(body))
	if err != nil {
		return nil, false
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, false
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, false
	}
	var rr retrieveResp
	if err := json.NewDecoder(resp.Body).Decode(&rr); err != nil {
		return nil, false
	}
	if len(rr.Articles) == 0 {
		return nil, false
	}
	return rr.Articles, true
}

// CitationLine renders an article as a short "Title (SOURCE moddasi N) — url" line
// suitable for legalBasis entries and advisory bodies.
func CitationLine(a Article) string {
	ref := a.Title
	if a.Article != "" {
		ref += " (" + a.Source + " " + a.Article + "-modda)"
	} else if a.Source != "" {
		ref += " (" + a.Source + ")"
	}
	return ref
}
