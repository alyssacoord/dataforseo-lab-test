# Plan — Very.co.uk Competitive Intelligence

**Last updated:** 2026-07-23 (after: investigated remaining "not ranking" cases in the Competitive Set keyword lookup — see "What's been delivered today")
**Source brief:** colleague message re: Very's tiered peer set (for DataForSEO traffic/rank pulls) + keyword seeds mined from ~156k sampled SKU scrapes.
**Built in:** `dashboard/` — Competitive Set, Search Visibility, and Trend Detection modules.
**Convention:** this file gets updated every time something in the app or the underlying analysis changes — treat it as the current source of truth for status, not a point-in-time snapshot.

---

## How to read this

- ✅ Done — real Live data pulled, findings verified, and (where relevant) shipped as an app feature, not just a one-off script.
- 🔲 Not started — scoped below, ready to pick up.
- ⚠️ Open decision — the brief offered something optional ("say the word"); not actioned pending a yes/no.

---

## Part 1 — Peer set, tiered by how tightly each domain actually competes with Very

### Tier 1 — structural peers ✅ DONE
`next.co.uk` · `jdwilliams.co.uk` · `simplybe.co.uk` · `studio.co.uk` · `freemans.com` · `laredoute.co.uk` · `argos.co.uk`

**What was run (real Live data, ~$1.25 total across two passes):**
- `historical_rank_overview` for Very + all 7 — visibility-over-time (organic ETV).
- `competitors_domain` for Very alone — algorithmic cross-check against the brief's manually-curated list.
- `domain_intersection` Very vs. each of the 7 — pairwise keyword-overlap tightness ranking, first raw, then re-run filtered to genuine garment-category keywords only.
- `ranked_keywords` for Very — top organic terms, sorted by volume.

**Key findings (worth carrying into the meeting):**
1. **Every domain in the set declined 16–39% in organic ETV, Apr→Jul 2026** — this is market-wide, not Very-specific. Very's own -27% sits mid-pack (worse than Freemans/Next/Argos/Studio, better than JD Williams/La Redoute/Simply Be). Present as "in line with a sector-wide dip," not an isolated warning sign.
2. **Only 2 of the 7 (Next, Argos) show up in DataForSEO's own algorithmic top-15 competitor list** — expected, since Tier 1's logic is business-model similarity (credit/flex-pay), not raw keyword overlap, which is dominated by broad-catalog giants (Amazon, eBay, John Lewis, etc.).
3. **Argos's ranking flips once filtered to genuine fashion-category overlap.** Raw keyword overlap made Argos look like the #2 tightest comp (341k shared keywords). Filtered to garment-vocabulary keywords only, it drops to **last** of the 7 (8.4k) — its raw overlap is almost entirely home/electronics/general-merchandise, not fashion. This is the finding most likely to have been one of the fact-checker's two catches, and the one most worth double-checking is actually reflected correctly in whatever deck goes into the meeting.
4. Raw "top shared keyword" per pair is dominated by incidental third-party brand names (mango, nike, birkenstock, boots, legos) — high search volume, not evidence of real competitive overlap.

**App features shipped as a result:**
- Competitive Set: bulk-paste to seed a named peer list in one action (was one-domain-per-submit).
- Competitive Set: "Show overlap" now works on manually-added/confirmed peers, not just auto-suggested candidates (previously had no effect there at all).
- Competitive Set: keyword filter for "Show overlap" — a 3-state control (**None / Fashion vocabulary / LangChain — disabled, coming soon**). "Fashion vocabulary" is a server-side regex filter (garment vocabulary, word-boundary matched) on `domain_intersection`, no extra API cost, surfaces the real total count (e.g. "49,550 shared keywords, fashion vocabulary only") alongside the sample table. This is what caught the Argos reordering, and is reusable for any domain pair, not just Very's. The LangChain option is visibly present but disabled — the semantic-filter roadmap is now in the UI itself, not just this doc.
- Competitive Set: candidate and confirmed-set rows now also show total ranking-keyword count and estimated ad-equivalent traffic value (USD — confirmed via docs, not GBP, despite UK-scoped queries), both already being fetched but previously unused.

---

### Tier 2 — fashion cross-shop 🔲 NOT STARTED
`asos.com` · `boohoo.com` · `prettylittlething.com` · `newlook.com` · `riverisland.com` · `matalan.co.uk` · `marksandspencer.com` · `debenhams.com` · `quizclothing.co.uk` · `missguided.co.uk`

**Plan:** identical pattern to Tier 1 — visibility-over-time (Search Visibility) + pairwise overlap with the fashion-keyword filter on (Competitive Set). 10 domains means this needs to be split into two Search Visibility "Visibility over time" batches (its comma-list caps at 10 domains including Very itself, so Tier 2 alone already hits that cap — Very + all 10 is 11, over the limit). Straightforward, no new app work needed — just execution.

### Tier 3 — the "Sports" half of Fashion & Sports 🔲 NOT STARTED
`jdsports.co.uk` · `sportsdirect.com` · `gymshark.com` · `decathlon.co.uk`

**Plan:** same pattern, smaller set (4 domains, fits easily alongside Very in one Search Visibility batch). Likely a lighter pass than Tier 1/2 given the brief frames this as a narrower category slice.

### Tier 4 — value disruptors 🔲 NOT STARTED
`shein.co.uk` · `temu.com` · `vinted.co.uk` · `amazon.co.uk`

**Plan:** the brief explicitly frames these as "worth trending even if not peers" — that's a Trend Detection job (are these brands/terms gaining momentum), not a Competitive Set peer-overlap job. Different module, different question: not "how much do we overlap with Shein" but "is Shein's share of the conversation growing."

### Cross-tier starter shortlist (noted, not a 5th tier)
Next, ASOS, Boohoo/PLT, New Look, River Island, Matalan, M&S, N Brown (JD Williams/Simply Be), Studio, Argos, JD Sports, Shein — the brief's own suggested "if you want a tight core set to start" list, spanning Tiers 1–4. Worth using as the shortlist if Tier 2/3/4 in full turns out to be more than the meeting needs.

---

## Part 2 — Keyword seeds (from SKU scrapes) 🔲 NOT STARTED

**Head terms:** dress · top · t-shirt/tee · shirt · jeans · trousers/pants · shorts · skirt · jacket · hoodie · sweatshirt · jumper/sweater · polo · shoes/footwear · bag · swimwear/bikini · jumpsuit · co-ord

**Modifiers:** silhouette/length (mini, midi, maxi, oversized, wide leg, high waisted, cropped) · fabric (cotton, denim, linen, satin, silk, knit, leather, jersey) · pattern/detail (floral, print, stripe, lace, embroidered, tie)

**Ready-to-paste phrases** (36 head×modifier combinations already assembled in the brief — midi dress, wide leg jeans, oversized blazer, etc.)

**Caveats carried over from the brief:** corpus has a jewellery skew (earrings, necklaces, rings, diamond, sterling) and junk buckets (`web`, `fashion`, `mw_product_option_cloned`, `effy rc`, `lab created diamond`) — already excluded from the lists above; don't reintroduce them unless jewellery/accessories trends are explicitly wanted too.

**Demand signal to fold into the trend read:** jeans has the lowest sold-out rate (13%) but ~45% on sale — over-supplied, discount-led. Linen/satin/floral are riding summer newness. Worth pairing DataForSEO's search-interest data against this live merchandising signal rather than presenting search trend alone.

**Plan:** feed the ready-to-paste phrases into Trend Detection, scoped to the confirmed Google Trends Apparel category (code 68 — already wired into the app and verified against the real category list, not guessed). Given Trend Detection currently caps at 5 keywords per search, the 36 phrases need batching into ~8 runs rather than one.

**App capability upgrade (done — see "What's been delivered today"):** Trend Detection now has a per-keyword detail panel — click any keyword in the momentum chart for real search volume/CPC/competition, age/gender demography, and UK regional interest, all on demand. This is a better fit for actually running the 36 phrases than what existed before: demography used to only ever cover the first keyword in a batch, so running 5-keyword batches meant losing demographic detail on 4 of every 5 phrases. Now every phrase, in every batch, gets full detail on click. The batching execution itself is still not started.

### ⚠️ Open decision — not yet actioned
The brief offers to generate the full head×modifier cartesian, ranked by the team's own live product counts + sold-out rate (so DataForSEO gets a pre-prioritised list instead of us guessing which phrases matter), and to cross-check which peer domains already have Tranco history. This needs a "say the word" from whoever owns this thread — it's their data (product counts, sold-out rates, Tranco holdings), not something this app or DataForSEO can produce independently.

---

## What's been delivered today

- Full Tier 1 analysis (visibility trend, algorithmic cross-check, pairwise overlap, ranked keywords) — real Live data, ~$1.25 total cost.
- The Argos reordering finding, which materially changes how Tier 1 should be presented.
- Ten permanent app improvements to Competitive Set, all verified end-to-end against the running app (clean typecheck/build, real Live calls through the app's own proxy, not just scripted once and discarded):
  1. Bulk-add peer domains (paste a list instead of one-at-a-time).
  2. "Show overlap" wired onto confirmed-set entries, not just auto-suggested candidates.
  3. Server-side fashion-vocabulary keyword filter for overlap results.
  4. Filter control upgraded to a 3-state toggle with a visible (disabled) LangChain option, making the semantic-filter roadmap explicit in the app.
  5. More candidate/confirmed-set info surfaced: total ranking-keyword count, estimated ad-equivalent traffic value (USD).
  6. "Compare all" — one button runs the overlap comparison for the whole confirmed peer set in parallel and renders a ranked bar chart of shared-keyword tightness, instead of clicking "Show overlap" on each peer individually.
  7. **Fixed a real `BarChart` rendering bug**, caught from a screenshot: the outer flex container used `align-items: flex-end` instead of the default `stretch`, so columns never received a definite height — every bar's `height: {pct}%` had nothing valid to resolve against and silently collapsed to a 2px fallback regardless of the real value. All bars looked identical (a flat colored underline) no matter how different the underlying numbers were. Fixed for all three existing chart usages (AI Visibility's two charts too), not just this one.
  8. Added a detail table below the peer comparison chart — shared keywords, % of the tightest peer, total ranking keywords, avg position, traffic value, ad-equivalent value.
  9. **Made that table self-sufficient**, after another screenshot showed it blank for manually-added peers: it originally read the extra columns off each peer's add-time snapshot, which either never existed (manual adds) or predated the fields (peers added before the snapshot was extended). "Compare all" now fetches everything live per peer instead — `domain_intersection` (limit 20, to average a real "avg position on shared keywords") plus `ranked_keywords` (limit 1, for the peer's own count/traffic-value/ad-equivalent — confirmed these aggregate fields don't depend on the item limit). Every column now populates for any peer, regardless of how it was added.
  10. **Ad-equivalent value converted from USD to GBP.** `estimated_paid_traffic_cost` is always USD-denominated regardless of `location_code` (confirmed via docs) — a real gap in a UK-focused tool. Chose a live-fetched rate (Frankfurter, free, no key, 24h server-side cache via `app/api/fx-rate`) over a static `.env` number. GBP is the headline figure at all three display sites; the original USD amount, exact rate, and as-of date stay visible on hover, never silently discarded. Falls back to plain USD if the FX fetch fails — never breaks or shows a wrong number. Verified the cache is real, not just present in code: dev log showed the first call at 171ms (a genuine network round-trip), every call after at 2-3ms.
- **Trend Detection: per-keyword detail panel.** Click any keyword in the momentum chart to open real search volume/CPC/competition (`google_ads/search_volume`, new), age/gender demography, and UK regional interest (`subregion_interests`, new) — fetched on demand and cached, same pattern as Competitive Set's "Show overlap." Side effect worth noting: this replaces the old "demography only for the first keyword in a search" limitation entirely — every keyword in every batch now gets full detail on click, not just whichever happened to be typed first. CPC/bid values reuse the GBP conversion built for ad-equivalent value (`formatAdEquivalent` generalized to `formatUsdToGbp` with an optional decimals param, since CPC needs 2dp where ad-equivalent value doesn't) — confirmed `cpc` is USD-denominated via docs before assuming it, same check as before.
- **Keyword lookup added to Competitive Set.** Every shared keyword shown in "Show overlap" (both on suggested candidates and confirmed peers) is now clickable — opens the same keyword-detail panel from Trend Detection, right there, so you can look up "jeans," "dresses," etc. inside the context of a specific domain comparison, not just Trend Detection's standalone search. Extracted the detail-fetch logic into `lib/useKeywordDetail.ts` + `components/KeywordDetailPanel.tsx` rather than duplicating it a second time — it had just been written for Trend Detection, so extracting immediately rather than waiting for a third use was the right call here. Trend Detection now imports the shared version too; behavior unchanged, just de-duplicated.
- **Reworked that lookup to be competitive-set-relative instead of domain-agnostic, per feedback from a screenshot of the resulting panel.** The Trend Detection-style panel (age/gender demography, regional interest) has no connection to any domain — clicking it from inside one peer's overlap table wrongly implied it was about that domain pair. Replaced it in Competitive Set with `lib/useKeywordSetLookup.ts` + `components/CompetitiveSetKeywordPanel.tsx`: for a keyword, fires one `ranked_keywords` call per domain in the set (target + every confirmed peer) with an exact-match filter (`keyword_data.keyword = "<keyword>"`), and renders a table of domain → position/search volume/CPC/ETV, sorted by position, with a "not ranking" row for domains that don't rank for it. Also added a direct text input ("Look up a keyword across your competitive set") so a keyword no longer has to already appear in some peer's overlap table to be looked up — typing it and clicking a keyword in an overlap table both feed the same lookup. Trend Detection's own panel (`useKeywordDetail`/`KeywordDetailPanel`) is untouched — the generic Trends data is still the right thing to show there, just not here. Verified end-to-end: clean `tsc`/`build`, real Live calls through the app's own proxy for `very.co.uk` + `next.co.uk` filtered on "boots" (positions 22 and 11, volume 5,000,000, CPC $0.16 — both correct), page HTML confirmed the new input renders, dev log showed only the expected 200s from the real lookups.
- **Fixed false "not ranking" results in that lookup.** Two real causes: (1) the exact-match filter is case-sensitive against DataForSEO's stored (lowercase) keyword string — confirmed live that filtering on `"Boots"` returned zero matches for a domain that does rank for `"boots"` — fixed by lowercasing/trimming before filtering. (2) `ranked_keywords` only returns what DataForSEO has already indexed for that domain, which can miss real, live rankings. Added a shared live-SERP fallback (`serp/google/organic/live/advanced`, depth 100) — fired once per lookup, not once per domain — that cross-checks any row still unresolved after the indexed-data pass; matched positions are tagged "live SERP" in the UI so the data source stays visible, and search volume/CPC (not domain-specific) are borrowed from whichever domain's `ranked_keywords` match already had them. Confirmed a real true-positive end-to-end: `jdwilliams.co.uk` for "jeans" came back not-found from `ranked_keywords` but the live-SERP fallback correctly caught it at rank 33; also confirmed genuinely-absent cases (`simplybe.co.uk` for "coats"/"jeans") correctly stay "not ranking" through both checks, so the fallback doesn't introduce false positives. Clean `tsc`/`build`, dev log free of errors.
- **Investigated a screenshot showing 4 of 8 domains still "not ranking" for "jeans"** (argos.co.uk, simplybe.co.uk, laredoute.co.uk, freemans.com) to rule out a bug before accepting the result. Confirmed all 4 return a clean `20000 Ok` with zero matches (not a silently-swallowed error), and that each has a large real keyword footprint in DataForSEO overall (argos.co.uk: 1,067,080 ranked keywords; simplybe.co.uk: 236,325; laredoute.co.uk: 120,313; freemans.com: 83,435) — so they're well-indexed generally, they just don't appear for the bare word "jeans" specifically. Re-ran the live-SERP fallback at depth 200 (confirmed a valid value; depth 300/700 are rejected by the endpoint) and still found no match for any of the 4 — likely because "jeans" alone is dominated by dedicated denim/fashion retailers, and these general-merchandise sites rank for longer phrases instead ("argos jeans," "women's jeans") rather than the bare term. This reads as an accurate result, not a tool defect. Bumped the live-SERP fallback depth from 100 to 200 anyway (cost: $0.008 → $0.02 per fallback call, still negligible) since it's a free small accuracy win even though it didn't change the outcome for this particular keyword.

## Next steps, in order

1. Tier 2 (fashion cross-shop) — same pattern, two Search Visibility batches.
2. Tier 3 (sports) — same pattern, one batch.
3. Tier 4 (value disruptors) — Trend Detection momentum pass, not Competitive Set overlap.
4. Keyword seeds — batch the 36 phrases through Trend Detection, Apparel-scoped.
5. Decide on the cartesian-ranking + Tranco cross-check offer (needs the brief's author, not us).
6. **LangChain relevance filtering — planned, not yet implemented.** Full plan in [`langchain-plan.md`](langchain-plan.md): replaces the vocabulary-regex keyword filter and adds a new competitor-relevance filter, both via `model.withStructuredOutput()`. Note the scope correction from earlier notes here — the actual right tool per LangChain's own docs is plain structured output, not the full Deep Agents harness (no planning/memory/subagents needed for a stateless classification call).
