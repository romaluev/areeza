# Areeza — Development Plan

> **Audience:** the build team + their coding agents.
> **Read with:** [conventions.md](conventions.md) (naming + isolation), [architecture.md](architecture.md) (the Go system + token discipline), [ui-guide.md](ui-guide.md) (frontend), [legal-domain.md](legal-domain.md) (legal IP), [model-plan.md](model-plan.md) (classifier + data).
> **Principle:** **contract-first parallelism.** Agree the Go API + the typed TS client *once*, then each track builds behind it — frontend on a mock, backend in Go. **Edit only the folders you own.**

## 1. Team & ownership

Ownership is by **folder** — the main way we avoid conflicts. Not in your column → don't edit it; request it.

| Person | Role | **Owns** |
|---|---|---|
| **Rakhmatillo** | Founder / CEO · lead & architect | the **contract** (API shapes in `server/internal/api` + the TS client types in `packages/core`), integration, deploy, `/docs`, the pitch |
| **Mukhammadxoja** | CTO · backend core | `server/cmd`, `server/internal/api`, `server/internal/pipeline` (orchestration), `server/pkg/{llm,db}` |
| **Saloxiddin** | SWE · AI / legal / model | `server/internal/legal` (the engine), `services/scraper`, `services/classifier`, RAG ingestion, the prompts |
| **Abdulboriy** | SWE · frontend | `apps/web`, `packages/ui` |
| **Shoxdiyor** | COO | pitch, mentor prep, go-to-market, market validation (non-code) |
| **Advisors** (Anvarjon, Jasur) | Supreme Court dev/IT engineers | authoritative article numbers, real anonymized data, the integration path, legal sign-off |

> The two **backend** owners (CTO, AI-SWE) split by package: CTO owns the **plumbing** (server, LLM provider, pipeline orchestration, DB, API); AI-SWE owns the **domain brain** (legal engine, scraping, RAG, classifier, prompts). They meet at the pipeline interface.

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

## 3. The contract (define FIRST, then freeze)

The boundary is the **Go HTTP/WS API** + a **typed TS client** in `packages/core`. Document each endpoint's request/response once; the mock returns fixtures.

| Route | Owner | Request → Response |
|---|---|---|
| `WS /ws/intake` | CTO | stream; tools `record_fact`/`ask_followup` → `{ caseId, facts, nextQuestion?, done }` |
| `POST /api/classify` | AI-SWE | `{ caseId?, text }` → `{ categoryCode, confidence, track }` |
| `POST /api/route` | AI-SWE | `{ categoryCode, facts }` → `LegalRoute` |
| `POST /api/draft` | CTO+AI-SWE | `{ caseId }` → `{ document }` |
| `POST /api/validate` | AI-SWE | `{ caseId, documentId }` → `{ checks[], canFile }` |
| `POST /api/export` | CTO | `{ caseId }` → `{ pdfUrl }` |
| `GET/POST /api/cases` | CTO | case CRUD |

Domain types (`Case`, `CaseFacts`, `LegalRoute`, `GeneratedDocument`, `ValidationResult`, `Category`) live once as Go structs **and** mirrored TS types in `packages/core`. Changing a contract = a tiny PR + a ping.

## 4. Phases & tasks

Card: **`ID` — owner — goal · `paths` · depends · done-when.** [CP target].

### Phase 0 — Foundation (CEO + CTO; blocks everything) — [CP1→CP2]
- **P0.1** — CTO — Go server skeleton: chi + pgx/sqlc + Postgres+pgvector (docker-compose), a `/health` route. · `server/*` · — · **done:** `make dev` serves; migrations run.
- **P0.2** — FE-SWE — Next.js web shell (App Router, Tailwind, shadcn), adapting notiky's layout. · `apps/web/*` · — · **done:** `pnpm dev` serves a blank shell.
- **P0.3** — CEO — The **contract**: API shapes + `packages/core` TS client + `mock.ts` + `fixtures.ts` (unpaid-salary). · `server/internal/api/types`, `packages/core/*` · P0.1 · **done:** the client returns contract-valid mock data for every endpoint.
- **P0.4** — CEO — Env + Postgres + `ANTHROPIC_API_KEY` + `CLASSIFIER_API_URL`; CI (Go test/vet + web typecheck/lint). · `.env.example`, `.github/` · — · **done:** PRs run green.

### Track BE — Mukhammadxoja (backend plumbing) — [CP2]
- **BE1** — LLM provider in Go: Anthropic SDK behind a small interface (caching, tools, structured output, streaming). · `server/pkg/llm/*` · P0.1 · **done:** a typed structured-output call + a streaming call work; prompt-cache hints wired.
- **BE2** — `WS /ws/intake`: streaming tool-loop (`ask_followup`, `record_fact`); **context = structured facts, not transcript** (architecture §5b). · `server/internal/api/intake`, `server/internal/pipeline/intake` · BE1 · **done:** one-question-at-a-time UZ/RU intake fills `CaseFacts`.
- **BE3** — `/api/draft`: template + slot-fill (opus), cached legal block. · `server/internal/pipeline/draft` · BE1, A1 · **done:** outputs the `da'vo arizasi` per legal-domain §4, structure not invented.
- **BE4** — `/api/export`: render the document → print-correct PDF. · `server/internal/pipeline/export` · BE3 · **done:** downloadable package.
- **BE5** — DB + cases CRUD + persistence (sqlc). · `server/pkg/db`, `server/internal/api/cases` · P0.1 · **done:** cases/facts/docs persist.
- **BE6** — Deploy (Railway/Fly + managed Postgres). · — · BE2–BE5 · **done:** public API URL.

### Track AI — Saloxiddin (legal brain + model) — [CP2]
- **A1** — Legal engine: categories/routes/templates/validation as typed Go data from legal-domain §3–§6. · `server/internal/legal/*` · P0.3 · **done:** `Route("labor.wage_recovery")` returns the full route; zero model calls.
- **A2** — `/api/classify`: Claude+enum first; same contract. · `server/internal/pipeline/classify` · A1, BE1 · **done:** unpaid-salary text → correct category + track.
- **A3** — `/api/route` + `/api/validate` (deterministic §6 rules → rare Claude soft-pass). · `server/internal/pipeline/{route,validate}` · A1 · **done:** route + the rejection-risk checklist.
- **A4** — Scraper: lex.uz codes + sud.uz decisions → `data/*` (model-plan §2). · `services/scraper/*` · — · **done:** codes article-chunked; resolves the `[VERIFY]` numbers (advisor-confirmed).
- **A5** — RAG ingestion: embed code articles → `legal_chunks` (pgvector); retrieval per category. · `services/scraper`, `server/pkg/db` · A4 · **done:** top-k articles fetched for a case.
- **A6** — Classifier: synthetic+real dataset → train → serve behind `CLASSIFIER_API_URL` (model-plan). · `services/classifier/*` · A4 · **done:** fine-tuned router live; Claude fallback intact.

### Track FE — Abdulboriy (frontend, against the mock) — [CP2]
- **F1** — Design system in `packages/ui` (tokens, Button/Card/Input/Badge/Dialog/Tabs/Skeleton; shadcn + fluid-functionalism motion, see ui-guide). · `packages/ui/*` · P0.2 · **done:** primitives render light+dark.
- **F2** — App shell + case list (from the mock client). · `apps/web/app/(app)/*` · F1, P0.3 · **done:** sidebar + case list render.
- **F3** — Intake chat (`message-list`, `message-bubble`, `prompt-box`) on `/ws/intake` (mock). · `apps/web/components/intake/*` · F1 · **done:** type the unpaid-salary line → streamed Q&A → facts panel fills.
- **F4** — Case workspace (two-pane) + `RouteCard` + `FactsPanel`. · `apps/web/components/workspace/*` · F2 · **done:** chat/facts left; route/doc/validation tabs right.
- **F5** — Document viewer (TipTap) — renders `GeneratedDocument` as a real court `da'vo arizasi`. · `apps/web/components/document/*` · F1 · **done:** authentic serif layout, editable.
- **F6** — Validation panel + export UI. · `apps/web/components/{validation,export}/*` · F1 · **done:** pass/warn/fail checklist + "download package".
- **F7** — Landing page (on-message with the pitch). · `apps/web/app/(marketing)/*` · F1 · **done:** problem → solution → demo CTA.

### Integration — all — [CP2/Final]
- **I1** point the client at the real API; run unpaid-salary end-to-end. **I2** states polish + UZ/RU copy. **I3** deploy + clean GitHub. **I4** demo dry-run vs [demo-script.md](demo-script.md).

## 5. Sequencing vs. checkpoints

- **CP1:** narrative + the [web pitch](../pitch/index.html) + extract mentor objections; meanwhile P0 + A1 + F1 kick off.
- **CP1 → CP2 (the leap):** BE2–BE4 + A1–A3 + F2–F6 + I1 = a working end-to-end demo; + A6 classifier; + I3 deploy. This visible delta is what the rubric pays for.
- **Final:** I2/I4 polish + the 7-minute pitch+demo.

## 6. Start here (first hour)

- **CEO (Rakhmatillo):** P0.3 (the contract + mock) — it unblocks everyone — then P0.4.
- **CTO (Mukhammadxoja):** P0.1 (Go skeleton), then BE1 (LLM provider).
- **AI-SWE (Saloxiddin):** **A1** (legal engine — pure data, zero deps) the moment legal-domain is read; queue A4 (scrape).
- **FE-SWE (Abdulboriy):** P0.2 then F1, building F3 against the mock.

## 7. Conflict-avoidance (full detail in [conventions.md](conventions.md))

1. **Edit only your folders** (§1). 2. **Contracts are shared** — tiny PR + ping. 3. **Branch per task** (`be/…`, `a/…`, `f/…`), small PRs, merge often. 4. **Mock first** — FE never waits for BE. 5. **Keep `main` runnable** (Go vet/test + web typecheck/lint). 6. **Agents:** one task per agent, scoped to its `paths`; git worktrees for parallel file-mutating agents.
