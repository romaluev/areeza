package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/romaluev/areeza/server/internal/api"
	"github.com/romaluev/areeza/server/internal/store"
)

func main() {
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
	handler := api.NewRouter(st)

	addr := ":" + port
	log.Printf("areeza api listening on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}
