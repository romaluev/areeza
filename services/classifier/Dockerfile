# Areeza classifier (Tier-1: bge-m3 + LogisticRegression) — context: ./services/classifier
# bge-m3 is baked into the image so startup is instant and fully offline.
#
# NOTE: the app lives at /app/services/classifier (not /app) on purpose —
# build_chat_jsonl.py (imported by engine.py) does Path(__file__).parents[2] at
# import time, which needs at least three path levels above the repo root.

FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/models \
    CLASSIFIER_TIER=tier1
WORKDIR /app/services/classifier

COPY requirements.deploy.txt .
RUN pip install --no-cache-dir -r requirements.deploy.txt

# Pre-download the embedding model into the image (offline at runtime).
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-m3')"

COPY . .

# Lock the model to the baked copy — no network needed once running.
ENV HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1
EXPOSE 8081
HEALTHCHECK --interval=20s --timeout=5s --start-period=40s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8081/health', timeout=3)" || exit 1
CMD ["uvicorn", "serve:app", "--host", "0.0.0.0", "--port", "8081"]
