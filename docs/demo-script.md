# Areeza — Demo Script

> The live product demo + mentor Q&A prep. Legal specifics marked **[VERIFY]** are being
> confirmed via research + Oliy Sud advisors; update from [legal-domain.md](legal-domain.md).

## The one-line goal of the demo

> **A person who didn't understand the legal process now holds a complete, validated, court-ready filing package — in under two minutes.**

Everything serves that before/after.

## The flagship case: unpaid salary

Relatable, socially important, common, easy to show end-to-end, strong access-to-justice narrative. Persona: a worker owed 2 months' wages, can't afford a lawyer.

## Live demo beats (CP2 / Final — the full run)

1. **Open on the problem, not the product.** "Imagine your employer hasn't paid you for two months. You go to e-sud.uz… and you're staring at forms and legal categories you don't understand. Most people give up or get rejected." Land the pain first.
2. **Plain-language intake.** Type in Uzbek: *"Ish beruvchim 2 oydan beri oyligimni to'lamayapti."* Areeza responds in Uzbek and asks **one focused question at a time** (employer name, employment status, salary amount, contract, evidence). Show it *extracting structured facts* live.
3. **Classification (the model beat).** Areeza shows: **"Aniqlangan: mehnat nizosi — ish haqini undirish"** (labor dispute — wage recovery) with confidence — and detects whether the wage is **undisputed** (→ fast *court-order* track) or **disputed** (→ full *statement of claim*). That branch is the "depth" beat. Say: *"This routing is done by a model we fine-tuned on Uzbek legal case patterns."*
4. **The route appears.** Workspace fills in: **tuman/shahar fuqarolik sudi** (civil court), application type **`da'vo arizasi`** (or a **court order** if the wage is accrued & undisputed — CPC 173–174), **state-fee exemption** for labor claims (MK 277 / SK 329), **3-month** limitation, the required documents, and the legal basis (Labor Code + CPC arts **188/189/191**). *Exact article numbers confirmed with our Oliy Sud advisors (new 2023 Labor Code).* Full detail: [legal-domain.md](legal-domain.md).
5. **The court-ready document.** Areeza generates a real-looking `da'vo arizasi` — correct header, plaintiff/defendant, claim amount, factual `bayonnoma`, legal basis, the demand (`so'rov qismi`), attachment list, date, signature line. **Open it. Let a domain mentor read it.** This is the moment that wins the Domain lens.
6. **Validation (the second wow).** Run the validation engine: a checklist lights up — ✅ jurisdiction correct, ✅ fee-exempt, ⚠️ "attach employment contract," ✅ within limitation period, ✅ respondent identified. Say: *"This is exactly why filings get rejected — we catch it before submission."*
7. **Filing package.** One click → a downloadable PDF package + a step-by-step "how to file on e-sud" guide. *"From a sentence to a filing package."*

## CP1 (today) — the lighter version

CP1 is 40% and feedback-focused. If the full build isn't ready, run a **thin slice**: intake → classification → a generated `da'vo arizasi` (even with a mocked backend). Then spend the rest of each 10-minute mentor slot on narrative + **mining their objections** (see below). Tell them explicitly: *"By CP2 you'll see the full validated end-to-end flow + the fine-tuned classifier."* — setting up the growth delta the rubric rewards.

## Talking points per mentor (tailor each 10-min slot)

- **Technical mentor (T):** the agentic pipeline (intake→classify→route→draft→validate), zod-structured outputs, reuse velocity, and the fine-tuned Uzbek classifier (innovation + stack). Show the GitHub.
- **Business mentor (B):** TAM/SAM/SOM, monetization (citizen per-filing + SMB subscription + **B2G licensing to courts**), unit economics, and founder traction (Notiky/Horyco). The moat: Oliy Sud relationship + the validation/rejection dataset.
- **Domain mentor (S):** **lead with the Oliy Sud advisors.** Walk through the generated document's legal correctness. Emphasize compliance positioning (navigation + preparation, human-in-the-loop, not "AI lawyer"). Ask them to pressure-test the document.

## Questions to ASK each mentor at CP1 (turn scoring into discovery)

1. "What would make a judge from a real court *trust* a document like this?"
2. "What's the #1 procedural reason these citizen filings get returned or rejected?"
3. "If you scored us today, what's the one thing that would move us from a 7 to a 10 by tomorrow?"
4. "Which case type beyond unpaid salary would be most impactful to show?"
5. (Business) "What monetization model would a Uzbek court / legal-aid body actually pay for?"

Write down every answer. CP2 = visibly doing what they said.

## Q&A prep (likely hard questions)

- **"Is this giving legal advice / practicing law?"** → No. We help *navigate and prepare* a filing the citizen themselves submits; human-in-the-loop; we reduce rejection risk, we don't guarantee outcomes. Built with Oliy Sud advisors.
- **"What if the AI is wrong?"** → Legal structure is data-driven from validated templates, not invented by the model; the model fills narrative slots; validation + the user + (future) a lawyer review before filing.
- **"Isn't the market too small?"** → UZ is the wedge; the category is every digitizing-but-confusing justice system — Central Asia, CIS, and beyond (1B+ people). TAM global, SOM local.
- **"Why won't e-sud just build this?"** → Portals digitize forms; they don't translate life-problems into procedure. We sit *before* the portal. And we'd partner (B2G), not compete.
- **"What did you actually train?"** → A case-classifier fine-tuned on Uzbek legal patterns for routing — real, specific, demoed live. Generation uses Claude.
