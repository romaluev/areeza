#!/usr/bin/env python3
"""serve.py — Areeza RAG retrieval API + a tiny inspection page.

POST /retrieve  { "query"?: str, "categoryCode"?: str, "k"?: int=5 }
    -> { "articles": [ { code, source, article, title, text, url, score, verbatim_verified } ] }
GET  /health
GET  /            -> minimal page to eyeball retrieval

Run (from services/rag, classifier venv):
    ../classifier/.venv/bin/python -m uvicorn serve:app --port 8082
Everything runs on-device; the citizen's case text never leaves the machine.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

import engine as eng

_idx: Optional[eng.RagIndex] = None


def get_index() -> eng.RagIndex:
    global _idx
    if _idx is None:
        _idx = eng.RagIndex()
    return _idx


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_index()  # warm bge-m3 + index at startup
    yield


app = FastAPI(title="Areeza RAG", lifespan=lifespan)


class RetrieveIn(BaseModel):
    query: Optional[str] = None
    categoryCode: Optional[str] = None
    k: int = 5


class Article(BaseModel):
    code: str
    source: str
    article: Optional[str] = None
    title: str
    text: str
    url: str
    score: float
    verbatim_verified: bool = False


class RetrieveOut(BaseModel):
    articles: List[Article]


@app.post("/retrieve", response_model=RetrieveOut)
def retrieve(inp: RetrieveIn) -> RetrieveOut:
    arts = get_index().retrieve(query=inp.query, categoryCode=inp.categoryCode, k=inp.k)
    return RetrieveOut(articles=[Article(**a) for a in arts])


@app.get("/health")
def health() -> dict:
    return {"ok": True, "corpus": len(get_index().records)}


@app.get("/", response_class=HTMLResponse)
def home() -> str:
    return DEMO_HTML


DEMO_HTML = """<!doctype html><html lang="uz"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Areeza — Legal RAG</title>
<style>
 body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
   background:radial-gradient(1200px 600px at 70% -10%,#13224a,#0b1020);color:#eef2ff}
 .wrap{max-width:760px;margin:0 auto;padding:40px 20px 64px}
 h1{font-size:21px;margin:0 0 2px} .sub{color:#9aa6c7;font-size:13px;margin:0 0 16px}
 .card{background:#141b33;border:1px solid #26304f;border-radius:14px;padding:16px}
 select,textarea{width:100%;background:#0d1428;color:#eef2ff;border:1px solid #26304f;
   border-radius:10px;padding:10px 12px;font-size:14px;margin-bottom:10px}
 button{background:linear-gradient(135deg,#6d8cff,#9b6dff);color:#fff;border:0;font-weight:600;
   padding:10px 18px;border-radius:10px;cursor:pointer}
 .art{border:1px solid #26304f;border-radius:10px;padding:11px 13px;margin-top:10px;background:#0f1730}
 .art h3{margin:0 0 4px;font-size:15px} .art .m{color:#9aa6c7;font-size:12px}
 .art a{color:#9bb0ff} .pill{font-size:11px;color:#bcc9ff;background:rgba(109,140,255,.14);
   border:1px solid rgba(109,140,255,.4);border-radius:999px;padding:2px 8px;margin-left:6px}
 .warn{color:#fbbd23;font-size:11px;margin-left:6px}
</style></head><body><div class="wrap">
 <h1>Areeza — Legal Grounding (RAG)</h1>
 <p class="sub">Real lex.uz citations for a case · on-device · UZ/RU</p>
 <div class="card">
   <select id="cat">
     <option value="labor.wage_recovery">labor.wage_recovery</option>
     <option value="labor.reinstatement">labor.reinstatement</option>
     <option value="debt.recovery">debt.recovery</option>
     <option value="consumer.dispute">consumer.dispute</option>
     <option value="family.child_support">family.child_support</option>
     <option value="other">other</option>
   </select>
   <textarea id="q" rows="2" placeholder="Ixtiyoriy: holatni yozing / опишите ситуацию"></textarea>
   <button id="go">Retrieve</button>
   <div id="out"></div>
 </div>
</div><script>
const $=id=>document.getElementById(id);
async function run(){
  $("out").innerHTML="…";
  const r=await fetch("/retrieve",{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({categoryCode:$("cat").value,query:$("q").value||null,k:6})});
  const d=await r.json();
  $("out").innerHTML=d.articles.map(a=>`<div class="art">
    <h3>${a.title}<span class="pill">${a.source.toUpperCase()} ${a.article||"—"}</span>
    ${a.verbatim_verified?"":'<span class="warn">summary — verify text</span>'}</h3>
    <div>${a.text}</div>
    <div class="m">score ${a.score} · <a href="${a.url}" target="_blank">${a.url}</a></div></div>`).join("");
}
$("go").onclick=run; run();
</script></body></html>"""
