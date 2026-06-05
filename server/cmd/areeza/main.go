package main

import (
	"bufio"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/romaluev/areeza/server/internal/ai/classify"
	"github.com/romaluev/areeza/server/internal/ai/draft"
	"github.com/romaluev/areeza/server/internal/ai/intake"
	"github.com/romaluev/areeza/server/internal/api"
	"github.com/romaluev/areeza/server/internal/legal"
	"github.com/romaluev/areeza/server/internal/seed"
	"github.com/romaluev/areeza/server/internal/store"
	"github.com/romaluev/areeza/server/pkg/llm"
)

func main() {
	loadDotEnv(".env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	seedPath := os.Getenv("SEED_PATH")
	if seedPath == "" {
		seedPath = filepath.Join("internal", "store", "seed.json")
	}

	cases, err := store.LoadSeed(seedPath)
	if err != nil {
		log.Fatalf("load seed: %v", err)
	}
	log.Printf("loaded %d cases from %s", len(cases), seedPath)

	st := store.New(cases)

	// Inject the flagship rich Situation so the real-mode home list + workspace
	// render a populated example (seed.json holds the older lean "case" shape).
	if demo := seed.DemoWageSituation(); demo != nil {
		if raw, err := json.Marshal(demo); err == nil {
			st.Put(demo.ID, raw)
		}
	}

	// The routing chain: on-device tier1 → tier2 → Claude backup → keyword floor.
	// tier URLs come from env; the Claude backup is wired only when the key is present.
	chain := &legal.Classifier{
		Tier1URL: os.Getenv("CLASSIFIER_API_URL"),
		Tier2URL: os.Getenv("CLASSIFIER_TIER2_URL"),
	}

	// The intake brain needs Claude. If the key is absent we still boot (CRUD,
	// classify, route, validate keep working) but the live conversation is disabled.
	var brain *intake.Brain
	var drafter *draft.Drafter
	var provider *llm.Provider
	if p, err := llm.New(); err != nil {
		log.Printf("WARNING: intake brain + draft disabled — %v", err)
	} else {
		provider = p
		brain = intake.New(p)
		brain.Classifier = chain
		chain.Backup = classify.NewEnumClassifier(p)
		drafter = draft.New(p)
		log.Printf("intake brain ready (model=%s, tier1=%q, tier2=%q)",
			envOr("CLAUDE_MODEL", llm.DefaultModel), chain.Tier1URL, chain.Tier2URL)
	}

	handler := api.NewRouter(st, brain, chain, drafter, provider)

	addr := ":" + port
	log.Printf("areeza api listening on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// loadDotEnv loads KEY=VALUE lines from a .env file into the process environment
// (existing env vars win). Minimal, dependency-free; ignores missing files.
func loadDotEnv(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, val, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		val = strings.TrimSpace(val)
		val = strings.Trim(val, `"'`)
		if key == "" {
			continue
		}
		// .env wins over an unset OR empty env var (a shell that exports
		// ANTHROPIC_API_KEY="" must not silently shadow the real key here); a
		// non-empty exported var still wins (e.g. PORT overrides).
		if v, exists := os.LookupEnv(key); !exists || v == "" {
			_ = os.Setenv(key, val)
		}
	}
}
