# Areeza Go API — build context: ./server
# Multi-stage: static binary, then a tiny Alpine runtime (ships CA certs for the
# Anthropic TLS calls and a shell + wget for the container healthcheck).

FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/areeza ./cmd/areeza

FROM alpine:3.20
RUN apk add --no-cache ca-certificates wget
WORKDIR /app
COPY --from=build /out/areeza /app/areeza
COPY --from=build /src/internal/store/seed.json /app/internal/store/seed.json
ENV PORT=8080 \
    SEED_PATH=/app/internal/store/seed.json
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -qO- http://localhost:8080/health || exit 1
ENTRYPOINT ["/app/areeza"]
