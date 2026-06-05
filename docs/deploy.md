# Deploying Areeza to Coolify

The whole system ships as **one Docker Compose resource**: `web`, `api`, `classifier`,
`rag`, and a `pgvector` Postgres. Only `web` and `api` are public; the rest live on
the internal compose network. See [`docker-compose.yml`](../docker-compose.yml).

```
browser ──HTTPS──▶ web  (Next.js :3000)         areeza.uz
browser ─HTTPS/WSS▶ api (Go :8080)              api.areeza.uz
                     │ internal docker DNS
                     ├─▶ classifier :8081        (internal)
                     ├─▶ rag        :8082        (internal)
                     └─▶ postgres   :5432        (internal, volume)
```

## One-time setup in Coolify

1. **Create resource** → *Docker Compose* → point it at this repo, branch `main`,
   compose file `docker-compose.yml`.
2. **Environment variables** (copy from [`.env.coolify.example`](../.env.coolify.example)):
   | Var | Example | Notes |
   |-----|---------|-------|
   | `ANTHROPIC_API_KEY` | `sk-ant-…` | secret — Claude intake/draft |
   | `POSTGRES_PASSWORD` | `…` | secret |
   | `PUBLIC_WEB_URL` | `https://areeza.uz` | API CORS allowlist |
   | `PUBLIC_API_URL` | `https://api.areeza.uz` | baked into the web build |
   | `CLAUDE_MODEL` | `claude-sonnet-4-6` | optional |
3. **Domains** — attach `areeza.uz` to the **web** service and `api.areeza.uz` to the
   **api** service. The `SERVICE_FQDN_WEB_3000` / `SERVICE_FQDN_API_8080` markers in
   the compose tell Coolify to route + issue TLS for those ports. Point both domains'
   DNS **A records** at the Coolify host.
4. **Deploy.** First build is slow (~10–15 min) because each Python image bakes in the
   `bge-m3` model (~2.3 GB). Subsequent deploys are cached. Coolify auto-deploys on push
   to `main` via its git webhook.

> **`PUBLIC_API_URL` is build-time.** The browser talks to the API directly (REST **and**
> WebSocket), so the web bundle hard-codes this URL at `next build`. If you change the API
> domain, **rebuild** the web service.

## Before you deploy — catch errors locally

```bash
make preflight          # go vet/test/build · web typecheck/lint/build · compose · all 4 images
SKIP_DOCKER=1 make preflight   # fast path: skip the image builds
```

The same checks run in CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) on every
push, with the full image-build matrix on PRs to `main`. **If the images build in CI, they
build in Coolify.**

## Local full-stack smoke (optional)

```bash
PUBLIC_API_URL=http://localhost:8080 PUBLIC_WEB_URL=http://localhost:3000 \
  ANTHROPIC_API_KEY=sk-ant-… POSTGRES_PASSWORD=dev \
  docker compose up --build
```

- `curl localhost:8080/health` → `{"status":"ok"}`
- `curl -XPOST localhost:8081/classify -H 'content-type: application/json' -d '{"text":"Ish beruvchim oyligimni to'\''lamayapti"}'` → `labor.wage_recovery`
- `curl -XPOST localhost:8082/retrieve -H 'content-type: application/json' -d '{"categoryCode":"labor.wage_recovery","k":3}'` → real lex.uz articles
- open `localhost:3000`, run the intake flow end-to-end.

## Notes & limitations

- **Classifier is Tier-1 only** (bge-m3 + LogisticRegression). Tier-2 uses Apple-Silicon
  MLX and cannot run on a Linux host; the Go routing chain degrades Tier-1 → Claude backup
  automatically, so this is transparent. Re-adding Tier-2 in the cloud would require porting
  it off MLX (e.g. llama.cpp / vLLM).
- **Postgres is provisioned but unused** — the Go API uses an in-memory store today.
  `DATABASE_URL` is already wired to the API for when persistence lands. Data resets on
  restart until then.
- **Committed model artifact** — `services/classifier/artifacts/tier1.joblib` (30 KB) is
  committed on purpose so the git-based build has it. The RAG index is rebuilt from the
  committed corpus at image-build (`ingest.py`).
