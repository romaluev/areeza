# Areeza Router — our own local case-routing model

Trains **our own model** to route a citizen's plain-language complaint (Uzbek/Russian) to the
correct legal category + procedure track. Runs **entirely on-device** — the complaint never leaves
the laptop (the privacy / data-residency story). It serves the `/api/classify` slot; Claude stays
on document generation and as the always-on fallback.

Two engines, staged:

| Engine | What | Role |
|---|---|---|
| **Tier-1** | `bge-m3` embeddings → LogisticRegression | the safe, live demo path |
| **Tier-2** | LoRA fine-tune of `Qwen2.5-1.5B-Instruct` (MLX) | the "we fine-tuned our own LLM" hero — swapped in only if it wins on the test set |

## Setup (once per laptop) — pin Python 3.12, NOT 3.14

```bash
cd services/classifier
uv venv --python 3.12 .venv && source .venv/bin/activate
uv pip install mlx-lm sentence-transformers scikit-learn joblib numpy \
               fastapi "uvicorn[standard]" sentencepiece matplotlib anthropic pydantic httpx
python -c "import mlx.core as mx; print('MLX ok', mx.default_device())"
mlx_lm.lora --help
```

## Quick smoke test (no API key needed)

Proves the whole pipeline end-to-end on the built-in curated seed:

```bash
python generate.py seed          # writes data/classify/{train,val,test}.jsonl
python train.py                  # trains Tier-1, saves artifacts/tier1.joblib (+ confusion PNG)
uv run uvicorn serve:app --port 8081
# open http://localhost:8081  — click a preset chip
```
For a faster smoke test (skip the ~2GB bge-m3 download), use a small embedder:
```bash
EMB_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 python train.py
```
(serve.py reads the embedder id from the saved bundle, so it stays consistent.)

## Full run — the real model

```bash
# 1) DATA  (Laptop A) — needs a key
export ANTHROPIC_API_KEY=sk-ant-...
python generate.py full --per-class 400        # ~2400 rows, UZ latin+cyrillic + RU
#    eyeball ~30 rows before training:
#    head -n 30 ../../data/classify/train.jsonl

# 2) TIER-1  (Laptop B) — the live model
python train.py                                # reads data/classify, saves artifacts/tier1.joblib

# 3) TIER-2  (Laptop B, in parallel) — the hero
python build_chat_jsonl.py                     # -> data/classify_llm/{train,valid}.jsonl
mlx_lm.lora --config lora_config.yaml          # ~25-35 min; SCREENSHOT the loss curve
mlx_lm.generate --model mlx-community/Qwen2.5-1.5B-Instruct-4bit \
                --adapter-path adapters --max-tokens 12 --temp 0.0 \
                --prompt "Ish haqimni 3 oydan beri to'lashmayapti."   # must print ONE label

# 4) EVAL + decide the swap
python eval.py                                 # accuracy/F1 + confusion PNGs + recommendation

# 5) SERVE  (Laptop A serves the demo)
uv run uvicorn serve:app --port 8081                       # Tier-1 (default)
CLASSIFIER_TIER=tier2 uv run uvicorn serve:app --port 8081 # Tier-2 (only if eval said swap)
```

## Two-laptop split (independent workers, NOT distributed)

- **Laptop A:** `generate.py full` (network-bound) → then `serve.py` for the live demo.
- **Laptop B:** `train.py` (Tier-1) → `build_chat_jsonl.py` + `mlx_lm.lora` (Tier-2) → `eval.py`.
- Sync the data once: `scp -r data/classify B:.../data/` (or commit it).

## Files

| File | What |
|---|---|
| `generate.py` | synthetic UZ/RU data via Claude + a built-in curated seed (`seed` mode) |
| `train.py` | Tier-1: bge-m3 → LogisticRegression (+ binary track head) |
| `build_chat_jsonl.py` | labeled data → chat JSONL for the LoRA |
| `lora_config.yaml` | 16GB-safe MLX LoRA hyperparams |
| `engine.py` | shared inference (Tier-1 + Tier-2, parse-and-snap, track rule) |
| `serve.py` | FastAPI `/classify` (the contract) + `/` showcase page |
| `eval.py` | compare engines, confusion PNGs, swap recommendation |
| `artifacts/` | `tier1.joblib`, confusion PNGs |
| `adapters/` | LoRA adapter output |

Integration contract for the app team: [`../../docs/handoff-classify-contract.md`](../../docs/handoff-classify-contract.md).

## Troubleshooting

- **`sentencepiece` / wheel build errors** → you're on Python 3.14. Recreate the venv with `--python 3.12`.
- **Memory pressure during LoRA (Activity Monitor yellow/red)** → in `lora_config.yaml`: `batch_size: 1`, then `num_layers: 4`. Run LoRA on the laptop that isn't serving.
- **Tier-2 prints prose instead of a label** → expected occasionally; `engine.py` snaps to the nearest valid label, else `other`. Keep Tier-1 live if accuracy is low.
- **First run is slow** → `bge-m3` (~2GB) and the Qwen weights download once; pre-pull them early.
