# Areeza — Model Plan (the classifier)

> **Owner:** Dev 1. **Goal:** a real, fast, **defensible** trained model for case routing — the "we trained a model" beat — not a from-scratch LLM. It must be **live in the demo** and **swap behind `/api/classify`** (Claude+enum stays as the always-on fallback, so the demo never breaks).

## 1. What the model does

Input: a citizen's plain-language complaint (Uzbek or Russian). Output: `{ categoryCode, confidence, track }` matching the **same contract** as `/api/classify` (see [development-plan.md](development-plan.md) §3). `categoryCode` ∈ the enum in [legal-domain.md](legal-domain.md) §3 (`labor.wage_recovery`, `labor.reinstatement`, `debt.recovery`, `consumer.dispute`, `family.child_support`, `other`). For `labor.wage_recovery`, also predict `track` = `order` (accrued & undisputed) vs `claim` (disputed).

Why a classifier (not a generative fine-tune): fastest to train, genuinely better than a generic model at **Uzbek/Russian** legal routing, easy to host, easy to explain, and demoable live. Claude still does the heavy generation.

## 2. Approach — start at Tier 1, climb only if time

**Tier 1 — embeddings + lightweight classifier (RECOMMENDED, ~hours).**
Multilingual sentence embeddings → a small classifier (logistic regression / linear SVM). Robust on small data, trains in minutes, trivial to serve.
- Embeddings: a multilingual model that handles UZ/RU — `intfloat/multilingual-e5-base`, `sentence-transformers/LaBSE`, or a hosted API (OpenAI `text-embedding-3-small`, Cohere `embed-multilingual-v3`).
- Classifier: `scikit-learn` `LogisticRegression` (with `predict_proba` for confidence) or `LinearSVC` + calibration.

**Tier 2 — fine-tune a small open LLM (if time, stronger "trained a model" story).**
Fine-tune `Qwen2.5-1.5B/3B-Instruct` or `Llama-3.2-1B/3B` to output the category as constrained text. Easiest paths: **Together AI / Fireworks** hosted fine-tune, or **Unsloth** on a free Colab/T4. Serve via the provider endpoint.

**Tier 3 — stretch (probably skip):** fine-tune fact-extraction or the order/claim sub-decision as its own head.

## 3. Data — generate it with Claude (the key enabler)

We have no labeled corpus, so synthesize one and have the **Oliy Sud advisors sanity-check a sample** (cheap quality + Domain-lens credibility).

1. Prompt Claude (`claude-opus-4-8`) to generate realistic plain-language complaints for **each** category in [legal-domain.md](legal-domain.md) §3, in **both Uzbek and Russian**, varying phrasing, dialect, formality, and length. Include ambiguous/edge cases and the `other` class. For wage cases, label `track`.
2. Target ~**300–500 examples/category** → ~2–3k total. Output **JSONL**: `{ "text": "...", "locale": "uz|ru", "categoryCode": "...", "track": "order|claim|null" }`.
3. Advisors review a ~50-example sample for label correctness; fix systematic errors in the generation prompt and regenerate.
4. Split **80/10/10** train/val/test → `data/classify/{train,val,test}.jsonl`.

## 4. Train (Tier 1 steps)

1. Generate dataset (step 3) → `data/classify/*.jsonl`.
2. Embed all texts with the chosen multilingual model; **cache** embeddings.
3. Train `LogisticRegression` on embeddings → `categoryCode`; a second small head (or rules) for `track`.
4. **Evaluate** on test: accuracy, per-class F1, confusion matrix. Report honestly (synthetic test will look high — say so).
5. Save artifact (`joblib`) + the embedding model id.

## 5. Serve & integrate

- Smallest reliable option: a tiny **FastAPI** service `POST /classify {text} → {categoryCode, confidence, track}`, deployed on Railway/Render/Fly (or run locally for the demo).
- `apps/web/app/api/classify/route.ts` calls `CLASSIFIER_API_URL` when set; **falls back to Claude+enum** on any error or if unset. Same contract either way → zero frontend change.
- Add `CLASSIFIER_API_URL` to `.env.example`.

## 6. Files

```
data/classify/{train,val,test}.jsonl     # generated dataset
services/classifier/                      # Python: generate.py, train.py, serve.py (FastAPI), requirements.txt
packages/core/ai/classify/                # the TS client + the Claude+enum fallback
```

## 7. Honesty & roadmap (for the pitch)

- Say exactly what it is: *"a model trained on Uzbek/Russian legal-case patterns to route a plain-language story to the correct procedure,"* validated with Supreme-Court advisors. Don't claim a from-scratch LLM.
- Roadmap line: retrain on **real anonymized filings** post-pilot → the data moat compounds.

## 8. Timebox & cut-line

Tier 1 is a few hours. **It must not block the end-to-end demo** — `/api/classify` works on the Claude+enum fallback from day one, so the classifier is a *swap-in upgrade* for CP2, not a dependency. If short on time: ship Tier 1, present Tier 2 as "in training."
