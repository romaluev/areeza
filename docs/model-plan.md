# Areeza — Model & Data Plan

> **Owner:** the AI/model engineer. Two distinct AI assets, two distinct data needs:
> 1. **The router** — a small fine-tuned model that maps a plain-language complaint → `categoryCode` + `track`. The "we trained a model" beat; live behind `/classify`.
> 2. **The legal RAG corpus** — the codes, chunked + embedded, that ground document drafting + validation (and resolve the `[VERIFY]` article numbers in [legal-domain.md](legal-domain.md)).
>
> Claude does the heavy generation; these make us **fast, cheap, and locally accurate** where a generic model is weak (Uzbek/Russian legal routing). See the token discipline in [architecture.md](architecture.md) §5.

## 1. What the router does

Input: a citizen's complaint in Uzbek or Russian. Output: `{ categoryCode, confidence, track }` (same contract as `/classify`). `categoryCode` ∈ the enum in [legal-domain.md](legal-domain.md) §3. For `labor.wage_recovery`, also predict `track` = `order` (accrued & undisputed) vs `claim` (disputed). A small classifier, not a from-scratch LLM: fastest to train, genuinely better than a generic model at UZ/RU legal phrasing, trivial to host, demoable live.

## 2. Where to get the data

### 2a. Legal codes → the RAG corpus (and the real article numbers)
**lex.uz** — the official legal database. Scrape the full text of:
- **Labor Code** (ЎРҚ-798, 2023): `lex.uz/docs/6257288` (UZ) · `lex.uz/docs/6257291` (RU)
- **Civil Procedure Code** (2018): `lex.uz/docs/3517337` (UZ) · `lex.uz/docs/3517334` (RU)
- **Tax Code** (fee exemption art.), **Consumer-Rights Law** (`lex.uz/acts/4704`)

Pages are mostly static, article-structured HTML → split by **modda / статья**, keep `{article_ref, lang, text}`. This both (a) builds `legal_chunks` for RAG and (b) **gives the authoritative current article numbers** — feed a sample to the advisors to confirm, then delete the `[VERIFY]` flags.

### 2b. Real court decisions → classifier grounding + rejection patterns
**publication.sud.uz / public.sud.uz** — the public database of court rulings (large). Each decision states the case type, the parties' claims, the legal basis, and the outcome. Scrape (paginated, rate-limited) to get **real legal language per category**, real `da'vo arizasi` structures, and **why filings fail** (returned/refused cases → validation rules). This is the highest-value *real* signal.

### 2c. Official templates → the document skeletons
**yurxizmat.uz** (Justice Ministry generator, e.g. `/uz/document/24` = wage claim) and **advice.uz** — authentic `da'vo arizasi` samples in UZ/RU. Scrape to lock the template slots in [legal-domain.md](legal-domain.md) §4.

### 2d. Synthetic plain-language complaints → the classifier's main signal
Court decisions are *formal*; citizens type *informally* ("oyligimni bermayapti, 2 oy bo'ldi"). Bridge the gap: prompt **Claude (opus)** to generate realistic plain-language complaints per category, **UZ + RU**, varied dialect/formality/length, with labels + `track`. Target ~300–500/category (~2–3k total) as `{text, locale, categoryCode, track}` JSONL. This matches the input distribution we actually serve.

### 2e. The advisors — the real unlock
Our advisors are the **Supreme Court's dev + IT team** (they build e-sud / my.sud.uz). Ask them for: the **authoritative current article numbers**, **real anonymized filings** (gold training + grounding data), label sign-off, and — for the roadmap — **sud.uz data/API access**. This is data and integration no competitor can get.

> **Training set = synthetic (primary, matches real input) + real-decision snippets (grounding) + advisor-checked labels.** RAG corpus = scraped lex.uz codes.

## 3. Tools (fast + easy)

| Need | Tool | Why |
|---|---|---|
| Scrape lex.uz (static) | Python `requests` + `BeautifulSoup`/`lxml` | simplest; pages are article-structured HTML |
| Scrape sud.uz / JS-heavy | **Firecrawl** (hosted, LLM-ready markdown) or **Crawl4AI** (OSS, free) | handles JS + pagination, clean output, fast |
| Embeddings (UZ/RU) | `intfloat/multilingual-e5-base` or `LaBSE` (HF, local, free); or OpenAI `text-embedding-3` / Cohere `embed-multilingual-v3` (hosted) | strong multilingual; local = zero cost |
| Classifier (Tier 1) | `scikit-learn` LogisticRegression on embeddings | trains in **minutes**, `predict_proba` confidence, trivial to serve |
| Fine-tune (Tier 2) | **Together AI / Fireworks** hosted fine-tune, or **Unsloth** on a free Colab T4 — base `Qwen2.5-1.5B/3B` or `Llama-3.2-1B/3B` | a real fine-tuned-LLM artifact; stronger story |
| Labeling / augmentation | Claude (opus) | generate + label synthetic data |
| Vector store | Postgres **pgvector** (already in our stack) | one fewer service |

## 4. Build sequence

1. **Scrape** codes (2a) + a few thousand decisions (2b) + templates (2c) → `data/legal/*` and `data/decisions/*`.
2. **Generate** the synthetic complaint set (2d) → `data/classify/{train,val,test}.jsonl` (80/10/10). Advisor spot-check (2e).
3. **RAG:** embed code articles → `legal_chunks` (pgvector). Retrieval tested per category.
4. **Train router (Tier 1):** embed train texts → LogisticRegression → eval (accuracy, per-class F1, confusion matrix). Save `joblib` + the embedding-model id. Upgrade to Tier 2 only if time.
5. **Serve:** small FastAPI `/classify {text} → {categoryCode, confidence, track}`; deploy (Railway/Render) behind `CLASSIFIER_API_URL`. Go `/classify` calls it and **falls back to Claude+enum** on any error → the endpoint always works.
6. **Eval honestly** (synthetic test scores high — say so) and set the roadmap: retrain on real anonymized filings post-pilot → the data moat compounds.

## 5. Files

```
data/legal/         # scraped codes (article-chunked, UZ/RU) → legal_chunks
data/decisions/     # scraped court decisions (grounding + rejection patterns)
data/classify/      # {train,val,test}.jsonl  (synthetic + real, labeled)
services/scraper/   # Python: lex.py, sud.py (requests/Firecrawl) → JSONL
services/classifier/# Python: embed.py, train.py, serve.py (FastAPI), requirements.txt
```

## 6. Honesty & pitch line

Say exactly what it is: *"a model trained on Uzbek/Russian legal-case patterns to route a plain-language story to the correct procedure,"* validated with the Supreme Court's own engineers. Not a from-scratch LLM.

## 7. Timebox & cut-line

Tier 1 (scrape codes for RAG + synthetic set + embeddings classifier) is a **few hours**. It must **not block** the end-to-end demo — `/classify` runs on the Claude+enum fallback from day one, so the trained router is a swap-in upgrade for CP2, not a dependency. If short on time: ship Tier 1, present Tier 2 as "in training," and lead with the lex.uz RAG (it visibly grounds the document in real article text).
