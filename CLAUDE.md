# CLAUDE.md — Agent Brain for Areeza

> Single source of truth for anyone (human or AI) writing code in this repo.
> `AGENTS.md` and `.cursorrules` are thin pointers here. Before non-trivial work read
> [docs/architecture.md](docs/architecture.md), [docs/legal-domain.md](docs/legal-domain.md), and the role-specific doc.
> Frontend → [docs/ui-guide.md](docs/ui-guide.md) · AI/model + data → [docs/model-plan.md](docs/model-plan.md) · onboarding → [docs/dev-setup.md](docs/dev-setup.md) · deploy → [docs/deploy.md](docs/deploy.md).

## What we're building (in one breath)

**Areeza** — an AI legal filing platform for Uzbekistan. Plain-language problem → correct legal route → court-ready `da'vo arizasi` → validated filing package → submission guidance. **A workflow, not a chatbot.** Flagship demo: **unpaid-salary labor claim.** The workspace unit is a multi-issue **`Situation`** (one conversation, many issues / documents / forums).

Built **live at a hackathon** (Track: Sud Tizimi). Optimize for a **working, demoable, real-looking** end-to-end flow over breadth.

## Golden rules

1. **Ship the loop, not the chrome.** Every hour the end-to-end demo (`intake → classify → route → draft → validate → export`) should run. Vertical slices, not horizontal layers.
2. **Real, not lorem.** The generated `da'vo arizasi` must look like an authentic Uzbek court document (correct headers, court name, Labor Code / FPK refs, claim structure). Domain people will read it. Pull structure from [docs/legal-domain.md](docs/legal-domain.md).
3. **Never position as "AI lawyer" or give "legal advice."** Language is *navigation, preparation, validation, reduces rejection risk, human-in-the-loop.* Product rule AND scoring rule (S4: regulatory compliance).
4. **Bias to working software.** If something is slow to wire (live e-sud submission, auth), stub it cleanly behind an interface and keep the demo moving. Mark stubs with `// TODO(real):`.
5. **Token discipline.** Most pipeline stages are deterministic or a cheap classifier call — **not** Claude. See [docs/architecture.md](docs/architecture.md) §5. The model's context is the **structured facts**, never the chat transcript.
6. **Bilingual by default.** UI and generated docs primarily **Uzbek**, Russian fallback. Intake understands UZ (Latin + Cyrillic) and RU.

## Tech stack (what's actually shipping)

- **Backend: Go** — chi router · gorilla/websocket · in-memory store today, Postgres+pgvector provisioned (`DATABASE_URL` wired, persistence TBD).
- **LLM:** **Anthropic Go SDK** behind `server/pkg/llm.Provider` (caching, tools, structured output, streaming). Models: **`claude-sonnet-4-6`** for intake + soft-validate; **`claude-opus-4-8`** for the final document; `claude-haiku-4-5` for cheap extraction.
- **Routing model:** **on-device, ours, shipped.** Tier-1 (live): `BAAI/bge-m3` embeddings → calibrated LogisticRegression. Tier-2 (hero): LoRA fine-tune of `Qwen2.5-1.5B-Instruct` on MLX. Both served from `services/classifier`. Go always-on fallback in `server/internal/legal/classify.go` (keyword router). Same `/classify` contract throughout.
- **Legal grounding:** local **RAG** over a curated lex.uz corpus, `services/rag` (bge-m3 + NumPy index). Cites real article numbers + URLs.
- **Web:** Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui (Radix) · TipTap 3 · framer-motion · @tanstack/react-query · zustand · sonner.
- **PDF export:** server-rendered, print-correct court layout (`server/internal/export`).
- **Deploy:** Docker Compose on **Coolify** (web · api · classifier · rag · pgvector). See [docs/deploy.md](docs/deploy.md).

## Team & how we work

**Rakhmatillo Lutfullaev** (Founder / CEO) · **Mukhammadxoja Lutfullaev** (CTO — model training + scraping) · **Shoxdiyor Aliyev** (COO) · **Saloxiddin Mirxafizov** (Growth) · **Abdulboriy Abduxalilov** (SWE, frontend). **Advisor: Anvarjon Abdullajonov** (Oliy Sud Dev Team Leader).

We build **contract-first, in parallel**: the Go API shapes + the typed TS client (`packages/core`) are agreed first; the **web builds against a mock client** while the **Go backend implements** behind the same shapes. **Edit only the folders you own** ([docs/conventions.md](docs/conventions.md) §1). Pitch/deck is **Uzbek** ([pitch/index.html](pitch/index.html)); product UI + generated documents are Uzbek/Russian.

## Where things live

```
server/                       # Go backend
  cmd/areeza/                 # entrypoint
  internal/
    api/                      # REST + WS handlers (intake, classify, route, draft, validate, export, situations)
    ai/{intake,draft,validate,classify,scripted}/   # Claude-backed pipeline stages + scripted demo
    legal/                    # route engine + keyword classifier + templates
    situation/                # the Situation aggregate (multi-issue model)
    export/                   # PDF + filing package builders
    pipeline/prompts/         # named prompt constants (no inline prompts)
    store/, seed/             # in-memory store + seed data
  pkg/
    ai/                       # Brain interface
    llm/                      # Anthropic provider (caching, tools, streaming, structured output)

apps/web/                     # Next.js
  app/                        # (marketing) landing · (app)/situations workspace
  components/                 # intake · workspace · document · validation · export · …

packages/
  ui/                         # design system (tokens, shadcn primitives, fluid motion)
  core/                       # types · api client (mock | real) · legal data

services/
  classifier/                 # Python FastAPI — tier-1 (bge-m3 + LR) + tier-2 (Qwen LoRA)
  rag/                        # Python FastAPI — curated lex.uz corpus + bge-m3 retrieval

docs/                         # the product brain
```

**Legal logic lives in `server/internal/legal` (Go), data-driven from [docs/legal-domain.md](docs/legal-domain.md)** — never invented in handlers or prompts.

## AI conventions

- Every model call returns into a **Go struct** via schema-constrained / structured output. No hand-rolled JSON parsing.
- **Intake** = WebSocket streaming tool-loop (`ask_followup`, `record_fact`, etc.). One focused question at a time. **Context = the structured facts + last message, not the transcript** ([architecture.md](docs/architecture.md) §5b).
- **Classification** → `services/classifier` (tier-1/tier-2) → `{ categoryCode, confidence, track, engine }`; on miss the keyword router answers; on miss again, Claude+enum. Same contract everywhere.
- **Document generation** = a fixed **template** (CPC Art-189 skeleton, [legal-domain.md](docs/legal-domain.md) §4) + **slot-fill** of the narrative `bayonnoma` and computed fields. The model never invents legal structure.
- **Validation** = deterministic rule checks (required fields, fee/exemption, jurisdiction, limitation, evidence) **first**; only the ambiguous body-adequacy item escalates to one Claude soft-pass.
- **Prompt caching** on the system prompt + the legal block (template + route rules + retrieved articles). **opus only for the final document**; cheaper models everywhere else.
- Prompts live in `server/internal/pipeline/prompts/` as named constants — never inline in handlers.

## Commands

```bash
make dev               # Go API on :8080 (in-memory store)
make test              # go test ./...
make vet               # go vet ./...
make seed              # regenerate server/internal/store/seed.json from TS fixtures
make preflight         # full check (go + web + compose + 4 images)
SKIP_DOCKER=1 make preflight   # fast: skip image builds
pnpm dev               # web on :3000
pnpm typecheck && pnpm lint    # run before every push
```

For classifier / RAG sidecars (optional, real mode): see [docs/dev-setup.md](docs/dev-setup.md) §3b. For deploy: [docs/deploy.md](docs/deploy.md).

## Do / Don't

- ✅ Vertical slices · ✅ Real legal text · ✅ Structured outputs · ✅ Token discipline (deterministic-first) · ✅ Stub external integrations cleanly.
- ❌ "AI lawyer" / legal-advice framing · ❌ Hand-rolled JSON parsing of model output · ❌ Legal structure invented by the model · ❌ Re-sending chat transcript as model context · ❌ Polishing pixels before the loop runs end-to-end.

## Strategic context

The hackathon final = **0.4 × CP1 + 0.6 × CP2** (we passed both, top-20, #1 by checkpoint score). The final on 6 Jun is judged fresh — positioning + delivery matter more than past scores. See [docs/roadmap.md](docs/roadmap.md) and [docs/pitch.md](docs/pitch.md).
