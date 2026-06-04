#!/usr/bin/env python3
"""engine.py — shared inference for both router engines.

Tier1  = bge-m3 embeddings + LogisticRegression (the safe, live engine).
Tier2  = MLX LoRA fine-tune of Qwen-1.5B (the hero engine, swapped in if it wins).

Both return the SAME contract dict:
    {categoryCode, confidence, track, rationale, engine}

serve.py and eval.py both import from here so the logic lives in one place.
"""
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Optional

import numpy as np

from build_chat_jsonl import ALLOWED, SYSTEM  # single source of truth for the label set

HERE = Path(__file__).resolve().parent
ART = HERE / "artifacts"
# ADAPTER_PATH env lets us point Tier-2 at different adapters (e.g. adapters_3b, adapters_7b).
ADAPTER = Path(os.environ.get("ADAPTER_PATH", str(HERE / "adapters")))

LABELS = [
    "labor.wage_recovery",
    "labor.reinstatement",
    "debt.recovery",
    "consumer.dispute",
    "family.child_support",
    "other",
]

# Dispute signals (uz latin + cyrillic, ru) -> wage case goes to the "claim" track.
DISPUTE = re.compile(
    r"(spor|спор|nizo|низо|e['’]?tiroz|эътироз|kelishmovchilik|келишмовчилик|"
    r"не\s*соглас|оспарив|rad\s*et|рад\s*эт|tan\s*olma|тан\s*олма)",
    re.I,
)


def split_label(label: str) -> tuple[str, Optional[str]]:
    """'labor.wage_recovery|order' -> ('labor.wage_recovery', 'order')."""
    if "|" in label:
        cat, track = label.split("|", 1)
        return cat, track
    return label, None


def snap_label(raw: str) -> tuple[str, float]:
    """Parse a raw LLM string to one of ALLOWED. Returns (label, heuristic_confidence)."""
    first = raw.strip().splitlines()[0].strip() if raw.strip() else ""
    for lbl in ALLOWED:
        if first == lbl:
            return lbl, 0.95
    for lbl in ALLOWED:
        if lbl in first:
            return lbl, 0.8
    low = first.lower()
    for lbl in ALLOWED:
        if lbl.split("|")[0] in low:
            return lbl, 0.6
    return "other", 0.3


# --------------------------------------------------------------------------- #
class Tier1:
    """Embeddings + LogisticRegression. Loads from artifacts/tier1.joblib."""

    name = "tier1"

    def __init__(self) -> None:
        import joblib
        from sentence_transformers import SentenceTransformer

        bundle_path = ART / "tier1.joblib"
        if not bundle_path.exists():
            raise FileNotFoundError(f"{bundle_path} not found — run `python train.py` first")
        bundle = joblib.load(bundle_path)
        self.clf = bundle["clf"]
        self.track_clf = bundle["track_clf"]
        self.emb_model = bundle["emb_model"]
        self.embedder = SentenceTransformer(self.emb_model)
        self.label = f"Local Tier-1 ({self.emb_model.split('/')[-1]})"

    def _embed(self, text: str) -> np.ndarray:
        return self.embedder.encode([text], normalize_embeddings=True).astype(np.float32)

    def _track(self, text: str, cat: str, vec: np.ndarray) -> Optional[str]:
        if cat != "labor.wage_recovery":
            return None
        if DISPUTE.search(text):
            return "claim"
        if self.track_clf is not None:
            return str(self.track_clf.predict(vec)[0])
        return "order"

    def predict(self, text: str) -> dict:
        vec = self._embed(text)
        proba = self.clf.predict_proba(vec)[0]
        i = int(proba.argmax())
        cat = str(self.clf.classes_[i])
        conf = float(proba[i])
        return {
            "categoryCode": cat,
            "confidence": round(conf, 3),
            "track": self._track(text, cat, vec),
            "rationale": f"Tier-1 embedding classifier; p={conf:.2f}",
            "engine": self.label,
        }


# --------------------------------------------------------------------------- #
class Tier2:
    """MLX LoRA fine-tune. Loads base + adapter from adapters/."""

    name = "tier2"

    def __init__(self) -> None:
        from mlx_lm import load

        base = os.environ.get("TIER2_BASE", "mlx-community/Qwen2.5-1.5B-Instruct-4bit")
        if not ADAPTER.exists() or not any(ADAPTER.iterdir()):
            raise FileNotFoundError(f"{ADAPTER} empty — run the LoRA train first")
        self.model, self.tokenizer = load(base, adapter_path=str(ADAPTER))
        self.label = f"Local Tier-2 (Qwen-1.5B LoRA)"
        try:
            from mlx_lm.sample_utils import make_sampler

            self._sampler = make_sampler(temp=0.0)
        except Exception:  # noqa: BLE001 — older mlx_lm has no sampler arg
            self._sampler = None

    def _generate(self, text: str) -> str:
        from mlx_lm import generate

        prompt = self.tokenizer.apply_chat_template(
            [{"role": "system", "content": SYSTEM}, {"role": "user", "content": text}],
            add_generation_prompt=True,
            tokenize=False,
        )
        kwargs = dict(max_tokens=16, verbose=False)
        if self._sampler is not None:
            kwargs["sampler"] = self._sampler
        try:
            return generate(self.model, self.tokenizer, prompt=prompt, **kwargs)
        except TypeError:
            return generate(self.model, self.tokenizer, prompt, **kwargs)

    def predict(self, text: str) -> dict:
        raw = self._generate(text)
        label, conf = snap_label(raw)
        cat, track = split_label(label)
        return {
            "categoryCode": cat,
            "confidence": round(conf, 3),
            "track": track,
            "rationale": f"Tier-2 LoRA emitted '{raw.strip()[:40]}'",
            "engine": self.label,
        }


def load_engine(tier: Optional[str] = None):
    tier = (tier or os.environ.get("CLASSIFIER_TIER", "tier1")).lower()
    return Tier2() if tier == "tier2" else Tier1()
