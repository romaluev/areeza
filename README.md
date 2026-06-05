# Areeza — AI Legal Filing Platform

> **From "I have a problem" to a court-ready filing — without needing to understand the legal system.**

Areeza turns a citizen's plain-language story (`"my employer hasn't paid my salary for two months"`) into the **correct legal route, a court-ready `da'vo arizasi`, a validated filing package, and step-by-step submission guidance** for Uzbekistan's digital courts.

It is **not** an AI lawyer or a chatbot. It is a **filing platform**: it completes a workflow, with a human in the loop.

🟢 **Live:** [areeza.uz](https://areeza.uz) · API: [api.areeza.uz](https://api.areeza.uz/health)

---

## The problem

Uzbekistan's courts went online (`my.sud.uz`, `cabinet.sud.uz`), but the **user-level access problem wasn't solved**. A citizen still has to know which legal category, which forum, which form, which code articles, what evidence — or the filing gets rejected for a procedural mistake. A lawyer costs **~$500** ([Real Protection](https://realprotection.uz/price)) for a case that's often worth $200–$1,200. **The math doesn't work, so most people don't file.**

Meanwhile, civil cases grew **+50% YoY in 2025 to 2M+**, with **556 cases per judge per month** — the Supreme Court called the load "an unrealistic regime" ([Gazeta.uz, Feb 2026](https://www.gazeta.uz/en/2026/02/11/courts/)).

Areeza is the missing intelligence layer between people and digital justice.

---

## How it works (the loop)

```
Describe → Classify → Route → Collect → Draft → Validate → File → Track
```

A multi-issue **Situation** can contain many **Issues** (e.g. fraud + corruption complaint + police-inaction admin complaint), each with its own forum, route, and **Document** — all driven from a single guided conversation.

## Flagship demo — unpaid salary

A worker types: *"Ish haqimni 2 oydan beri to'lashmayapti."* In ~2 minutes Areeza produces a **court-ready `da'vo arizasi`** with the correct civil court, the Labor Code basis, the claim amount, the attachment checklist, and a "where and how to file" guide — and flags everything that could cause rejection.

---

## Tech stack

| Layer | Choice |
|---|---|
| Monorepo | pnpm + Turborepo |
| Web | Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · TipTap |
| Backend | **Go** (chi · gorilla/websocket) · in-memory store today, Postgres+pgvector provisioned |
| LLM | **Anthropic Go SDK** (Claude sonnet 4.6 for intake/validate, opus 4.8 for drafting) behind a `pkg/llm.Provider` interface |
| Routing model | **On-device tier-1 classifier** — `BAAI/bge-m3` embeddings + calibrated LogisticRegression (live); LoRA-tuned `Qwen2.5-1.5B` on MLX as tier-2 ("we trained our own model") |
| Legal grounding | Local **RAG** over a curated lex.uz corpus (bge-m3 + NumPy index); cites real article numbers and URLs |
| PDF | Server-rendered court-ready document export |
| Deploy | Docker Compose on **Coolify** (web · api · classifier · rag · pgvector) → [areeza.uz](https://areeza.uz) |

See [docs/architecture.md](docs/architecture.md) for the full design.

## Repo structure

```
apps/web/             # Next.js — (marketing) landing + (app) situations workspace
packages/ui/          # @areeza/ui — design tokens, shadcn primitives, Fluid Functionalism motion
packages/core/        # shared TS — types · api client (mock | real) · legal data
server/               # Go backend
  cmd/areeza/         # entrypoint
  internal/
    api/              # REST + WebSocket handlers
    ai/               # intake brain · draft · validate (soft-pass) · classify · scripted demo
    legal/            # route engine + keyword fallback classifier
    situation/        # Situation aggregate model
    export/           # PDF / package builders
    pipeline/prompts/ # named prompt constants
    store/            # in-memory + seed
  pkg/
    ai/               # Brain interface
    llm/              # Anthropic provider
services/
  classifier/         # Python FastAPI · bge-m3 + LR (tier-1) · Qwen2.5-1.5B LoRA (tier-2)
  rag/                # Python FastAPI · curated lex.uz corpus + bge-m3 retrieval
docs/                 # the product brain
pitch/                # web pitch deck
```

## Quickstart

```bash
pnpm install
cp .env.example apps/web/.env.local   # NEXT_PUBLIC_API_MODE=mock by default
pnpm dev                              # web → http://localhost:3000
```

Mock mode runs the full demo with **no backend and no keys**. For real-mode (Go API + classifier + RAG), see [docs/dev-setup.md](docs/dev-setup.md) and [docs/deploy.md](docs/deploy.md).

## Docs

Start here:

| Doc | What |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Agent brain — read before coding |
| [docs/prd.md](docs/prd.md) | Product vision |
| [docs/architecture.md](docs/architecture.md) | System design, pipeline, token discipline |
| [docs/legal-domain.md](docs/legal-domain.md) | The legal IP (routes, templates, validation) |
| [docs/model-plan.md](docs/model-plan.md) | Classifier + RAG |
| [docs/ui-guide.md](docs/ui-guide.md) | Frontend design system |
| [docs/dev-setup.md](docs/dev-setup.md) | Onboarding & commands |
| [docs/deploy.md](docs/deploy.md) | Coolify deploy |
| [docs/pitch.md](docs/pitch.md) | Pitch + speaker notes |
| [docs/market-research.md](docs/market-research.md), [docs/final-research.md](docs/final-research.md) | Market data |

## Team

- **Rakhmatillo Lutfullaev** — Founder · CEO. First Cursor Ambassador in Uzbekistan. Built Horyco (restaurant AI OS) and Notiky (AI product brain).
- **Mukhammadxoja Lutfullaev** — CTO. SWE @ Clockster, ex-CTO @ Horyco. Leads model training + scraping.
- **Shoxdiyor Aliyev** — COO. Manager @ Yandex Market.
- **Saloxiddin Mirxafizov** — Growth.
- **Abdulboriy Abduxalilov** — SWE (frontend).
- **Advisor: Anvarjon Abdullajonov** — Oliy Sud Dev Team Leader · 10+ yrs SWE.

## Status

**Milliy AI Xakaton — Andijon stage (3–6 Jun 2026), Track: Sud Tizimi.** Passed CP1 + CP2, top-20 (#1 by checkpoint score). In the final on 6 Jun.
