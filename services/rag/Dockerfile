# Areeza RAG (legal-article retrieval over the curated lex.uz corpus) — context: ./services/rag
# bge-m3 is baked in; the cosine index is rebuilt deterministically at build time
# from the committed corpus (corpus/legal_uz.jsonl) — no API key, no network at runtime.

FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/models
WORKDIR /app

COPY requirements.deploy.txt .
RUN pip install --no-cache-dir --timeout=120 --retries=5 -r requirements.deploy.txt

# Pre-download the embedding model into the image (offline at runtime).
ENV HF_HUB_DOWNLOAD_TIMEOUT=60
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-m3')"

COPY . .

# Build the index from the corpus (writes artifacts/rag_index.npz + meta.json).
RUN python ingest.py

# Lock the model to the baked copy — no network needed once running.
ENV HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1
EXPOSE 8082
HEALTHCHECK --interval=20s --timeout=5s --start-period=40s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8082/health', timeout=3)" || exit 1
CMD ["uvicorn", "serve:app", "--host", "0.0.0.0", "--port", "8082"]
