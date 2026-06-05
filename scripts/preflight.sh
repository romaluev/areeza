#!/usr/bin/env bash
# preflight.sh — run the same checks CI runs, locally, BEFORE pushing/deploying.
# Mirrors .github/workflows/ci.yml so build errors surface on your laptop, not in
# Coolify. Run from anywhere: `make preflight` or `bash scripts/preflight.sh`.
#
# Skip the (slow) image builds with: SKIP_DOCKER=1 make preflight
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$1"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$1"; }

step "Go: vet · build · test"
( cd server && go vet ./... && go build ./... && go test ./... )
ok "Go"

step "Web: install · typecheck · lint · build"
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
NEXT_PUBLIC_API_MODE=real NEXT_PUBLIC_API_URL=https://api.example.com \
  NEXT_TELEMETRY_DISABLED=1 pnpm --filter @areeza/web build
ok "Web"

step "Python: byte-compile classifier + rag"
python3 -m py_compile services/classifier/*.py
python3 -m py_compile services/rag/*.py
ok "Python"

step "Compose: validate"
PUBLIC_API_URL=https://api.example.com PUBLIC_WEB_URL=https://example.com \
  POSTGRES_PASSWORD=preflight ANTHROPIC_API_KEY=sk-preflight \
  docker compose -f docker-compose.yml config -q
ok "Compose"

if [ "${SKIP_DOCKER:-0}" = "1" ]; then
  printf '\n\033[1;33m⚠ Skipping image builds (SKIP_DOCKER=1)\033[0m\n'
else
  step "Docker: build all four images (this is the real deploy signal)"
  PUBLIC_API_URL=https://api.example.com PUBLIC_WEB_URL=https://example.com \
    POSTGRES_PASSWORD=preflight ANTHROPIC_API_KEY=sk-preflight \
    docker compose -f docker-compose.yml build
  ok "Docker images"
fi

printf '\n\033[1;32m✔ preflight passed — safe to push / deploy\033[0m\n'
