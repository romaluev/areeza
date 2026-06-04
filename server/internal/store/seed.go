package store

import (
	"encoding/json"
	"fmt"
	"os"
)

type seedFile struct {
	Cases []json.RawMessage `json:"cases"`
}

// LoadSeed reads seed.json (generated from packages/core fixtures).
func LoadSeed(path string) (map[string]json.RawMessage, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var sf seedFile
	if err := json.Unmarshal(b, &sf); err != nil {
		return nil, err
	}
	out := make(map[string]json.RawMessage, len(sf.Cases))
	for _, raw := range sf.Cases {
		var meta struct {
			ID string `json:"id"`
		}
		if err := json.Unmarshal(raw, &meta); err != nil || meta.ID == "" {
			return nil, fmt.Errorf("seed case missing id")
		}
		out[meta.ID] = raw
	}
	return out, nil
}
