package ai

import "context"

// Event is a JSON-serializable intake stream event (matches packages/core IntakeEvent).
type Event map[string]any

// Brain streams tool-driven workspace updates for a situation.
type Brain interface {
	Stream(ctx context.Context, situationID string, userInput string) (<-chan Event, error)
}
