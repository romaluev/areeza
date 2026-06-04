#!/usr/bin/env python3
"""build_chat_jsonl.py — convert the labeled data into chat JSONL for the MLX LoRA.

The Tier-2 fine-tune (Qwen-1.5B) learns text -> label. We make the assistant turn
be ONLY the label, drawn from a closed 7-way set, with track folded into the wage
label (e.g. "labor.wage_recovery|order"). A fixed, tiny output space is what makes a
1.5B model emit a valid label reliably.

Reads:   data/classify/{train,val}.jsonl
Writes:  data/classify_llm/{train,valid}.jsonl   (note: mlx_lm expects "valid")

Run (from services/classifier, venv active):
    python build_chat_jsonl.py
"""
from __future__ import annotations

import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SRC = REPO / "data" / "classify"
DST = REPO / "data" / "classify_llm"
DST.mkdir(parents=True, exist_ok=True)

ALLOWED = [
    "labor.wage_recovery|order",
    "labor.wage_recovery|claim",
    "labor.reinstatement",
    "debt.recovery",
    "consumer.dispute",
    "family.child_support",
    "other",
]
SYSTEM = (
    "You are a legal case router for Uzbekistan. Read the citizen's complaint "
    "(Uzbek or Russian) and reply with EXACTLY ONE label from this list, nothing else:\n"
    + " ".join(ALLOWED)
)


def label_for(row: dict) -> str:
    cat = row["categoryCode"]
    if cat == "labor.wage_recovery":
        track = row.get("track") or "order"
        return f"labor.wage_recovery|{track}"
    return cat


def convert(src_name: str, dst_name: str) -> None:
    src = SRC / f"{src_name}.jsonl"
    if not src.exists():
        raise SystemExit(f"missing {src} — run generate.py first")
    rows = [json.loads(l) for l in src.read_text(encoding="utf-8").splitlines() if l.strip()]
    out_lines = []
    for r in rows:
        rec = {
            "messages": [
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": r["text"]},
                {"role": "assistant", "content": label_for(r)},
            ]
        }
        out_lines.append(json.dumps(rec, ensure_ascii=False))
    (DST / f"{dst_name}.jsonl").write_text("\n".join(out_lines) + "\n", encoding="utf-8")
    print(f"{dst_name}: {len(out_lines)} rows -> {DST / f'{dst_name}.jsonl'}")


if __name__ == "__main__":
    convert("train", "train")
    convert("val", "valid")
    print("Done. Now: mlx_lm.lora --config lora_config.yaml")
