# Areeza — Architecture

> How the system is built and how to scaffold it fast by reusing `notiky-app`.
> Read alongside [CLAUDE.md](../CLAUDE.md) (conventions) and [prd.md](prd.md) (what).

## 1. System overview

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 16 app (apps/web)                                   │
│                                                              │
│  Chat intake  ─┐                      ┌─ Case workspace      │
│  (streamText)  │                      │  (documents, valid., │
│                ▼                      │   status, export)    │
│         ┌──────────────┐              └──────────────────────┘
│         │  API routes  │  ── Vercel AI SDK ──▶  Claude        │
│         │ /api/intake  │                        (Anthropic)   │
│         │ /api/classify│  ──▶  Fine-tuned UZ classifier       │
│         │ /api/draft   │        (planned; Claude+enum until)  │
│         │ /api/validate│                                      │
│         │ /api/export  │  ── legal engine (packages/core) ──┐ │
│         └──────────────┘                                    │ │
└──────────────────────────────────────────────────────────┼─┘
                                                             ▼
                        Supabase (Postgres + pgvector + Auth + Storage)
```

## 2. The agentic pipeline (the product)

| Stage | Input | Output | How |
|---|---|---|---|
| 1. Intake | user message | `case_facts` | `streamText` + tools: `ask_followup`, `record_fact` |
| 2. Classify | facts + narrative | `categoryCode` | classifier model (or Claude + zod enum) |
| 3. Route | category | route object | `packages/core/legal` lookup (data-driven) |
| 4. Collect | route.requiredFacts | missing list | diff facts vs. required; ask/upload |
| 5. Draft | route + facts | `da'vo arizasi` (md) | template + Claude fills narrative slots |
| 6. Validate | document + facts | checks[] + canFile | deterministic rules → Claude soft-check |
| 7. File | validated package | guide + PDF | render PDF, render e-sud steps |
| 8. Track | case | status view | workspace UI |

**Principle:** legal *structure* is data (the engine); the model only fills *content* slots. This kills hallucinated procedure and makes output deterministic enough to trust.

## 3. Data model (Supabase / Postgres)

```sql
-- identity via Supabase Auth (auth.users) + profiles
profiles(id uuid pk → auth.users, full_name, locale default 'uz')

cases(
  id uuid pk, user_id uuid, title text, status text,         -- draft|collecting|ready|filed
  category_code text, route_id text,
  claim_amount numeric, currency text default 'UZS',
  created_at, updated_at)

case_messages(id, case_id fk, role, content, created_at)      -- chat intake transcript

case_facts(id, case_id fk, key text, value jsonb, source text)-- structured extracted data

documents(
  id, case_id fk, type text,                                  -- 'davo_arizasi' etc.
  title, content_md text, pdf_url text,
  status text, version int)

validations(id, case_id fk, document_id fk, checks jsonb, can_file bool, created_at)

attachments(id, case_id fk, name, storage_path, kind)         -- uploaded evidence

-- legal knowledge (seed from docs/legal-domain.md; can be code-constants for hackathon)
legal_categories(code pk, name_uz, name_ru, description)
legal_routes(
  id pk, category_code fk, body text, court_type text,
  application_type text, required_facts jsonb, required_docs jsonb,
  fee_rule text, limitation text, procedure_steps jsonb, law_refs jsonb)
legal_templates(id pk, route_id fk, template_md text, required_fields jsonb)
```

> For hackathon speed, `legal_categories/routes/templates` can start as **typed constants in `packages/core/legal`** (no DB round-trip, easy to edit, version-controlled). Move to DB only if needed.

## 4. API surface (Next.js route handlers)

```
POST /api/intake        # streaming chat; tools extract facts; returns case state
POST /api/classify      # { caseId } → { categoryCode, confidence, rationale }
GET  /api/cases         # list
POST /api/cases         # create
GET  /api/cases/:id     # full case (facts, route, docs, validation)
POST /api/cases/:id/draft     # generate da'vo arizasi
POST /api/cases/:id/validate  # run validation engine
POST /api/cases/:id/export    # render filing-package PDF
```

## 5. Reuse map — what to copy from `notiky-app`

Source root: `/Users/romalutfullaev/Projects/notiky/notiky-app`

| Take | From | Use for |
|---|---|---|
| shadcn primitives | `packages/ui/components/ui/*` | all buttons/inputs/dialogs/sheets/tabs/cards |
| chat bubble / message list / prompt box | `packages/views/copilot/components/{message-bubble,message-list,prompt-box}.tsx` | the intake chat UI (strip the WS/Go coupling, feed from AI SDK) |
| TipTap editor | `packages/views/editor/content-editor.tsx` (+ bubble-menu) | editing the generated `da'vo arizasi` |
| layout / resizable panels / sidebar | `packages/views/layout/*` | two-pane (chat + workspace) shell |
| wait/work indicators | `packages/views/common/{chat-wait-indicator,chat-work-steps}.tsx` | "Areeza is preparing…" states |
| tsconfig / eslint config | `packages/tsconfig`, `packages/eslint-config` | workspace config |
| pnpm-workspace / turbo.json shape | root | monorepo setup |

**Do NOT copy:** the Go `server/`, the WebSocket streaming protocol (`streaming.ts` is coupled to Go), the billing/Stripe stack. We replace the data layer with Vercel AI SDK + Supabase.

## 6. Scaffold plan (first commands)

```bash
# from repo root (/Users/romalutfullaev/Projects/hackathon)
git init
pnpm init                      # set "packageManager": "pnpm@10", workspaces
# pnpm-workspace.yaml: packages: ["apps/*", "packages/*"]
pnpm dlx create-next-app@latest apps/web --ts --app --tailwind --eslint --src-dir=false
pnpm add ai @ai-sdk/anthropic zod @supabase/supabase-js --filter web
pnpm dlx shadcn@latest init    # in apps/web (or packages/ui)
# create packages/core (ai, legal, types, db) + packages/ui
# copy reuse map components from notiky-app
# .env.local: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE keys
pnpm dev
```

Then build vertical slices M1→M5 per [roadmap.md](roadmap.md).

## 7. Environment

```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
# (later) CLASSIFIER_API_URL=  for the fine-tuned model endpoint
```

## 8. Deploy

- **App:** Vercel (App Router + API routes). **Data:** Supabase cloud.
- **Classifier (later):** small hosted endpoint (or embeddings+classifier inside an API route) at `CLASSIFIER_API_URL`.
- **GitHub:** required for CP2 — keep history clean and the README current.
