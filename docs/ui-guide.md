# Areeza — UI Guide (notiky-ported design system)

> Product UI is ported from **notiky-app** presentational layers into `@areeza/ui` + `apps/web`, wired to `@areeza/core` types only. Legal documents still use **EB Garamond** (`--font-legal` / `--font-serif`).

## 1. Product feel

Warm cream light / neutral gray-violet dark. **Forest-green brand** (`--brand` / `--primary`) for CTAs. Calm surfaces, hairline borders, one obvious primary action per screen. Motion is functional (nav pill glide, step crossfade, thinking shimmer), never decorative. `defaultTheme="system"` in `apps/web/lib/providers.tsx`.

## 2. Token layers (`packages/ui/src/styles/`)

| File | Role |
|---|---|
| `tokens.css` | Light `:root` — OKLCH palette, 8-step `--surface-*`, layout vars (`--control-h`, `--layout-dialog-popover-width`), semantic `--danger`/`--warn`/`--success*` |
| `dark-tokens.css` | `.dark { … }` overrides (kept separate for Turbopack) |
| `base.css` | Shiki dual-theme hooks, sidebar/sonner base rules |
| `prose.css` | `.rich-text-editor` typography (chat markdown + editors) |
| `fluid-shimmer.css` | `@utility shimmer-text` for `ThinkingIndicator` |

**Semantics (common bug):**

- `--muted` / `bg-muted` → **fill** (chip/track background)
- `--muted-foreground` / `text-muted-foreground` → **secondary text** (never use `text-muted` for body copy)

**Brand:** `--brand` forest green · `--brand-foreground` cream · `--brand-gold` warning accent.

**Legal:** `--font-serif: var(--font-legal)` in `@theme`; `.legal-paper` / `bg-legal-paper` in `apps/web/app/globals.css`.

**App bridge:** `apps/web/app/globals.css` imports all token files + `@theme inline` bridge (`--color-danger`, `--color-warn`, surfaces). Utilities: `shellPanel`, `elevatedCard`, `raisedSurface`, `floatingSurface`, `bg-overlay-scrim`, `bg-legal-paper`.

**Raw `[var(--…)]` policy:** primitives use semantic Tailwind (`border-input`, `bg-card`, `text-muted-foreground`, etc.). Residual raw vars in `@areeza/ui` are mostly layout `length:` tokens (progress, table, sonner). **`apps/web/components` should use semantic classes only** — verified zero `[var(--…)]` in app components after visual QA detox pass.

## 3. Primitives (`@areeza/ui`)

| Export | Notes |
|---|---|
| `components/button` | `variant="brand"` / `brand-outline` for sole primary CTA; `aria-invalid` + `xs`/`icon-lg`; unified `focus-visible:ring-3` |
| `components/card` | `rounded-xl border bg-card shadow-sm`; optional `elevated` |
| `components/sidebar` | shadcn sidebar (cookie collapse, icon mode, tooltips); **`SidebarProvider` required** |
| `components/fluid/nav-menu-group` | `NavMenuGroup` + `NavMenuHighlight` (`layoutId` sliding pill) |
| `hooks/use-nav-proximity` | Optional proximity emphasis for dense nav |
| `markdown/*` | `Markdown`, `StreamingMarkdown`, `CodeBlock` (Shiki + GFM + sanitize) |
| `components/fluid/thinking-indicator` | Morphing SVG + shimmer cycling words (single loader — do not duplicate in app) |
| `layout/page-layout-primitives` | `PagePaneRoot`, `ScrollArea`, `ChatScrollArea` |
| `components/empty-state` | `variant` `page` \| `list` \| `dashed`; neutral icon well |
| `list-row`, `status-pill` | Row density via `--density-row-*`; `navRowTransition` |

Icons: `@areeza/ui/icons` — HugeIcons catalog only (no lucide in product code).

Focus ring everywhere: `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none`.

## 4. App shell (`apps/web/components/shell/`)

| Piece | Behavior |
|---|---|
| `app-shell.tsx` | Single **`SidebarProvider`** (`defaultOpen`, `--sidebar-width: var(--layout-app-sidebar-width)`). Desktop sidebar + rounded `main`. **`TopBarSlot`** above main (md+). Mobile header: menu + **`useShellPageTitle`** + brand **Yangi holat** → `/situations/new`. Skip link + labelled `main`. One **`TooltipProvider`** in `lib/providers.tsx` only. |
| `app-sidebar.tsx` | Presentation-only `Sidebar` (`variant="inset"`, `collapsible="icon"`). `NavMenuGroup` highlights + `aria-current="page"`. `LocaleToggle`, theme toggle (`useSyncExternalStore` hydration guard). Nav hrefs: `/situations`, `/situations/new`. |
| `top-bar.tsx` / `top-bar-slot.tsx` / `use-top-bar.ts` | Pages publish title via `useTopBar({ title })` on `/situations`, `/situations/new`, and loaded workspace (situation name). Slot falls back to `resolveShellPageTitle(pathname)` for redirects and unmapped routes. |
| `route-error-panel.tsx` / `route-not-found-panel.tsx` | Shared segment error / 404 chrome with `EmptyState`. |

## 5. Intake / conversation (`apps/web/components/intake/`)

| Component | Behavior |
|---|---|
| `intake-flow.tsx` | Hero new-case flow; **no `reset()` on each turn**; success → `/situations/${id}` |
| `situation-intake-rail.tsx` | Per-situation intake via `situationIntakeSurface(id)` |
| `use-intake-store.ts` | Scoped stores per surface; `syncAllIntakeLocales` for app-wide locale |
| `prompt-box.tsx` | `raisedSurface`, `focus-within:ring-3`, `maxLength`, `aria-label`, stop when streaming |
| `message-list.tsx` | `ChatScrollArea` + single `ThinkingIndicator` |
| `message-bubble.tsx` | User accent; assistant `Markdown` / `StreamingMarkdown` + copy when done |
| `first-run-onboarding.tsx` | 2-step dialog on `/situations/new` (`localStorage` gate) |

Document stream in workspace uses legal paper / section streaming — **not** chat markdown.

## 6. Guided workspace (`situation-workspace.tsx`)

Single-focus flow (not 4-column grid):

```
header: title + WorkspaceStepProgress (numbered steps, layoutId pill, aria-current="step", completed steps clickable)
main:   AnimatePresence crossfade between step panels (reduced-motion: instant)
footer: Orqaga (ghost) | one brand primary CTA (export download only here — not duplicated in panel)
```

| Step | Panel |
|---|---|
| Suhbat | `SituationIntakeRail` |
| Hujjatlar | `SituationDocumentsPanel` (horizontal `ListRow` doc nav on mobile) |
| Tekshirish | `IssuesPanel` + `review-readiness`; issue → linked doc / `ValidationPanel`; optional Tafsilotlar (`EmptyState variant="list"`) |
| Topshirish | `SituationExportPanel` + `situation-export-blockers.ts`; footer brand ZIP CTA |

Advisories: inline callout (top 2 open). `advisory-panel.tsx` removed.

Document paper: `bg-legal-paper`. Streaming: `resetOnChange: false` while chunks arrive; typewriter after `section_done` only.

## 7. Lists, routes, locale, onboarding

**Home:** `situations-home.tsx` — `EmptyState` + `ListRowGroup`; multi-row skeleton; `isError` + retry; row `aria-label` with `updatedAt`; `situationStatusLabel` in `lib/copy.ts`.

**Routes (canonical):**

| Path | Purpose |
|---|---|
| `/situations` | List |
| `/situations/new` | Intake hero + onboarding |
| `/situations/[id]` | Guided workspace |
| `/cases/*` | Server redirects → `/situations/*` equivalents |

Segment errors: `situations/error.tsx`, `situations/[id]/error.tsx`, `situations/new/error.tsx`, `[id]/not-found.tsx` — link back to `/situations`.

**Locale:** `use-app-store` persisted `locale`; `LocaleBridge` + `useAppLocale` sync **all** intake surfaces; `LocaleToggle` in sidebar + landing; `uiCopy` / `LANDING_COPY` uz\|ru (landing sections fully bilingual). Terminology: **holat** (not ish).

**Legacy:** `/cases/*` server redirects only; `cases-home.tsx` thin re-export. `case-workspace.tsx` and `export-panel.tsx` removed.

## 8. Commands

```bash
pnpm --dir apps/web dev
pnpm lint && pnpm typecheck
```

## 9. Deferred / known gaps

- e-sud direct submit integration.
- Manual light/dark walkthrough on every release (automated screenshot pass covers core routes).
