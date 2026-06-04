# Areeza — Architecture

> Areeza's system design. **Backend: Go. Web: Next.js.** The web adapts notiky-app's chat/editor/workspace UI; the backend is Areeza's own — a legal-filing pipeline. Where a proven pattern exists in notiky-app (the LLM provider + streaming layer), **study it and reimplement for our domain** — don't copy blindly.
> Read with [CLAUDE.md](../CLAUDE.md), [prd.md](prd.md), [legal-domain.md](legal-domain.md) (the legal IP), [model-plan.md](model-plan.md) (classifier + data).

## 1. Principles

1. **Workflow, not chatbot.** Deterministic wherever possible; the model only where generation is genuinely required.
2. **Token/context discipline** (§5). Most pipeline steps never call Claude. A whole case costs a handful of model calls, not a growing chat.
3. **Legal structure is data, never generated.** The model fills slots; the engine owns the structure (jurisdiction, fee, limitation, required docs, citations).
4. **Stream the slow parts** so perceived latency stays low.

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | **Go** — chi router · pgx + sqlc · Postgres 17 + **pgvector** · WebSocket (streaming) | Areeza's own services |
| LLM | **Anthropic Go SDK** behind a small provider interface (prompt caching, tool use, structured output, streaming) | the *shape* to learn from notiky-app's `server/pkg/llm`; reimplement lean |
| Classifier | small model served over HTTP behind `/classify` | see [model-plan.md](model-plan.md) |
| Web | Next.js 16 · React 19 · TS · Tailwind v4 · shadcn · TipTap | chat/editor/workspace **adapted from notiky-app** |
| PDF | server-side render (HTML → PDF) of the court document | print-correct layout |
| Deploy | Go on Railway/Fly · Postgres managed · web on Vercel | |

## 2b. Situation aggregate (multi-issue)

The workspace unit is a **`Situation`** JSON aggregate (in-memory demo; Postgres `jsonb` later):

- `issues[]` — each with `categoryCode`, `route`, `step`, `status`
- `documents[]` — each with `issueIds[]`, `destination` (forum), per-doc `validation`
- `parties[]`, `evidence[]`, `timeline[]`, `advisories[]` — linked via `issueIds[]`
- Shared `messages[]` intake thread

**AI brain interface:** `server/pkg/ai.Brain` + `server/internal/ai/scripted` (demo). Tools map 1:1 to WebSocket events (`issue_identified`, `document_proposed`, `advisory`, …). Swap scripted → Anthropic without UI changes.

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

## 7. Data model (Postgres + pgvector)

```sql
profiles(id → auth, full_name, locale default 'uz')
cases(id, user_id, title, status, category_code, route_id, claim_amount, currency, created_at, updated_at)
case_messages(id, case_id, role, content, created_at)          -- chat transcript (UI only)
case_facts(id, case_id, key, value jsonb, source)              -- the model's real context
documents(id, case_id, type, title, content_md, pdf_url, status, version)
validations(id, case_id, document_id, checks jsonb, can_file bool, created_at)
attachments(id, case_id, name, storage_path, kind)
legal_categories(code pk, name_uz, name_ru, description)        -- + routes/templates (start as code constants)
legal_chunks(id, source, article_ref, lang, text, embedding vector)  -- RAG over the codes
```

## 8. Legal knowledge & RAG

- **Ingest:** scrape the codes (lex.uz) → split by **article** → embed (multilingual) → store in `legal_chunks`. See [model-plan.md](model-plan.md) for sources + tools.
- **Retrieve:** per case category, pull top-k relevant articles → fold into the cached legal block used by draft + validate. This also **supplies the real article numbers/text** for citation (resolving the `[VERIFY]` items in [legal-domain.md](legal-domain.md)).
- **Engine vs RAG:** the deterministic route engine owns the *decision* (which court, fee, limitation, required docs — data); RAG supplies the *text* (article wording for the document + soft checks). Decisions never depend on a vector search.

## 9. API surface (Go) + the frontend contract

```
WS   /ws/intake            stream; tools record facts; emits case state + next question
POST /api/classify         { caseId?, text } → { categoryCode, confidence, track }
POST /api/route            { categoryCode, facts } → LegalRoute
POST /api/draft            { caseId } → { document }
POST /api/validate         { caseId, documentId } → { checks[], canFile }
POST /api/export           { caseId } → { pdfUrl }
GET/POST /api/cases ...     case CRUD
```

**Contract-first parallel still holds** (see [development-plan.md](development-plan.md)): the Go API shapes + a typed TS client are agreed first; the **web builds against a mock client** while the **Go backend implements** behind the same shapes. The contract is the boundary between the frontend and backend tracks.

## 10. Build & deploy

- **Backend:** Go modules, `make dev` (server + Postgres via docker-compose), sqlc-generated queries, migrations. Deploy to Railway/Fly.
- **Web:** pnpm + Turborepo, `pnpm dev`, deploy to Vercel.
- **Classifier:** separate small service (Railway/Render) behind `CLASSIFIER_API_URL`; Claude+enum fallback so `/classify` always works.
- **Env:** `ANTHROPIC_API_KEY`, `DATABASE_URL`, `CLASSIFIER_API_URL`, storage keys.

## 11. How to build it (sequence)

1. Stand up the Go server skeleton (chi, pgx/sqlc, Postgres+pgvector, a health route) and the Next web shell. Study notiky-app's `server/pkg/llm` + its WebSocket streaming to learn the **provider + streaming pattern**, then implement Areeza's lean version.
2. Land the **legal engine** (categories/routes/templates/validation as typed data from [legal-domain.md](legal-domain.md)) — zero model calls, instantly testable.
3. Ingest the codes into `legal_chunks` (scrape → embed) for RAG + real citations.
4. Wire the pipeline stage by stage (intake → classify → route → draft → validate → export), keeping §5 discipline.
5. Adapt the chat/editor/workspace UI from notiky-app for the case workspace.
6. Swap the fine-tuned classifier in behind `/classify`.

The legal engine, the pipeline, the validation, and the classifier are **Areeza's own**. notiky-app is where engineers learn the Go-LLM-streaming and workspace-UI patterns — not a source to clone.
