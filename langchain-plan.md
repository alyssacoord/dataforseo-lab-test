# LangChain-Based Relevance Filtering — Competitors & Keywords

**Status:** Planned, not yet implemented.
**Source:** research via `langchain-skills:ecosystem-primer`, `deep-agents-core`, `langchain-fundamentals`, `langchain-middleware`, `langchain-dependencies` — fetched live (re-verified 2026-07-23), not assumed from training data.

## Context

Competitive Set already has two places that filter "noise" out of raw DataForSEO results, both rule-based today with known, real blind spots:

1. **Keyword overlap filtering** — `lib/keywordVocabulary.ts`'s `FASHION_KEYWORD_REGEX`, applied via `OverlapPanel` / `handleExpand` / `handleCompareAll` in `dashboard/app/competitive-set/page.tsx`. A garment-vocabulary substring regex. Correctly excludes obvious noise ("mango", "nike" as bare brand terms) but can't judge intent, and can't catch anything that doesn't literally contain a garment word.
2. **Suggested competitors** — the raw `competitors_domain` candidate list in the same page. Today there's no relevance filtering at all beyond the numeric "Min shared keywords" threshold — Amazon, eBay, YouTube, Pinterest routinely show up because they share *some* keywords, with no judgment on whether they're a genuine fashion/general-merchandise competitor.

The UI already has a **disabled "LangChain (coming soon)" button** in the filter-mode control (`FilterMode = 'none' | 'regex' | 'langchain'`, `dashboard/app/competitive-set/page.tsx`) — this plan is what turns that on, plus extends the same capability to the competitor-candidates list, matching the explicit ask ("filtering the irrelevant competitors, keywords").

## What the LangChain docs actually say to build here

This is worth stating plainly because it's a course-correction, not just an implementation detail: the ask was for "LangChain's DeepAgent," but Deep Agents' own documented decision table (`deep-agents-core`'s `<when-to-use>`) says this task — single-purpose, context fits in one prompt, no planning/memory/subagent delegation needed — belongs in the *other* column: use LangChain's plain `create_agent`, not Deep Agents. `createDeepAgent` does have a real TypeScript build (`createDeepAgent` from the `deepagents` package), so it's not a platform-availability problem — it's that pulling in planning/filesystem/subagent middleware for a stateless classification call is pure overhead with no payoff.

Going a step further: this task doesn't even need `create_agent`'s tool-calling loop — it's classification, not tool use. The right primitive, confirmed via `langchain-fundamentals`'s structured-output section, is **`model.withStructuredOutput(zodSchema)`** — one model call, one Zod-validated response, no loop, no tools, no agent framework beyond the model wrapper itself.

**Net effect:** simpler, cheaper, one fewer dependency (no `langchain`, `@langchain/langgraph`, or `deepagents` package needed), and still genuinely "the LangChain option" the UI already promises — just the right layer of the stack for what this specific job is. If there's a reason to want the full Deep Agents harness anyway (e.g. this is meant to grow into multi-step reasoning across a whole competitive-brief workflow, or it's a fixed team convention to always use Deep Agents), that's a real reason to revisit — flag it and I'll redo this section.

## Package/dependency confirmation (via `langchain-dependencies`)

Minimal set for this scope:
- `@langchain/core` — peer dependency, must be listed explicitly (not always auto-hoisted).
- `@langchain/anthropic` — the model provider (`ChatAnthropic`).
- `zod` — not currently used anywhere in this app; net-new.

Not needed for this scope: `langchain` (agents/chains/retrieval — no agent loop here), `@langchain/langgraph` / `deepagents` (no orchestration needed).

**Worth flagging:** `langchain-dependencies`'s own minimal-project template lists `langchain` + `langsmith` as "always required" baseline packages, on the assumption most projects eventually reach for `create_agent`/chains. Deliberately going narrower here since this scope never does — the only genuinely required packages for `model.withStructuredOutput()` are the provider package and `@langchain/core`. `zod` for schema validation, and optionally `langsmith` if choice 5 below (tracing) is turned on.

```bash
cd dashboard && npm install @langchain/anthropic @langchain/core zod
```

## Approach

### 1. New secret
Add `ANTHROPIC_API_KEY` to `dashboard/.env.local`, and a blank placeholder in `dashboard/.env.local.example` — mirroring the existing `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD` pattern. This is a **new real secret and a new real per-call cost** (Anthropic usage), separate from and in addition to the DataForSEO bill already being tracked in `plan.md`.

**Model choice:** default to **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) — cheap and fast, sufficient for a straightforward relevance judgment. Easy to swap to Sonnet later if judgment quality on ambiguous cases needs it.

### 2. Shared classification helper — `dashboard/lib/relevanceFilter.ts` (new, server-only)

One function serves both use cases, since they're structurally identical (list of items + business context → per-item relevance judgment):

```ts
import { ChatAnthropic } from '@langchain/anthropic';
import { z } from 'zod';

const JudgmentSchema = z.object({
  judgments: z.array(z.object({ item: z.string(), relevant: z.boolean(), reason: z.string() })),
});

export async function classifyRelevance(items: string[], context: string) {
  const model = new ChatAnthropic({ model: 'claude-haiku-4-5-20251001', temperature: 0 });
  const structured = model.withStructuredOutput(JudgmentSchema);
  const { judgments } = await structured.invoke(
    `${context}\n\nItems to judge:\n${items.map((i) => `- ${i}`).join('\n')}`
  );
  return judgments; // { item, relevant, reason }[]
}
```

Context strings differ per use case — written explicitly at the call site, not baked into the helper:

- **Keywords:** "You're judging whether each shared keyword between {targetDomain} and {peerDomain} (both UK fashion/general-merchandise retailers) represents genuine competitive overlap in clothing/fashion, versus incidental overlap (third-party brand names, unrelated product categories, generic terms). Judge each keyword."
- **Competitors:** "You're judging whether each candidate domain is a genuine UK fashion or fashion-adjacent general-merchandise competitor to {targetDomain}, versus a domain that shares some keywords incidentally (marketplaces, unrelated retailers, generic platforms). Judge each domain."

### 3. New API route — `dashboard/app/api/relevance-filter/route.ts` (new)

Thin server-side route mirroring `dashboard/app/api/dataforseo/route.ts`'s shape — keeps the "only this one file touches the secret" discipline already established for the DataForSEO credentials. `POST { items: string[], context: string }` → calls `classifyRelevance` → returns `{ judgments }` or `{ error }`. No client code ever imports `@langchain/anthropic` directly.

### 4. Wire into Competitive Set (`dashboard/app/competitive-set/page.tsx`)

**Keyword filtering — enable the existing disabled button:**
- Remove `disabled` from the "LangChain" button in the filter-mode control; `FilterMode` already has `'langchain'` as a valid type value, just unused today.
- `handleExpand` / `handleCompareAll`: when `filterMode === 'langchain'`, fetch `domain_intersection` keywords **unfiltered** (no DataForSEO `filters` param — that's the regex path's job) with a slightly larger `limit` (e.g. 30, up from 20) so the classifier has enough to work with. POST the returned keyword strings + context to `/api/relevance-filter`, and render only `relevant: true` items in `OverlapPanel`'s table — with a small expandable "N filtered as noise (see why)" affordance showing the `reason` for excluded ones. Never silently hide without explanation — matches the transparency habit already established throughout this app (e.g. the caveats already surfaced inline in Trend Detection and AI Visibility).

**Competitor filtering — new capability, not just enabling a toggle:**
- After `handleSearch` populates `rawCandidates` (from `competitors_domain`), add a "Filter with LangChain" button near the existing Sort/Min-shared-keywords control row.
- On click: POST the candidate domain list + context to `/api/relevance-filter`, store judgments in state (`Record<string, { relevant: boolean; reason: string } | null>`), and add a "Hide likely-irrelevant" checkbox that filters `candidates` (in the existing `useMemo`) down to judged-relevant ones when both the checkbox is on and judgments exist. Each candidate row shows its `reason` on hover/expand when a judgment exists, win or lose — so a false "irrelevant" call is visible and correctable, not silently hidden.

### 5. Types (`dashboard/lib/types.ts`)

```ts
export interface RelevanceJudgment { item: string; relevant: boolean; reason: string; }
```

## Verification plan

1. **Test the classifier in isolation before any UI wiring** — the actual acceptance test for whether this is worth shipping. Run `classifyRelevance` directly against the exact cases already surfaced this session:
   - Keywords: `["mango", "nike", "boots", "birkenstock", "wide leg jeans", "midi dress", "floral dress"]` — confirm brand names come back `relevant: false`, genuine category terms come back `relevant: true`.
   - Competitors: `["amazon.co.uk", "ebay.co.uk", "youtube.com", "next.co.uk", "asos.com"]` — confirm marketplaces/platforms are flagged `relevant: false` with a sensible reason, real fashion/general-merchandise peers come back `relevant: true`.
2. `npx tsc --noEmit` and `npm run build` after wiring — same discipline as every other module in this app.
3. Drive the new route through the running dev server with `curl` before trusting the UI — same verification pattern used for every DataForSEO endpoint so far.
4. Restart the dev server clean, click through both the keyword-filter and competitor-filter paths, check the dev log for errors.
5. Update `plan.md` per the standing convention once shipped.

## Cost note, stated plainly

This adds a **second real per-call cost** on top of DataForSEO's: every "Show overlap"/"Compare all" run in LangChain mode fires one Anthropic call (batched — one call per keyword-list or per candidate-list, not per item), and every competitor-list "Filter with LangChain" click fires one more. Haiku keeps this cheap, but it's a different bill (Anthropic) than the DataForSEO one already being tracked in `plan.md`.

## Plan choices — decide before implementing

Five separate decision points, each with a recommendation already reflected in the "Approach" section above. Flag any you want changed before implementation starts — the rest of this doc assumes the recommended (**bold**) option at each point.

### 1. Implementation layer
Re-confirmed directly against `ecosystem-primer`'s own decision table (Step 1): "pure model call... with no agent loop" routes to plain LangChain, bottom layer — exactly this case, since there's no tool use, no multi-step reasoning, just one classification call.
- **A. Structured output only — `model.withStructuredOutput(zodSchema)`, no agent loop, no tools (recommended, and what's spec'd above).** One call in, one validated judgment list out. Cheapest, simplest, no `langchain`/`@langchain/langgraph`/`deepagents` dependency. Right fit because this is pure classification — nothing to plan, remember, or delegate.
- **B. `create_agent` with `response_format: JudgmentSchema` (the actual current param name, confirmed via `langchain-fundamentals`).** Gets the same validated-object result (`result.structured_response` / `result.structuredResponse`) but via the full agent loop, which means pulling in `langchain` proper and giving the model tools to call mid-judgment — e.g. a tool that checks a domain's actual product categories before ruling on relevance, instead of judging from the keyword/domain string alone. Real quality upside for ambiguous cases, at the cost of a slower, more expensive multi-turn call per batch, and a dependency this scope doesn't otherwise need.
- **C. Full Deep Agents harness (`createDeepAgent`).** Only makes sense if this grows into multi-step reasoning across a whole competitive-brief workflow (planning, memory, subagent delegation) rather than a single relevance call. Confirmed available as a real TypeScript build (`createDeepAgent` from `deepagents`), not a platform gap — just the wrong layer for this scope, per `deep-agents-core`'s own decision table (re-confirmed: "context fits in a single prompt" / "single agent is sufficient" / "ephemeral, single-session work" all point away from Deep Agents here).

### 2. Model
- **A. Claude Haiku 4.5 (recommended, and what's spec'd above).** Cheap, fast, sufficient for a relevance yes/no with a one-line reason.
- **B. Claude Sonnet 5.** Worth switching to if Haiku's judgment calls on genuinely ambiguous cases (e.g. borderline general-merchandise sites, keywords that are half brand-name half category) turn out wrong often enough in testing (step 1 of the verification plan below) to matter. Straightforward swap — one string in `relevanceFilter.ts`.

### 3. Scope / rollout order
- **A. Ship keyword filtering and competitor filtering together in one pass (recommended, and what's spec'd above).** Matches the original ask ("filtering the irrelevant competitors, keywords") and both use cases share the same helper/route, so there's little marginal cost to doing both at once.
- **B. Keyword filtering first, competitor filtering as a fast-follow.** Lower-risk if you'd rather verify the classifier's judgment quality on one surface (the already-built, currently-disabled "LangChain" toggle) before extending it to a second.
- **C. Competitor filtering first.** Arguably the bigger real gap today — keyword overlap already has a working regex filter as a fallback, while the competitor-candidates list has no relevance filtering at all beyond a numeric threshold, so marketplaces/platforms show up unfiltered right now.

### 4. Fallback behavior when the Anthropic call errors or times out
- **A. Fall back to showing everything unfiltered, with a visible inline error (recommended, and what's spec'd above).** Matches the transparency/no-silent-failure discipline already established everywhere else in this app (e.g. the FX-rate USD fallback, the live-SERP warning text) — never hide data because a call failed, always say so.
- **B. Fall back to the existing regex filter automatically.** Keeps *some* filtering active on failure rather than none, at the cost of silently swapping filter logic under the user without them choosing it — a real tradeoff against the "always visible, never silent" pattern this app has followed so far.

### 5. LangSmith tracing — new consideration, not in the original plan
`ecosystem-primer` is explicit that LangSmith should be set up "always... alongside any of" the three layers, for observability — this wasn't in scope before this round of research and is worth deciding on explicitly rather than silently adding or silently skipping.
- **A. Skip it (recommended for this scope, and what's spec'd above).** One Anthropic call per batch with a Zod-validated response is easy to debug from the API route's own response/error handling alone — the same level of observability every DataForSEO call in this app already gets (logged via the dev server, inspected with `curl`). Adding a third external account/dependency (`langsmith` package + `LANGSMITH_API_KEY`) for a single-call classifier is arguably more setup than the thing being observed.
- **B. Wire it up** — `npm install langsmith`, set `LANGSMITH_API_KEY` / `LANGSMITH_TRACING=true` / `LANGSMITH_PROJECT` (current env var names, confirmed live — older names from pre-1.0 docs no longer work). Worth it if judgment quality drifting over time is a real concern — gives a searchable history of every relevance call, the exact prompt, and the model's reasoning, without having to reproduce a bad judgment manually to debug it. Real value if this expands beyond the two use cases here.
