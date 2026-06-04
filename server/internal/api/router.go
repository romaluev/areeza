package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/romaluev/areeza/server/internal/store"
)

func NewRouter(st *store.Store) http.Handler {
	h := &Handler{Store: st}
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	r.Get("/health", h.Health)

	r.Route("/api", func(r chi.Router) {
		r.Get("/cases", h.ListCases)
		r.Get("/cases/summary", h.CaseSummary)
		r.Get("/cases/{id}", h.GetCase)
		r.Delete("/cases/{id}", h.DeleteCase)
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
