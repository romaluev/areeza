# Handoff — `/api/classify` contract (local router → Claude fallback)

> **Status (post-shipment, 5 Jun 2026): live.** The wiring described below is implemented Go-side in [`server/internal/legal/classify_chain.go`](../server/internal/legal/classify_chain.go) (tier-1 → tier-2 → Claude → keyword). The Next.js TypeScript sketch later in this doc is the original handoff sketch kept for contract reference.

This is what the **frontend/backend team** needed to wire the trained router into the app. The model lives in [`services/classifier/`](../services/classifier) and runs **locally** (privacy: the complaint never leaves the device). The Go API at `POST /api/classify` proxies to it and **falls back to the keyword router, then Claude+enum** so the demo can't break.

## Contract

```
POST /api/classify
Request:  { text: string, caseId?: string }
Response: { categoryCode, confidence, track, rationale }
```

- `categoryCode` ∈ `labor.wage_recovery | labor.reinstatement | debt.recovery | consumer.dispute | family.child_support | other`
- `track` ∈ `"order" | "claim" | null` — only non-null for `labor.wage_recovery`
  (`order` = accrued & undisputed → court-order path; `claim` = disputed → full statement of claim)
- `confidence` ∈ `[0,1]`
- `rationale` — short human-readable string (for the UI / debugging)

> The local service also returns an extra `engine` field (which model answered). It's optional;
> the zod schema below ignores unknown keys, so it's safe to keep or drop.

> **Doc nit:** `architecture.md` §4 lists the response without `track`. The 4-field shape above
> (with `track`) is the correct one — align §4 when you touch it.

## zod schema (`packages/core/types` or co-located)

```ts
import { z } from "zod";

export const CategoryCode = z.enum([
  "labor.wage_recovery",
  "labor.reinstatement",
  "debt.recovery",
  "consumer.dispute",
  "family.child_support",
  "other",
]);

export const ClassifyResult = z.object({
  categoryCode: CategoryCode,
  confidence: z.number().min(0).max(1),
  track: z.enum(["order", "claim"]).nullable(),
  rationale: z.string(),
});
export type ClassifyResult = z.infer<typeof ClassifyResult>;
```

## Next.js route — proxy with Claude fallback

```ts
// apps/web/app/api/classify/route.ts
import { ClassifyResult } from "@areeza/core/types";
import { classifyWithClaudeEnum } from "@areeza/core/ai/classify"; // the always-on fallback

export async function POST(req: Request) {
  const { text } = await req.json();

  // 1) try the local trained model (CLASSIFIER_API_URL = the laptop, e.g. via a tunnel)
  const url = process.env.CLASSIFIER_API_URL;
  if (url) {
    try {
      const r = await fetch(`${url}/classify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(2500),
      });
      if (r.ok) return Response.json(ClassifyResult.parse(await r.json()));
    } catch {
      /* fall through to Claude */
    }
  }

  // 2) fallback: Claude + zod enum (never breaks the demo)
  return Response.json(await classifyWithClaudeEnum(text));
}
```

## Claude fallback sketch (`packages/core/ai/classify.ts`)

```ts
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { ClassifyResult, CategoryCode } from "@areeza/core/types";

export async function classifyWithClaudeEnum(text: string) {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: ClassifyResult,
    prompt:
      `Classify this Uzbek/Russian citizen complaint into one categoryCode. ` +
      `For labor.wage_recovery set track=order if the amount is accrued & undisputed, ` +
      `else claim. Otherwise track=null.\n\nComplaint: ${text}`,
  });
  return object; // already matches the contract
}
```

## Env

```
CLASSIFIER_API_URL=http://localhost:8081     # local dev (same machine)
# for a remote frontend, expose the laptop with a tunnel (e.g. cloudflared) and use that URL
```

If `CLASSIFIER_API_URL` is unset, the route uses Claude directly — useful for Vercel preview
deploys where there's no laptop to reach. (A local MLX/sklearn model **cannot** run on Vercel;
on-device is the point — that's the privacy/on-prem story.)
