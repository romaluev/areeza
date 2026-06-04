package legal

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"
)

// categoryLabels mirrors the Uzbek labels used by the local keyword router so the
// remote (trained) classifier produces an identical Classification shape.
var categoryLabels = map[string]string{
	"labor.wage_recovery":  "Mehnat nizosi — ish haqini undirish",
	"labor.reinstatement":  "Mehnat nizosi — ishga qaytarish",
	"debt.recovery":        "Qarzni undirish",
	"consumer.dispute":     "Iste'molchi nizosi",
	"family.child_support": "Oila nizosi — aliment",
	"other":                "Boshqa turdagi nizo",
}

type remoteClassifyResp struct {
	CategoryCode string  `json:"categoryCode"`
	Confidence   float64 `json:"confidence"`
	Track        *string `json:"track"`
}

// ClassifyRemote calls the trained classifier service (CLASSIFIER_API_URL, e.g. the
// on-device bge-m3 router) and maps its result into the Classification contract.
// Returns ok=false on any error/timeout so the caller falls back to the local keyword
// router. Non-breaking: a no-op when CLASSIFIER_API_URL is unset.
func ClassifyRemote(text string) (Classification, bool) {
	base := os.Getenv("CLASSIFIER_API_URL")
	if base == "" {
		return Classification{}, false
	}
	body, _ := json.Marshal(map[string]string{"text": text})
	ctx, cancel := context.WithTimeout(context.Background(), 2500*time.Millisecond)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, base+"/classify", bytes.NewReader(body))
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

	label := categoryLabels[rc.CategoryCode]
	if label == "" {
		label = categoryLabels["other"]
	}
	track, trackLabel := "claim", "Da'vo tartibi"
	rationale := "Tasniflagich (bge-m3) natijasi."
	if rc.Track != nil {
		switch *rc.Track {
		case "order":
			track, trackLabel = "court_order", "Sud buyrug'i tartibi (nizosiz)"
			rationale = "Hisoblangan va nizosiz qarz — sud buyrug'i tartibida (FPK 170–178) yuritiladi."
		case "claim":
			track, trackLabel = "claim", "Da'vo tartibi (nizoli)"
			rationale = "Summa yoki holatlar nizoli — to'liq da'vo tartibida (FPK 189–191) yuritiladi."
		}
	}

	return withLevel(Classification{
		CategoryCode:   rc.CategoryCode,
		Label:          label,
		Confidence:     rc.Confidence,
		Track:          track,
		TrackLabel:     trackLabel,
		TrackRationale: rationale,
	}), true
}
