package api

import (
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/romaluev/areeza/server/internal/ai/draft"
	"github.com/romaluev/areeza/server/internal/ai/intake"
	"github.com/romaluev/areeza/server/internal/legal"
	"github.com/romaluev/areeza/server/internal/store"
	"github.com/romaluev/areeza/server/pkg/llm"
)

func NewRouter(st *store.Store, brain *intake.Brain, classifier *legal.Classifier, drafter *draft.Drafter, provider *llm.Provider) http.Handler {
	h := &Handler{Store: st, Brain: brain, Classifier: classifier, Drafter: drafter, Provider: provider}
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins(),
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	r.Get("/health", h.Health)

	r.Route("/api", func(r chi.Router) {
		r.Get("/situations", h.ListSituations)
		r.Get("/situations/summary", h.SituationSummary)
		r.Get("/situations/{id}", h.GetSituation)
		r.Patch("/situations/{id}/issues/{issueId}", h.MoveIssue)
		r.Delete("/situations/{id}", h.DeleteSituation)
		r.Post("/classify", h.Classify)
		r.Post("/route", h.Route)
		r.Post("/validate", h.Validate)
		r.Post("/export", h.Export)
		r.Get("/export/{caseId}.pdf", h.ExportPDF)
		r.Post("/draft", h.Draft)
		r.Put("/documents", h.UpdateDocument)
		r.Post("/documents/regenerate", h.RegenerateSection)
	})

	r.Get("/ws/intake", h.IntakeWS)
	r.Get("/ws/draft", h.DraftWS)

	return r
}

// allowedOrigins returns the CORS allowlist. Local dev origins are always
// permitted; production origins are appended from CORS_ALLOWED_ORIGINS
// (comma-separated, e.g. "https://areeza.uz,https://www.areeza.uz").
func allowedOrigins() []string {
	origins := []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	if v := os.Getenv("CORS_ALLOWED_ORIGINS"); v != "" {
		for _, o := range strings.Split(v, ",") {
			if o = strings.TrimSpace(o); o != "" {
				origins = append(origins, o)
			}
		}
	}
	return origins
}
