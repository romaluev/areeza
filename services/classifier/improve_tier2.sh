#!/bin/bash
# Improve Tier-2: train the hero on Qwen2.5-3B and re-eval vs Tier-1.
cd /Users/mlutfullaev/dev/indie/ryco/areeza/services/classifier || exit 1
source .venv/bin/activate
export TIER2_BASE=mlx-community/Qwen2.5-3B-Instruct-4bit

echo "########## TRAIN TIER-2 = Qwen2.5-3B LoRA (iters 500) ##########"
mlx_lm.lora --config lora_config.yaml 2>&1 | grep -vE "Fetching|\bit/s\b|s/it"
if [ ! -f adapters/adapters.safetensors ]; then echo "FATAL: 3B adapter not saved"; exit 1; fi

echo "########## EVAL: TIER-1 vs TIER-2 (3B) ##########"
python eval.py 2>&1 | grep -vE "Batches|it/s|font cache|Fetching|Warning: You are"

echo "########## IMPROVE COMPLETE ##########"
