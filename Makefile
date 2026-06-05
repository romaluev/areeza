.PHONY: dev all server web rag classifier1 classifier2 test vet seed preflight

PORT ?= 8080
PY := ../classifier/.venv/bin/python
CLF := .venv/bin/python

dev: server

# --- individual processes ---

server:
	cd server && PORT=$(PORT) go run ./cmd/areeza

web:
	pnpm --dir apps/web dev

# On-device RAG (rag_index.npz + corpus/legal_uz.jsonl), served on :8082.
rag:
	cd services/rag && $(PY) -m uvicorn serve:app --port 8082

# Classifier tier1 — bge-m3 + LogisticRegression, on :8081.
classifier1:
	cd services/classifier && CLASSIFIER_TIER=tier1 $(CLF) -m uvicorn serve:app --port 8081

# Classifier tier2 — Qwen-LoRA, on :8083 (optional; mac/MLX only). The Go routing
# chain degrades to tier1 → Claude backup when CLASSIFIER_TIER2_URL is unset/down.
classifier2:
	cd services/classifier && CLASSIFIER_TIER=tier2 $(CLF) -m uvicorn serve:app --port 8083

# --- whole stack: RAG + classifier(t1,t2) + Go API + web, in one terminal ---
# Ctrl-C tears the whole process group down. Set ANTHROPIC_API_KEY in server/.env
# first or the intake brain + draft stay disabled.
all:
	@echo "areeza: RAG :8082 · classifier t1 :8081 · t2 :8083 · api :$(PORT) · web :3000"
	@trap 'kill 0' EXIT INT TERM; \
		( cd services/rag && $(PY) -m uvicorn serve:app --port 8082 ) & \
		( cd services/classifier && CLASSIFIER_TIER=tier1 $(CLF) -m uvicorn serve:app --port 8081 ) & \
		( cd services/classifier && CLASSIFIER_TIER=tier2 $(CLF) -m uvicorn serve:app --port 8083 ) & \
		( cd server && PORT=$(PORT) go run ./cmd/areeza ) & \
		( pnpm --dir apps/web dev ) & \
		wait

test:
	cd server && go test ./...

vet:
	cd server && go vet ./...

# Run every CI check locally before pushing/deploying (builds all four images).
# Skip the slow image builds with: SKIP_DOCKER=1 make preflight
preflight:
	bash scripts/preflight.sh

seed:
	pnpm dlx tsx -e "import { CASE_LIST, DEMO_CASE_DETAIL, DEMO_CASE_ID, getCaseDetail } from './packages/core/src/api/fixtures.ts'; import { writeFileSync, mkdirSync } from 'fs'; import { join } from 'path'; const details = []; for (const c of CASE_LIST) { const d = getCaseDetail(c.id); if (d) details.push(structuredClone(d)); } if (!details.some((d) => d.id === DEMO_CASE_ID)) details.unshift(structuredClone(DEMO_CASE_DETAIL)); const dir = join('server/internal/store'); mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, 'seed.json'), JSON.stringify({ cases: details }, null, 2)); console.log('seed', details.length);"
