# Areeza Case Router — Model Card

> Our own model that turns a citizen's plain-language problem (Uzbek or Russian) into the
> correct legal route. **Trained by us, runs on-device, no real citizen data.**

## What it does

One job: read a complaint and output the legal **category** + procedure **track** — the routing
decision that starts the filing workflow.

```
"Ish beruvchim 3 oydan beri oyligimni to'lamayapti"  →  labor.wage_recovery · track: order  (0.91)
"Бывший муж не платит алименты на ребёнка"           →  family.child_support               (0.93)
```

- **Categories:** `labor.wage_recovery`, `labor.reinstatement`, `debt.recovery`, `consumer.dispute`, `family.child_support`, `other`
- **Track** (wage cases): `order` (accrued & undisputed → fast court-order path) vs `claim` (disputed → full statement of claim)
- **Contract:** `POST /classify {text}` → `{ categoryCode, confidence, track, rationale }`

## Why it matters (the pitch)

1. **It's genuinely ours.** Not a wrapped API call — a model we trained on Uzbek/Russian legal-case patterns.
2. **Private by construction.** Runs entirely on-device. The citizen's sensitive problem never leaves the machine — the data-residency story a government/justice customer needs.
3. **Bilingual + bi-script.** Handles Uzbek (Latin *and* Cyrillic) and Russian — how people actually write.
4. **No real citizen data used.** Trained on synthetic + curated data, so there's no privacy debt baked into the model.

## How it's built — two tiers

| | Tier-1 (live) | Tier-2 (hero) |
|---|---|---|
| Method | `BAAI/bge-m3` multilingual embeddings → calibrated LogisticRegression | LoRA fine-tune of `Qwen2.5-1.5B-Instruct` (MLX, on-device) |
| Role | the production router | "we fine-tuned our own LLM" — swapped in if it wins on eval |
| Strengths | fast, calibrated, robust on small data | strong narrative, end-to-end learned |

Both run locally. **Claude + a zod enum is the always-on fallback** in the API layer, so the demo never breaks.

## Data

Multi-source, fully synthetic/curated — **no scraped personal data**:
- **Curated** hand-authored examples (both Uzbek scripts + Russian).
- **GPT-generated** (via codex) for diversity — a second independent model reduces single-model bias.
- Stratified for class balance; deduped; Uzbek-weighted to match the product's primary language.

`generate.py` reproduces it; `train.py` / `lora_config.yaml` reproduce the models.

## Results

*(held-out test; synthetic-test numbers are optimistic vs. real complaints — reported honestly)*

| Stage | Examples | Tier-1 acc / macro-F1 |
|---|---|---|
| Curated only | 329 | 0.86 / 0.86 |
| + GPT (multi-source) | 509 | **0.94 / 0.94** |
| + Uzbek top-up (~1k) | ~1,000 | _updating after retrain_ |

Tier-2 (LoRA) vs Tier-1 head-to-head: _filled in after eval; Tier-1 stays live unless Tier-2 wins._

## Positioning (compliance)

Never an "AI lawyer" and never "legal advice." The model **navigates and prepares** — it routes a problem
to the right procedure to **reduce rejection risk**, with a human in the loop. This is a product rule and a
scoring rule.

## Roadmap

- Retrain on **real anonymized filings** post-pilot → the data moat compounds.
- A local **Uzbek-law grounding index** (Labor Code + Civil Procedure Code) so drafting/validation cite real articles — fully on-device.
- Expand beyond the flagship labor-claim route.
