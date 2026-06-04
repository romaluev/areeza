#!/usr/bin/env python3
"""engine.py — Areeza legal-grounding RAG: retrieve real Uzbek law articles for a case.

Embeds the curated lex.uz corpus with bge-m3 (same model as the classifier), builds a
local cosine index, and returns the top-k relevant articles WITH citations (number, title,
lex.uz URL) so generated court documents cite real law instead of placeholders.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
ART = HERE / "artifacts"
CORPUS = HERE / "corpus" / "legal_uz.jsonl"
EMB_MODEL = os.environ.get("EMB_MODEL", "BAAI/bge-m3")

# A representative Uzbek query per category, so retrieval works from categoryCode alone
# (e.g. when the draft step only knows the routed category, not a free-text query).
CATEGORY_SEEDS = {
    "labor.wage_recovery": "ish haqini undirish, ish haqi to'lanmadi, da'vo arizasi, hisob-kitob, davlat boji",
    "labor.reinstatement": "ishga tiklash, noqonuniy ishdan bo'shatish, mehnat shartnomasi bekor qilindi",
    "debt.recovery": "qarzni undirish, qarz qaytarilmadi, tilxat, shartnoma, sud buyrug'i",
    "consumer.dispute": "iste'molchi huquqlari, sifatsiz tovar yoki xizmat, pulni qaytarish",
    "family.child_support": "aliment, bola uchun nafaqa undirish",
    "other": "fuqarolik da'vosi, sud",
}


def load_corpus() -> list[dict]:
    return [json.loads(l) for l in CORPUS.read_text(encoding="utf-8").splitlines() if l.strip()]


class RagIndex:
    """Loads the prebuilt index (artifacts/) + bge-m3 and answers retrieval queries."""

    def __init__(self) -> None:
        meta_path = ART / "meta.json"
        emb_path = ART / "rag_index.npz"
        if not meta_path.exists() or not emb_path.exists():
            raise FileNotFoundError(f"{ART} missing index — run `python ingest.py` first")
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        self.records: list[dict] = meta["records"]
        self.emb_model: str = meta["emb_model"]
        self.emb: np.ndarray = np.load(emb_path)["emb"].astype(np.float32)  # (N, d), normalized

        from sentence_transformers import SentenceTransformer

        self.embedder = SentenceTransformer(self.emb_model)

    def _embed(self, text: str) -> np.ndarray:
        return self.embedder.encode([text], normalize_embeddings=True).astype(np.float32)[0]

    def retrieve(self, query: str | None = None, categoryCode: str | None = None, k: int = 5) -> list[dict]:
        parts = []
        if query:
            parts.append(query)
        if categoryCode and categoryCode in CATEGORY_SEEDS:
            parts.append(CATEGORY_SEEDS[categoryCode])
        if not parts:
            parts.append(CATEGORY_SEEDS["other"])
        qv = self._embed(" ".join(parts))

        sims = self.emb @ qv  # cosine similarity (vectors are normalized)
        ranked = sims.copy()
        # small boost for articles tagged for this category (or universally applicable)
        if categoryCode:
            for i, r in enumerate(self.records):
                tags = r.get("category_tags", [])
                if categoryCode in tags or "all_civil" in tags:
                    ranked[i] += 0.05

        order = np.argsort(-ranked)[: max(1, k)]
        out = []
        for i in order:
            r = self.records[int(i)]
            out.append(
                {
                    "code": r["code"],
                    "source": r["source"],
                    "article": r.get("article"),
                    "title": r["title"],
                    "text": r["text"],
                    "url": r["url"],
                    "score": round(float(sims[int(i)]), 3),
                    "verbatim_verified": bool(r.get("verbatim_verified", False)),
                }
            )
        return out
