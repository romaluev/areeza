package scripted

import (
	"context"
	"time"

	"github.com/romaluev/areeza/server/internal/legal"
	"github.com/romaluev/areeza/server/pkg/ai"
)

// Brain is a scripted stand-in until the real Anthropic provider ships.
type Brain struct{}

func New() *Brain { return &Brain{} }

func (b *Brain) Stream(ctx context.Context, situationID string, userInput string) (<-chan ai.Event, error) {
	ch := make(chan ai.Event)
	go func() {
		defer close(ch)
		_ = legal.ClassifyText(userInput)
		steps := []ai.Event{
			{"type": "assistant_delta", "delta": "Tahlil qilindi. "},
			{"type": "done", "situationId": situationID},
		}
		for _, ev := range steps {
			select {
			case <-ctx.Done():
				return
			case ch <- ev:
			}
			time.Sleep(350 * time.Millisecond)
		}
	}()
	return ch, nil
}
