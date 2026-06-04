# Areeza — Dev Setup & Onboarding

> Get productive in ~10 minutes. You do **not** need any reference repo (notiky-app, etc.) locally — everything you need is in `/docs`.

## 1. Prerequisites

- **Node 22+** and **pnpm 10** (`corepack enable` then `corepack prepare pnpm@latest --activate`)
- **git** with SSH access to `git@github.com:romaluev/areeza.git`
- An AI coding agent (Cursor / Claude Code) — point it at [CLAUDE.md](../CLAUDE.md)
- **Go 1.22+** and **Docker** (backend track — `make dev`)
- **ANTHROPIC_API_KEY** only when pointing the web at the real Go API or running AI routes locally

## 2. First run (frontend — mock, no backend)

```bash
git clone git@github.com:romaluev/areeza.git
cd areeza
pnpm install
cp .env.example apps/web/.env.local   # NEXT_PUBLIC_API_MODE=mock by default
pnpm dev                              # web → http://localhost:3000
```

Frontend works **with no keys**: `NEXT_PUBLIC_API_MODE=mock` runs the full demo (intake stream → workspace → da'vo arizasi → validation → export) on fixtures. Set `NEXT_PUBLIC_API_MODE=real` and `NEXT_PUBLIC_API_URL` once the Go API is live.

## 3. Commands

```bash
pnpm dev          # run the web app
pnpm build        # turbo build all
pnpm lint         # eslint across the workspace
pnpm typecheck    # tsc --noEmit across the workspace
make dev          # Go API + Postgres (backend track)
make migrate      # apply DB migrations
```

Run `pnpm typecheck && pnpm lint` **before every push** (see [conventions.md](conventions.md) §4).

## 4. Repo map (where things live)

```
apps/web            # Next.js 16 app — (marketing) landing + (app) cases/intake/workspace
packages/ui         # @areeza/ui — design tokens + Radix/shadcn primitives
packages/core/types # zod contracts (shared)
packages/core/api   # typed client + mock + fixtures
packages/core/legal # route/category data (mirrors legal-domain.md; Go engine is canonical in server/)
server/             # Go backend (separate track)
docs/               # the product brain — start here
```

## 5. Read-first, by role

- **Everyone:** [CLAUDE.md](../CLAUDE.md) → [development-plan.md](development-plan.md) → [conventions.md](conventions.md).
- **Dev 1 (AI/Model + Backend):** [legal-domain.md](legal-domain.md) (the IP), [model-plan.md](model-plan.md) (your classifier), [architecture.md](architecture.md) (data model + pipeline). You don't need any UI repo.
- **Dev 2 (Frontend):** [ui-guide.md](ui-guide.md) (design system + the reuse map — self-contained), [development-plan.md](development-plan.md) Track B.
- **Pitch/strategy:** [pitch.md](pitch.md), [market-research.md](market-research.md), [demo-script.md](demo-script.md).

## 6. How to pick up work

1. Open [development-plan.md](development-plan.md) §4, find an unclaimed task in **your track** (`A*` Dev 1, `B*` Dev 2, `P0*` Roma).
2. Branch: `a/<id>-<slug>` or `b/<id>-<slug>` (e.g. `b/b3-intake-chat`).
3. Build **only inside that task's `paths`** against the **contract** (mock if you're Dev 2).
4. Meet the task's "done-when". `typecheck` + `lint`. Open a small PR. Merge when green.

## 7. Working with agents

- One agent per task; feed it the **task card** + the relevant doc (legal-domain / ui-guide) + [CLAUDE.md](../CLAUDE.md).
- Tell it to stay inside the task's `paths` and target the contracts.
- Running several file-mutating agents at once? Give each its own **git worktree** so they don't collide (see [conventions.md](conventions.md) §6).
