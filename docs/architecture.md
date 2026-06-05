# Areeza — Architecture

> Areeza's system design. **Backend: Go. Web: Next.js.** Areeza's own pipeline — multi-issue Situation workspace, deterministic legal engine, Claude only where generation is required, local on-device classifier + RAG for routing and grounding.
> Read with [CLAUDE.md](../CLAUDE.md), [prd.md](prd.md), [legal-domain.md](legal-domain.md) (the legal IP), [model-plan.md](model-plan.md) (classifier + data), [deploy.md](deploy.md) (Coolify).

## 1. Principles

1. **Workflow, not chatbot.** Deterministic wherever possible; the model only where generation is genuinely required.
2. **Token/context discipline** (§5). Most pipeline steps never call Claude. A whole case costs a handful of model calls, not a growing chat.
3. **Legal structure is data, never generated.** The model fills slots; the engine owns the structure (jurisdiction, fee, limitation, required docs, citations).
4. **Stream the slow parts** so perceived latency stays low.

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | **Go** — chi router · gorilla/websocket · in-memory store today, Postgres 17 + **pgvector** provisioned | Areeza's own services |
| LLM | **Anthropic Go SDK** behind `server/pkg/llm.Provider` (caching, tools, structured output, streaming) | sonnet for intake/validate, opus for the document, haiku for cheap extraction |
| Classifier | **`services/classifier`** — bge-m3 + LR (tier-1, live) + LoRA Qwen2.5-1.5B on MLX (tier-2). Go keyword router + Claude+enum as fallbacks. | see [model-plan.md](model-plan.md) |
| RAG | **`services/rag`** — curated lex.uz corpus + bge-m3 NumPy index | cites real article numbers and lex.uz URLs |
| Web | Next.js 16 · React 19 · TS strict · Tailwind v4 · shadcn (Radix) · TipTap 3 | Areeza's own UI |
| PDF | server-side render (HTML → PDF) of the court document | print-correct layout |
| Deploy | **Docker Compose on Coolify** (web · api · classifier · rag · pgvector) — [areeza.uz](https://areeza.uz) | see [deploy.md](deploy.md) |

## 2b. Situation aggregate (multi-issue)

The workspace unit is a **`Situation`** JSON aggregate (in-memory demo; Postgres `jsonb` later):

- `issues[]` — each with `categoryCode`, `route`, `step`, `status`
- `documents[]` — each with `issueIds[]`, `destination` (forum), per-doc `validation`
- `parties[]`, `evidence[]`, `timeline[]`, `advisories[]` — linked via `issueIds[]`
- Shared `messages[]` intake thread

**AI brain:** `server/pkg/ai.Brain` interface + Claude implementation in `server/internal/ai/intake` (live) and `server/internal/ai/scripted` (deterministic demo fallback). Tools map 1:1 to WebSocket events the web client renders.

**Streaming event vocabulary:**
- `WS /ws/intake` (`brain.go`, `finalize.go`): `assistant_delta`, `fact`, `question` (+ optional `options`), `sources_proposed` (RAG articles + grounding prompt), `awaiting_confirmation`, `classified`, `issue_identified`, `route_proposed`, `active_issue`, `party_added`, `evidence_logged`, `timeline_event`, `advisory`, `document_proposed`, `next_action`, `done`, `error`.
- `WS /ws/draft` (`ws.go`): `section_start`, `chunk`, `section_done`, `done`, `error`.

Swap scripted → Anthropic without UI changes — the event shapes are the contract.

## 3. System overview

```
  Next.js web ──REST + WebSocket──▶  Go API
   (chat, workspace, doc viewer)        │
                                        ├─▶ Postgres + pgvector  (situations JSONB aggregate, legal_chunks)
                                        ├─▶ Claude (Anthropic)   (intake loop · draft · soft-validate)
                                        ├─▶ Classifier service   (/classify — the fine-tuned router)
                                        └─▶ Legal engine (in-proc) + RAG (pgvector)  (route · rules · citations)
```

## 4. The pipeline (Areeza's backend, in Go)

Each stage is a Go package. The **model is invoked in only three places** (marked 🧠); everything else is deterministic or a cheap service call.

| Stage | What | Model? |
|---|---|---|
| 1. Intake | WebSocket stream; tool-use loop (`ask_followup`, `record_fact`) extracts structured facts | 🧠 sonnet (bounded) |
| 2. Classify | text → `categoryCode` + `track` via the classifier service (Claude+enum fallback) | classifier (cheap) |
| 3. Route | `categoryCode` → court, fee rule, limitation, required docs, law refs | deterministic engine |
| 4. Collect | diff `required_facts` vs `case_facts` → ask only what's missing | deterministic |
| 5. Draft | template skeleton + slot-fill of the narrative `bayonnoma` + computed fields | 🧠 opus |
| 6. Validate | §6 rejection-ground rules → escalate only ambiguous items | rules → 🧠 sonnet (rare) |
| 7. Export | render the `da'vo arizasi` to a print-correct PDF package | deterministic |
| 8. Track | case status + next steps in the workspace | deterministic |

## 5. Token & context efficiency (read this carefully)

The product is LLM-heavy on the surface but should be **cheap and fast** underneath. Five levers:

**(a) Cost tiering — push work down the stack.**
Deterministic (free) → small classifier (≈0 Claude tokens) → Claude only for narrative draft + the rare soft-check. Routing, fee/limitation, required-docs, and most validation are **pure data** — zero model tokens.

**(b) Structured facts as context — never the transcript.**
Intake maintains typed `case_facts`. Each model turn receives a **compact structured state** (the facts + the single new user message + the list of still-missing fields) — **not** the growing chat history. Context stays small and *constant* regardless of how long the conversation runs. The `record_fact` tool is how state accretes; the transcript is for the UI, not the model.

**(c) Prompt caching.**
Cache the system prompt + the **legal knowledge block** (the template, the route's rules, and the top-k retrieved code articles) via Anthropic `cache_control`. It's large and static within a case → every subsequent call in that case is a cheap cache *read*. This is the single biggest saver for draft + validate.

**(d) RAG, not whole-corpus.**
Never stuff the codes into the prompt. Retrieve **top-k articles for the case's category** from pgvector, cache that block per route. The Labor Code is thousands of lines; a wage case needs ~5 articles.

**(e) Model selection + structured output.**
haiku/sonnet for cheap extraction and validation; **opus only for the final document**. All structured returns use Go structs / JSON-schema-constrained output so there's no reparse/retry loop.

> **Per-case budget (target):** ~1 short sonnet intake loop (cached system) + **0** routing tokens + **1** opus draft (cached legal block) + at most 1 short sonnet soft-validate. A "chatbot" that resends history would cost 5–10× more. Measure `cache_read` vs `input` tokens in logs and keep cache-hit > 80% within a case.

## 6. Workflows (state machines, not free chat)

- **Intake** = bounded state machine. `state = { phase, facts, missing[], routeId? }`. Each turn the model does exactly one of: ask the next missing fact (one focused question) or propose the route. Bounded output, small input → cheap and reliable.
- **Draft** = deterministic **template** (the CPC Art-189 skeleton from [legal-domain.md](legal-domain.md) §4) + **slot-fill**: the model writes only the narrative and computed fields. The legal structure is never model-generated → no hallucinated procedure.
- **Validate** = run the §6 rejection-ground rules in Go first (instant, free). Only genuinely ambiguous items ("is this evidence sufficient?") escalate to **one** Claude soft-pass. Most filings never hit the model here.

## 7. Data model

**Shipped: in-memory `map[id]json.RawMessage`** (`server/internal/store/store.go`) seeded from `server/internal/store/seed.json`. The shape is the **`Situation` aggregate** (one JSON blob per id) defined in [`server/internal/situation/model.go`](../server/internal/situation/model.go):

```go
type Situation struct {
    ID, Title, Status, Locale, Currency, ClaimAmount, ActiveIssueID string
    CreatedAt, UpdatedAt string
    Messages   []Message       // chat transcript (UI only)
    Facts      []Fact          // the model's real context (key/value/group)
    Issues     []Issue         // multi-issue: categoryCode, route, step, status
    Parties    []Party         // plaintiff, defendants, witnesses, third parties
    Evidence   []Evidence      // files, dates, status
    Timeline   []TimelineEvent // facts + deadlines
    Documents  []Document      // each → issueIds[], destination forum, validation
    Advisories []Advisory      // deadline_warning / evidence_gap / strategic_recommendation / …
    Readiness  Readiness       // documentsReady/Total · blockingAdvisoryIds · canExport
    StatusHistory []StatusEvent
}
```

**Provisioned, not yet wired: Postgres 17 + pgvector** (docker-compose). The persistence wave will move the aggregate to `situations(id pk, payload jsonb, updated_at)` and add `legal_chunks(id, article_ref, lang, text, embedding vector)` for the RAG step. `DATABASE_URL` is already routed to the API.

## 8. Legal knowledge & RAG

- **Ingest:** scrape the codes (lex.uz) → split by **article** → embed (multilingual) → store in `legal_chunks`. See [model-plan.md](model-plan.md) for sources + tools.
- **Retrieve:** per case category, pull top-k relevant articles → fold into the cached legal block used by draft + validate. This also **supplies the real article numbers/text** for citation (resolving the `[VERIFY]` items in [legal-domain.md](legal-domain.md)).
- **Engine vs RAG:** the deterministic route engine owns the *decision* (which court, fee, limitation, required docs — data); RAG supplies the *text* (article wording for the document + soft checks). Decisions never depend on a vector search.

## 9. API surface (Go) + the frontend contract

```
GET    /api/health
GET    /api/situations             — list summaries
GET    /api/situations/summary     — header counts
GET    /api/situations/{id}        — full Situation aggregate
DELETE /api/situations/{id}
POST   /api/classify               { situationId?, text } → Classification
POST   /api/route                  { categoryCode, facts } → LegalRoute
POST   /api/draft                  { situationId } → { document }
PUT    /api/documents              update sections
POST   /api/documents/regenerate   sectionId, instruction → Document
POST   /api/validate               { situationId, documentId } → ValidationResult
POST   /api/export                 { situationId } → { pdfUrl }
GET    /api/export/{id}.pdf        — rendered package
WS     /ws/intake                  streaming tool-loop
WS     /ws/draft                   streaming draft
```

**Contract-first parallel still holds**: the Go API shapes + the typed TS client (`packages/core`) are agreed first; the **web builds against a mock client** while the **Go backend implements** behind the same shapes. The contract is the boundary between the frontend and backend tracks.

## 10. Build & deploy

- **Backend:** Go modules, `make dev`. Currently an in-memory store (`server/internal/store`); Postgres+pgvector is provisioned in compose and `DATABASE_URL` is wired — persistence wave is the next step.
- **Web:** pnpm + Turborepo, `pnpm dev`.
- **Classifier:** [`services/classifier`](../services/classifier/) on **:8081**. Go calls `POST {CLASSIFIER_API_URL}/classify`; on unset URL, timeout, or non-200 → in-proc keyword router in `server/internal/legal/classify.go`; on miss again → Claude+enum.
- **RAG:** [`services/rag`](../services/rag/) on **:8082** (`POST /retrieve`). Wired into draft for real citations.
- **Deploy:** **Docker Compose on Coolify** — `web` (Next 16) + `api` (Go) public; `classifier` + `rag` + `postgres` (pgvector) internal. Domains: areeza.uz · api.areeza.uz. See [deploy.md](deploy.md).
- **Env:** `ANTHROPIC_API_KEY`, `DATABASE_URL`, `CLASSIFIER_API_URL` (optional), `RAG_API_URL` (optional), `PUBLIC_API_URL`, `PUBLIC_WEB_URL`. See [dev-setup.md](dev-setup.md) §3b for local commands, [deploy.md](deploy.md) for Coolify.

## 11. What's shipped vs. on deck

**Shipped:** the Situation aggregate, the multi-issue workspace, the full pipeline (intake → classify → route → draft → validate → export), the on-device classifier (tier-1 live, tier-2 trained), the RAG retrieval over a curated lex.uz corpus, server-rendered PDF export (via chromedp; placeholder fallback when Chrome is absent), Coolify deploy at [areeza.uz](https://areeza.uz).

**On deck:** Postgres persistence (today the store resets on restart), tier-2 classifier swap-in once it wins on eval, expanded RAG corpus beyond the labor flagship, real e-sud submission integration (today we produce + guide). See [development-plan.md](development-plan.md) §4.
