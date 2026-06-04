# Areeza — UI Guide (design system + reuse map)

> For **Dev 2** (frontend) and anyone building UI. **Dev 2 shares Roma's workspace**, so clone/copy directly from `notiky-app` at `/Users/romalutfullaev/Projects/notiky/notiky-app` — primitives in `packages/ui/components/ui/`, patterns in `packages/views/{copilot,editor,layout,common}/`. Everything below is also described by name + library so Dev 1 / agents without the repo can rebuild it fresh.
> Sources of taste: **notiky-app UI** (patterns below) + **Fluid Functionalism** (motion principles, https://fluidfunctionalism.com). Pairs with [conventions.md](conventions.md) and [development-plan.md](development-plan.md) (Track B).

## 1. Product feel

Clean, modern, **trustworthy** (govtech/justice — not a flashy consumer app). Calm surfaces, confident type, gold used sparingly as the "justice" accent. Motion is **functional** (it explains state changes), never decorative. Fully keyboard-accessible and dark-mode ready.

## 2. Libraries (install these — the stack)

`next@16` · `react@19` · `tailwindcss@4` · **shadcn/ui** (Radix primitives) · `lucide-react` (icons) · `sonner` (toasts) · `framer-motion` (motion) · `@tanstack/react-query@5` (server state) · `zustand@5` (local UI state) · `@tiptap/react@3` + `@tiptap/starter-kit` (document editor) · `react-markdown` + `remark-gfm` (assistant markdown) · `clsx` + `tailwind-merge` (the `cn()` helper). Backend-side (Dev 1): `ai` + `@ai-sdk/anthropic`, `zod`, `@supabase/supabase-js`.

> shadcn/ui is Radix-based → keyboard + ARIA for free, which is exactly Fluid Functionalism's "accessible by default." Add primitives with `pnpm dlx shadcn@latest add button card input ...`.

## 3. Design tokens (define in `packages/ui` as CSS vars + Tailwind theme)

**Light (default)**
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FFFFFF` | page background |
| `--surface` | `#F5F7FA` | cards, panels |
| `--border` | `#E2E8F0` | hairlines |
| `--ink` (foreground) | `#0E1B33` | primary text |
| `--muted` | `#64748B` | secondary text |
| `--primary` | `#15315C` | primary actions, links (deep navy-blue = trust) |
| `--accent` (gold) | `#C9A227` | sparse justice accent, highlights |
| `--success` | `#2E8B57` | validation pass |
| `--warn` | `#B7791F` | validation warning |
| `--danger` | `#B23B3B` | validation fail / destructive |

**Dark**: `--bg #0B1426` · `--surface #13233F` · `--border #22324F` · `--ink #E8EEF7` · `--muted #93A4BE` · `--primary #4F86C6` · `--accent #E0BE54` (semantic colors lighten ~10%).

**Type:** UI = `Inter` (or system sans). **Legal document view = a serif** (`Lora`/`Georgia`) so it reads official. Requisites/numbers = `ui-monospace`. Scale: display 28–34, h1 22, h2 18, body 15, small 13.
**Radius:** cards 10px (`--radius`), inputs/buttons 8px. **Shadow:** subtle only (`shadow-sm`); elevation via surface + border, not heavy shadows.
**Spacing:** Tailwind 4px base; generous whitespace (min `p-4` in cards, `gap-3`+ between blocks).

## 4. Motion (Fluid Functionalism — motion = information)

- Use **framer-motion spring**: `{ type: "spring", stiffness: 300, damping: 30 }`. Speeds: fast 150ms (hover/press), base ~250ms (enter/exit).
- **Animate state changes, not decoration:** new chat message slides+fades in; validation items **stagger** in as checks resolve; the route card expands when classification lands; the generated document fades in section by section.
- **Font-weight shift** (not just color) for nav/hover emphasis. Subtle **proximity/hover** feedback on interactive cards.
- Always respect `prefers-reduced-motion` (drop to instant). Loading = a calm `ThinkingIndicator`, never a jarring spinner.

## 5. Reuse map — notiky patterns to rebuild (you don't need the repo)

Recreate these with shadcn + the libs above, guided by the descriptions. (notiky's originals are coupled to its monorepo — use them as a *spec*, not a copy.)

| Areeza component (build in) | notiky reference (pattern) | What it does | Built with |
|---|---|---|---|
| `MessageList` (`components/intake`) | `copilot/message-list` | Scrollable transcript, auto-scroll to newest, groups by role, stall recovery | div + scroll, framer-motion |
| `MessageBubble` | `copilot/message-bubble` | User/assistant turn; assistant streams text + renders markdown | react-markdown + remark-gfm |
| `PromptBox` | `copilot/prompt-box` | Textarea input, send button, **UZ/RU locale toggle**, Enter-to-send, attach (optional) | shadcn Textarea/Button |
| `ThinkingIndicator` | `common/chat-wait-indicator` + FF `ThinkingSteps` | Calm "Areeza tayyorlamoqda…" with step hints | framer-motion |
| `DocumentView` | `editor/content-editor` (+ `bubble-menu`) | Renders `GeneratedDocument` as a real court `da'vo arizasi` (serif, centered headings, requisites block, `Ilova` list); read + edit modes | TipTap 3 StarterKit (edit) / styled render (read) |
| `CaseWorkspace` | `layout/*` two-pane resizable | Left = chat + facts, right = route/document/validation tabs | shadcn Tabs + resizable panels |
| `AppSidebar` | `layout/sidebar` | Case list, "New case", workspace header | shadcn + lucide |
| `ToolConfirm` / question wizard | `copilot/question-block-panel`, `tool-confirm-panel` | Inline structured prompts ("Confirm employer name?") | shadcn Card + Buttons |

shadcn primitives to add now: `button card input textarea label badge dialog sheet tabs tooltip select checkbox skeleton scroll-area separator sonner` (+ `command` for ⌘K later).

## 6. Components unique to Areeza (build in `packages/ui` or `components/*`)

- **`RouteCard`** — shows the legal route: court (`tuman/shahar fuqarolik sudi`), application type (`da'vo arizasi` / court order), **state-fee exemption** badge, limitation period, law refs (CPC 188/189/191), and the required-documents checklist. Source: `LegalRoute` contract.
- **`FactsPanel`** — the structured `CaseFacts` extracted during intake; **missing required facts highlighted** in `--warn`.
- **`ValidationPanel`** — the `ValidationResult` checklist: each item `✓` (success) / `!` (warn) / `✗` (fail) + an inline one-line `fix`. Stagger-animate in.
- **`StepProgress`** — the pipeline indicator: Tasvirlang → Tasniflang → Yo'naltiring → Tayyorlang → Tekshiring → Topshiring.
- **`ExportPanel`** — "Download filing package" + step-by-step e-sud (`my.sud.uz` / `cabinet.sud.uz`) guide.

## 7. Screens (routes)

- `/(marketing)/` — landing: problem → solution → demo CTA (on-message with [pitch.md](pitch.md)).
- `/(app)/cases` — case list (cards: title, category, status).
- `/(app)/cases/new` — intake chat (`MessageList` + `PromptBox`); on first classify, route to the workspace.
- `/(app)/cases/[id]` — **the workspace** (`CaseWorkspace`): chat + `FactsPanel` left; `RouteCard` / `DocumentView` / `ValidationPanel` tabs right; `ExportPanel`.

## 8. Document authenticity (the Domain-lens moment)

`DocumentView` must look like a **real Uzbek court document** — this is what the Oliy Sud mentor reads. Mirror [legal-domain.md](legal-domain.md) §4 exactly: court name top, `Daʼvogar`/`Javobgar` blocks with requisites, centered `DAʼVO ARIZASI` + subtitle, `Daʼvo bahosi`, body, `SO'RAYMAN:`, numbered `Ilova:`, date + signature line. Serif font, A4-ish column, print-clean. Provide a **Print/PDF** affordance.

## 9. Accessibility & states (non-negotiable)

- Every interactive element: keyboard reachable, visible focus ring, ARIA via Radix.
- Every async view has **loading (skeleton), empty, and error** states. No dead spinners.
- Color is never the only signal (icons + text on validation). Test light **and** dark.
