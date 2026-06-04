# Areeza — Dev Setup & Onboarding

> Get productive in ~10 minutes. You do **not** need any reference repo (notiky-app, etc.) locally — everything you need is in `/docs`.

## 1. Prerequisites

- **Node 22+** and **pnpm 10** (`corepack enable` then `corepack prepare pnpm@latest --activate`)
- **git** with SSH access to `git@github.com:romaluev/areeza.git`
- An AI coding agent (Cursor / Claude Code) — point it at [CLAUDE.md](../CLAUDE.md)
- **ANTHROPIC_API_KEY** (Dev 1 / anyone running the AI routes)
- A **Supabase** project (Dev 1 / Roma) — URL + anon + service-role keys

## 2. First run

```bash
git clone git@github.com:romaluev/areeza.git
cd areeza
pnpm install
cp .env.example .env.local        # fill the keys you have
pnpm dev                          # web → http://localhost:3000
```

Frontend works **with no keys**: `.env.local` defaults to `NEXT_PUBLIC_API_MODE=mock`, so the whole UI runs on fixtures. Set it to `real` once Dev 1's routes are live.

## 3. Commands

```bash
pnpm dev          # run the web app
pnpm build        # turbo build all
pnpm lint         # eslint across the workspace
pnpm typecheck    # tsc --noEmit across the workspace
pnpm db:push      # apply the Supabase schema (Dev 1)
```

Run `pnpm typecheck && pnpm lint` **before every push** (see [conventions.md](conventions.md) §4).

## 4. Repo map (where things live)

```
apps/web            # the app — Dev 2 owns app/(marketing|app) + components; Dev 1 owns app/api/{intake,classify,route,draft,validate}
packages/ui         # @areeza/ui — design system & components (Dev 2)
packages/core/types # the CONTRACTS — zod + types (Roma; shared)
packages/core/api   # client + mock + real + fixtures (Dev 2)
packages/core/ai    # prompts, schemas, Claude wrappers (Dev 1)
packages/core/legal # the route engine (Dev 1)
packages/core/db    # supabase (Dev 1)
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
