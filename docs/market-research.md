# Areeza — Market Research Brief

> VC-grade research for the pitch. Compiled 4 June 2026 (EN/RU/UZ sources). FX ≈ 12,000 UZS/USD.
> Every number is cited. **[ESTIMATE]** = reasoned assumption, not a citation. Feeds [pitch.md](pitch.md).

## Thesis

Uzbekistan just made electronic court filing **mandatory** and is putting AI inside its courts — but the citizen still has to know *which* claim to file, on *what* form, under *which* code, or it gets rejected. **Areeza is the intelligence layer** that turns a plain-language problem into a court-ready, validated filing — starting with **2M+ civil cases/year** in UZ, expanding to every digitizing-but-confusing justice system on earth (**1.5B** people with unmet justice needs).

---

## 1. Uzbekistan ground truth

| Metric | Value | Source/date |
|---|---|---|
| Population | 36.8M (Jan 2024), ~37M now | stat.uz, 2024 |
| Labor force | 14.46M | statbase, 2024 |
| Avg monthly salary | 6.38M sum (~$530), FY2025 | daryo/yep.uz, 2025 |
| Minimum wage | 1.27M sum (~$100/mo) | wage.is, Aug 2025 |

**Court caseload (demand signal):**

| Case type | Volume/yr | Source |
|---|---|---|
| Total cases | **4M+ (2025, +37% YoY)** | gazeta.uz, 6 Feb 2026 |
| **Civil cases** | **2M+ (2025, +50% YoY)** | gazeta.uz, 6 Feb 2026 |
| Economic cases | 690K+ | gazeta.uz, 2026 |
| Administrative-violation | 691K (2025) | gazeta.uz/upl.uz |
| **"Indisputable" formulaic cases** | **~1M/yr** (incl. **200K utility-debt**) | Decree, 21 Aug 2025 |
| Judges | ~1,700 | gazeta.uz, 2026 |
| **Avg judge civil workload** | **556 cases/month vs. 16 international norm** | gazeta.uz, 2026 |

> **Framing gold:** The Supreme Court itself says judges work "in an unrealistic regime." The system is drowning. Areeza is **supply-side relief** (cleaner, machine-readable filings) AND **demand-side access** — a rare both-sides-of-the-market pitch.

**Affordability:** lawyer draft + first-instance representation = **5–10% of claim, min 1.5M sum (~$125+)**; consultation 80,000–200,000 sum (~$7–17); appeals min 1M sum (~$83). Status-quo cost to file one civil matter properly ≈ **$125–300+**, vs. ~$100/mo minimum wage. UZ ranks **83/142** on WJP Rule of Law 2024 (first decline in 8 yrs); the state legislated **free legal aid (Law ZRU-848, 2023)** + **149 "Madad"/advice.uz free-consultation bureaus** — official evidence of an unmet affordability problem. **[ESTIMATE] ~50–60% of adults can't comfortably afford private representation for a routine civil matter.**

## 2. Digital-court adoption ("the rails exist")

| Metric | Value | Source |
|---|---|---|
| E-SUD e-filing launched | **2013** (Supreme Court + USAID + UNDP) | gazeta.uz, 2013 |
| Cumulative e-filings | 566K+ by end-2018 | norma.uz/ICTNEWS |
| **Filing channel now** | **Electronic ONLY — paper no longer accepted** | Decree, 21 Aug 2025 |
| **AI mandated in courts** | outcome/cost prediction *before filing*, **AI assistant on my.sud.uz**, auto-transcripts, auto-drafting | Decree, 21 Aug 2025 |
| Courtrooms | Tashkent pilot end-2025 → nationwide 2026–27; **162 new courts 2025–30** | Decree, 21 Aug 2025 |
| E-gov rank | **63rd globally, EGDI 0.7999** (UN 2024, "very high") | euronews/OECD.ai |
| E-gov scale | **760+ services, 16M+ delivered H1 2025**; "Digital Uzbekistan 2030" + "Zero Bureaucracy 2030" | my.gov.uz/euronews |

## 3. Global access-to-justice / legaltech

| Metric | Value | Source |
|---|---|---|
| Global legaltech market | **$29.8B (2025) → $73.3B (2035)**, 9.4% CAGR, **APAC fastest** | Precedence Research, 2025 |
| Global justice gap | **5.1B** people with ≥1 unmet justice need; **1.5B** can't resolve a civil/admin/criminal problem | WJP, 2019 |
| US addressable volume benchmark | ~66M plaintiff cases/yr | a16z (Eve), 2025 |

## 4. TAM / SAM / SOM (with arithmetic)

- **TAM** — global self-represented / access-to-justice layer: **~$25–30B today → ~$70B+ by 2035** (legaltech), addressing **1.5B** underserved people. Law firms ≈60% of spend today → the citizen-facing layer is *underbuilt*.
- **SAM** — digitizing civil-law justice systems (Central Asia + CIS + adjacent EM, **~250–300M** people; common-law tools like DoNotPay can't serve them). Bottom-up **[ESTIMATE]**: ~25M relevant filings/yr × ~$10 blended ARPU ≈ **~$200–400M/yr** serviceable + B2G licensing.
- **SOM** — UZ self-represented filers: ~2–2.5M relevant filings/yr; capture **5%** in 3 yrs ≈ 110K filings × ~$8 ≈ **~$0.9M consumer ARR + $0.5–1.5M B2G** = **~$1.5–2.5M ARR in 36 months**, <0.1% of TAM. Market growing **37–50%/yr**, government-forced online.

> **Slide story:** 1.5B underserved (TAM) → 250–300M civil-law digitizing population (SAM) → 2M+ UZ civil filings/yr growing 50% YoY (SOM).

## 5. Competitors

| Capability | **Areeza** | ChatGPT | Lawyer (UZ) | Portal (advice.uz / e-sud) |
|---|---|---|---|---|
| Plain-language problem (UZ/RU) | ✅ | ✅ | ✅ | ⚠️ human, 9–18 |
| Correct legal route (type/venue/code) | ✅ | ❌ | ✅ | ⚠️ advisory only |
| Court-ready document (right form) | ✅ | ⚠️ wrong format | ✅ | ❌ / ⚠️ blank forms |
| Validates vs. rejection | ✅ | ❌ | ✅ | ❌ |
| Local-law-specific | ✅ | ❌ | ✅ | ✅ |
| 24/7, instant, nationwide | ✅ | ✅ | ❌ | ❌ |
| Price | **~$4–8/filing** | free (unusable) | **$125–300+** | free/state-fee |

- **DoNotPay** — "robot lawyer," US/UK **common-law only** (can't function in UZ civil law); **FTC final order Feb 2025, $193K penalty**, banned from "substitute for a lawyer" claims, found to never test quality. The anti-pattern to distance from.
- **ChatGPT** — no procedure, no forms, no validation; documented **hallucinated/fake citations** + sanctions.
- **advice.uz / "Madad"** — official, free, trusted, but human, office-hours, advisory-only, can't scale to 2M+.
- **e-sud / my.sud.uz** — the official rail, now mandatory + getting an AI assistant; a **submission pipe, not an intelligence layer**. **Our wedge AND our B2G partner**, not a competitor.
- **VC comps** — a16z→Harvey **$8B**, a16z→Eve **$47M**, Bessemer→EvenUp **$2B** (record legaltech funding 2025). All **B2B-for-US-law-firms**. Areeza = the missing **consumer + B2G** bottom-of-pyramid play in the fastest-growing region.

## 6. Why now

1. **Filing went digital — and just became mandatory** (21 Aug 2025 decree: electronic-only).
2. **The state is putting AI inside the courthouse** (my.sud.uz AI assistant, outcome prediction, auto-drafting) → government endorsement + built-in B2G buyer.
3. **LLMs crossed the threshold** to parse a messy story into structured legal language — but raw LLMs hallucinate; the unlock is *constrained, validated* generation against real UZ forms.
4. **Nationwide e-gov + "Zero Bureaucracy" mandate** (63rd globally, 16M+ digital services H1 2025).
5. **System overloaded + reforming** (+50% civil caseload, 556 cases/judge/month, 162 new courts, state-funded legal aid).

## 7. Monetization benchmarks

- Comparable: DoNotPay ~$36/3mo; LegalZoom per-doc ($89+) + $9.99/mo; Rocket Lawyer $39.99/mo; EvenUp/Harvey/Eve enterprise B2B.
- **Areeza model:** consumer **per-filing 50–100K sum (~$4–8)**; subscription **~$5–8/mo**; **B2G licensing** to my.sud.uz / Justice Ministry to triage the ~1M indisputable cases; **B2B** white-label to firms / the 149 Madad bureaus.
- **Unit-economics line:** Areeza captures **a few dollars** for output a lawyer charges **$125+** for — **10–30× below** incumbent price, marginal cost ≈ LLM inference.

## 8. Q&A weak links (be ready)

- No published *annual* e-SUD filing count for 2024–25 (strongest public figure: 566K+ cumulative by end-2018 + the electronic-only mandate). Request current number from Supreme Court press / `sud.uz`.
- "% who can't afford a lawyer" is an **[ESTIMATE]** (fee floors vs. wages + WJP), not an official stat.
- SAM/SOM dollar figures are **[ESTIMATE]s**; filing volumes + fee anchors are hard-cited, capture rates/ARPU are assumptions to defend.
- WJP justice-gap report is 2019 (canonical); pair with the 2024 Rule-of-Law decline for freshness.

## Sources

UZ market: uzdaily/stat.uz (pop), statbase (labor), daryo/yep.uz (salary), wage.is (min wage). Courts: gazeta.uz 6 Feb 2026 (4M/2M/+50%/556/1700), upl.uz (admin). Digital/reforms: gazeta.uz 23 Aug 2025 (AI decree), gazeta.uz 2013 + norma.uz/ICTNEWS (e-SUD), euronews/OECD.ai/my.gov.uz (e-gov). Fees/aid: norma.uz + realprotection.uz (prices), lex.uz ZRU-848, advice.uz, WJP (83/142). Global: precedenceresearch + fortunebusinessinsights (legaltech), worldjusticeproject.org (justice gap). Competitors: ftc.gov (DoNotPay order), Wikipedia (DoNotPay), cronkitenews/legaldive (hallucinations), law-trust/checkthat.ai (LegalZoom/Rocket). Comps: techcrunch (Harvey $8B), a16z/lawnext (Eve $47M), fortune (EvenUp $2B).
