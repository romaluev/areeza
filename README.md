# Areeza — AI Legal Filing Platform

> **From "I have a problem" to a court-ready application — without needing to understand the legal system.**

Areeza turns a citizen's plain-language story ("my employer hasn't paid my salary for two months") into the **correct legal route, a court-ready application, a validated filing package, and step-by-step submission guidance** for Uzbekistan's digital courts.

It is **not** an "AI lawyer" or a chatbot. It is a **filing platform**: it completes a workflow, not a conversation.

---

## The problem

Uzbekistan's courts went online (`e-sud.uz`, `my.gov.uz`), but the **user-level access problem wasn't solved**. Citizens still have to know:

- which legal category their problem falls under,
- which body/court has jurisdiction,
- which application form to file,
- what documents and evidence to attach,
- how to actually write the application.

Most people don't. So they choose the wrong form, miss a document, write it incorrectly — and get **rejected for a procedural mistake**, never understanding why. A lawyer is too expensive for an unpaid-salary or small-debt case.

**The bottleneck moved from "can I access the portal?" to "can I prepare the right submission?"** That's the gap Areeza fills — the missing intelligence layer between people and digital justice.

---

## How it works (the core loop)

```
Describe problem → Guided intake → Classify case → Select filing route
   → Collect facts & evidence → Generate application → Validate (rejection-risk check)
   → Filing guide / export package → Track status
```

A **hybrid interface**: chat for intake, a structured **case workspace** for documents, validation, and submission.

## Flagship demo — Unpaid salary claim

A worker types: *"Ish haqimni 2 oydan beri to'lashmayapti."* In ~60 seconds Areeza produces a **court-ready `da'vo arizasi` (statement of claim)** with the correct court, the correct Labor Code basis, the claim amount, the attachment checklist, and a "where and how to file" guide — and flags what's missing before it can be rejected.

---

## Why now

- Digital courts are **already online** in Uzbekistan — the infrastructure exists.
- LLMs just crossed the threshold where they can **navigate procedure**, not just answer questions.
- A national e-government / justice digitization push creates demand and a B2G path.

That two-curve intersection didn't exist 18 months ago.

## Differentiation

- **Workflow, not wrapper.** We complete the filing, not just give advice.
- **Domain-grounded.** Built with **advisors from Oliy Sud (Supreme Court of Uzbekistan)** — real procedures, real forms, regulatory realism.
- **Local legal intelligence.** A fine-tuned Uzbek case-classifier routes plain-language problems to the correct procedure (handles Uzbek/Russian where generic models are weak); Claude does the heavy document generation.
- **Validation engine** that reduces rejection risk against known procedural defects.

---

## Tech stack


| Layer                 | Choice                                                       |
| --------------------- | ------------------------------------------------------------ |
| Monorepo              | pnpm + Turborepo                                             |
| Web app               | Next.js 16 (App Router) · React 19 · TypeScript              |
| UI                    | Tailwind v4 · shadcn/ui (reused from notiky) · TipTap editor |
| AI                    | Vercel AI SDK · Claude (Anthropic) · zod structured outputs  |
| Routing model         | Fine-tuned Uzbek legal case-classifier *(planned)*           |
| Data / Auth / Storage | Supabase (Postgres + pgvector)                               |
| PDF                   | Server-rendered court-ready document export                  |
| Deploy                | Vercel + Supabase                                            |


See [docs/architecture.md](docs/architecture.md) for the full design and reuse map.

## Repo structure

```
Areeza/
├── apps/web/            # Next.js app (UI + API routes)
├── packages/ui/         # shadcn + reused components
├── packages/core/       # shared types, AI prompts, legal engine
├── docs/                # product brain (read these first)
│   ├── prd.md                # product requirements
│   ├── development-plan.md   # parallel tasks + ownership (start here to build)
│   ├── conventions.md        # naming, isolation, git, agent rules
│   ├── architecture.md       # system design, data model
│   ├── legal-domain.md       # case → route → form knowledge (the IP)
│   ├── ui-guide.md           # design system + reuse map (frontend)
│   ├── model-plan.md         # the classifier (AI/model track)
│   ├── dev-setup.md          # onboarding & commands
│   ├── roadmap.md            # checkpoint strategy
│   ├── demo-script.md        # the demo, step by step
│   ├── pitch.md              # the pitch (English) + deck content
│   ├── market-research.md    # cited market & competitor research
│   └── product.md            # original vision & positioning
├── CLAUDE.md            # the agent brain — read before coding
└── README.md
```

## Quickstart *(once scaffolded)*

```bash
pnpm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY + SUPABASE keys
pnpm dev                      # http://localhost:3000
```

---

## Team & Advisors

- **Roma Lutfullaev** — Founder / Team lead. First Cursor Ambassador in Uzbekistan; built Horyco (restaurant AI OS, solo) and Notiky (AI product brain). Vibe-coding at the level this hackathon rewards.
- **Advisors — Oliy Sud (Supreme Court of Uzbekistan):** validate legal procedures, forms, and regulatory compliance.
- *(+ team: see [docs/prd.md](docs/prd.md))*

## Status

**Milliy AI Xakaton — Andijan stage (June 3–6, 2026), Track: Sud Tizimi (Court/Justice).** See [docs/roadmap.md](docs/roadmap.md) for the checkpoint strategy.