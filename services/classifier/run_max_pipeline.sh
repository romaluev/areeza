#!/bin/bash
# Max-effort model panel: train 3B + 7B heroes, eval all engines, pick the best.
cd /Users/mlutfullaev/dev/indie/ryco/areeza/services/classifier || exit 1
source .venv/bin/activate
A=/Users/mlutfullaev/dev/indie/ryco/areeza/services/classifier/artifacts

echo "########## BUILD CHAT JSONL (~989 split) ##########"
python build_chat_jsonl.py

echo "########## TRAIN 3B HERO (layers 16, batch 4, rank 16, iters 800) ##########"
rm -rf adapters_3b; mkdir -p adapters_3b
mlx_lm.lora --config lora_3b.yaml 2>&1 | grep -vE "Fetching|\bit/s\b|s/it"

echo "########## TRAIN 7B HERO (best-effort: layers 8, batch 1, iters 400) ##########"
rm -rf adapters_7b; mkdir -p adapters_7b
mlx_lm.lora --config lora_7b.yaml 2>&1 | grep -vE "Fetching|\bit/s\b|s/it" || echo "WARN: 7B train nonzero (likely memory)"

echo "########## EVAL: TIER-1 vs TIER-2 (3B) ##########"
if [ -f adapters_3b/adapters.safetensors ]; then
  ADAPTER_PATH="$(pwd)/adapters_3b" TIER2_BASE=mlx-community/Qwen2.5-3B-Instruct-4bit \
    python eval.py 2>&1 | grep -vE "Batches|it/s|font cache|Fetching|Warning: You are"
  [ -f "$A/confusion_tier2.png" ] && cp "$A/confusion_tier2.png" "$A/confusion_3b.png"
else
  echo "3B adapter missing — skipping 3B eval"
fi

echo "########## EVAL: TIER-1 vs TIER-2 (7B) ##########"
if [ -f adapters_7b/adapters.safetensors ]; then
  ADAPTER_PATH="$(pwd)/adapters_7b" TIER2_BASE=mlx-community/Qwen2.5-7B-Instruct-4bit \
    python eval.py 2>&1 | grep -vE "Batches|it/s|font cache|Fetching|Warning: You are"
  [ -f "$A/confusion_tier2.png" ] && cp "$A/confusion_tier2.png" "$A/confusion_7b.png"
else
  echo "7B adapter missing — skipping 7B eval (memory)"
fi

echo "########## MAX PIPELINE COMPLETE ##########"
