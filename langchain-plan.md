# LangChain-Based Relevance Filtering — Competitors & Keywords

**Status:** Planned, not yet implemented.
**Source:** research via `langchain-skills:ecosystem-primer`, `deep-agents-core`, `langchain-fundamentals`, `langchain-dependencies` — fetched live, not assumed from training data.

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

## Open question before implementing

Model choice (Haiku 4.5 default, recommended) and scope (build both keyword *and* competitor filtering in one pass, since both were explicitly requested) are decisions made in this plan, not yet confirmed with you. Flag if either should change before implementation starts.
