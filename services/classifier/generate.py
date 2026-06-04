#!/usr/bin/env python3
"""generate.py — synthetic Uzbek/Russian labeled legal complaints for the Areeza router.

The router's only job: read a citizen's plain-language complaint and decide
(categoryCode, track). This script builds the labeled data it learns from.

Two modes:

    python generate.py seed
        Write the built-in curated seed dataset. NO API key needed.
        Use this to smoke-test the whole pipeline (train -> serve) instantly.

    python generate.py full --per-class 400
        Generate a large, diverse dataset with Claude Sonnet.
        Needs:  export ANTHROPIC_API_KEY=...
        Optional: export CLAUDE_MODEL=claude-sonnet-4-6   (default)

Both modes write a stratified 80/10/10 split to:
    data/classify/train.jsonl
    data/classify/val.jsonl
    data/classify/test.jsonl

Row schema (one JSON object per line):
    {"text": "...", "locale": "uz"|"ru", "script": "latin"|"cyrillic",
     "categoryCode": <one of LABELS>, "track": "order"|"claim"|null}
"""
from __future__ import annotations

import argparse
import json
import os
import random
import sys
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import List, Literal, Optional

from pydantic import BaseModel, ValidationError, field_validator, model_validator

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "data" / "classify"

LABELS = [
    "labor.wage_recovery",
    "labor.reinstatement",
    "debt.recovery",
    "consumer.dispute",
    "family.child_support",
    "other",
]
CategoryCode = Literal[
    "labor.wage_recovery",
    "labor.reinstatement",
    "debt.recovery",
    "consumer.dispute",
    "family.child_support",
    "other",
]
Track = Literal["order", "claim"]


class Example(BaseModel):
    text: str
    locale: Literal["uz", "ru"]
    script: Literal["latin", "cyrillic"]
    categoryCode: CategoryCode
    track: Optional[Track] = None

    @field_validator("text")
    @classmethod
    def _clean_text(cls, v: str) -> str:
        v = " ".join(v.split())
        if len(v) < 8:
            raise ValueError("text too short")
        return v

    @model_validator(mode="after")
    def _track_only_for_wage(self) -> "Example":
        # track is only meaningful for wage recovery; force null elsewhere.
        if self.categoryCode != "labor.wage_recovery":
            object.__setattr__(self, "track", None)
        return self


# --------------------------------------------------------------------------- #
# Curated seed — realistic, bilingual, both Uzbek scripts. No API needed.
# Small on purpose: it proves the pipeline end-to-end and is the no-key fallback.
# --------------------------------------------------------------------------- #
SEED_EXAMPLES: List[dict] = [
    # ---- labor.wage_recovery (track: order = accrued & undisputed; claim = disputed) ----
    {"text": "Ish beruvchim 3 oydan beri oyligimni to'lamayapti, summa hisoblangan lekin bermayapti.", "locale": "uz", "script": "latin", "categoryCode": "labor.wage_recovery", "track": "order"},
    {"text": "Иш берувчим икки ойдан бери ойлигимни тўламаяпти, маблағ ҳисобланган.", "locale": "uz", "script": "cyrillic", "categoryCode": "labor.wage_recovery", "track": "order"},
    {"text": "Работодатель не выплачивает мне зарплату уже два месяца, сумма начислена и не оспаривается.", "locale": "ru", "script": "cyrillic", "categoryCode": "labor.wage_recovery", "track": "order"},
    {"text": "To'rt oydan beri maosh yo'q, korxona qarzini tan oladi, lekin to'lamayapti.", "locale": "uz", "script": "latin", "categoryCode": "labor.wage_recovery", "track": "order"},
    {"text": "Меня не рассчитали при увольнении, зарплату за последний месяц посчитали, но не выдали.", "locale": "ru", "script": "cyrillic", "categoryCode": "labor.wage_recovery", "track": "order"},
    {"text": "Ishdan bo'shaganimda hisoblashib bermadi, qancha qarzligi bo'yicha kelishmovchilik bor.", "locale": "uz", "script": "latin", "categoryCode": "labor.wage_recovery", "track": "claim"},
    {"text": "Директор оспаривает сумму задолженности по зарплате, мы не согласны с расчётом.", "locale": "ru", "script": "cyrillic", "categoryCode": "labor.wage_recovery", "track": "claim"},
    {"text": "Ойлик миқдори бўйича низо бор, иш берувчи тўлашни рад этяпти.", "locale": "uz", "script": "cyrillic", "categoryCode": "labor.wage_recovery", "track": "claim"},

    # ---- labor.reinstatement ----
    {"text": "Meni asossiz ravishda ishdan bo'shatishdi, ishga qaytishni so'rayman.", "locale": "uz", "script": "latin", "categoryCode": "labor.reinstatement"},
    {"text": "Меня незаконно уволили, хочу восстановиться на работе.", "locale": "ru", "script": "cyrillic", "categoryCode": "labor.reinstatement"},
    {"text": "Мени ноқонуний ишдан бўшатишди, ишга тикланмоқчиман.", "locale": "uz", "script": "cyrillic", "categoryCode": "labor.reinstatement"},
    {"text": "Buyruq bilan sababsiz ishdan chetlatishdi, lavozimimni qaytarishni talab qilaman.", "locale": "uz", "script": "latin", "categoryCode": "labor.reinstatement"},
    {"text": "Уволили по статье без основания, требую восстановления в должности.", "locale": "ru", "script": "cyrillic", "categoryCode": "labor.reinstatement"},
    {"text": "Dekret ta'tilidan keyin ishga olishmadi, bu noqonuniy deb hisoblayman.", "locale": "uz", "script": "latin", "categoryCode": "labor.reinstatement"},
    {"text": "Сократили незаконно, не предупредив за два месяца, прошу восстановить.", "locale": "ru", "script": "cyrillic", "categoryCode": "labor.reinstatement"},
    {"text": "Синов муддати баҳона қилиб ноҳақ ишдан бўшатишди.", "locale": "uz", "script": "cyrillic", "categoryCode": "labor.reinstatement"},

    # ---- debt.recovery ----
    {"text": "Tanishimga qarzga pul berdim, muddati o'tdi, qaytarmayapti, tilxat bor.", "locale": "uz", "script": "latin", "categoryCode": "debt.recovery"},
    {"text": "Дал в долг знакомому 10 миллионов сумов, не возвращает, есть расписка.", "locale": "ru", "script": "cyrillic", "categoryCode": "debt.recovery"},
    {"text": "Қарзга пул бердим, келишилган муддатда қайтармаяпти.", "locale": "uz", "script": "cyrillic", "categoryCode": "debt.recovery"},
    {"text": "Kontragent shartnoma bo'yicha yetkazib berilgan tovar uchun to'lov qilmadi.", "locale": "uz", "script": "latin", "categoryCode": "debt.recovery"},
    {"text": "Контрагент не оплатил поставленный товар по договору, хочу взыскать долг.", "locale": "ru", "script": "cyrillic", "categoryCode": "debt.recovery"},
    {"text": "Pul qarz berganman, kelishilgan vaqtda qaytarmadi, sudga bermoqchiman.", "locale": "uz", "script": "latin", "categoryCode": "debt.recovery"},
    {"text": "Сосед взял деньги в долг и отказывается отдавать.", "locale": "ru", "script": "cyrillic", "categoryCode": "debt.recovery"},
    {"text": "Шартнома бўйича қарзни ундириб бермоқчиман.", "locale": "uz", "script": "cyrillic", "categoryCode": "debt.recovery"},

    # ---- consumer.dispute ----
    {"text": "Yangi telefon sotib oldim, buzuq chiqdi, do'kon almashtirib bermayapti.", "locale": "uz", "script": "latin", "categoryCode": "consumer.dispute"},
    {"text": "Купил холодильник, он бракованный, магазин отказывается возвращать деньги.", "locale": "ru", "script": "cyrillic", "categoryCode": "consumer.dispute"},
    {"text": "Сотиб олган маҳсулотим яроқсиз чиқди, дўкон пулни қайтармаяпти.", "locale": "uz", "script": "cyrillic", "categoryCode": "consumer.dispute"},
    {"text": "Ta'mirlash xizmati sifatsiz bajarildi, pulni qaytarib berishmayapti.", "locale": "uz", "script": "latin", "categoryCode": "consumer.dispute"},
    {"text": "Заказал мебель, привезли с дефектом, обменять отказываются.", "locale": "ru", "script": "cyrillic", "categoryCode": "consumer.dispute"},
    {"text": "Kafolat muddatida buzilgan tovarni ta'mirlab berishmadi.", "locale": "uz", "script": "latin", "categoryCode": "consumer.dispute"},
    {"text": "Услуга оказана некачественно, требую возврата уплаченных денег.", "locale": "ru", "script": "cyrillic", "categoryCode": "consumer.dispute"},
    {"text": "Онлайн дўкондан келган маҳсулот реклама билан мос келмади.", "locale": "uz", "script": "cyrillic", "categoryCode": "consumer.dispute"},

    # ---- family.child_support ----
    {"text": "Eski erim farzandimiz uchun aliment to'lamayapti.", "locale": "uz", "script": "latin", "categoryCode": "family.child_support"},
    {"text": "Бывший муж не платит алименты на ребёнка.", "locale": "ru", "script": "cyrillic", "categoryCode": "family.child_support"},
    {"text": "Собиқ турмуш ўртоғим болага алимент тўламаяпти.", "locale": "uz", "script": "cyrillic", "categoryCode": "family.child_support"},
    {"text": "Ajrashganmiz, bolamga nafaqa berishdan bosh tortyapti.", "locale": "uz", "script": "latin", "categoryCode": "family.child_support"},
    {"text": "Отец ребёнка уклоняется от уплаты алиментов, хочу взыскать через суд.", "locale": "ru", "script": "cyrillic", "categoryCode": "family.child_support"},
    {"text": "Bolam uchun aliment undirib berishni so'rayman.", "locale": "uz", "script": "latin", "categoryCode": "family.child_support"},
    {"text": "Хочу взыскать алименты на двоих несовершеннолетних детей.", "locale": "ru", "script": "cyrillic", "categoryCode": "family.child_support"},
    {"text": "Фарзандим учун нафақа тўлашдан бош тортяпти.", "locale": "uz", "script": "cyrillic", "categoryCode": "family.child_support"},

    # ---- other (real complaints that must NOT map to the 5) ----
    {"text": "Qo'shnim tunda baland ovozda musiqa qo'yib tinchligimni buzyapti.", "locale": "uz", "script": "latin", "categoryCode": "other"},
    {"text": "Сосед затопил мою квартиру, хочу возместить ущерб.", "locale": "ru", "script": "cyrillic", "categoryCode": "other"},
    {"text": "Мерос тақсимлаш бўйича ака-укалар билан низо чиқди.", "locale": "uz", "script": "cyrillic", "categoryCode": "other"},
    {"text": "Meni firibgarlik bilan aldab pulimni olib ketishdi.", "locale": "uz", "script": "latin", "categoryCode": "other"},
    {"text": "Меня обвиняют в совершении преступления, нужна правовая помощь.", "locale": "ru", "script": "cyrillic", "categoryCode": "other"},
    {"text": "Yer uchastkasi chegarasi bo'yicha qo'shni bilan tortishuv bor.", "locale": "uz", "script": "latin", "categoryCode": "other"},
    {"text": "Хочу оформить развод, общих детей и имущества нет.", "locale": "ru", "script": "cyrillic", "categoryCode": "other"},
    {"text": "Йўл-транспорт ҳодисаси бўлди, суғурта тўловни амалга оширмаяпти.", "locale": "uz", "script": "cyrillic", "categoryCode": "other"},
]


# --------------------------------------------------------------------------- #
# Claude generation (full mode)
# --------------------------------------------------------------------------- #
CATEGORY_MEANINGS = """- labor.wage_recovery: employer hasn't paid earned/owed wages
- labor.reinstatement: fired/dismissed unfairly, wants the job back
- debt.recovery: lent money / unpaid debt / unpaid invoice under a contract
- consumer.dispute: bought defective goods or got bad paid service
- family.child_support: ex-spouse won't pay child support (aliment)
- other: anything that does NOT cleanly fit the 5 above (inheritance, criminal,
  neighbor/property damage, land boundary, divorce-without-support, traffic/insurance).
  These MUST read like real citizen complaints that should NOT map to the 5."""

GEN_PROMPT = """You generate REALISTIC plain-language legal complaints written by ordinary citizens of Uzbekistan.

Produce exactly {n} DISTINCT complaints for this single cell:
- category: {cat}
- language: {locale}
- script: {script}   (for uz: latin e.g. "oyligimni to'lamadi"; cyrillic e.g. "ойлигимни тўламади". for ru: always cyrillic)
- register: {register}

What each category means (route a real life-problem to ONE):
{meanings}

Rules:
- Write the way a real person speaks, not like a lawyer. Vary persona (age, region: Tashkent/Fergana/Samarkand/Karakalpakstan flavor), length (one sentence to a short paragraph), and concrete specifics (sums in so'm, dates, job titles, names).
- Do NOT reuse these opening phrases: {avoid}
{track_rule}
Return ONLY a JSON array. Each element MUST be an object with EXACTLY these keys:
{{"text": <string>, "locale": "{locale}", "script": "{script}", "categoryCode": "{cat}", "track": {track_default}}}
No prose, no markdown fences — just the JSON array."""

REGISTERS = ["very casual / spoken", "neutral", "formal / petition-like"]
# Areeza is Uzbek-primary (Russian fallback). Oversample Uzbek — especially
# uz-Cyrillic, which is under-represented in the hand-authored pools.
CELLS = [
    ("uz", "cyrillic"), ("uz", "cyrillic"),
    ("uz", "latin"), ("uz", "latin"),
    ("ru", "cyrillic"),
]
# examples requested per LLM call; bump (e.g. GEN_PER_CALL=35) to amortize codex's
# fixed per-call agent overhead when generating in bulk.
PER_CALL = int(os.environ.get("GEN_PER_CALL", "12"))


def _extract_json_array(raw: str) -> list:
    """Find the FIRST balanced top-level [...] array (robust to codex's chatty,
    sometimes-duplicated output) and parse it."""
    start = raw.find("[")
    if start == -1:
        return []
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(raw)):
        ch = raw[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(raw[start : i + 1])
                except json.JSONDecodeError:
                    return []
    return []


def _call_cell(complete, cat, locale, script, register, avoid) -> List[Example]:
    is_wage = cat == "labor.wage_recovery"
    track_rule = (
        '- For EACH complaint set track: "order" if the amount is accrued/calculated and NOT '
        'disputed by the employer (fast court-order track), or "claim" if the amount or facts '
        "are disputed (full statement of claim). Mix both.\n"
        if is_wage
        else "- Set track to null for every complaint (it only applies to wage recovery).\n"
    )
    prompt = GEN_PROMPT.format(
        n=PER_CALL,
        cat=cat,
        locale=locale,
        script=script,
        register=register,
        meanings=CATEGORY_MEANINGS,
        avoid="; ".join(avoid[-6:]) or "(none yet)",
        track_rule=track_rule,
        track_default='"order" or "claim"' if is_wage else "null",
    )
    raw = complete(prompt)
    out: List[Example] = []
    for obj in _extract_json_array(raw):
        if not isinstance(obj, dict):
            continue
        obj.setdefault("locale", locale)
        obj.setdefault("script", script)
        obj["categoryCode"] = cat
        if not is_wage:
            obj["track"] = None
        try:
            out.append(Example(**obj))
        except (ValidationError, TypeError):
            continue
    return out


def _make_completer(provider: str):
    """Return (complete_fn, model_name) for the chosen LLM provider."""
    if provider == "codex":
        # Drive GPT through the codex CLI (its own auth) — no API key needed here.
        import subprocess

        def complete(prompt: str) -> str:
            try:
                r = subprocess.run(
                    ["codex", "exec", "--skip-git-repo-check", prompt],
                    capture_output=True, text=True, cwd="/tmp", timeout=420,
                )
                return r.stdout or ""
            except subprocess.TimeoutExpired:
                return ""

        return complete, "codex(gpt)"

    if provider == "openai":
        try:
            from openai import OpenAI
        except ImportError:
            sys.exit("openai not installed — run: uv pip install openai")
        if not os.environ.get("OPENAI_API_KEY"):
            sys.exit("OPENAI_API_KEY not set for --provider openai.")
        client = OpenAI()
        model = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini")

        def complete(prompt: str) -> str:
            r = client.chat.completions.create(
                model=model, temperature=1.0, max_tokens=4000,
                messages=[{"role": "user", "content": prompt}],
            )
            return r.choices[0].message.content or ""

        return complete, model

    # default: anthropic / claude
    try:
        from anthropic import Anthropic
    except ImportError:
        sys.exit("anthropic not installed — run: uv pip install anthropic")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("ANTHROPIC_API_KEY not set. Use `python generate.py seed` for a no-key dataset.")
    client = Anthropic()
    model = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-6")

    def complete(prompt: str) -> str:
        m = client.messages.create(
            model=model, max_tokens=4000, temperature=1.0,
            messages=[{"role": "user", "content": prompt}],
        )
        return m.content[0].text

    return complete, model


def cmd_full(per_class: int, workers: int, provider: str = "claude") -> List[Example]:
    complete, model = _make_completer(provider)
    print(f"Generating ~{per_class}/class with {provider}:{model} ({workers} workers)...")

    rows: List[Example] = []
    avoid_lock_openers: List[str] = []

    for cat in LABELS:
        got: List[Example] = []
        # enough calls to overshoot the target, then trim
        n_calls = max(1, -(-per_class // PER_CALL))  # ceil, no buffer — efficient for serial
        rounds = 0
        while len(got) < per_class and rounds < 40:
            rounds += 1
            jobs = []
            with ThreadPoolExecutor(max_workers=workers) as ex:
                for _ in range(n_calls):
                    locale, script = random.choice(CELLS)
                    register = random.choice(REGISTERS)
                    jobs.append(
                        ex.submit(
                            _call_cell, complete, cat, locale, script, register,
                            list(avoid_lock_openers),
                        )
                    )
                for fut in as_completed(jobs):
                    try:
                        batch = fut.result()
                    except Exception as e:  # noqa: BLE001 — keep going on a flaky call
                        print(f"  warn: call failed for {cat}: {e}")
                        continue
                    for e in batch:
                        avoid_lock_openers.append(e.text[:25])
                        got.append(e)
            print(f"  {cat}: {len(got)}/{per_class}")
            n_calls = 2  # top-up rounds are small
        if len(got) < per_class:
            print(f"  warn: {cat} stopped at {len(got)} after {rounds} rounds")
        rows.extend(got[:per_class])

    return rows


def cmd_pool() -> List[Example]:
    """Load + dedupe hand-authored data/classify/pool*.jsonl (no API needed).

    Malformed lines are dropped, not fatal — so partial typos never break the run.
    """
    files = sorted(OUT.glob("pool*.jsonl"))
    if not files:
        sys.exit("no data/classify/pool*.jsonl files found — write some first")
    seen: set[str] = set()
    rows: List[Example] = []
    dropped = 0
    for f in files:
        for line in f.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                ex = Example(**json.loads(line))
            except (json.JSONDecodeError, ValidationError, TypeError, ValueError):
                dropped += 1
                continue
            key = ex.text.lower()
            if key in seen:
                continue
            seen.add(key)
            rows.append(ex)
    print(f"Loaded {len(rows)} unique pool examples from {len(files)} file(s) ({dropped} dropped).")
    return rows


# --------------------------------------------------------------------------- #
# Split + write
# --------------------------------------------------------------------------- #
def stratified_split(rows: List[Example]):
    by_cat = defaultdict(list)
    for r in rows:
        by_cat[r.categoryCode].append(r)
    train, val, test = [], [], []
    for cat, items in by_cat.items():
        random.shuffle(items)
        n = len(items)
        a, b = max(1, int(n * 0.8)), max(1, int(n * 0.9))
        if n < 3:  # tiny class: everything to train
            train.extend(items)
            continue
        train.extend(items[:a])
        val.extend(items[a:b])
        test.extend(items[b:])
    for s in (train, val, test):
        random.shuffle(s)
    return train, val, test


def write_split(name: str, rows: List[Example]) -> None:
    path = OUT / f"{name}.jsonl"
    path.write_text(
        "\n".join(json.dumps(r.model_dump(), ensure_ascii=False) for r in rows) + "\n",
        encoding="utf-8",
    )
    counts = defaultdict(int)
    for r in rows:
        counts[r.categoryCode] += 1
    print(f"  {name}: {len(rows)} rows  {dict(counts)}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Generate labeled UZ/RU complaints for the router.")
    ap.add_argument(
        "mode",
        choices=["seed", "full", "pool"],
        help="seed = small curated set; full = Claude API generation; "
        "pool = split hand-authored data/classify/pool*.jsonl (no API)",
    )
    ap.add_argument("--per-class", type=int, default=400, help="(full) target examples per class")
    ap.add_argument("--workers", type=int, default=6, help="(full) parallel API calls")
    ap.add_argument(
        "--provider",
        choices=["claude", "openai", "codex"],
        default="claude",
        help="(full) which LLM generates the data; run several to mix for diversity",
    )
    ap.add_argument("--seed-rng", type=int, default=42, help="random seed for the split")
    args = ap.parse_args()

    random.seed(args.seed_rng)
    OUT.mkdir(parents=True, exist_ok=True)

    if args.mode == "seed":
        rows = [Example(**e) for e in SEED_EXAMPLES]
        print(f"Loaded {len(rows)} curated seed examples.")
    elif args.mode == "pool":
        rows = cmd_pool()
    else:
        gen = cmd_full(args.per_class, args.workers, args.provider)
        gen_path = OUT / f"pool_{args.provider}.jsonl"
        gen_path.write_text(
            "\n".join(json.dumps(r.model_dump(), ensure_ascii=False) for r in gen) + "\n",
            encoding="utf-8",
        )
        print(f"Generated {len(gen)} examples -> {gen_path}")
        # merge generated data with ALL hand-authored pools (additive, deduped)
        rows = cmd_pool()

    train, val, test = stratified_split(rows)
    print("Writing splits to", OUT)
    write_split("train", train)
    write_split("val", val)
    write_split("test", test)
    print("Done.")


if __name__ == "__main__":
    main()
