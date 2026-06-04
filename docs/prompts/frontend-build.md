# One-run prompt — Areeza frontend

> Paste this into your coding agent (Cursor / Claude Code) from the repo root. It builds the **entire fundamental UI in one autonomous run**, against a **mock backend**, adapting components from `notiky-app`. Work top-to-bottom; don't stop to ask — make sensible decisions and keep going.

---

You are building the **complete frontend for Areeza** — an AI legal-filing platform for Uzbekistan that turns a citizen's plain-language problem into a court-ready `da'vo arizasi`, validates it, and guides filing. Build the whole UI **in one run**, runnable end-to-end **without any backend or API keys** by wiring everything to a typed **mock**. The Go backend is built separately — you only touch the frontend and shared TS packages.

## Read first (these are the source of truth — obey them, don't duplicate them)
- `CLAUDE.md` — rules, stack, where things go.
- `docs/ui-guide.md` — **the design system** (tokens, fonts, motion), the component inventory, and the notiky reuse map. Follow it exactly.
- `docs/development-plan.md` — Track **FE** (tasks F1–F7) + the contract-first model.
- `docs/architecture.md` §9 — **the API contract** (endpoints + req/res) and the mock/real client pattern.
- `docs/conventions.md` — naming + isolation (stay inside `apps/web` + `packages/{ui,core}`).
- `docs/legal-domain.md` §4 — the **exact `da'vo arizasi` structure**. The generated document must mirror it precisely (a Supreme-Court engineer will read it).
- `docs/demo-script.md` — the flagship flow you must make work.

## Adapt from references (you have them locally — copy generously, don't reinvent)
- **`notiky-app`** — port its UI wholesale where it fits: the shadcn primitives (`packages/ui`), the **chat** (message list / message bubble / prompt box), the **TipTap editor**, the **two-pane resizable workspace + sidebar**, and the wait/loading indicators. Strip notiky's domain coupling and rewire to Areeza's mock client. Match its quality bar — don't downgrade.
- **fluidfunctionalism.com** — the motion language: framer-motion **spring physics**, **purposeful** entrance/transition (motion = information, not decoration), font-weight shift on hover, Radix-based accessibility, dark-mode parity, `prefers-reduced-motion`.

## Stack (use exactly)
pnpm + Turborepo monorepo · `apps/web` = Next.js 16 (App Router) + React 19 + TS strict · Tailwind v4 · shadcn/ui (Radix) · TipTap 3 · framer-motion · @tanstack/react-query · zustand · lucide-react · sonner · `clsx`+`tailwind-merge` (`cn()`). Shared: `packages/ui` (design system + components), `packages/core` (types + api client + mock + fixtures). **No `server/` code.**

## The mock is the whole enabler (do this first, then build against it)
In `packages/core`:
- `types/` — the TS contract from architecture §9 + the domain objects (`Case`, `CaseFacts`, `LegalRoute`, `GeneratedDocument`, `ValidationResult`, `Category`).
- `api/client.ts` — switches on `NEXT_PUBLIC_API_MODE` (`mock` | `real`); `mock.ts` returns fixtures; `real.ts` is a fetch stub for later; `fixtures.ts` — the **full unpaid-salary case**: the chat Q&A turns, extracted facts, the route, the `da'vo arizasi` (verbatim structure from legal-domain §4), and the validation checklist.
- The intake "stream" is **simulated** in mock (yield the assistant turns with a small delay). Everything runs with **no backend, no keys**. Default `NEXT_PUBLIC_API_MODE=mock`.

## Build (the fundamental UI — DRY, reuse the design system everywhere)
1. **Design system** (`packages/ui`): the ui-guide tokens (light+dark CSS vars, fonts, radius, motion springs) + shadcn primitives (Button, Card, Input, Textarea, Label, Badge, Dialog, Sheet, Tabs, Tooltip, Select, Checkbox, Skeleton, ScrollArea, Separator, Sonner). One `cn()`.
2. **App shell + routing** (`apps/web/app`): `(marketing)` landing + `(app)` product; `AppSidebar` (case list, "New case"), `AppShell`.
3. **Intake chat** (`components/intake`): `MessageList`, `MessageBubble` (streaming + markdown), `PromptBox` (UZ/RU toggle, Enter-to-send), `ThinkingIndicator` — on the mock stream.
4. **Case workspace** (`components/workspace`): two-pane resizable — chat + `FactsPanel` left; `RouteCard` / `DocumentView` / `ValidationPanel` tabs right; `StepProgress` (Describe→Classify→Route→Draft→Validate→File).
5. **DocumentView** (`components/document`): TipTap; renders `GeneratedDocument` as an **authentic Uzbek court `da'vo arizasi`** (legal-domain §4 layout — court name, `Daʼvogar`/`Javobgar`, centered `DAʼVO ARIZASI`, `Daʼvo bahosi`, body, `SO'RAYMAN`, numbered `Ilova`, date+signature; serif, print-clean). Read + edit + print/PDF.
6. **ValidationPanel** (`components/validation`): the checklist — pass/warn/fail icons + inline fixes, stagger-animated.
7. **RouteCard**, **FactsPanel**, **ExportPanel** (download package + step-by-step e-sud guide); **Landing** (problem → solution → demo CTA, on-message with the pitch).

**The flagship flow must work end-to-end on the mock:** type *"Ish beruvchim 2 oydan beri oyligimni to'lamayapti"* → streamed Q&A → classification badge (`mehnat nizosi — ish haqini undirish`) → workspace fills (route, facts) → generated `da'vo arizasi` → validation checklist → export. Add a one-click "try the demo" that runs it.

## Quality bar (non-negotiable)
DRY (shared tokens + components + `cn()`, zero duplicated styles) · conventions.md naming · every async view has **loading (skeleton) / empty / error** states · works in **light AND dark** · keyboard-accessible (Radix) · **bilingual** (Uzbek primary, structured for RU) · purposeful motion (respects reduced-motion) · the `da'vo arizasi` looks **real** · never invent legal structure (use legal-domain) · keep `main` runnable, `typecheck`+`lint` clean.

## Verify before you finish
Run `pnpm dev`, drive the full unpaid-salary flow in the browser, screenshot the key screens (intake, workspace, document, validation) in light + dark, fix what's off. 

## Done when
`pnpm install && pnpm dev` serves; the unpaid-salary flow runs end-to-end on the mock with no backend/keys; the generated `da'vo arizasi` mirrors legal-domain §4 and looks authentic; light+dark + all states clean; `typecheck`+`lint` pass; components are DRY and reuse the design system. Report what you built, the run command, and any deviations.
