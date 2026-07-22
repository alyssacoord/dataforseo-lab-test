# DataForSEO API Research for Coord

**Purpose:** Which DataForSEO v3 APIs Coord should research, test, and use for fashion competitive & market intelligence.
**Source:** https://docs.dataforseo.com/v3/ (full docs tree reviewed)
**Date:** 22 July 2026

---

## How to read this

- **Tier 1** — powers claims already on the Coord website. Wire these first.
- **Tier 2** — strong additions once Tier 1 is live.
- **Tier 3** — situational; revisit later.
- ⭐ = directly powers an existing product promise on the site.

Endpoint paths are relative to `https://api.dataforseo.com/v3/`.

---

## Tier 1 — Core

### 1. Competitive-set auto-detection
> Powers: *"Agents propose your competitive set on day one — you just add or remove brands."*

| Endpoint | What it gives Coord |
|---|---|
| `dataforseo_labs/google/competitors_domain/live` ⭐ | Feed a brand's domain → ranked list of competing domains. This IS the onboarding magic moment. |
| `dataforseo_labs/google/keywords_for_site/live` | Every keyword a domain ranks for → understand a new customer's category footprint. |
| `dataforseo_labs/google/domain_intersection/live` | Keyword overlap between customer and rival — quantifies "how much do we actually compete". |

### 2. Trend Detection
> Powers: *"Spot the trend before it peaks… colours, fabrics, and silhouettes gaining momentum."*

| Endpoint | What it gives Coord |
|---|---|
| `keywords_data/google_trends/explore/live` | Momentum curves; supports the **Apparel category filter**. |
| `keywords_data/dataforseo_trends/demography/live` ⭐ | Trend interest **by age and gender** — gold for fashion; Google Trends can't do this. |
| `keywords_data/dataforseo_trends/explore/live` | DataForSEO's own trends index (alternative/confirmation signal). |
| `keywords_data/dataforseo_trends/subregion_interests/live` | Regional splits (e.g. UK regions). |
| `keywords_data/clickstream_data/dataforseo_search_volume/live` | **Unrounded** search volumes from clickstream — better than Google Ads' bucketed numbers. |
| `keywords_data/google_ads/search_volume/live` | Baseline volume/CPC workhorse. Cheap; batches ~1,000 keywords per request. |
| `dataforseo_labs/google/historical_keyword_data/live` | Multi-year history → seasonality curves per trend. |

### 3. AI Visibility
> Powers: *"Agents measure how often AI assistants recommend your competitors — and whether you show up at all."*
> Note: this suite is much deeper than DataForSEO's marketing site suggests.

| Endpoint | What it gives Coord |
|---|---|
| `ai_optimization/llm_mentions/multi_target_metrics/live` ⭐ | Compare **multiple brands'** mention rates in LLM answers head-to-head. Literally the AI Visibility feature. |
| `ai_optimization/llm_mentions/top_mentioned_brands/live` | Which brands dominate a category in AI answers. |
| `ai_optimization/llm_mentions/timeseries_delta/live` | AI visibility change over time → "you're being displaced in ChatGPT" alerts. |
| `ai_optimization/llm_mentions/timeseries_new_lost/live` | New & lost mentions per period. |
| `ai_optimization/llm_mentions/historical/live` | Historical baseline. |
| `ai_optimization/chat_gpt/llm_responses/live` (also `claude`, `gemini`, `perplexity`) | Ask each model e.g. "best gym leggings under £60" programmatically; parse who gets recommended. |
| `ai_optimization/ai_keyword_data/keywords_search_volume/live` | How often queries are asked **to AI assistants** — the new demand channel, quantified. |
| `serp/google/ai_mode/*` | Google's AI Mode SERP — the fourth AI surface. |
| `ai_optimization/llm_mentions/*_lite/live` | Cheaper "lite" variants of the mentions endpoints — good for high-frequency agent polling. |

### 4. Search Visibility
> Powers: *"Whose visibility is climbing, whose is slipping, and the queries you're missing entirely."*

| Endpoint | What it gives Coord |
|---|---|
| `dataforseo_labs/google/ranked_keywords/live` | Every keyword a competitor ranks for, with positions. |
| `dataforseo_labs/google/historical_rank_overview/live` | Visibility climbing/slipping over time. |
| `dataforseo_labs/google/bulk_traffic_estimation/live` | Estimated organic traffic per competitor domain. |
| `dataforseo_labs/google/historical_bulk_traffic_estimation/live` | The same, historically. |
| `dataforseo_labs/google/serp_competitors/live` | Who contests a specific set of queries. |
| `dataforseo_labs/google/relevant_pages/live` | Which competitor pages capture the demand. |

### 5. Reviews (API-side complement to Coord's own on-site review scraping)

| Endpoint | What it gives Coord |
|---|---|
| `merchant/google/reviews/task_post` | Product-level Google Shopping reviews. |
| `business_data/trustpilot/search/task_post` + `reviews/task_post` | Brand-level Trustpilot review streams. |

---

## Tier 2 — Strong adds

| Endpoint | Use case |
|---|---|
| `serp/google/ads_search` + `ads_advertisers` | **Competitors' actual Google ads** — promo intelligence sleeper: who's pushing what, seasonal campaigns. Feeds the Price & Promo pillar. |
| `serp/google/autocomplete` | Emerging query phrasings ("barrel jeans **petite**") before they register volume. Cheap early-warning. |
| `content_analysis/sentiment_analysis/live` | Brand mention sentiment across the web. |
| `content_analysis/phrase_trends/live` | Mention volume of a phrase/brand over time. |
| `serp/google/news` | Fashion-press monitoring (Press & Buzz tab). |
| `serp/youtube/organic` + `video_info` + `video_comments` | Haul/review videos and their comment sentiment. |
| `business_data/social_media/pinterest/live` | Pin counts for competitor product URLs — social-save signal from *the* fashion discovery platform. |
| `merchant/google/products` + `product_info` | Google Shopping price comparison across sellers. |
| `merchant/amazon/products` + `asin` + `sellers` | Amazon products, variant trees (ASIN), seller offers. |
| `serp/google/images` | Visual SERP for trend queries — pairs with Coord's CV models. |

---

## Tier 3 — Situational / later

| Endpoint | Use case |
|---|---|
| `dataforseo_labs/amazon/*` (ranked keywords, product competitors, bulk search volume) | Only for competitors with meaningful Amazon presence. |
| `domain_analytics/technologies/domain_technologies/live` | Competitor tech stacks (Shopify, Klaviyo…). |
| `domain_analytics/technologies/domains_by_technology/live` | Find every Shopify fashion store — useful for **Coord's own lead-gen**. |
| `app_data/{apple,google}/app_reviews` | Reviews of competitors' mobile apps (ASOS app, Vinted…). |
| `databases/*` | Bulk on-prem dumps — only when per-call costs bite at scale. |

---

## Skip entirely

Backlinks API · OnPage/Lighthouse (own-site SEO tooling) · Google My Business / Hotels / Tripadvisor (local & travel) · Finance / Jobs / Events / Dataset SERPs · Baidu / Naver / Seznam / Yahoo (unless expanding to those markets).

---

## Implementation & testing notes

1. **Sandbox first.** `sandbox.dataforseo.com` mirrors the API with canned responses, free — validate schemas before spending. A free trial also exists.
2. **Live vs Standard methods.**
   - *Standard* = queued (`task_post` → `task_get`), cheapest, supports **webhooks/pingbacks** → ideal for overnight agent sweeps.
   - *Live* = instant, pricier → use for flash-alert checks and interactive queries.
3. **Native tooling for the agent stack:** official **TypeScript client** (Coord is Next.js), an **MCP server**, and a **LangChain wrapper** — agents can call DataForSEO as a first-class tool.
4. **Batching:** volume endpoints accept ~1,000 keywords per request — batch aggressively to control cost.
5. **Pricing model:** pure pay-as-you-go, $50 minimum top-up; most calls cost fractions of a cent. Per-endpoint prices: https://dataforseo.com/pricing
6. **Result storage:** Standard-method results are stored 30 days; Live results are not stored — persist everything into Coord's own store on receipt.

## Suggested test order

1. `competitors_domain` with a few real fashion domains — validates the onboarding story cheapest.
2. Google Trends Apparel + `dataforseo_trends/demography` — validates the trend-detection story.
3. LLM Mentions multi-target on a known brand set — validates AI Visibility.
4. Then widen to search visibility, reviews, and Tier 2.
