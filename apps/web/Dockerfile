# Areeza web (Next.js 16) — build context: repo ROOT
#   docker build -f apps/web/Dockerfile .
# pnpm 10.12.1 via corepack; Next standalone output (set in next.config.ts).
# NEXT_PUBLIC_* are baked at build time, so the public API URL is a build ARG.

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# --- install deps (cached on lockfile + manifests) ---
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
COPY packages/core/package.json packages/core/
RUN pnpm install --frozen-lockfile

# --- build the standalone server ---
FROM base AS build
COPY --from=deps /app/ ./
COPY . .
ARG NEXT_PUBLIC_API_MODE=real
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_MODE=$NEXT_PUBLIC_API_MODE \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @areeza/web build

# --- minimal runtime ---
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# standalone mirrors the monorepo layout because outputFileTracingRoot = repo root,
# so the entrypoint lives at apps/web/server.js and static/public sit beside it.
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- http://localhost:3000/ >/dev/null 2>&1 || exit 1
CMD ["node", "apps/web/server.js"]
