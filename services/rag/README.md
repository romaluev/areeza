# Areeza Legal-Grounding RAG (`services/rag`)

Retrieves **real Uzbek law articles** (with citations: number, title, lex.uz URL) for a case, so the
generated `da'vo arizasi` cites actual law instead of placeholders. This is the *knowledge* layer; the
classifier (`services/classifier`) is the *routing* layer. Positioning: **navigator + preparer,
human-in-the-loop** — not "AI lawyer."

**Why RAG, not a trained-on-law model:** retrieval keeps answers accurate (quotes real articles),
up-to-date (re-index when law changes — no retraining), and verifiable (every claim carries a citation).

## How it works

```
corpus/legal_uz.jsonl  →  ingest.py (bge-m3 embed)  →  artifacts/{rag_index.npz, meta.json}
case (categoryCode / query)  →  serve.py /retrieve  →  top-k articles + citations
```

- **Corpus:** curated lex.uz citations (real article numbers/titles/URLs) + accurate Uzbek requirement
  summaries. Records with `verbatim_verified: false` need the official verbatim text swapped in later
  (lex.uz content API or advisor); `number_verified: false` marks the 3 articles lex.uz didn't expose
  (wage-frequency, dispute-limitation, fee-exemption) — confirm numbers with an advisor.
- **Index:** local numpy (on-device/private), same pattern as the classifier's joblib. pgvector
  (`legal_chunks`) is the production swap.
- **Model:** `BAAI/bge-m3` — reused from the classifier (no extra download).

## Run (reuses the classifier venv)

```bash
cd services/rag
PY=../classifier/.venv/bin/python          # has bge-m3, sentence-transformers, fastapi
$PY ingest.py                              # build the index (seconds)
$PY -m uvicorn serve:app --port 8082       # http://localhost:8082
```

## Try it

```bash
curl -s localhost:8082/retrieve -H 'content-type: application/json' \
  -d '{"categoryCode":"labor.wage_recovery","k":5}' | python -m json.tool

curl -s localhost:8082/retrieve -H 'content-type: application/json' \
  -d '{"query":"ish haqi to'\''lanmadi, ishdan bo'\''shadim, hisob-kitob qilishmadi"}'
```

Contract for the Go backend (draft step): [`../../docs/handoff-rag-contract.md`](../../docs/handoff-rag-contract.md).

## Files

| File | Purpose |
|---|---|
| `corpus/legal_uz.jsonl` | curated legal corpus (citations + summaries) |
| `ingest.py` | embed corpus → local index |
| `engine.py` | load index + bge-m3; `retrieve(query, categoryCode, k)` |
| `serve.py` | FastAPI `/retrieve` + `/health` + `/` demo page |

## Roadmap

- Swap `verbatim_verified:false` summaries for official lex.uz text (content API / advisor).
- Confirm the 3 `number_verified:false` article numbers.
- Expand beyond the labor-claim flagship; move index to pgvector + scheduled re-index for live updates.
