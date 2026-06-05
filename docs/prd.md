# Areeza — Product Requirements Document (PRD)

> Working name: **Areeza** (Uzbek: *application / petition*). Category: **AI legal filing platform**.
> Companion docs: [product.md](product.md) (positioning), [architecture.md](architecture.md) (how),
> [legal-domain.md](legal-domain.md) (the legal IP), [roadmap.md](roadmap.md) (when), [demo-script.md](demo-script.md) (the demo).

## 1. Vision

Become the **intelligence layer between people and digital justice infrastructure** — starting in Uzbekistan, expandable to every emerging market where courts went online but stayed hard to use.

Digital portals solved access at the *infrastructure* level. Areeza solves it at the *user* level: it translates a real-life problem into a correct, validated, court-ready legal action.

## 2. The insight

The real problem isn't "people don't know the law." It's: **people can't translate their life situation into the correct legal procedure.** They don't need legal information — they need **procedural navigation** that ends in a filed application.

## 3. Users / ICP

| Priority | Who | Job-to-be-done |
|---|---|---|
| **P0 (demo + pitch)** | **Self-represented citizens** who can't afford a lawyer | "Help me file this correctly so it isn't rejected." |
| P1 | **Small businesses / entrepreneurs** | Unpaid invoices, contract & supplier disputes, no in-house lawyer. |
| P2 | **Lawyers / legal clinics** | Faster intake + document drafting; handle more cases. |
| **Strategic (B2G)** | **Courts / legal-aid bodies** | Fewer defective filings, less manual review, better citizen experience, analytics. |

Lead with **citizens + access to justice** (bigger, more important, wins the room). B2B (lawyers/firms) and B2G are the scaling levers.

## 4. Goals & non-goals (hackathon scope)

**Goals**
- A working **end-to-end demo** of one case type (unpaid salary) that produces a real-looking court-ready `da'vo arizasi` + validation + filing guide.
- A multi-issue **`Situation` workspace** that handles many issues from one conversation (one fraud story can spawn a civil claim + a prosecutor complaint + an anti-corruption complaint).
- Our own **on-device routing model** (bge-m3 + LR tier-1 live; LoRA Qwen 1.5B tier-2 trained) — "we trained our own model" is real, not a promise.
- A **VC-grade pitch** with TAM/SAM/SOM, competitor table including direct UZ competitors (Tuzuk, Case Cloud), unit economics, and a $100K pre-seed close.

**Non-goals (now)**
- Real submission integration with e-sud (we *guide* + export a package; integration is roadmap upside).
- Full coverage of all case types (we go deep on 1–2; show breadth as a list).
- Payments, teams, multi-tenant admin — stub or skip.
- Training a generative legal LLM from scratch (we fine-tune a *classifier*; Claude generates).

## 5. The core loop (functional spec)

Each module below is a vertical slice. Build in this order.

### 5.1 Problem intake `[P0]`
- Chat entry: "Nima bo'ldi? / Что случилось?" User describes the problem in plain Uzbek/Russian.
- AI asks **one focused follow-up at a time**, extracting structured facts (employer name, employment status, salary amount, months unpaid, contract availability, evidence, prior communication).
- Output: a structured `case` + `case_facts`.

### 5.2 Case classification `[P0]`
- Classify into a legal category from a fixed enum (see [legal-domain.md](legal-domain.md) §3).
- Returns `{ categoryCode, confidence, track, engine }`. Live, visible step in the demo ("Areeza identified: **labor dispute — wage recovery**").
- Backed by `services/classifier` (tier-1: bge-m3 + LR, live; tier-2: Qwen 1.5B LoRA, swap-in candidate). Keyword router + Claude+enum are always-on fallbacks at the Go API layer.

### 5.3 Filing route selection `[P0]`
- Map category → **route**: which body/court, application type, required documents, fee rule (labor claims are state-fee-exempt — confirm), limitation period, procedure steps, legal basis (Labor Code + Civil Procedure Code articles).
- Data-driven from `packages/core/legal`. Source: [legal-domain.md](legal-domain.md).

### 5.4 Data collection / evidence checklist `[P0]`
- Show required facts + documents. Highlight what's still missing. Let the user confirm/upload.

### 5.5 Document generation `[P0]`
- Generate a **court-ready `da'vo arizasi`** from the route's template + collected facts: court name, plaintiff/defendant, claim amount, factual circumstances (`bayonnoma`), legal basis, demand (`so'rov`), attachment list, date, signature line.
- Editable in the workspace (TipTap). Exportable to PDF.

### 5.6 Validation engine `[P0]`
- Deterministic checks first (missing required fields, wrong/again jurisdiction, fee/exemption, limitation, respondent identified), then a Claude pass for soft issues.
- Output: a checklist `{ label, status: pass|warn|fail, fix }` + `canFile`. This is a core "wow" — it shows *why* filings get rejected and prevents it.

### 5.7 Filing guide / export `[P1]`
- Step-by-step "where and how to file" (e-sud / court), and a downloadable **filing package** (application PDF + checklist). No live integration required for the demo.

### 5.8 Case workspace + tracker `[P1]`
- Per-case view: summary, category, route, required docs, generated application, validation status, submission checklist, status, next steps.

## 6. Demo flow (the thing the jury sees)

See [demo-script.md](demo-script.md) for the exact narration. One sentence of "wow":

> **A person who didn't understand the legal process now holds a complete, validated, court-ready filing package — in under two minutes.**

## 7. Differentiation / moat

1. **Workflow, not wrapper** — completes a filing (route + doc + validation + guide), not Q&A.
2. **Multi-issue platform** — one real-life situation often has 3–4 legal threads (fraud + corruption + police inaction). We're the only tool that models that.
3. **Local legal intelligence** — our own on-device classifier (bge-m3 tier-1 + Qwen LoRA tier-2) + structured legal route engine + lex.uz RAG.
4. **Validation engine** — encodes *why filings get rejected*; this dataset compounds into a moat over time.
5. **Founder execution** — built live, fast, by the country's Cursor Ambassador.
6. **Advisor: Anvarjon Abdullajonov** (Oliy Sud Dev Team Leader) — real procedural fidelity, real integration path.

## 8. Success metrics

- **Hackathon:** CP1 → CP2 score growth (the rubric weights it 0.4/0.6); reach final (top-5 in track); win the Court/Justice track.
- **Product (post-event):** % reduction in rejection risk for filed applications; time-to-prepared-filing (minutes vs. days); # of completed filing packages; pilot with a court / legal-aid body.

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Unauthorized-practice-of-law / liability | Position as navigation + preparation, human-in-the-loop, "reduces rejection risk" (never guarantees). Procedural fidelity reviewed with an Oliy Sud Dev Team advisor. |
| Gov-integration dependency | Citizen-side works *without* integration (generate + guide). Integration is upside, not a blocker. |
| "Market too small" | Frame TAM globally (every digitizing-justice market), SAM Central Asia/CIS, SOM UZ. |
| Generated doc looks fake / wrong | Mirror real `da'vo arizasi` structure; advisor validation; deterministic templates over free-form generation. |
| Hallucinated legal claims | Legal structure is data-driven (engine), not model-invented; model only fills narrative slots. |

## 10. Open decisions

- Final product name (Areeza vs. Areeza AI vs. Adli) — Areeza for now.
- Classifier training approach (synthetic-data fine-tune vs. embeddings+classifier) — see [roadmap.md](roadmap.md); decide once data brief lands.
- How much of the e-sud submission flow to *simulate* in the demo.
