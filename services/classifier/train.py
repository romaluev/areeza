#!/usr/bin/env python3
"""train.py — Tier-1 router: multilingual embeddings -> LogisticRegression.

This is the SAFE, ships-by-default classifier. It is convex (no training drama),
trains in minutes, and gives calibrated confidence for free.

Pipeline:
    1. Embed each complaint with a frozen multilingual model (default BAAI/bge-m3,
       which covers Uzbek Latin + Cyrillic AND Russian).
    2. Fit a multinomial LogisticRegression for categoryCode.
    3. Fit a small binary LogisticRegression for track (order/claim) on wage rows.
    4. Save everything to artifacts/tier1.joblib and write a confusion-matrix PNG.

Run (from services/classifier, with the venv active):
    python train.py
Override the embedding model (e.g. a smaller one for a fast smoke test):
    EMB_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 python train.py
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import joblib
import numpy as np

REPO = Path(__file__).resolve().parents[2]
DATA = REPO / "data" / "classify"
ART = Path(__file__).resolve().parent / "artifacts"
ART.mkdir(parents=True, exist_ok=True)

EMB_MODEL = os.environ.get("EMB_MODEL", "BAAI/bge-m3")
LABELS = [
    "labor.wage_recovery",
    "labor.reinstatement",
    "debt.recovery",
    "consumer.dispute",
    "family.child_support",
    "other",
]


def load(split: str) -> list[dict]:
    path = DATA / f"{split}.jsonl"
    if not path.exists():
        raise SystemExit(f"missing {path} — run `python generate.py seed` (or full) first")
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def main() -> None:
    from sentence_transformers import SentenceTransformer
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import classification_report, confusion_matrix

    print(f"Loading embedding model: {EMB_MODEL}")
    embedder = SentenceTransformer(EMB_MODEL)

    def embed(texts: list[str]) -> np.ndarray:
        return embedder.encode(
            texts, normalize_embeddings=True, batch_size=32, show_progress_bar=True
        ).astype(np.float32)

    train, test = load("train"), load("test")
    print(f"train={len(train)}  test={len(test)}")

    Xtr = embed([r["text"] for r in train])
    ytr = [r["categoryCode"] for r in train]
    Xte = embed([r["text"] for r in test])
    yte = [r["categoryCode"] for r in test]

    # --- category head ---
    clf = LogisticRegression(max_iter=2000, C=1.0, class_weight="balanced")
    clf.fit(Xtr, ytr)
    pred = clf.predict(Xte)

    present = [c for c in LABELS if c in set(yte) | set(pred)]
    print("\n=== Tier-1 category report (held-out test) ===")
    print(classification_report(yte, pred, labels=present, zero_division=0))

    # --- track head: binary order/claim, trained only on wage rows ---
    wage = [r for r in train if r["categoryCode"] == "labor.wage_recovery" and r.get("track")]
    track_clf = None
    if len(wage) >= 12:
        Xw = embed([r["text"] for r in wage])
        yw = [r["track"] for r in wage]
        if len(set(yw)) == 2:
            track_clf = LogisticRegression(max_iter=2000, class_weight="balanced").fit(Xw, yw)
            print(f"track head trained on {len(wage)} wage rows.")
        else:
            print("track head skipped — only one track value present in wage rows.")
    else:
        print(f"track head skipped — too few wage rows with a track label ({len(wage)}).")

    # --- save bundle (serve.py reads emb_model from here) ---
    out = ART / "tier1.joblib"
    joblib.dump(
        {"emb_model": EMB_MODEL, "clf": clf, "track_clf": track_clf, "labels": LABELS},
        out,
    )
    print(f"\nSaved {out}")

    # --- confusion matrix PNG (pitch screenshot) ---
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        from sklearn.metrics import ConfusionMatrixDisplay

        cm = confusion_matrix(yte, pred, labels=present)
        fig, ax = plt.subplots(figsize=(8, 7))
        ConfusionMatrixDisplay(cm, display_labels=present).plot(
            ax=ax, xticks_rotation=45, colorbar=False, cmap="Blues"
        )
        ax.set_title(f"Areeza Tier-1 router — {EMB_MODEL}")
        fig.tight_layout()
        png = ART / "confusion_tier1.png"
        fig.savefig(png, dpi=130)
        print(f"Saved {png}")
    except Exception as e:  # noqa: BLE001 — plotting is a nice-to-have, never fatal
        print(f"(confusion PNG skipped: {e})")


if __name__ == "__main__":
    main()
