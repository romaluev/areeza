# Areeza — Dev Setup & Onboarding

> Get productive in ~10 minutes. You do **not** need any external reference repo locally — everything you need is in `/docs`.

## 1. Prerequisites

- **Node 22+** and **pnpm 10** (`corepack enable` then `corepack prepare pnpm@latest --activate`)
- **git** with SSH access to `git@github.com:romaluev/areeza.git`
- An AI coding agent (Cursor / Claude Code) — point it at [CLAUDE.md](../CLAUDE.md)
- **Go 1.26+** and **Docker** (backend track — `make dev` / `make preflight`)
- **ANTHROPIC_API_KEY** when running the real Go API or the full stack

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
pnpm dev          # web on :3000
pnpm build        # turbo build all
pnpm lint         # eslint across the workspace
pnpm typecheck    # tsc --noEmit across the workspace
make dev          # Go API on :8080 (in-memory store; Postgres provisioned via docker-compose, persistence TBD)
make all          # full stack: RAG :8082 · classifier-t1 :8081 · classifier-t2 :8083 · API :8080 · web :3000
make test         # go test ./...
make vet          # go vet ./...
make seed         # regenerate server/internal/store/seed.json from TS fixtures
make preflight    # full check (go + web + compose + 4 images)
SKIP_DOCKER=1 make preflight   # fast path: skip image builds
```

Run `pnpm typecheck && pnpm lint` **before every push** (see [conventions.md](conventions.md) §4).

## 3b. Optional: classifier + RAG services (real-mode enrichment)

The **mock Situation demo** does not need these. When `NEXT_PUBLIC_API_MODE=real`, the Go API can call two optional Python sidecars; if they are down or unset, behavior degrades gracefully.

| Service | Port | Env (Go API) | Fallback when unset / unreachable |
|---|---|---|---|
| [`services/classifier`](../services/classifier/) tier-1 | **8081** | `CLASSIFIER_API_URL=http://localhost:8081` | In-proc **keyword router** in `server/internal/legal/classify.go` (covers all 16 codes including `fraud.*`, `criminal.*`, `family.*`, `admin.*`) |
| [`services/classifier`](../services/classifier/) tier-2 | **8083** | `CLASSIFIER_TIER2_URL=http://localhost:8083` | tier-1 (then keyword, then Claude+enum) |
| [`services/rag`](../services/rag/) | **8082** | `RAG_API_URL=http://localhost:8082` | Static `LegalBasis` from the route engine |

**Classifier (trained router, 16 categories — see [classifier README](../services/classifier/README.md) for full setup):**

```bash
cd services/classifier
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
python generate.py seed          # seed training JSONL from data/classify/
python train.py                  # downloads bge-m3 + LoRA — multi-GB, one-time
uvicorn serve:app --host 0.0.0.0 --port 8081
```

**RAG (lex.uz grounding):**

```bash
cd services/rag
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
python ingest.py                 # scrape + embed — multi-GB, one-time
uvicorn serve:app --host 0.0.0.0 --port 8082
```

**Wire into the Go API:**

```bash
export CLASSIFIER_API_URL=http://localhost:8081   # optional
export RAG_API_URL=http://localhost:8082          # optional; not used by draft yet
make dev
curl -s -X POST http://localhost:8080/api/classify \
  -H 'Content-Type: application/json' \
  -d '{"text":"Ish beruvchim oyligimni to'\''lamayapti"}'
```

With `CLASSIFIER_API_URL` unset, `/api/classify` always answers via the keyword router (no Python process required). Contracts: [handoff-classify-contract.md](handoff-classify-contract.md), [handoff-rag-contract.md](handoff-rag-contract.md).

## 4. Repo map (where things live)

```
apps/web                  # Next.js 16 — (marketing) landing + (app)/situations workspace
packages/ui               # @areeza/ui — design tokens, shadcn primitives, vendored Fluid Functionalism
packages/core/src/types   # zod contracts (shared)
packages/core/src/api     # typed client (mock | real) + fixtures
packages/core/src/legal   # category labels mirror (Go engine in server/internal/legal is canonical)
server/                   # Go backend (chi · websocket · AI packages)
services/classifier       # Python — tier-1 bge-m3+LR + tier-2 Qwen LoRA (MLX)
services/rag              # Python — lex.uz curated corpus + bge-m3 retrieval
docs/                     # the product brain — start here
```

## 5. Read-first, by role

- **Everyone:** [CLAUDE.md](../CLAUDE.md) → [development-plan.md](development-plan.md) → [conventions.md](conventions.md).
- **Backend / AI:** [legal-domain.md](legal-domain.md) (the IP), [model-plan.md](model-plan.md) (classifier + RAG), [architecture.md](architecture.md).
- **Frontend:** [ui-guide.md](ui-guide.md), [development-plan.md](development-plan.md).
- **Deploy:** [deploy.md](deploy.md) (Coolify).
- **Pitch / strategy:** [pitch.md](pitch.md), [market-research.md](market-research.md), [final-research.md](final-research.md), [demo-script.md](demo-script.md).

## 6. How to pick up work

1. Open [development-plan.md](development-plan.md) §4 to see what's shipped vs. on deck.
2. Branch: `<owner>/<slug>` (e.g. `roma/postgres-persistence`, `mukhammadxoja/classifier-tier2-eval`).
3. Build **only inside the folders you own** ([conventions.md](conventions.md) §1) against the contract.
4. `pnpm typecheck && pnpm lint` (web) + `go test ./...` + `go vet ./...` (Go) before push. Small PR.

## 7. Working with agents

- One agent per task; feed it [CLAUDE.md](../CLAUDE.md) + the relevant role doc.
- Tell it to stay inside the task's `paths`.
- Running several file-mutating agents at once? Give each its own **git worktree** (see [conventions.md](conventions.md) §6).
