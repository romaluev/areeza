#!/usr/bin/env python3
"""serve.py — local FastAPI router + standalone showcase page.

POST /classify  { "text": "..." }
    -> { categoryCode, confidence, track, rationale, engine }   (the swap-in contract)
GET  /          -> a self-contained demo page (no external CDN -> works fully offline)
GET  /health    -> { ok, tier }

Which engine serves:
    CLASSIFIER_TIER=tier1   (default) — bge-m3 + LogisticRegression
    CLASSIFIER_TIER=tier2             — Qwen-1.5B LoRA adapter

Run (from services/classifier, venv active):
    uv run uvicorn serve:app --port 8081
    # then open http://localhost:8081
Everything runs on THIS machine — the complaint text never leaves the device.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

import engine as eng

_engine = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = eng.load_engine()
    return _engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_engine()  # warm the model at startup so the first request is fast
    yield


app = FastAPI(title="Areeza Router", lifespan=lifespan)


class ClassifyIn(BaseModel):
    text: str


class ClassifyOut(BaseModel):
    categoryCode: str
    confidence: float
    track: Optional[str] = None
    rationale: str
    engine: Optional[str] = None


@app.post("/classify", response_model=ClassifyOut)
def classify(inp: ClassifyIn) -> ClassifyOut:
    return ClassifyOut(**get_engine().predict(inp.text))


@app.get("/health")
def health() -> dict:
    return {"ok": True, "tier": os.environ.get("CLASSIFIER_TIER", "tier1")}


@app.get("/", response_class=HTMLResponse)
def home() -> str:
    return DEMO_HTML


DEMO_HTML = """<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Areeza — Case Router</title>
<style>
  :root { --bg:#0b1020; --card:#141b33; --ink:#eef2ff; --muted:#9aa6c7;
          --accent:#6d8cff; --good:#36d399; --warn:#fbbd23; --bad:#f87272; --line:#26304f; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
         background:radial-gradient(1200px 600px at 70% -10%,#1a2444,var(--bg)); color:var(--ink); }
  .wrap { max-width:760px; margin:0 auto; padding:40px 20px 64px; }
  .top { display:flex; align-items:center; gap:12px; margin-bottom:6px; }
  .logo { width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#6d8cff,#9b6dff);
          display:grid;place-items:center;font-weight:800;font-size:20px; }
  h1 { font-size:22px; margin:0; letter-spacing:-.2px; }
  .sub { color:var(--muted); font-size:13px; margin:2px 0 0; }
  .priv { display:inline-flex;align-items:center;gap:6px; margin-top:14px; font-size:12px;
          color:var(--good); background:rgba(54,211,153,.1); border:1px solid rgba(54,211,153,.3);
          padding:5px 10px; border-radius:999px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:16px; padding:18px;
          margin-top:18px; }
  textarea { width:100%; min-height:96px; resize:vertical; background:#0d1428; color:var(--ink);
             border:1px solid var(--line); border-radius:12px; padding:12px 14px; font-size:15px;
             line-height:1.5; outline:none; }
  textarea:focus { border-color:var(--accent); }
  .chips { display:flex; flex-wrap:wrap; gap:8px; margin:12px 0 4px; }
  .chip { font-size:12px; color:var(--muted); background:#0d1428; border:1px solid var(--line);
          border-radius:999px; padding:6px 11px; cursor:pointer; transition:.15s; }
  .chip:hover { color:var(--ink); border-color:var(--accent); }
  .row { display:flex; gap:10px; align-items:center; margin-top:12px; }
  button { background:linear-gradient(135deg,#6d8cff,#9b6dff); color:white; border:0; font-weight:600;
           font-size:15px; padding:11px 20px; border-radius:12px; cursor:pointer; }
  button:disabled { opacity:.55; cursor:default; }
  .result { margin-top:18px; display:none; }
  .result.show { display:block; animation:fade .25s ease; }
  @keyframes fade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  .cat { font-size:20px; font-weight:700; }
  .catcode { color:var(--muted); font-size:12px; font-family:ui-monospace,Menlo,monospace; }
  .bar { height:10px; background:#0d1428; border-radius:999px; overflow:hidden; margin:12px 0 4px; }
  .fill { height:100%; width:0; background:var(--good); transition:width .5s ease; }
  .meta { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
  .tag { font-size:12px; padding:5px 10px; border-radius:8px; border:1px solid var(--line); color:var(--muted); }
  .tag b { color:var(--ink); }
  .badge { background:rgba(109,140,255,.14); border-color:rgba(109,140,255,.4); color:#bcc9ff; }
  details { margin-top:12px; } summary { cursor:pointer; color:var(--muted); font-size:12px; }
  pre { background:#0d1428; border:1px solid var(--line); border-radius:10px; padding:12px;
        overflow:auto; font-size:12px; color:#cdd6f4; }
  .err { color:var(--bad); font-size:13px; margin-top:10px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <div class="logo">A</div>
    <div>
      <h1>Areeza — Case Router</h1>
      <p class="sub">Fuqaroning muammosini to'g'ri yuridik yo'nalishga yo'naltiradi · UZ / RU</p>
    </div>
  </div>
  <span class="priv">● Hammasi shu qurilmada · всё локально · nothing leaves this device</span>

  <div class="card">
    <textarea id="text" placeholder="Muammoingizni yozing… / Опишите проблему…"></textarea>
    <div class="chips" id="chips"></div>
    <div class="row">
      <button id="go">Aniqlash / Определить</button>
      <span class="catcode" id="status"></span>
    </div>
    <div class="result" id="result">
      <div class="cat" id="catName"></div>
      <div class="catcode" id="catCode"></div>
      <div class="bar"><div class="fill" id="fill"></div></div>
      <div class="catcode"><span id="confTxt"></span> ishonch / уверенность</div>
      <div class="meta">
        <span class="tag" id="trackTag" style="display:none">track: <b id="trackVal"></b></span>
        <span class="tag badge" id="engineTag"></span>
      </div>
      <details><summary>JSON</summary><pre id="json"></pre></details>
    </div>
    <div class="err" id="err"></div>
  </div>
</div>

<script>
const NAMES = {
  "labor.wage_recovery": "Ish haqini undirish · Взыскание зарплаты",
  "labor.reinstatement": "Ishga tiklash · Восстановление на работе",
  "debt.recovery":       "Qarzni undirish · Взыскание долга",
  "consumer.dispute":    "Iste'molchi nizosi · Спор потребителя",
  "family.child_support":"Aliment · Алименты",
  "other":               "Boshqa yo'nalish · Другое",
};
const PRESETS = [
  "Ish beruvchim 3 oydan beri oyligimni to'lamayapti.",
  "Мени ноқонуний ишдан бўшатишди, ишга тикланмоқчиман.",
  "Бывший муж не платит алименты на ребёнка.",
];
const $ = id => document.getElementById(id);
const chips = $("chips");
PRESETS.forEach(p => {
  const c = document.createElement("span");
  c.className = "chip"; c.textContent = p.length > 46 ? p.slice(0,44)+"…" : p;
  c.title = p; c.onclick = () => { $("text").value = p; classify(); };
  chips.appendChild(c);
});

async function classify() {
  const text = $("text").value.trim();
  $("err").textContent = "";
  if (!text) { $("err").textContent = "Matn kiriting / Введите текст"; return; }
  $("go").disabled = true; $("status").textContent = "…";
  try {
    const r = await fetch("/classify", {
      method:"POST", headers:{"content-type":"application/json"},
      body: JSON.stringify({ text })
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    $("catName").textContent = NAMES[d.categoryCode] || d.categoryCode;
    $("catCode").textContent = d.categoryCode;
    const pct = Math.round((d.confidence || 0) * 100);
    $("fill").style.width = pct + "%";
    $("fill").style.background = pct >= 75 ? "var(--good)" : pct >= 50 ? "var(--warn)" : "var(--bad)";
    $("confTxt").textContent = pct + "%";
    if (d.track) { $("trackTag").style.display = ""; $("trackVal").textContent = d.track; }
    else { $("trackTag").style.display = "none"; }
    $("engineTag").textContent = d.engine || "engine";
    $("json").textContent = JSON.stringify(d, null, 2);
    $("result").classList.add("show");
  } catch (e) {
    $("err").textContent = "Xato / Ошибка: " + e.message;
  } finally {
    $("go").disabled = false; $("status").textContent = "";
  }
}
$("go").onclick = classify;
$("text").addEventListener("keydown", e => { if ((e.metaKey||e.ctrlKey) && e.key === "Enter") classify(); });
</script>
</body>
</html>"""
