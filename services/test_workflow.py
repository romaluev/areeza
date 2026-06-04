#!/usr/bin/env python3
"""test_workflow.py — exercise the AI layer end-to-end on real cases (no backend needed).

For each complaint:  classify (Tier-1 router) -> retrieve cited law (RAG) -> print the
"case navigation package" a citizen would get before drafting.

Run (from services/, classifier venv):
    classifier/.venv/bin/python test_workflow.py
Loads bge-m3 twice (router + RAG); run when no training is using memory.
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "classifier"))  # so classifier/engine.py finds build_chat_jsonl
sys.path.insert(0, str(ROOT / "rag"))


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


TESTS = [
    "Ish beruvchim 3 oydan beri oyligimni to'lamayapti, hisoblangan lekin bermayapti.",
    "Иш ҳақи миқдори бўйича низо бор, директор тан олмаяпти.",
    "Меня незаконно уволили после декрета, хочу восстановиться на работе.",
    "Tanishimga qarz berdim, tilxat bor, lekin yarim yildan beri qaytarmayapti.",
    "Бывший муж не платит алименты на двоих детей уже год.",
    "Купил холодильник, оказался бракованным, магазин отказывается возвращать деньги.",
]


def main() -> None:
    clf_e = _load("clf_engine", ROOT / "classifier" / "engine.py")
    rag_e = _load("rag_engine", ROOT / "rag" / "engine.py")

    print("loading router (Tier-1) + RAG index ...")
    router = clf_e.Tier1()
    rag = rag_e.RagIndex()
    # share the embedder to halve memory (both use bge-m3)
    if router.emb_model == rag.emb_model:
        rag.embedder = router.embedder

    for i, text in enumerate(TESTS, 1):
        r = router.predict(text)
        arts = rag.retrieve(categoryCode=r["categoryCode"], query=text, k=4)
        print("\n" + "=" * 78)
        print(f"[{i}] {text}")
        track = f" · track={r['track']}" if r.get("track") else ""
        print(f"  ROUTE  → {r['categoryCode']}  (conf {r['confidence']:.2f}){track}")
        print(f"  LAW    → grounded citations:")
        for a in arts:
            flag = "" if a["verbatim_verified"] else " (summary)"
            print(f"           {a['source'].upper():14} {a['article'] or '—':5} {a['title']}{flag}")
            print(f"             ↳ {a['url']}")
    print("\n" + "=" * 78)
    print("Each case: routed by our model + grounded in real lex.uz citations — on-device.")


if __name__ == "__main__":
    main()
