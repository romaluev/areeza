package legal

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"
)

type remoteClassifyResp struct {
	CategoryCode string  `json:"categoryCode"`
	Confidence   float64 `json:"confidence"`
	Track        *string `json:"track"`
	Rationale    string  `json:"rationale"`
	Engine       string  `json:"engine"`
}

// classifyAt calls one classifier service tier at baseURL (e.g. the on-device bge-m3
// router on :8081 or the Qwen-LoRA tier on :8083) and maps its result into the shared
// Classification contract via Compose. Returns ok=false on any error/timeout so the
// chain can escalate to the next tier. Does NOT set ConfidenceLevel — the chain does.
func classifyAt(ctx context.Context, baseURL, text string) (Classification, bool) {
	if baseURL == "" {
		return Classification{}, false
	}
	body, _ := json.Marshal(map[string]string{"text": text})
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/classify", bytes.NewReader(body))
	if err != nil {
		return Classification{}, false
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return Classification{}, false
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return Classification{}, false
	}
	var rc remoteClassifyResp
	if err := json.NewDecoder(resp.Body).Decode(&rc); err != nil {
		return Classification{}, false
	}

	track := ""
	if rc.Track != nil {
		track = *rc.Track
	}
	return Compose(rc.CategoryCode, rc.Confidence, track, rc.Rationale), true
}

// ClassifyRemote is the legacy single-tier helper (reads CLASSIFIER_API_URL). Kept as
// a thin back-compat wrapper; the live path uses Classifier.Classify (classify_chain.go).
func ClassifyRemote(text string) (Classification, bool) {
	c, ok := classifyAt(context.Background(), os.Getenv("CLASSIFIER_API_URL"), text)
	if !ok {
		return Classification{}, false
	}
	return withLevel(c), true
}
