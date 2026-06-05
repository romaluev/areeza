# Areeza — Roadmap & Checkpoint Strategy

> We are **live** at the Milliy AI Xakaton, Andijan stage. This doc is the living plan.
> Score = `0.4 × CP1 + 0.6 × CP2`. **Growth between checkpoints is the game.**

## The meta-strategy (read this first)

The rubric pays for a **growth arc**, not a peak. Three consequences:

1. **CP1 (today) is discovery, not a final.** Its weight is only 40%, and its real value is that the **three mentors who score you are your judges** — for Technical, Business, and Domain. Use CP1 to extract their objections, pre-sell the vision, and bank goodwill. Show enough to be credible; don't burn the night polishing for 40%.
2. **CP2 (tomorrow) is where we win.** 60% weight + it explicitly rewards "how you applied mentor advice." We land the full working demo + a visible leap (the fine-tuned classifier, validation, polish) that directly answers CP1 feedback. **This is Roma's overnight-rebuild superpower, aimed at exactly the metric that rewards it.**
3. **Cover all three lenses on purpose:**
   - **Technical (T1–T5):** real implementation, clean GitHub, innovation, *team knowledge*, strong stack → Go + Anthropic Go SDK + the on-device classifier (bge-m3 + LR tier-1 live, Qwen LoRA tier-2 trained) + local lex.uz RAG.
   - **Business (B1–B5):** relevance, monetization, moat, sustainability, growth → TAM/SAM/SOM + unit economics + Notiky/Horyco traction proof.
   - **Domain (S1–S5):** depth + *regulatory compliance* → **lead with the Oliy Sud advisors**; show a real-looking `da'vo arizasi`.

## Schedule (June 3–6, 2026)

| Day | Date | What | Our move |
|---|---|---|---|
| 1 | Jun 3 | Opening, workshops, team + track | Done. Track: **Sud Tizimi**. |
| 2 | **Jun 4 (today)** | **Checkpoint 1** (14:00–18:00, 10 min/mentor) | Narrative + thin slice + **extract objections**. |
| 3 | Jun 5 | Pitching workshop (10:00) + **Checkpoint 2** (14:00–18:00, GitHub) | **The leap:** full demo + classifier + validation + polished deck. Top-20 announced 19:00. |
| 4 | Jun 6 | **Final** (7 min: 3 pitch + 2 demo + 2 Q&A) | Win the Court/Justice track → Tashkent National Final (Dec 2026). |

## Today → CP1 (priority order, time-boxed)

The build was *not* the first priority this round — foundation + research + pitch were. So CP1 leans **narrative-heavy**, which is correct for a 40% checkpoint. Targets, in order:

1. **Foundation docs** (this set) — ✅ in progress.
2. **Pitch narrative for the 3 mentors** — the problem story, the Oliy Sud moat, the architecture, the plan, the CP2 promise. Tailor a 10-min version for each lens.
3. **A thin clickable slice if time allows** — even a single screen: type the unpaid-salary problem → see classification + a generated `da'vo arizasi`. Mock the backend if needed; T-scores jump when mentors see *something* run. (Ask Roma if there's time before 14:00.)
4. **The 5 questions to ask each mentor** (turn CP1 into a feedback-mining session): "What would make a judge from a real court trust this?" / "What's the #1 reason these filings get rejected?" / "What would you need to see at CP2?"

## CP1 → CP2 (the overnight leap)

Build the real end-to-end demo. Milestones (vertical slices, each demoable):

- **M0 — Scaffold:** pnpm+turbo monorepo, Next.js 16 app, Go API skeleton, Postgres+pgvector via docker-compose. App runs.
- **M1 — Intake → Classify:** chat intake (Uzbek/Russian) → structured facts → live classification.
- **M2 — Route → Draft:** route engine for the labor/wage case → generated court-ready `da'vo arizasi` (real structure).
- **M3 — Validate → Export:** validation checklist (rejection-risk) → PDF filing package + filing guide.
- **M4 — The classifier:** fine-tuned Uzbek case-classifier swapped in behind `/api/classify` (the "we trained a model" beat). *(See model plan below.)*
- **M5 — Polish + Deploy:** workspace polish, deploy to Vercel, clean GitHub for CP2.

> **Cut line:** if time is short, M1–M3 + a great pitch wins more than a half-built M4. The classifier is a differentiator, not a dependency — if it's not ready, demo Claude+enum behind the same interface and present the trained model as "shipping."

## Model plan (fastest credible "trained model")

Goal: a **real, demoable, defensible** trained artifact — not an overclaim. A fine-tuned **case-classifier/router**, because it's (a) fast to train, (b) genuinely better than a generic model at Uzbek legal routing, (c) live in the demo.

- **Data:** use Claude to synthesize a few hundred–few thousand labeled `(plain-language complaint → category/route)` pairs in Uzbek + Russian, grounded in the categories in [legal-domain.md](legal-domain.md). Have advisors sanity-check the labels.
- **Train (pick fastest available):** (a) embeddings + lightweight classifier (sentence-embeddings → logistic regression/SVM) — trainable in minutes, trivial to host; or (b) fine-tune a small open model (Qwen/Llama 1–8B via an easy hosted fine-tune). Start with (a); upgrade to (b) only if time.
- **Serve:** behind `/api/classify`, identical interface to the Claude fallback.
- **Pitch line:** *"We fine-tuned a model on Uzbek legal case patterns to route a citizen's plain-language story to the correct procedure."* True, specific, demoable.

## Beyond the hackathon (the venture arc — for the pitch)

- **Now:** working MVP, unpaid-salary wedge, Oliy Sud advisory.
- **6 months:** 3–5 case types, a real pilot with a court / legal-aid body, first paying users (citizens + SMBs).
- **1 year:** e-sud submission integration, B2G licensing, the validation dataset as a moat.
- **3 years:** the intelligence layer for digital justice across Central Asia / CIS; expand to the next digitizing-justice market.
