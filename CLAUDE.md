# CLAUDE.md — Agent Brain for Areeza

> This is the single source of truth for anyone (human or AI) writing code in this repo.
> `AGENTS.md` and `.cursorrules` are thin pointers to this file. Before non-trivial work read
> [docs/development-plan.md](docs/development-plan.md) (tasks + ownership) and [docs/conventions.md](docs/conventions.md) (naming + isolation),
> then [docs/prd.md](docs/prd.md), [docs/architecture.md](docs/architecture.md), [docs/legal-domain.md](docs/legal-domain.md).
> Frontend → [docs/ui-guide.md](docs/ui-guide.md) · AI/model → [docs/model-plan.md](docs/model-plan.md) · getting started → [docs/dev-setup.md](docs/dev-setup.md).

## What we're building (in one breath)

**Areeza** — an AI legal filing platform for Uzbekistan. It turns a citizen's plain-language problem into the correct legal route → a court-ready application (`da'vo arizasi`) → a validated filing package → submission guidance. **A workflow that completes a filing, not a chatbot that answers questions.** Flagship demo: **unpaid-salary labor claim**.

We are building this **live at a hackathon** (Track: Court/Justice). Optimize for a **working, demoable, real-looking** end-to-end flow over breadth. One case type done convincingly > ten done shallowly.

## Golden rules

1. **Ship the loop, not the chrome.** Every hour, the end-to-end demo (`intake → route → draft → validate → export`) should run. Build vertical slices, not horizontal layers.
2. **Reuse before you write.** Copy proven UI from `notiky-app` (`/Users/romalutfullaev/Projects/notiky/notiky-app/packages/ui` and `packages/views`). Do not reinvent chat bubbles, editors, buttons. See the reuse map in [docs/architecture.md](docs/architecture.md).
3. **Real, not lorem.** The generated `da'vo arizasi` must look like an authentic Uzbek court document (correct headers, court name, Labor Code references, claim structure). A domain mentor from Oliy Sud will read it. Pull structure from [docs/legal-domain.md](docs/legal-domain.md).
4. **Never position as "AI lawyer" or give "legal advice."** Language everywhere is: *navigation, preparation, validation, reduces rejection risk, human-in-the-loop.* This is a product rule AND a scoring rule (S4: regulatory compliance).
5. **Bias to working software.** If something is slow to wire (real e-sud integration, auth flows), stub it cleanly behind an interface and keep the demo moving. Mark stubs with `// TODO(real):`.
6. **Bilingual by default.** UI and generated docs primarily **Uzbek**, with Russian fallback. The intake must understand Uzbek/Russian input.

## Tech stack (use exactly this)

- **Monorepo:** pnpm workspaces + Turborepo.
- **Web:** Next.js 16 (App Router) · React 19 · TypeScript (strict).
- **Styling/UI:** Tailwind v4 · shadcn/ui · lucide-react · sonner (toasts) · framer-motion. Editor: TipTap 3.
- **AI:** **Vercel AI SDK** (`ai`, `@ai-sdk/anthropic`) for streaming + tool use. **zod** for all structured outputs (classification, fact extraction, validation).
  - Models: **`claude-sonnet-4-6`** for the interactive intake/agentic loop (fast). **`claude-opus-4-8`** for heavy document generation when quality matters. Use prompt caching for the system prompt + legal knowledge.
  - **Routing model (planned):** a fine-tuned Uzbek case-classifier behind `/api/classify`. Until it exists, classify with Claude + a zod enum — keep the interface identical so we can swap it in.
- **Data/Auth/Storage:** **Supabase** (Postgres + pgvector + Auth + Storage). Use `@supabase/supabase-js`. Server-side calls use the service role; client uses anon key + RLS.
- **PDF export:** server-render the document to a styled, print-correct PDF (court layout).
- **Deploy:** Vercel (app + API routes) + Supabase. A GitHub repo is required for CP2 — keep commits clean.

> **Rejected for speed:** reusing notiky's Go backend. We take its *frontend* gold and use Next.js API routes + Vercel AI SDK for the data layer. Don't pull in Go.

## Team & how we work

Roma (lead/architect) · Dev 1 (AI/model + backend) · Dev 2 (frontend + backend). We build **contract-first, in parallel**: shared types live in `@areeza/core/types`; each track works behind them with mocks, so nobody is blocked. **Edit only the folders you own** ([docs/development-plan.md](docs/development-plan.md) §1). Packages: `@areeza/ui`, `@areeza/core`. The pitch/deck is in **English** ([docs/pitch.md](docs/pitch.md)); the product UI + generated documents stay Uzbek/Russian.

## Where things go

```
apps/web/
  app/                  # App Router. Routes + pages.
    (marketing)/        # landing
    app/                # authed product: case list, case workspace
    api/                # route handlers (intake, classify, draft, validate, export)
  components/           # app-specific composition (thin)
packages/ui/            # shared presentational components (shadcn + reused notiky)
packages/core/          # shared, framework-free logic:
  ai/                   # prompts, schemas (zod), Claude wrappers, tool defs
  legal/                # the route engine: category → route → form → docs → validation rules
  types/                # shared TS types
  db/                   # supabase client + typed queries
docs/                   # the product brain
```

**Legal logic lives in `packages/core/legal`, not in components or prompts.** Prompts call into the engine; the engine is data-driven from [docs/legal-domain.md](docs/legal-domain.md).

## AI conventions

- Every model call that returns data uses a **zod schema** + AI SDK `generateObject`/`streamObject`. No JSON parsing by hand.
- **Intake** = `streamText` with tools (`ask_followup`, `record_fact`, `propose_route`). The model asks one focused question at a time, extracts facts into structured state.
- **Classification** returns `{ categoryCode, confidence, rationale }` constrained to the enum in `packages/core/legal/categories.ts`.
- **Document generation** takes `(route, facts)` → fills a template from `packages/core/legal/templates`. The template is the skeleton; the model fills slots and writes the narrative `bayonnoma` section. Never let the model invent the legal structure.
- **Validation** = deterministic rule checks (required fields, fee/exemption, jurisdiction, limitation period) **first**, then a Claude pass for "soft" issues (unclear claim, weak evidence). Return `{ checks: [{id, label, status, fix}], canFile: boolean }`.
- Keep all prompts in `packages/core/ai/prompts/` as named exports — never inline long prompts in routes.

## Commands *(once scaffolded)*

```bash
pnpm dev            # run the app (localhost:3000)
pnpm build          # turbo build all
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit across workspace
pnpm db:push        # apply supabase schema
```

## Do / Don't

- ✅ Vertical slices. ✅ Reuse notiky UI. ✅ Real legal text. ✅ zod everywhere. ✅ Stub external integrations cleanly.
- ❌ "AI lawyer" / advice framing. ❌ Hand-rolled JSON parsing of model output. ❌ Legal structure invented by the model. ❌ Pulling in the Go backend. ❌ Polishing pixels before the loop runs end-to-end.

## Strategic context (why we build this way)

The hackathon final score = `0.4×CP1 + 0.6×CP2` — **growth between checkpoints wins.** CP1 (today): nail the narrative + a thin working slice + extract mentor objections. CP2 (tomorrow): demonstrate the *leap* — full end-to-end demo + the fine-tuned classifier + validation. Build toward a visible delta. See [docs/roadmap.md](docs/roadmap.md).
