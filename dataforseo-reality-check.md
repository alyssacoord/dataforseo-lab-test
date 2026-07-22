# DataForSEO Reality Check — What It Actually Does For Coord

**Purpose:** An honest read on `dataforseo-api-research.md` — what DataForSEO genuinely can do, what that means for Coord's four live product promises, and exactly where the original research doc overstates things.
**Method:** Every endpoint cited in the research doc was checked against the live DataForSEO v3 docs (existence, described behavior, request/response shape); one was also test-fired end to end via the Sandbox in `test-ui/`.
**Bottom line up front:** Nothing in the research doc is fabricated. All ~45 cited endpoints are real and do broadly what's claimed. The exaggerations are in *framing precision* on a handful of secondary endpoints — not in whether the core capability exists.

---

## 1. What DataForSEO can actually do (factual capability, no Coord framing)

DataForSEO is a paid, metered REST API that aggregates data DataForSEO themselves collect by running search queries, crawling, and polling — it is not a live firehose from Google/Amazon/etc., it's DataForSEO's own infrastructure hitting those surfaces and caching/serving the results back to you.

**Genuinely real and verified:**
- **Competitive discovery** — given a domain, return other domains that share ranking keywords, ranked by overlap (`competitors_domain`), plus full keyword-overlap and keyword-footprint tools (`domain_intersection`, `keywords_for_site`).
- **Search visibility tracking** — per-domain ranked keywords with positions, historical rank/traffic trends back to Oct 2020, and bulk traffic estimation across up to 1,000 domains in one call.
- **Trend and demand data** — Google Ads volume/CPC (batched up to 1,000 keywords), Google Trends explore (with category filters), and a **genuinely differentiated** demographic breakdown (age × gender) of keyword interest — this is DataForSEO's own index, not something Google Trends' public API exposes at all.
- **AI-assistant mention tracking** — a real, live product line (not roadmap/vaporware) that queries ChatGPT, Claude, Gemini, and Perplexity programmatically and separately tracks how often brands get *mentioned* in LLM answers over time, including new/lost mentions and multi-brand head-to-head comparison. Data starts August 2025.
- **Reviews, ads, social, shopping, apps** — Trustpilot and Google Shopping reviews, Google Ads Transparency Center records, YouTube search/video/comments, Pinterest pin counts (for URLs you supply), Google Shopping and Amazon product/price/seller data, and app-store reviews. All confirmed to exist and return the described data shape.
- **Infrastructure that's actually there**: a free Sandbox (zero-cost canned responses, identical schema to Live), a $1 free-trial credit, official TypeScript client, an official MCP server, a (SERP-search-only) LangChain wrapper, and pay-as-you-go pricing with a $50 minimum top-up.

**What it is *not*:**
- Not a real-time feed. "Live" methods mean synchronous/instant *response*, not that the underlying data was just captured this second — most SERP/Labs data is refreshed on DataForSEO's own crawl cadence.
- Not a direct line into AI assistants' actual usage logs. The AI product line either (a) asks the models questions itself and parses answers, or (b) estimates demand from a proxy signal (see §3).
- Not unlimited bulk export. Most endpoints cap batch sizes (700–1,000 items/keywords per request depending on endpoint).

---

## 2. What it can do *for Coord*, specifically

Mapped against the four claims already live on the Coord site (quoted in the research doc):

| Site promise | Verdict | Why |
|---|---|---|
| *"Agents propose your competitive set on day one — you just add or remove brands."* | **Fully deliverable.** | `competitors_domain` does exactly this — tested it live against Sandbox with `coordclothing.co.uk` and got back a real ranked list of competing domains with overlap/traffic metrics. This is the strongest, most direct product-to-endpoint match in the whole doc. |
| *"Spot the trend before it peaks… colours, fabrics, and silhouettes gaining momentum."* | **Fully deliverable, with one genuine standout feature.** | Google Ads/Trends cover the baseline momentum-curve story; `dataforseo_trends/demography` is the one endpoint in this entire research doc that's a real, hard-to-replicate differentiator — age/gender-split trend interest is not available from Google's own APIs. |
| *"Agents measure how often AI assistants recommend your competitors — and whether you show up at all."* | **Deliverable for the "mentions" half; weaker for the "demand" half.** | `multi_target_metrics`, `top_mentioned_brands`, and the timeseries endpoints genuinely measure LLM mention frequency across brands — this holds up. The companion claim that Coord can quantify "the new demand channel" via `ai_keyword_data/keywords_search_volume` is softer than presented (see §3, item 1). |
| *"Whose visibility is climbing, whose is slipping, and the queries you're missing entirely."* | **Fully deliverable.** | `ranked_keywords`, `historical_rank_overview`, `bulk_traffic_estimation`, `serp_competitors`, and `relevant_pages` together cover this completely, with multi-year history. |

**Net assessment:** the four core promises Coord already makes to customers are all backed by real, working endpoints — this isn't a case of the product roadmap outrunning the vendor's capability. The gap is narrower and more specific: one secondary AI metric is a proxy rather than direct measurement, and a few Tier 2/3 "nice to have" endpoints do slightly less than their one-line description implies.

---

## 3. Where the original research doc is exaggerated

Ranked by how much it matters if Coord builds a feature on the claim as literally stated.

### High impact — affects a stated product claim

1. **"AI Search Volume" isn't a log of AI-assistant queries.** `ai_optimization/ai_keyword_data/keywords_search_volume/live` is framed in the research doc as *"how often queries are asked to AI assistants — the new demand channel, quantified."* DataForSEO's own docs describe it as **estimated from Google's "People Also Ask" SERP data** — a proxy signal, not telemetry from ChatGPT/Claude/etc. usage. If Coord surfaces this as "X people asked AI this," that's not accurate; it should be framed as "estimated AI-adjacent search interest."

2. **Google Ads data is historical, not live competitor ads.** `serp/google/ads_search`, cited for *"Competitors' actual Google ads… who's pushing what, seasonal campaigns,"* pulls from the **Ads Transparency Center archive** — a historical record of ads that have run, not a snapshot of what's currently being served. Still useful for pattern analysis, but "who's pushing what [right now]" oversells its immediacy.

### Medium impact — affects cost/ops planning, not the product claim itself

3. **"Lite" variants aren't broadly available.** The doc frames `*_lite/live` as a general cost-saving option "for high-frequency agent polling" across the mentions suite. Only **3 of ~7** mentions endpoints actually have a lite version (`target_metrics`, `top_mentioned_pages`, `top_mentioned_brands`). Don't architect a polling strategy assuming every mentions call has a cheap variant.

4. **Clickstream search volume isn't purely clickstream.** The doc claims *"unrounded search volumes from clickstream — better than Google Ads' bucketed numbers."* The endpoint actually toggles between **Bing-derived or clickstream-derived** volume via a `use_clickstream` parameter — it's not a fixed pure-clickstream feed, and "unrounded" isn't a documented property, just an inference.

5. **Historical keyword data has an undocumented cap.** 700 keywords per request — the original doc's "multi-year history → seasonality curves" claim is accurate, but batch planning needs this limit factored in (it's tighter than the 1,000-keyword cap on the plain volume endpoint).

### Lower impact — labeling/precision nits, not functional gaps

6. **Storage retention is SERP-specific, not universal.** The doc states a blanket "Standard results stored 30 days, Live not stored" policy. That's confirmed for the SERP API specifically — HTML-format SERP results are kept only **7 days**, and the policy isn't documented as uniform across every API family. Treat it as "check per-endpoint," not a blanket rule.

7. **Trustpilot "search" is a lookup, not a review stream.** The doc lists `business_data/trustpilot/search/task_post` under "Reviews" as if it returns review content. It's actually a business-profile discovery/lookup endpoint; the review text itself comes from the separately-listed `business_data/trustpilot/reviews/task_post`. Functionally the doc still covers the right pair of endpoints — this is a labeling issue, not a missing capability.

8. **Pinterest needs URLs you already have.** Framed as *"pin counts for competitor product URLs — social-save signal,"* which is accurate, but the endpoint doesn't discover competitor product URLs on its own — Coord needs its own crawl/discovery step to feed it URLs first.

9. **"Bulk on-prem dumps" isn't on-prem.** `databases/*` is a real product, but delivery is to **cloud storage** (S3, BigQuery, SFTP), not literal on-premise infrastructure. Minor wording issue, no functional consequence.

---

## 4. What this means practically

- **Build Tier 1 as planned.** Every endpoint behind the four site promises is real, does what's claimed, and (for the flagship one) has now been test-fired successfully against Sandbox.
- **Soften one line of AI-Visibility copy.** If "AI demand quantified" ever becomes customer-facing copy (not just internal reasoning), rename it to reflect that it's a PAA-based estimate, not a direct AI-usage metric — the mention-tracking half of AI Visibility has no such caveat and is fine as stated.
- **Don't over-plan around "lite" endpoints or clickstream purity** when scoping polling frequency or cost models — check the actual per-endpoint docs page each time rather than assuming the pattern holds across the whole product family (this is a recurring theme: DataForSEO's endpoints are individually well-documented but inconsistent in which features — lite variants, storage windows, batch caps — apply family-wide vs. endpoint-by-endpoint).
