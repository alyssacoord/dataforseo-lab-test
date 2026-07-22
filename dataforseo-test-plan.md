# DataForSEO Endpoint Test Plan

**Purpose:** Step-by-step instructions to test every endpoint listed in `dataforseo-api-research.md`, using either the local test UI in `test-ui/` or plain curl.
**Credentials:** read from `.env` in this folder (`DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`) — already present.
**Verified:** all endpoint paths below were checked to genuinely exist against the live DataForSEO v3 docs. A few request bodies are best-effort (DataForSEO doesn't publish every field name identically across endpoints) — if a call 404s or returns a `40x` validation error, open the endpoint's page at https://docs.dataforseo.com/v3/ (search the left nav for the path) and copy its exact sample body into the editable field.

---

## 0. One-time setup

1. **Sandbox first, always.** `sandbox.dataforseo.com` mirrors every endpoint with dummy data at **zero cost** — validate schemas here before ever switching to Live. The test UI defaults to Sandbox; Live is behind an explicit toggle.
2. Install and start the local test UI:
   ```bash
   cd test-ui
   npm install
   npm start
   ```
   Then open **http://localhost:5177**.
3. The top bar shows whether credentials loaded from `../.env`. If it says "no credentials found," check `.env` has `DATAFORSEO_LOGIN=` and `DATAFORSEO_PASSWORD=` set.
4. Leave the **Sandbox/Live** toggle on Sandbox until you've confirmed a request shape works — Live calls cost real money (fractions of a cent each, but they add up across ~45 endpoints).

### Curl alternative (no UI)

```bash
LOGIN=$(grep DATAFORSEO_LOGIN .env | cut -d= -f2)
PASS=$(grep DATAFORSEO_PASSWORD .env | cut -d= -f2)
curl -s -X POST "https://sandbox.dataforseo.com/v3/dataforseo_labs/google/competitors_domain/live" \
  -u "$LOGIN:$PASS" \
  -H "Content-Type: application/json" \
  -d '[{"target":"coordclothing.co.uk","location_code":2826,"language_code":"en","limit":10}]'
```
Swap `sandbox.dataforseo.com` → `api.dataforseo.com` to go Live. Every endpoint below follows this same `curl -u login:pass -d '[{...}]' https://<host>/v3/<path>` shape (task-based endpoints are `POST` to `.../task_post` then `GET .../task_get/<task_id>`).

---

## 1. How to read the test UI

- **Sidebar** — every endpoint from the research doc, grouped by Tier → section. A dot next to each turns green (200 OK) or red (error) once you've run it, and persists across page reloads (localStorage) so you can track testing progress like a checklist.
- **Main panel** — method + path (editable, in case a path needs the `/advanced` or `/html` suffix corrected), a JSON body textarea pre-filled with a sample payload, and a **Run test** button.
- **Task ID field** — appears automatically for `task_get/{id}` endpoints; paste in the task id returned by the matching `task_post` call.
- **Response panel** — raw JSON back from DataForSEO, plus HTTP status and latency.

---

## 2. Suggested test order

Run these in order — each validates a core product claim before you widen scope.

1. **`T1-01` competitors_domain** — the onboarding "propose your competitive set" story. Use a real fashion domain (`coordclothing.co.uk` is pre-filled).
2. **`T1-04` / `T1-05`** Google Trends Apparel + demography — validates the trend-detection story (age/gender breakdown is the differentiator vs plain Google Trends).
3. **`T1-11` multi_target_metrics** — validates AI Visibility with a known brand set.
4. Then work through the rest of **Tier 1** (Search Visibility, Reviews), then **Tier 2**, then **Tier 3**.

---

## 3. Tier 1 — Core (test these first)

### Competitive-set auto-detection
| ID | Endpoint | What to check |
|---|---|---|
| T1-01 | `dataforseo_labs/google/competitors_domain/live` | Returns a ranked list of competing domains for the target. |
| T1-02 | `dataforseo_labs/google/keywords_for_site/live` | Returns keywords the domain ranks/could rank for. |
| T1-03 | `dataforseo_labs/google/domain_intersection/live` | Returns overlapping keywords between two domains. |

### Trend Detection
| ID | Endpoint | What to check |
|---|---|---|
| T1-04 | `keywords_data/google_trends/explore/live` | Momentum curve returned; confirm `category_code` for Apparel in the docs page and swap it into the body if the sample doesn't have one. |
| T1-05 | `keywords_data/dataforseo_trends/demography/live` | Response includes age-band × gender split. |
| T1-06 | `keywords_data/dataforseo_trends/explore/live` | DataForSEO's own trend index — compare shape to T1-04. |
| T1-07 | `keywords_data/dataforseo_trends/subregion_interests/live` | Regional (UK) interest breakdown. |
| T1-08 | `keywords_data/clickstream_data/dataforseo_search_volume/live` | Check whether the response indicates Bing-sourced or clickstream-sourced volume — confirmed this endpoint toggles via a `use_clickstream` param rather than always being pure clickstream. |
| T1-09 | `keywords_data/google_ads/search_volume/live` | Baseline volume/CPC. Try batching 3 keywords, then try up to 1,000 to confirm the batch cap. |
| T1-10 | `dataforseo_labs/google/historical_keyword_data/live` | Multi-year history. Confirmed 700-keyword cap per request — test near that limit if you plan to batch. |

### AI Visibility
| ID | Endpoint | What to check |
|---|---|---|
| T1-11 | `ai_optimization/llm_mentions/multi_target_metrics/live` | Head-to-head mention metrics across the 3 target brands. |
| T1-12 | `ai_optimization/llm_mentions/top_mentioned_brands/live` | Ranked brand list for a category keyword. |
| T1-13 | `ai_optimization/llm_mentions/timeseries_delta/live` | Change in mentions between two dates. |
| T1-14 | `ai_optimization/llm_mentions/timeseries_new_lost/live` | New/lost mentions per period. |
| T1-15 | `ai_optimization/llm_mentions/historical/live` | Historical baseline — data only goes back to Aug 2025, don't set `date_from` earlier. |
| T1-16a–d | `ai_optimization/{chat_gpt,claude,gemini,perplexity}/llm_responses/live` | Same prompt across all four models — compare which brands each recommends. |
| T1-17 | `ai_optimization/ai_keyword_data/keywords_search_volume/live` | **Caveat confirmed:** this is estimated from Google "People Also Ask" data, not a direct AI-assistant query log — read the response's methodology fields (if any) before treating it as ground truth. |
| T1-18 | `serp/google/ai_mode/live/advanced` | May return empty/error — Google AI Mode SERP is only live in select countries; note whether UK is covered. |
| T1-19a/b | `ai_optimization/llm_mentions/{target_metrics,top_mentioned_brands}_lite/live` | Confirmed these 2 lite variants exist; don't assume every mentions endpoint has one (most don't). |

### Search Visibility
| ID | Endpoint | What to check |
|---|---|---|
| T1-20 | `dataforseo_labs/google/ranked_keywords/live` | Keyword + position list for a competitor. |
| T1-21 | `dataforseo_labs/google/historical_rank_overview/live` | Visibility trend over time (from Oct 2020). |
| T1-22 | `dataforseo_labs/google/bulk_traffic_estimation/live` | Traffic estimate per domain, multiple domains in one call. |
| T1-23 | `dataforseo_labs/google/historical_bulk_traffic_estimation/live` | Same, historical. |
| T1-24 | `dataforseo_labs/google/serp_competitors/live` | Domains contesting a keyword set. |
| T1-25 | `dataforseo_labs/google/relevant_pages/live` | Which competitor pages rank/capture traffic. |

### Reviews (async — task_post then task_get)
| ID | Endpoint | What to check |
|---|---|---|
| T1-26a/b | `merchant/google/reviews/task_post` → `task_get/{id}` | Needs a real Google product `gid` — grab one from a T2-11 `merchant/google/products` result first, then paste it in. |
| T1-27a/b | `business_data/trustpilot/search/task_post` → `task_get/{id}` | This is a business **lookup**, not review text — confirms the doc's "search" label is a discovery step, not the review stream itself. |
| T1-28a/b | `business_data/trustpilot/reviews/task_post` → `task_get/{id}` | The actual review text/ratings, keyed on `domain`. |

> Task-based calls: run the `task_post`, copy the `id` from the response's `tasks[0].id` field, paste it into the **Task ID** field on the matching `task_get` row, then run that.

---

## 4. Tier 2 — Strong adds

| ID | Endpoint | What to check |
|---|---|---|
| T2-01 | `serp/google/ads_search/live/advanced` | **Caveat confirmed:** pulls from the Ads Transparency Center archive (historical ad records), not ads currently being served on live SERPs — factor this into the "seasonal campaign" framing. |
| T2-02 | `serp/google/ads_advertisers/live/advanced` | Advertiser list for a domain/keyword. |
| T2-03 | `serp/google/autocomplete/live/advanced` | Autocomplete suggestions — early-warning query phrasing. |
| T2-04 | `content_analysis/sentiment_analysis/live` | Sentiment score for brand mentions across the web. |
| T2-05 | `content_analysis/phrase_trends/live` | Mention-volume-over-time for a phrase/brand. |
| T2-06 | `serp/google/news/live/advanced` | News SERP for press monitoring. |
| T2-07 | `serp/youtube/organic/live/advanced` | Video search results for haul/review content. |
| T2-08 | `serp/youtube/video_info/live/advanced` | Needs a real `video_id` — pull one from T2-07's results first. |
| T2-09 | `serp/youtube/video_comments/live/advanced` | Needs the same `video_id`. |
| T2-10 | `business_data/social_media/pinterest/live` | **Caveat confirmed:** needs URLs you already have; it doesn't discover competitor product URLs on its own. |
| T2-11 | `merchant/google/products/live/advanced` | Google Shopping price comparison. |
| T2-12 | `merchant/google/product_info/live/advanced` | Needs a `gid` from T2-11's results. |
| T2-13 | `merchant/amazon/products/task_post` | Verify on the docs page whether this is actually `task_post` or has a `live` variant — the research doc didn't specify. |
| T2-14 | `merchant/amazon/asin/task_post` | Needs a real ASIN. |
| T2-15 | `merchant/amazon/sellers/task_post` | Needs a real ASIN. |
| T2-16 | `serp/google/images/live/advanced` | Visual SERP for a trend query. |

---

## 5. Tier 3 — Situational / later

| ID | Endpoint | What to check |
|---|---|---|
| T3-01 | `dataforseo_labs/amazon/ranked_keywords/live` | Needs a real ASIN — only relevant if a competitor sells on Amazon. |
| T3-02 | `dataforseo_labs/amazon/product_competitors/live` | Same. |
| T3-03 | `dataforseo_labs/amazon/bulk_search_volume/live` | Amazon-side search volume for a keyword list. |
| T3-04 | `domain_analytics/technologies/domain_technologies/live` | Tech stack detected for a domain. |
| T3-05 | `domain_analytics/technologies/domains_by_technology/live` | Reverse lookup — every domain using a given tech. |
| T3-06 | `app_data/apple/app_reviews/task_post` | Needs a real Apple App Store app id. |
| T3-07 | `app_data/google/app_reviews/task_post` | Needs a real Android package/app id. |

`databases/*` (bulk on-prem-style dumps) is intentionally **not** in the test UI — it's a one-time-purchase/scheduled-drop product (delivered to S3/BigQuery/SFTP, not literally on-prem), not something you smoke-test with a single call. Evaluate it directly via sales/pricing conversation if Tier 1/2 usage grows large enough to justify it.

---

## 6. What "done" looks like

- Every Tier 1 row shows a green dot in the sidebar, tested against Sandbox.
- For the 3–4 highest-value endpoints (`competitors_domain`, `dataforseo_trends/demography`, `multi_target_metrics`), re-run once against **Live** with a real Coord/competitor domain to confirm production data quality before wiring anything into the app.
- Any endpoint whose sample body 404s or returns a field-validation error: fix the body from the actual docs page and note the corrected shape here (or in the endpoints config) so the next person doesn't repeat the trial-and-error.
