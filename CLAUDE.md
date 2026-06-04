# CLAUDE.md — Agent Brain for Areeza

> This is the single source of truth for anyone (human or AI) writing code in this repo.
> `AGENTS.md` and `.cursorrules` are thin pointers to this file. Before non-trivial work read
> [docs/development-plan.md](docs/development-plan.md) (tasks + ownership) and [docs/conventions.md](docs/conventions.md) (naming + isolation),
> then [docs/prd.md](docs/prd.md), [docs/architecture.md](docs/architecture.md), [docs/legal-domain.md](docs/legal-domain.md).
> Frontend → [docs/ui-guide.md](docs/ui-guide.md) · AI/model + data → [docs/model-plan.md](docs/model-plan.md) · getting started → [docs/dev-setup.md](docs/dev-setup.md).

## What we're building (in one breath)

**Areeza** — an AI legal filing platform for Uzbekistan. It turns a citizen's plain-language problem into the correct legal route → a court-ready application (`da'vo arizasi`) → a validated filing package → submission guidance. **A workflow that completes a filing, not a chatbot that answers questions.** Flagship demo: **unpaid-salary labor claim**.

Built **live at a hackathon** (Track: Court/Justice). Optimize for a **working, demoable, real-looking** end-to-end flow over breadth. One case type done convincingly > ten done shallowly.

## Golden rules

1. **Ship the loop, not the chrome.** Every hour, the end-to-end demo (`intake → route → draft → validate → export`) should run. Build vertical slices, not horizontal layers.
2. **Adapt the UI from `notiky-app`; build the backend ourselves.** The chat/editor/workspace UI is mostly adapted from notiky-app. The backend is Areeza's own Go pipeline — where notiky-app has a proven pattern (the LLM provider + WebSocket streaming), **study it and reimplement lean**, don't clone. Don't reinvent chat bubbles, editors, buttons.
3. **Real, not lorem.** The generated `da'vo arizasi` must look like an authentic Uzbek court document (correct headers, court name, code references, claim structure). Supreme-Court engineers advise us and will read it. Pull structure from [docs/legal-domain.md](docs/legal-domain.md).
4. **Never position as "AI lawyer" or give "legal advice."** Language everywhere is: *navigation, preparation, validation, reduces rejection risk, human-in-the-loop.* Product rule AND scoring rule (S4: regulatory compliance).
5. **Bias to working software.** If something is slow to wire (real e-sud integration, auth), stub it cleanly behind an interface and keep the demo moving. Mark stubs with `// TODO(real):`.
6. **Token discipline.** Most pipeline stages are deterministic or a cheap classifier call — **not** Claude. See [docs/architecture.md](docs/architecture.md) §5. The model's context is the **structured facts**, never the chat transcript.
7. **Bilingual by default.** UI and generated docs primarily **Uzbek**, Russian fallback. Intake understands Uzbek/Russian input.

## Tech stack (use exactly this)

- **Backend: Go** — chi router · pgx + sqlc · **Postgres 17 + pgvector** · WebSocket for streaming. Areeza's own services (the pipeline, the legal engine, the API).
- **LLM:** **Anthropic Go SDK** behind a small provider interface — prompt caching, tool use, structured output, streaming. (Learn the shape from notiky-app's `server/pkg/llm`; reimplement lean.) Models: **`claude-sonnet-4-6`** for the interactive intake loop + soft-validation; **`claude-opus-4-8`** only for the final document. `claude-haiku-4-5` for cheap extraction.
- **Routing model:** a fine-tuned Uzbek/Russian case-classifier served over HTTP behind `/api/classify`. Until it's trained, classify with Claude + an enum — identical contract so we swap it in. See [docs/model-plan.md](docs/model-plan.md).
- **Web:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 · shadcn/ui · lucide-react · sonner · framer-motion · TipTap 3. UI adapted from notiky-app. Calls the Go API via a typed client.
- **PDF export:** server-render the document to a styled, print-correct PDF (court layout).
- **Deploy:** Go on Railway/Fly · Postgres managed · web on Vercel. GitHub required for CP2 — keep commits clean.

## Team & how we work

**Rakhmatillo Lutfullaev** (Founder/CEO, lead/architect) · **Mukhammadxoja Lutfullaev** (CTO) · **Shoxdiyor Aliyev** (COO) · **Saloxiddin Mirxafizov** & **Abdulboriy Abduxalilov** (SWE). **Advisors: Anvarjon Abdullajonov + Jasur Umarov — the Supreme Court's dev/IT engineers** (they build e-sud / my.sud.uz).

We build **contract-first, in parallel**: the Go API shapes + a typed TS client are agreed first; the **web builds against a mock client** while the **Go backend implements** behind the same shapes. **Edit only the folders you own** ([docs/development-plan.md](docs/development-plan.md) §1). The pitch/deck is **English** ([pitch/index.html](../pitch/index.html), [docs/pitch.md](docs/pitch.md)); the product UI + generated documents stay Uzbek/Russian.

## Where things go

```
server/                 # Go backend — Areeza's own logic
  cmd/                  # entrypoint(s)
  internal/
    api/                # REST + WS handlers (intake, classify, route, draft, validate, export, cases)
    pipeline/           # the stages (intake loop, draft slot-fill, validate)
    legal/              # the route engine: category → route / form / required-docs / rules (data-driven)
  pkg/
    llm/                # Anthropic provider: caching, tools, structured output, streaming
    db/                 # pgx + sqlc queries + migrations (Postgres + pgvector)
apps/web/               # Next.js UI (adapts notiky chat/editor/workspace); calls the Go API
  app/                  # (marketing) landing · (app) case list + workspace
  components/           # app-specific composition (thin)
packages/
  ui/                   # shared presentational components (shadcn + adapted notiky)
  core/                 # TS: the typed API client + shared contract types
services/
  classifier/           # the fine-tuned router (model-plan.md)
  scraper/              # lex.uz / sud.uz ingestion (model-plan.md)
docs/                   # the product brain
```

**Legal logic lives in `server/internal/legal` (Go), data-driven from [docs/legal-domain.md](docs/legal-domain.md)** — never invented in handlers or prompts.

## AI conventions

- Every model call returns into a **Go struct** via schema-constrained / structured output — no hand-rolled JSON parsing.
- **Intake** = a WebSocket streaming loop with tools (`ask_followup`, `record_fact`). One focused question at a time. **Context = the structured facts + last message, not the transcript** (architecture §5b).
- **Classification** → the classifier service → `{ categoryCode, confidence, track }`; Claude+enum fallback, same contract.
- **Document generation** = a fixed **template** (CPC Art-189 skeleton) + **slot-fill** of the narrative `bayonnoma` and computed fields. Never let the model invent the legal structure.
- **Validation** = deterministic rule checks (required fields, fee/exemption, jurisdiction, limitation) **first**; only ambiguous items escalate to one Claude soft-pass.
- **Prompt caching** on the system prompt + the legal block (template + route rules + retrieved articles). **opus only for the final document**; cheaper models elsewhere.
- Keep prompts in `server/internal/pipeline/prompts/` as named constants — never inline long prompts in handlers.

## Commands *(once scaffolded)*

```bash
make dev            # Go server + Postgres (docker-compose)
make migrate        # apply DB migrations
make sqlc           # regenerate typed queries
pnpm --dir apps/web dev   # web on localhost:3000
pnpm lint && pnpm typecheck
```

## Do / Don't

- ✅ Vertical slices. ✅ Adapt notiky UI. ✅ Real legal text. ✅ Structured outputs. ✅ Token discipline (deterministic-first). ✅ Stub external integrations cleanly.
- ❌ "AI lawyer" / advice framing. ❌ Hand-rolled JSON parsing of model output. ❌ Legal structure invented by the model. ❌ Re-sending the chat transcript as model context. ❌ Polishing pixels before the loop runs end-to-end.

## Strategic context (why we build this way)

The hackathon final score = `0.4×CP1 + 0.6×CP2` — **growth between checkpoints wins.** CP1: nail the narrative + a thin working slice + extract mentor objections. CP2: demonstrate the *leap* — full end-to-end demo + the fine-tuned classifier + validation. Build toward a visible delta. See [docs/roadmap.md](docs/roadmap.md).
