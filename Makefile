.PHONY: dev server test vet seed

PORT ?= 8080

dev: server

server:
	cd server && PORT=$(PORT) go run ./cmd/areeza

test:
	cd server && go test ./...

vet:
	cd server && go vet ./...

seed:
	pnpm dlx tsx -e "import { CASE_LIST, DEMO_CASE_DETAIL, DEMO_CASE_ID, getCaseDetail } from './packages/core/src/api/fixtures.ts'; import { writeFileSync, mkdirSync } from 'fs'; import { join } from 'path'; const details = []; for (const c of CASE_LIST) { const d = getCaseDetail(c.id); if (d) details.push(structuredClone(d)); } if (!details.some((d) => d.id === DEMO_CASE_ID)) details.unshift(structuredClone(DEMO_CASE_DETAIL)); const dir = join('server/internal/store'); mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, 'seed.json'), JSON.stringify({ cases: details }, null, 2)); console.log('seed', details.length);"
