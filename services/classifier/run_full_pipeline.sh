#!/bin/bash
# Autonomous Tier-1 + Tier-2 pipeline: generate -> audit -> Tier-1 -> chat -> LoRA -> eval.
# Run from anywhere: bash run_full_pipeline.sh
cd /Users/mlutfullaev/dev/indie/ryco/areeza/services/classifier || exit 1
source .venv/bin/activate
D=/Users/mlutfullaev/dev/indie/ryco/areeza/data/classify

echo "########## STEP 1: GENERATE (serial codex, Uzbek-biased, per-class 80) ##########"
GEN_PER_CALL=40 python generate.py full --provider codex --per-class 80 --workers 1
if [ ! -s "$D/pool_codex.jsonl" ]; then echo "FATAL: pool_codex.jsonl empty/missing"; exit 1; fi

echo "########## STEP 2: AUDIT MERGED DATASET ##########"
python - <<'PY'
import json,collections
from pathlib import Path
D=Path("/Users/mlutfullaev/dev/indie/ryco/areeza/data/classify")
rows=[];seen=set()
for f in sorted(D.glob("pool*.jsonl")):
    for l in f.read_text().splitlines():
        if not l.strip():continue
        o=json.loads(l);k=o["text"].lower()
        if k in seen:continue
        seen.add(k);rows.append(o)
print("TOTAL unique:",len(rows))
print("category :",dict(collections.Counter(r["categoryCode"] for r in rows)))
print("loc/script:",dict(collections.Counter(f'{r["locale"]}-{r["script"]}' for r in rows)))
print("wage track:",dict(collections.Counter(r.get("track") for r in rows if r["categoryCode"]=="labor.wage_recovery")))
PY

echo "########## STEP 3: RETRAIN TIER-1 (bge-m3) ##########"
python train.py 2>&1 | grep -vE "Batches|it/s|font cache|Warning: You are"
[ -f artifacts/tier1.joblib ] || { echo "FATAL: tier1.joblib missing"; exit 1; }

echo "########## STEP 4: BUILD CHAT JSONL ##########"
python build_chat_jsonl.py

echo "########## STEP 5: TRAIN TIER-2 LoRA (Qwen2.5-1.5B, 800 iters) ##########"
mlx_lm.lora --config lora_config.yaml 2>&1 | grep -vE "Fetching|\bit/s\b|s/it"

echo "########## STEP 6: EVAL TIER-1 vs TIER-2 ##########"
python eval.py 2>&1 | grep -vE "Batches|it/s|font cache|Fetching|Warning: You are"

echo "########## PIPELINE COMPLETE ##########"
