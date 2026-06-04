#!/usr/bin/env python3
"""ingest.py — embed the legal corpus with bge-m3 and build the local RAG index.

Run from services/rag with the classifier venv active (it has bge-m3 + sentence-transformers):
    ../classifier/.venv/bin/python ingest.py
Writes artifacts/rag_index.npz (embeddings) + artifacts/meta.json (article records).
"""
from __future__ import annotations

import json

import numpy as np

import engine as eng


def main() -> None:
    from sentence_transformers import SentenceTransformer

    records = eng.load_corpus()
    if not records:
        raise SystemExit("empty corpus — corpus/legal_uz.jsonl has no rows")

    # embed title + summary so retrieval matches on both the article name and its substance
    texts = [f"{r['title']}. {r['text']}" for r in records]
    print(f"embedding {len(texts)} articles with {eng.EMB_MODEL} ...")
    model = SentenceTransformer(eng.EMB_MODEL)
    emb = model.encode(texts, normalize_embeddings=True, show_progress_bar=True).astype(np.float32)

    eng.ART.mkdir(parents=True, exist_ok=True)
    np.savez(eng.ART / "rag_index.npz", emb=emb)
    (eng.ART / "meta.json").write_text(
        json.dumps({"emb_model": eng.EMB_MODEL, "records": records}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    verified = sum(1 for r in records if r.get("number_verified"))
    print(f"ingested {len(records)} articles (dim {emb.shape[1]}); {verified} with lex.uz-verified numbers")
    print(f"saved -> {eng.ART/'rag_index.npz'} + meta.json")


if __name__ == "__main__":
    main()
