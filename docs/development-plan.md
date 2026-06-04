# Areeza — Development Plan

> **Audience:** the build team (Roma = Lead/Architect · Dev 1 = AI/Model + Backend · Dev 2 = Frontend + Backend) and their coding agents.
> **Read with:** [conventions.md](conventions.md) (naming + isolation), [ui-guide.md](ui-guide.md) (frontend + reuse), [architecture.md](architecture.md) (system), [legal-domain.md](legal-domain.md) (the legal IP), [model-plan.md](model-plan.md) (the classifier).
> **Principle:** **contract-first parallelism.** We agree the interfaces *once*, then each track builds behind them with mocks. **No two people edit the same files.** That is how we move fast in parallel without merge hell.

---

## 1. Team & ownership map

Ownership is by **folder**, and it is the primary way we avoid conflicts. If a file isn't in your column, you don't edit it — you request it.

| Person | Role | **Owns (edits freely)** | Does NOT touch |
|---|---|---|---|
| **Roma** | Lead / Architect / Integration | root configs (`package.json`, `turbo.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`), **`packages/core/types`** (the contracts), CI, `/docs`, deploy | feature internals once delegated |
| **Dev 1** | AI / Model + Backend ("the brain") | `packages/core/ai`, `packages/core/legal`, `packages/core/db`, `apps/web/app/api/{intake,classify,route,draft,validate}`, the classifier (see model-plan) | `apps/web` UI, `packages/ui` |
| **Dev 2** | Frontend + Backend-for-frontend ("the face") | `apps/web/app/(marketing)`, `apps/web/app/(app)`, `apps/web/components`, **`packages/ui`**, `packages/core/api` (client + hooks + mocks), `apps/web/app/api/{cases,export}` | `packages/core/{ai,legal}`, AI route internals |
| **Shared** | change via a *tiny* PR + a ping | `packages/core/types` (contracts), root configs, `.env.example` | — |

> Both devs do "backend," but on **different routes**: Dev 1 owns the AI/logic routes; Dev 2 owns the thin CRUD/export routes + the client. They meet only at the **contract**.

---

## 2. The parallelization strategy (how we never block each other)

```
            packages/core/types  ← the CONTRACT (zod schemas + TS types)
                  ▲                          ▲
   Dev 1 IMPLEMENTS │                          │ Dev 2 CONSUMES
   (real /api/* )   │                          │ (UI via api client)
                    │     packages/core/api    │
                    └────  client.ts  ─────────┘
                          ├ mock.ts   (fixtures — Dev 2 builds against this from minute 1)
                          └ real.ts   (fetch the live API — flip when ready)
```

1. **Roma lands Phase 0** = scaffold + **contracts** + a **mock API** returning realistic fixtures for every endpoint.
2. From that moment, **Dev 2 builds the entire UI against the mock** (no backend needed, never blocked). **Dev 1 builds the real implementations** behind the *same* contracts.
3. **Integration = flip one env flag** `NEXT_PUBLIC_API_MODE=mock|real`. Because both sides target the same zod-validated contract, it just works.

This is the whole game. Get Phase 0 right and the two tracks run fully independently until integration.

---

## 3. The contracts — define FIRST (Phase 0), then freeze

All live in `packages/core/types/` as **zod schemas** (export the inferred TS type next to each). Both devs import from `@areeza/core/types`. Changing a contract = a tiny PR + a ping to the other dev.

**Domain objects:** `Case`, `CaseFacts`, `Category` (enum from [legal-domain.md](legal-domain.md) §3), `LegalRoute`, `GeneratedDocument`, `ValidationResult`, `Citizen`.

**Endpoints (request → response):**

| Route | Owner | Request | Response |
|---|---|---|---|
| `POST /api/intake` | Dev 1 | `{ caseId?, message, locale }` | `{ caseId, messages[], facts, nextQuestion?, done }` (streamed) |
| `POST /api/classify` | Dev 1 | `{ caseId? , text }` | `{ categoryCode, confidence, track: "order"\|"claim", rationale }` |
| `POST /api/route` | Dev 1 | `{ categoryCode, facts }` | `LegalRoute` |
| `POST /api/draft` | Dev 1 | `{ caseId }` | `{ document: GeneratedDocument }` |
| `POST /api/validate` | Dev 1 | `{ caseId, documentId }` | `ValidationResult` = `{ checks: {id,label,status,fix}[], canFile }` |
| `POST /api/export` | Dev 2 | `{ caseId }` | `{ pdfUrl }` |
| `GET/POST /api/cases`, `GET /api/cases/:id` | Dev 2 | … | `Case` / `Case[]` |

> Until Dev 1's real routes exist, `mock.ts` returns the **unpaid-salary fixture** for all of the above so Dev 2 sees a full, realistic flow.

---

## 4. Phases & task list

Task card format: **`ID` — owner — goal · `paths` · depends-on · done-when.** Each card is sized to be one agent prompt. CP target in brackets.

### Phase 0 — Foundation (Roma; **blocks everything**, do first) — [CP1→CP2]

- **P0.1** — Roma — Scaffold the monorepo. · root + `apps/web` (Next.js 16, App Router, TS, Tailwind v4) + `packages/{ui,core}` · — · **done-when:** `pnpm install && pnpm dev` serves a blank app; `pnpm typecheck`/`lint`/`build` pass.
- **P0.2** — Roma — Write the **contracts**. · `packages/core/types/*` (zod for every domain object + endpoint in §3) · P0.1 · **done-when:** both devs can `import { CaseSchema, ... } from "@areeza/core/types"`.
- **P0.3** — Roma — **Mock API + fixtures.** · `packages/core/api/{client.ts, mock.ts, real.ts, fixtures.ts}`; switch on `NEXT_PUBLIC_API_MODE` · P0.2 · **done-when:** calling each endpoint via the client (mock mode) returns contract-valid unpaid-salary data.
- **P0.4** — Roma→Dev 2 — Design tokens + shadcn init + app shell. · `packages/ui` tokens, `apps/web/app/layout.tsx` · P0.1 · **done-when:** tokens + base components render (see [ui-guide.md](ui-guide.md)).
- **P0.5** — Roma — Env + Supabase project + keys. · `.env.example`, Supabase, `ANTHROPIC_API_KEY` · — · **done-when:** `.env.example` documents every var; Supabase URL/keys exist.
- **P0.6** — Roma — CI: typecheck + lint + build on PR. · `.github/workflows/ci.yml` · P0.1 · **done-when:** PRs run green.

### Track A — Dev 1 (AI/Model + Backend) — behind the contracts — [CP2]

- **A1** — Legal data engine. · `packages/core/legal/{categories.ts, routes.ts, templates/davo-arizasi.ts, validation.ts}` from [legal-domain.md](legal-domain.md) §3–§6 · P0.2 · **done-when:** `getRoute("labor.wage_recovery")` returns the full route; templates + validation rules are typed data, not prose.
- **A2** — AI plumbing. · `packages/core/ai/{client.ts (AI SDK + Claude), prompts/*.ts, schemas.ts}` · P0.2 · **done-when:** a typed `generateObject` helper + named prompt exports exist; `claude-sonnet-4-6` for loop, `claude-opus-4-8` for heavy gen.
- **A3** — `/api/classify` (Claude + zod enum first). · `apps/web/app/api/classify/route.ts` · A1,A2 · **done-when:** unpaid-salary text → `labor.wage_recovery`, correct `track`, contract-valid.
- **A4** — `/api/intake` (streamText + tools `ask_followup`, `record_fact`). · `apps/web/app/api/intake/route.ts` · A1,A2 · **done-when:** asks one question at a time in UZ/RU, extracts `CaseFacts`, streams per contract.
- **A5** — `/api/route` (engine lookup). · `apps/web/app/api/route/route.ts` · A1 · **done-when:** returns `LegalRoute` incl. court, fee-exemption, limitation, law refs, required docs.
- **A6** — `/api/draft` (template + Claude narrative). · `apps/web/app/api/draft/route.ts` · A1,A2 · **done-when:** outputs a `da'vo arizasi` matching legal-domain §4 structure, slots filled, **legal structure not invented**.
- **A7** — `/api/validate` (deterministic §6 checks → Claude soft-pass). · `apps/web/app/api/validate/route.ts` · A1 · **done-when:** returns the checklist + `canFile`; flags missing contract, wrong venue, etc.
- **A8** — DB persistence (Supabase). · `packages/core/db/*` · P0.5 · **done-when:** cases/facts/documents persist; *(in-memory store is an acceptable CP2 fallback — flag it).*
- **A9** — **Classifier** (the "we trained a model" beat). · see [model-plan.md](model-plan.md); swap behind `/api/classify` · A3 · **done-when:** fine-tuned model serves classification; Claude+enum stays as fallback.

### Track B — Dev 2 (Frontend) — against the mock API — [CP2]

- **B1** — Design system. · `packages/ui/*` — tokens, Button, Card, Input, Textarea, Badge, Dialog, Tabs, Tooltip, Skeleton (shadcn + fluid-functionalism motion, see [ui-guide.md](ui-guide.md)) · P0.4 · **done-when:** a Storybook-less demo page renders all primitives in light + dark.
- **B2** — App shell + case list. · `apps/web/app/(app)/layout.tsx`, `.../cases/page.tsx`, `components/layout/*` · B1,P0.3 · **done-when:** sidebar + case list render from the mock client.
- **B3** — Intake chat. · `components/intake/{message-list,message-bubble,prompt-box}.tsx`, `.../cases/new/page.tsx` · B1,P0.3 · **done-when:** type the unpaid-salary line → streamed Q&A (mock) → facts panel fills.
- **B4** — Case workspace (two-pane) + route card + facts panel. · `.../cases/[id]/page.tsx`, `components/workspace/*` · B2 · **done-when:** left = chat/facts, right = route + document + validation tabs.
- **B5** — Document viewer/editor (TipTap). · `components/document/*` · B1 · **done-when:** renders `GeneratedDocument` to look like a real court `da'vo arizasi` (serif, centered headings, Ilova list); editable.
- **B6** — Validation panel. · `components/validation/*` · B1 · **done-when:** checklist with pass/warn/fail icons + inline fixes from `ValidationResult`.
- **B7** — Export + filing guide UI. · `components/export/*`, `app/api/export/route.ts` · B5 · **done-when:** "Download package" + step-by-step e-sud guide render.
- **B8** — Landing page. · `apps/web/app/(marketing)/page.tsx` · B1 · **done-when:** problem → solution → demo CTA, on-message with [pitch.md](pitch.md).

### Integration — Roma + both — [CP2/Final]

- **I1** — Flip `API_MODE=real`; run the unpaid-salary case end-to-end. · — · all A + B · **done-when:** the real pipeline produces a validated `da'vo arizasi` from a typed sentence.
- **I2** — States polish (loading/empty/error), UZ/RU copy pass. · — · I1 · **done-when:** no broken states in the demo path.
- **I3** — Deploy (Vercel + Supabase); clean GitHub for CP2. · — · I1 · **done-when:** public URL works; repo is presentable.
- **I4** — Demo dry-run against [demo-script.md](demo-script.md). · — · I3 · **done-when:** the 2-minute run is smooth; fallback path tested.

---

## 5. Sequencing vs. checkpoints

- **Now → CP1 (today, 40%, narrative):** Roma presents the pitch ([pitch.md](pitch.md)) + extracts mentor objections; meanwhile Phase 0 + A1/A2 + B1 kick off. (Optional: the parked `.prototype/web` can stand in as a "something runs" demo if a mentor wants to see code.)
- **CP1 → CP2 (overnight, 60%, the leap):** land **A3–A7 + B2–B6 + I1** = a working end-to-end demo, + A9 classifier shipping, + I3 deploy. This visible delta is what the rubric pays for.
- **CP2 → Final (Jun 6):** I2/I4 polish + the 7-minute pitch+demo.

## 6. "Start here" (first hour, per person)

- **Roma:** P0.1 → P0.2 → P0.3 (unblocks everyone), then P0.5/P0.6 in parallel with an agent.
- **Dev 1:** read [legal-domain.md](legal-domain.md) + [model-plan.md](model-plan.md); start **A1** (pure data, zero deps) the moment P0.2 lands; queue A2.
- **Dev 2:** read [ui-guide.md](ui-guide.md); start **B1** the moment P0.4 lands; build B3 against the mock.

## 7. Conflict-avoidance rules (the short version — full detail in [conventions.md](conventions.md))

1. **Edit only your folders** (§1). Need a shared file changed? Tiny PR + ping.
2. **Contracts are sacred.** Don't silently change `packages/core/types` — it breaks the other track.
3. **Branch per task** (`a/<id>-slug`, `b/<id>-slug`), small PRs, merge to `main` often.
4. **Mock first.** Dev 2 never waits for Dev 1 — build against `mock.ts`.
5. **Keep `main` runnable.** Typecheck + lint before every push.
6. **Agents:** one task per agent, scoped to that task's `paths`; for parallel file-mutating agents use **git worktrees** (isolation).
