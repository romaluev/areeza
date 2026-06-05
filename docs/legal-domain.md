# Areeza — Legal Domain Knowledge (the IP)

> The legal engine's source of truth: case → route → form → required docs → validation.
> Also the **seed dataset for the classifier** and the **template for document generation**.
> Compiled 4 Jun 2026 from official UZ sources. **[VERIFY]** = must be confirmed by our Oliy Sud advisors before demo.

## How this doc is used

- `packages/core/legal/categories.ts` — the classifier enum (§3).
- `packages/core/legal/routes.ts` — route metadata per category (§3–§5).
- `packages/core/legal/templates/` — document skeletons (§4).
- `packages/core/legal/validation.ts` — checks derived from rejection grounds (§6).

> **Critical numbering caveat.** A **new Labor Code (ЎРҚ-798, in force 30 Apr 2023)** renumbered articles. Almost every public template still cites the **OLD** LC arts (244, 253, 277). The **Civil Procedure Code (CPC, 2018 redaction)** uses arts **188–191 / 194–195**; an older 1997 CPC used 149–160. **Do not hard-code old LC numbers as current — flag for advisor.**

## 1. The rails — UZ e-justice platforms (real, live)

| Platform | URL | Role |
|---|---|---|
| E-SUD hub | `my.sud.uz` | Citizen entry: case monitoring, **fee calculator**, e-filing links, templates |
| Personal cabinet "ADOLAT" | `cabinet.sud.uz` | Authenticated: **submit claims/petitions electronically**, e-notifications, e-docs |
| Case monitoring | `my.sud.uz/pages/monitoring/civil.html` | Track a civil claim's status |
| E-payment (state fee) | `billing.sud.uz` | Pay davlat boji online |
| Published decisions | `public.sud.uz` | Public rulings database |
| Hearing schedules | `jadval2.sud.uz` | Scheduled cases |
| Main portal | `sud.uz` | Supreme Court site, templates (~**500 ready templates** UZ/RU/Karakalpak), FAQ |

Other rails: **my.gov.uz** (state services), **advice.uz** (official free legal-aid guides), **yurxizmat.uz** (Justice Ministry **template generator** — our best source for authentic doc layout), **raqobat.gov.uz** (consumer-protection committee).

> **Filing is now electronic-only** for state bodies & lawyers (Decree 21 Aug 2025); citizens can e-file via `cabinet.sud.uz` (needs e-ID) or file in person/by mail. **[VERIFY]** exact citizen wage-claim e-flow + e-signature requirements.

## 2. Product principle

Classify → route from this data → fill a **fixed template** with collected facts → **validate against §6 rejection grounds** → export package + guide. The model fills *content slots*; the *legal structure is data here*, never invented.

## 3. Case category schema (classifier enum + routes)

The full enum lives in [`packages/core/src/legal/index.ts`](../packages/core/src/legal/index.ts) (TS) and [`server/internal/legal/classify.go`](../server/internal/legal/classify.go) (Go). Trained classifier covers the original 6; the keyword router + multi-issue routes (§6b) extend coverage for the platform demo.

| `categoryCode` | Plain trigger | Route summary |
|---|---|---|
| `labor.wage_recovery` | "salary not paid" | **Branch:** accrued & undisputed → **court order** (FPK 173–174); disputed → **claim** (FPK 188–191). Civil court. **Fee-exempt.** |
| `labor.reinstatement` | "fired unfairly" | Statement of claim, civil court. **1-month** limit. Fee-exempt. |
| `labor.harassment` | "harassed at work" | Prosecutor complaint + (often) admin labor-inspectorate complaint. |
| `debt.recovery` | "lent money, not repaid" / utility arrears | Accrued & undisputed → **court order** (FPK 173–174); contested → claim. Civil court at debtor location. |
| `consumer.dispute` | "bought defective goods/service" | Complaint to **raqobat.gov.uz** and/or **claim** to civil court; venue = defendant or harm location (plaintiff's choice); moral-damage recoverable. |
| `family.child_support` | "ex won't pay aliment" | No paternity dispute → **court order** (FPK 173–174); contested → claim. |
| `family.injunction` | "spouse is about to sell our property" | Urgent injunction petition, civil court. |
| `fraud.investment` | "I was scammed / lost my investment" | Civil debt-recovery **plus** prosecutor's fraud complaint (often co-filed). |
| `other` | none of the above | Clarifying question + manual pick. |

> The trained classifier covers the original 6 codes; the **multi-issue platform demo** uses the extended enum (see §6b — fraud, harassment, family, admin variants). The Go API keyword router + Claude+enum fallback handle the extended enum so the contract never breaks.

## 4. DEMO CASE — unpaid salary (`labor.wage_recovery`)

### Route logic
1. **Is the wage accrued/calculated but unpaid, with no genuine dispute?**
   - **Yes →** *Court-order track* (буйруқ тартибида), **CPC arts ~173–174**. Judge issues a **court order (sud buyrug'i)** with **no hearing**. Employer has **10 days** to object; objection cancels the order → refile as claim.
   - **No (amount/debt disputed) →** *Statement-of-claim track* (даъво тартibida), **CPC arts 188–191**. Full hearing.
2. **Jurisdiction:** civil court (tuman/shahar) at the **defendant/employer's** location; labor claims **also** allow the **worker's place of residence** (plaintiff's choice, CPC art ~34). **[VERIFY]**
3. **State fee: EXEMPT** for claims from labor relations (**LC art 277 + Tax Code art 329** — old numbering **[VERIFY]**). Court recovers the fee from the employer if the claim wins. *State the exemption + basis in the document.*
4. **Limitation (muddat):** general labor dispute **3 months** from when the worker knew/should have known; dismissal/reinstatement **1 month**; employer material-damage **1 year**; health-damage **none**. **[VERIFY]** new LC numbers.
5. **Legal basis (cite in doc):** Labor Code arts on (a) duty to pay for work performed and (b) wages paid **≥ once per half-month** — OLD arts **244, 253**; **[VERIFY]** new equivalents. CPC arts **188, 189, 191**.

### Required facts (intake must collect)
employer (name + requisites: address, СТИР/ИНН, МФО, ОКЭД), employment status & position, hire date + order №, salary amount, months unpaid, total owed, contract availability, evidence (payroll, work-record book, avg-wage certificate), prior communication.

### Document template — `da'vo arizasi` (mirror this; CPC Art 189 mandatory sections)

```
                         ________ tuman (shahar) fuqarolik ishlari bo'yicha sudiga
   Daʼvogar:  F.I.Sh., yashash manzili, telefon, e-mail
   Javobgar:  (tashkilot nomi), manzili, hisob raqami, STIR (INN), MFO, OKED, telefon

                         DAʼVO ARIZASI
                  (ish haqini undirish to'g'risida)
                  Daʼvo bahosi: ________ so'm

   Men ____ yildan ____ lavozimida ishlayman (buyruq № ___).
   Ish beruvchi Mehnat kodeksi [VERIFY moddalari] talablariga zid ravishda
   ____ oydan ____ oygacha ish haqimni to'lamadi. Jami qarz: ____ so'm (hisob-kitob ilovada).

   Mehnat kodeksi [VERIFY], FPK 188, 189, 191-moddalariga asosan,

                         SO'RAYMAN:
   Javobgardan foydamga ____ so'm ish haqi qarzini undirib berilishini so'rayman.
   Eslatma: mehnat munosabatlaridan kelib chiqqan daʼvo davlat bojidan ozod (MK 277 / SK 329 — [VERIFY]).

   Ilova:
   1. Mehnat shartnomasi nusxasi
   2. Ish haqi hisob-kitobi
   3. O'rtacha ish haqi to'g'risida maʼlumotnoma
   4. Daʼvo arizasi nusxalari (javobgar soni bo'yicha — FPK 190)

   Sana: __________            Imzo: __________
```

**CPC Art 189 required sections** (validation must check each): court name · plaintiff details · defendant details · the demand · claim value (if monetary) · factual circumstances + evidence · pre-litigation info (if required) · list of attachments · signature + date. **Art 191:** attachments proving the facts (+ fee proof — N/A, cite exemption). **Art 190:** copies for each defendant/third party.

## 5. Other case types (one-line routes) — see §3 for codes

- **Debt recovery** — accrued & undisputed (IOU, notarized agreement, utility arrears) → court-order track (CPC 173–174); contested → claim; civil court at debtor location.
- **Consumer** — Law on Protection of Consumers' Rights (lex.uz/acts/4704); complaint to raqobat.gov.uz and/or claim; plaintiff-choice venue; moral damages.
- **Child support** — no paternity dispute → court order; contested → claim.
- **Reinstatement** — claim, civil court, **1-month** limit, fee-exempt.

## 6. Validation rules (from CPC return/refuse grounds)

Two dispositions: **Return (qaytarish, CPC art 195)** — curable, refile after fixing; **Refuse-to-accept (rad etish, CPC art 194)** — substantive bar. Our validation maps each generated field to a **return** ground:

| Check | Fails if | Ground |
|---|---|---|
| Court name present & correct venue | missing / wrong court | art 189(1), 195 |
| Plaintiff details complete | missing FIO/address | art 189(2) |
| Defendant identified + requisites | missing/unidentifiable | art 189(3) |
| Demand stated clearly | vague/absent | art 189(4) |
| Claim value present | monetary claim w/o amount | art 189(5) |
| Facts + evidence listed | no factual basis/evidence | art 189(6) |
| Fee handled | no fee proof / **no exemption cited** (wage case) | art 191/195 |
| Copies for defendants | not prepared | art 190 |
| Signature + date | unsigned / wrong signer | art 195 |
| Pre-trial done if required | mandatory step skipped | art 195 |
| Within limitation period | filed after muddat | substantive |

Run **deterministic checks first**, then a Claude soft-pass (unclear claim, weak evidence, inconsistent dates). Output `{ checks:[{id,label,status,fix}], canFile }`.

## 6b. Multi-issue platform routes (demo) — [VERIFY]

| `categoryCode` | Forum | Document kind |
|---|---|---|
| `fraud.investment` | civil_court | `davo_arizasi` |
| `criminal.fraud_complaint` | prosecutor | `prosecutor_complaint` |
| `criminal.corruption` | anticorruption_agency | `admin_complaint` |
| `admin.police_inaction` | prosecutor | `admin_complaint` |
| `labor.harassment` | prosecutor | `prosecutor_complaint` |
| `admin.labor_complaint` | labor_inspectorate | `admin_complaint` |
| `family.alimony_enforcement` | family_court | `court_order_petition` |
| `family.property_division` | civil_court | `davo_arizasi` |
| `family.injunction` | civil_court | `injunction_petition` |

Go templates: `server/internal/legal/templates/`. Limitation: reinstatement **1 month**, labor **3 months** (engine computes deadline advisories).

## 7. Advisor verification checklist (give to Oliy Sud advisors)

1. **NEW (2023) Labor Code article numbers** for: wage-payment frequency, delayed-payment liability, fee exemption (old 277), and the 3-mo/1-mo/1-yr limitation periods.
2. Can an **individual citizen e-file a wage claim end-to-end** via `cabinet.sud.uz` without a lawyer? Exact flow + e-signature/ID requirements.
3. Do **wage claims qualify for plaintiff-residence venue** (CPC art ~34)?
4. Current **CPC article numbers** courts cite for return (195) vs. refuse (194) and court order (173–174).
5. Is **Tax Code art 329** still the operative fee-exemption provision?

## 8. Sources

Codes (lex.uz): CPC 2018 https://lex.uz/docs/3517337 · Labor Code 2022/23 https://lex.uz/docs/6257288 · Consumer Law https://lex.uz/acts/4704 · return-of-claim explainer https://lex.uz/en/explanation/969. E-justice: my.sud.uz · cabinet.sud.uz · billing.sud.uz · public.sud.uz · sud.uz/faq. Templates: yurxizmat.uz/uz/document/24 (wage da'vo arizasi) · advice.uz/oz/documents/1561 · old.sud.uz template & labor-dispute guides. Court-order institute: sud.uz/news-2024-01-29-1.
