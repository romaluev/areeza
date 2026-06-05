package intake

import (
	"encoding/json"

	"github.com/romaluev/areeza/server/internal/legal"
)

// pendingDraft is the finalize gate held between the "sources_proposed" turn and the
// user's confirm turn. It is stored under situationID:pending so the public Situation
// stays clean, and it caches the classify + RAG results so the confirm turn doesn't
// recompute them. (CLAUDE.md §5b: gate state is structured, not transcript.)
type pendingDraft struct {
	Finalize finalizeInput        `json:"finalize"`
	Class    legal.Classification `json:"class"`
	Articles []legal.Article      `json:"articles"`
	RagOK    bool                 `json:"ragOk"`
	Query    string               `json:"query"`
}

func pendingKey(situationID string) string { return situationID + ":pending" }

func loadPending(st Store, id string) (*pendingDraft, bool) {
	raw, ok := st.Get(pendingKey(id))
	if !ok || len(raw) == 0 {
		return nil, false
	}
	var p pendingDraft
	if json.Unmarshal(raw, &p) != nil {
		return nil, false
	}
	return &p, true
}

func savePending(st Store, id string, p *pendingDraft) {
	if raw, err := json.Marshal(p); err == nil {
		st.Put(pendingKey(id), raw)
	}
}

func clearPending(st Store, id string) {
	st.Delete(pendingKey(id))
}
