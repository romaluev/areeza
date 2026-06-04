package store

import (
	"encoding/json"
	"sync"
)

// Store holds case payloads as JSON (contract-aligned with @areeza/core).
type Store struct {
	mu    sync.RWMutex
	cases map[string]json.RawMessage
}

func New(initial map[string]json.RawMessage) *Store {
	if initial == nil {
		initial = make(map[string]json.RawMessage)
	}
	return &Store{cases: initial}
}

func (s *Store) List() []json.RawMessage {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]json.RawMessage, 0, len(s.cases))
	for _, v := range s.cases {
		out = append(out, v)
	}
	return out
}

func (s *Store) Get(id string) (json.RawMessage, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	v, ok := s.cases[id]
	return v, ok
}

func (s *Store) Put(id string, data json.RawMessage) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cases[id] = data
}

func (s *Store) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.cases[id]; !ok {
		return false
	}
	delete(s.cases, id)
	return true
}
