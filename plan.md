# Plan — Very.co.uk Competitive Intelligence

**Last updated:** 2026-07-23 (after: candidate info enrichment + filter-toggle upgrade — see "What's been delivered today")
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

**Plan:** feed the ready-to-paste phrases into Trend Detection (momentum chart + age/gender demography), scoped to the confirmed Google Trends Apparel category (code 68 — already wired into the app and verified against the real category list, not guessed). Given Trend Detection currently caps at 5 keywords per search, the 36 phrases need batching into ~8 runs rather than one.

### ⚠️ Open decision — not yet actioned
The brief offers to generate the full head×modifier cartesian, ranked by the team's own live product counts + sold-out rate (so DataForSEO gets a pre-prioritised list instead of us guessing which phrases matter), and to cross-check which peer domains already have Tranco history. This needs a "say the word" from whoever owns this thread — it's their data (product counts, sold-out rates, Tranco holdings), not something this app or DataForSEO can produce independently.

---

## What's been delivered today

- Full Tier 1 analysis (visibility trend, algorithmic cross-check, pairwise overlap, ranked keywords) — real Live data, ~$1.25 total cost.
- The Argos reordering finding, which materially changes how Tier 1 should be presented.
- Five permanent app improvements to Competitive Set, all verified end-to-end against the running app (clean typecheck/build, real Live calls through the app's own proxy, not just scripted once and discarded):
  1. Bulk-add peer domains (paste a list instead of one-at-a-time).
  2. "Show overlap" wired onto confirmed-set entries, not just auto-suggested candidates.
  3. Server-side fashion-vocabulary keyword filter for overlap results.
  4. Filter control upgraded to a 3-state toggle with a visible (disabled) LangChain option, making the semantic-filter roadmap explicit in the app.
  5. More candidate/confirmed-set info surfaced: total ranking-keyword count, estimated ad-equivalent traffic value (USD).

## Next steps, in order

1. Tier 2 (fashion cross-shop) — same pattern, two Search Visibility batches.
2. Tier 3 (sports) — same pattern, one batch.
3. Tier 4 (value disruptors) — Trend Detection momentum pass, not Competitive Set overlap.
4. Keyword seeds — batch the 36 phrases through Trend Detection, Apparel-scoped.
5. Decide on the cartesian-ranking + Tranco cross-check offer (needs the brief's author, not us).
6. Longer-term, separately noted: a LangChain Deep Agents semantic filter to replace the current vocabulary-regex approach for cleaner overlap data at scale.
