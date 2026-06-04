package store

import (
	"encoding/json"
	"sync"
)

// SituationStore holds situation aggregates as JSON (contract matches packages/core).
type SituationStore struct {
	mu         sync.RWMutex
	situations map[string]json.RawMessage
}

func NewSituationStore(initial map[string]json.RawMessage) *SituationStore {
	if initial == nil {
		initial = map[string]json.RawMessage{}
	}
	return &SituationStore{situations: initial}
}

func (s *SituationStore) List() []json.RawMessage {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]json.RawMessage, 0, len(s.situations))
	for _, v := range s.situations {
		out = append(out, v)
	}
	return out
}

func (s *SituationStore) Get(id string) (json.RawMessage, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	v, ok := s.situations[id]
	return v, ok
}

func (s *SituationStore) Put(id string, data json.RawMessage) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.situations[id] = data
}

func (s *SituationStore) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.situations[id]; !ok {
		return false
	}
	delete(s.situations, id)
	return true
}
