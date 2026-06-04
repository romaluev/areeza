# Areeza — Conventions (naming · isolation · git · agents)

> The rules that let 3 people + their agents build in parallel without conflicts. Short, enforced.
> Pairs with [development-plan.md](development-plan.md) (ownership map) and [CLAUDE.md](../CLAUDE.md).

## 1. Monorepo layout & package names

```
areeza/                      (repo root — git@github.com:romaluev/areeza.git)
├── apps/
│   └── web/                 # Next.js 16 app (UI + API routes)
│       ├── app/
│       │   ├── (marketing)/ # landing
│       │   ├── (app)/       # authed product (cases, workspace)
│       │   └── api/         # route handlers
│       └── components/      # app-specific composition (thin)
├── packages/
│   ├── ui/                  # @areeza/ui  — presentational components (shadcn + reused)
│   └── core/                # @areeza/core — framework-free logic
│       ├── ai/              #   prompts, schemas, Claude wrappers (Dev 1)
│       ├── legal/           #   the route engine (Dev 1)
│       ├── db/              #   supabase client + queries (Dev 1)
│       ├── api/             #   client + mock + real + fixtures (Dev 2)
│       └── types/           #   THE CONTRACTS — zod + inferred types (Roma)
└── docs/                    # the product brain
```

Package names: **`@areeza/ui`**, **`@areeza/core`** (subpath exports: `@areeza/core/types`, `@areeza/core/legal`, …).
Import direction (never violate): `apps/web` → `@areeza/{ui,core}`; `@areeza/ui` → `@areeza/core/types` only; `@areeza/core` → never imports from `apps`. No circular deps.

## 2. Naming conventions

| Thing | Rule | Example |
|---|---|---|
| Files & folders | `kebab-case` | `case-workspace.tsx`, `route-engine.ts` |
| React components | `PascalCase` export, `kebab-case` file | `CaseWorkspace` in `case-workspace.tsx` |
| Hooks | `useXxx`, file `use-xxx.ts` | `useCase` in `use-case.ts` |
| Functions / vars | `camelCase` | `buildClaim()` |
| Types / interfaces | `PascalCase` (no `I` prefix) | `LegalRoute` |
| Zod schemas | `XxxSchema` next to its type | `CaseSchema` → `type Case = z.infer<…>` |
| Constants / enums | `SCREAMING_SNAKE` / `PascalCase` | `MAX_FACTS`, `CategoryCode` |
| API routes | `app/api/<resource>/route.ts`, REST verbs | `app/api/cases/route.ts` |
| Category codes | `domain.subtype` (lowercase) | `labor.wage_recovery` |
| Env vars | `SCREAMING_SNAKE`; client vars `NEXT_PUBLIC_` | `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_API_MODE` |
| CSS | Tailwind utilities + design tokens; no ad-hoc hex | `text-primary`, not `#0E1B33` |

**Domain term rule:** the brand is **`Areeza`** (always that spelling). The legal document type is **`da'vo arizasi`** — generic Uzbek, **lowercase**, never rename it to the brand. Same for `ariza` (application). Don't let a find-replace corrupt legal vocabulary.

## 3. The contract rule (most important)

- All cross-track types live in `@areeza/core/types` as **zod schemas** with inferred TS types. Validate inputs/outputs at every API boundary with the schema.
- **Changing a contract is a shared action:** tiny PR, title `contract: …`, ping the other dev. Never edit a contract silently — it desyncs the other track.
- Dev 2 always codes against `@areeza/core/api` (mock or real), **never** against Dev 1's internals.

## 4. Git workflow

- Default branch **`main`** must always be runnable (typecheck + lint + build green).
- **Branch per task:** `a/<task-id>-<slug>` (Dev 1), `b/<task-id>-<slug>` (Dev 2), `p0/<task-id>-<slug>` (Roma). Example: `a/a6-draft-engine`.
- **Conventional commits**, scoped: `feat(legal): add wage-recovery route`, `fix(intake): stream order`, `chore(ci): add typecheck`. Scopes: `legal, ai, api, ui, web, types, db, ci, docs`.
- **Small, frequent PRs.** Self-review the diff. Merge your own track's PRs once CI is green; ping for cross-track/contract PRs.
- Before every push: `pnpm typecheck && pnpm lint` (and `pnpm build` before merging to main).
- **Never commit:** secrets (`.env*` except `.env.example`), `node_modules`, build output (see [.gitignore](../.gitignore)).

## 5. Isolation rules (so parallel work doesn't collide)

1. **Edit only the folders you own** (development-plan §1). This alone prevents ~all merge conflicts.
2. **Shared files** (`package.json`, root configs, `@areeza/core/types`, `.env.example`): change via a small PR + a ping; don't batch unrelated edits into them.
3. **One feature = one branch = one PR.** Don't pile multiple tasks into one branch.
4. **Add, don't rewrite,** in shared modules (append a new schema/route rather than refactoring the file someone else is in).
5. If you must touch another track's file, **ask first** — they may be mid-edit.

## 6. Agentic-coding rules (we vibe-code in parallel)

- **One agent per task,** scoped to that task's `paths` from the plan. Give it the task card + the relevant doc (legal-domain, ui-guide) as context.
- **Parallel file-mutating agents → use `git worktrees`** (each agent on its own branch/worktree) so they can't clobber each other. Read-only/research agents don't need this.
- Every agent must: target the **contracts**, run `typecheck`+`lint` before reporting done, and **not** edit files outside its task scope.
- Keep prompts in `@areeza/core/ai/prompts/` as named exports — never inline long prompts in routes (so agents edit prompts in one place).
- Prefer **vertical slices** (one case path working end-to-end) over horizontal layers.

## 7. Quality gates (Definition of Done)

A task is done when: it matches its **contract**, `pnpm typecheck && pnpm lint` pass, the **app still runs**, the demo path isn't broken, and (UI) it has loading/empty/error states + works in light & dark. No `TODO(real):` left in the demo path for CP2.
