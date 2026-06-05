# Areeza — Development Plan

> **Audience:** the build team + their coding agents.
> **Read with:** [conventions.md](conventions.md) (naming + isolation), [architecture.md](architecture.md) (the Go system + token discipline), [ui-guide.md](ui-guide.md) (frontend), [legal-domain.md](legal-domain.md) (legal IP), [model-plan.md](model-plan.md) (classifier + data), [deploy.md](deploy.md).
> **Principle:** **contract-first parallelism.** The Go API shapes + the typed TS client are the boundary; tracks build behind them in parallel. **Edit only the folders you own.**

## 1. Team & ownership

Ownership is by **folder** — the main way we avoid conflicts. Not in your column → don't edit it; request it.

| Person | Role | **Owns** |
|---|---|---|
| **Rakhmatillo** | Founder · CEO · lead & architect | the **contract** (API shapes in `server/internal/api` + TS client types in `packages/core`), integration, deploy, `/docs`, the pitch |
| **Mukhammadxoja** | CTO · AI / model training + scraping | `services/classifier`, `services/rag`, model training (tier-1 bge-m3+LR, tier-2 Qwen LoRA), lex.uz scraping/ingest |
| **Abdulboriy** | SWE · frontend | `apps/web`, `packages/ui` |
| **Shoxdiyor** | COO | pitch, mentor prep, go-to-market, market validation (non-code) |
| **Saloxiddin** | Growth | video, SMM, traction (non-code) |
| **Advisor: Anvarjon Abdullajonov** | Oliy Sud Dev Team Leader | procedural fidelity, advisor-verified article numbers, integration path |

Backend Go services (`server/`) — Rakhmatillo + Mukhammadxoja split by package on demand; the AI sidecars (`services/classifier`, `services/rag`) are Mukhammadxoja's.

## 2. The parallelization strategy

```
        server/internal/api  (Go API shapes)  ──┐ defines the CONTRACT
        packages/core        (typed TS client) ─┘
              ▲                              ▲
   Go BACKEND │ implements                   │ consumes  FRONTEND
   (CTO + AI-SWE)                            │ (FE-SWE, against mock)
                       packages/core/api: client.ts · mock.ts · fixtures.ts
```

1. **Phase 0** (CEO + CTO): scaffold + the **API contract** + a **typed TS client with a mock** returning the unpaid-salary fixture.
2. **Frontend builds the whole UI against the mock** (never blocked). **Backend implements the real Go API** behind the same shapes.
3. **Integration = point the client at the live API** (one base-URL/flag). Same shapes → it just works.

## 3. The contract (frozen — see [architecture.md](architecture.md) §9 for the full surface)

The boundary is the **Go HTTP/WS API** + a **typed TS client** in `packages/core`. Live routes:

| Route | Request → Response |
|---|---|
| `GET /api/situations` (+ `/summary`, `/{id}`, `DELETE /{id}`) | Situation CRUD |
| `POST /api/classify` | `{ situationId?, text }` → `Classification` |
| `POST /api/route` | `{ categoryCode, facts }` → `LegalRoute` |
| `POST /api/draft` | `{ situationId }` → `{ document }` |
| `PUT /api/documents` · `POST /api/documents/regenerate` | document edits |
| `POST /api/validate` | `{ situationId, documentId }` → `ValidationResult` |
| `POST /api/export` (+ `GET /api/export/{id}.pdf`) | filing package |
| `WS /ws/intake`, `WS /ws/draft` | streaming |

Domain types (`Situation`, `Issue`, `Party`, `Evidence`, `Document`, `Advisory`, `ValidationResult`, `LegalRoute`, `Classification`) live as Go structs in `server/internal/{situation,legal}` and mirrored zod types in `packages/core/src/types`. Changing a contract = tiny PR + ping.

## 4. What's shipped vs. what's left (as of 5 Jun 2026, the day before the final)

### ✅ Shipped (CP1 + CP2)
- **Foundation** — Go server (chi · gorilla/websocket · in-memory store), Next.js web shell, pnpm/turbo monorepo, CI, `make preflight`.
- **Contract** — typed TS client (`packages/core`) with `mock | real` mode switch; full Situation aggregate types mirrored in Go.
- **Pipeline (Go)** — `WS /ws/intake` + `/ws/draft` streaming; `/classify`, `/route`, `/draft`, `/validate`, `/export`, `/documents`, `/situations` CRUD all wired (`server/internal/api`).
- **AI brain** — Anthropic Go SDK behind `server/pkg/llm.Provider`; intake brain, draft, validate soft-pass, classify, scripted demo all in `server/internal/ai/*`.
- **Legal engine** — categories/routes/templates/validation as typed Go data in `server/internal/legal`; deterministic-first validation per CPC return grounds.
- **Classifier** — `services/classifier` shipped: tier-1 bge-m3 + LR (~0.94 macro-F1) **live**, tier-2 LoRA Qwen2.5-1.5B-Instruct **trained** (head-to-head pending). Keyword + Claude+enum fallbacks always on.
- **RAG** — `services/rag` shipped: curated lex.uz corpus + bge-m3 NumPy index; `/retrieve` returns real article numbers + URLs; wired into draft.
- **PDF / package export** — server-side render in `server/internal/export`.
- **Frontend** — design system, Situation workspace, intake chat, document viewer (TipTap), validation panel, export, landing.
- **Deploy** — Docker Compose on Coolify (web · api · classifier · rag · pgvector). [areeza.uz](https://areeza.uz) live.

### 🚧 On deck (final-prep + post-hackathon)
- **Demo dry-run** vs. [demo-script.md](demo-script.md) — Roma + team.
- **Persistence** — Postgres+pgvector schema + sqlc queries (DATABASE_URL is wired; today the store resets on restart).
- **Verbatim verification** — confirm 3 article numbers + swap in official lex.uz text (see [model-plan.md](model-plan.md) §7).
- **Real anonymized filings** — retrain classifier + extend RAG corpus once advisor shares them.
- **Tier-2 swap-in** if it wins head-to-head on eval.
- **Real e-sud submission** integration (today we produce + guide, not submit).
- **Expand beyond labor flagship** — corpus + UI for fraud / consumer / family / admin tracks.

## 7. Conflict-avoidance (full detail in [conventions.md](conventions.md))

1. **Edit only your folders** (§1). 2. **Contracts are shared** — tiny PR + ping. 3. **Branch per task** (`be/…`, `a/…`, `f/…`), small PRs, merge often. 4. **Mock first** — FE never waits for BE. 5. **Keep `main` runnable** (Go vet/test + web typecheck/lint). 6. **Agents:** one task per agent, scoped to its `paths`; git worktrees for parallel file-mutating agents.
