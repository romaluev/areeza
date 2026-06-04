#!/usr/bin/env python3
"""eval.py — score Tier-1 (and Tier-2 if trained) on the held-out test set.

Prints accuracy + macro-F1 per engine, saves confusion-matrix PNGs (pitch
screenshots), and recommends which engine to serve.

Swap rule: serve Tier-2 only if its macro-F1 >= Tier-1's; otherwise keep Tier-1
live and present Tier-2 as "in training".

Run (from services/classifier, venv active):
    python eval.py
NOTE: synthetic test numbers are inflated vs. real complaints — report them honestly.
"""
from __future__ import annotations

import json
from pathlib import Path

import engine as eng

REPO = Path(__file__).resolve().parents[2]
DATA = REPO / "data" / "classify"
ART = Path(__file__).resolve().parent / "artifacts"


def load_test() -> list[dict]:
    path = DATA / "test.jsonl"
    if not path.exists():
        raise SystemExit(f"missing {path} — run generate.py first")
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


def score(name: str, engine_obj, rows: list[dict]) -> float:
    from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score

    gold = [r["categoryCode"] for r in rows]
    pred, track_hits, track_total = [], 0, 0
    for r in rows:
        out = engine_obj.predict(r["text"])
        pred.append(out["categoryCode"])
        if r["categoryCode"] == "labor.wage_recovery" and r.get("track"):
            track_total += 1
            if out.get("track") == r["track"]:
                track_hits += 1

    acc = accuracy_score(gold, pred)
    macro = f1_score(gold, pred, average="macro", zero_division=0)
    present = [c for c in eng.LABELS if c in set(gold) | set(pred)]
    print(f"\n=== {name} ===")
    print(f"accuracy={acc:.3f}   macro-F1={macro:.3f}")
    if track_total:
        print(f"track accuracy (wage rows)={track_hits}/{track_total}={track_hits/track_total:.2f}")
    print(classification_report(gold, pred, labels=present, zero_division=0))

    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        from sklearn.metrics import ConfusionMatrixDisplay

        cm = confusion_matrix(gold, pred, labels=present)
        fig, ax = plt.subplots(figsize=(8, 7))
        ConfusionMatrixDisplay(cm, display_labels=present).plot(
            ax=ax, xticks_rotation=45, colorbar=False, cmap="Blues"
        )
        ax.set_title(f"Areeza router — {name}")
        fig.tight_layout()
        png = ART / f"confusion_{engine_obj.name}.png"
        fig.savefig(png, dpi=130)
        print(f"saved {png}")
    except Exception as e:  # noqa: BLE001
        print(f"(confusion PNG skipped: {e})")
    return macro


def main() -> None:
    rows = load_test()
    print(f"test rows: {len(rows)}")

    f1_tier1 = score("Tier-1 (embeddings + logreg)", eng.Tier1(), rows)

    f1_tier2 = None
    try:
        t2 = eng.Tier2()
        f1_tier2 = score("Tier-2 (Qwen-1.5B LoRA)", t2, rows)
    except Exception as e:  # noqa: BLE001 — Tier-2 may not be trained yet
        print(f"\nTier-2 not evaluated: {e}")

    print("\n" + "=" * 48)
    if f1_tier2 is None:
        print("RECOMMENDATION: serve Tier-1 (Tier-2 not trained yet).")
    elif f1_tier2 >= f1_tier1:
        print(f"RECOMMENDATION: SWAP to Tier-2 (F1 {f1_tier2:.3f} >= {f1_tier1:.3f}).")
        print("  -> run serve.py with CLASSIFIER_TIER=tier2")
    else:
        print(f"RECOMMENDATION: keep Tier-1 (F1 {f1_tier1:.3f} > {f1_tier2:.3f}).")
        print("  -> present Tier-2 as 'our research track, in training'.")
    print("Reminder: synthetic-test numbers are optimistic vs. real complaints.")


if __name__ == "__main__":
    main()
