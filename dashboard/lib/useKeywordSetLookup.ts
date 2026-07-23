'use client';

import { useState } from 'react';
import { runDataForSEO, extractItems, extractError, type Mode } from './dataforseo';
import type { RankedKeywordItem, KeywordDomainRank, OrganicSerpItem } from './types';

export interface KeywordSetLookupState {
  loading: boolean;
  error: string | null;
  keyword: string;
  rows: KeywordDomainRank[];
}

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^www\./, '');
}

function domainsMatch(a: string, b: string): boolean {
  const na = normalizeDomain(a);
  const nb = normalizeDomain(b);
  return na === nb || na.endsWith(`.${nb}`) || nb.endsWith(`.${na}`);
}

function sortRows(rows: KeywordDomainRank[]): KeywordDomainRank[] {
  return [...rows].sort((a, b) => {
    if (a.position === null && b.position === null) return 0;
    if (a.position === null) return 1;
    if (b.position === null) return -1;
    return a.position - b.position;
  });
}

// Competitive-set-relative keyword lookup: for one typed keyword, fires a
// ranked_keywords call per domain (target + confirmed peers) filtered to an
// exact keyword match, so every row answers "does THIS domain rank for
// THIS keyword, and where" — unlike the generic, domain-agnostic Trends data.
//
// ranked_keywords misses two classes of real ranking: (1) case mismatches,
// since the filter is exact-string against DataForSEO's stored (lowercase)
// keyword, and (2) domains DataForSEO hasn't indexed for this exact keyword
// even though they rank live on Google right now. (1) is fixed by
// normalizing the filter value. (2) is checked with a single shared live
// organic SERP call — fired once per lookup, not once per domain — for
// whichever rows are still unresolved after the indexed-data pass.
export function useKeywordSetLookup(mode: Mode, locationCode: number, languageCode: string) {
  const [lookup, setLookup] = useState<KeywordSetLookupState | null>(null);

  async function runLookup(keyword: string, domains: Array<{ domain: string; isTarget: boolean }>) {
    const trimmed = keyword.trim();
    const normalized = trimmed.toLowerCase();
    if (!trimmed || domains.length === 0) return;

    setLookup({ loading: true, error: null, keyword: trimmed, rows: [] });

    const results = await Promise.all(
      domains.map(async ({ domain, isTarget }) => {
        const result = await runDataForSEO<RankedKeywordItem>({
          path: 'dataforseo_labs/google/ranked_keywords/live',
          mode,
          body: [
            {
              target: domain,
              location_code: locationCode,
              language_code: languageCode,
              limit: 1,
              filters: ['keyword_data.keyword', '=', normalized],
            },
          ],
        });
        return { domain, isTarget, result };
      })
    );

    const errors: string[] = [];
    let rows: KeywordDomainRank[] = results.map(({ domain, isTarget, result }) => {
      const err = extractError(result);
      if (err) errors.push(`${domain}: ${err}`);
      const item = err ? null : (extractItems(result)[0] ?? null);
      const serpItem = item?.ranked_serp_element?.serp_item;
      return {
        domain,
        isTarget,
        found: item != null,
        position: serpItem?.rank_absolute ?? null,
        searchVolume: item?.keyword_data.keyword_info?.search_volume ?? null,
        cpc: item?.keyword_data.keyword_info?.cpc ?? null,
        etv: serpItem?.etv ?? null,
        source: item != null ? 'ranked_keywords' : null,
      };
    });

    // Borrow real keyword-level stats (volume/CPC aren't domain-specific) for
    // rows a live SERP match will resolve below, which has no keyword_info of its own.
    const knownVolume = rows.find((r) => r.searchVolume != null)?.searchVolume ?? null;
    const knownCpc = rows.find((r) => r.cpc != null)?.cpc ?? null;

    let serpWarning: string | null = null;
    const stillUnresolved = rows.filter((r) => !r.found);
    if (stillUnresolved.length > 0) {
      const serpResult = await runDataForSEO<OrganicSerpItem>({
        path: 'serp/google/organic/live/advanced',
        mode,
        body: [{ keyword: trimmed, location_code: locationCode, language_code: languageCode, depth: 200 }],
      });
      const serpErr = extractError(serpResult);
      if (!serpErr) {
        const organicItems = extractItems(serpResult).filter((i) => i.type === 'organic' && i.domain);
        rows = rows.map((row) => {
          if (row.found) return row;
          const match = organicItems
            .filter((i) => domainsMatch(i.domain as string, row.domain))
            .sort((a, b) => (a.rank_absolute ?? Infinity) - (b.rank_absolute ?? Infinity))[0];
          if (!match) return row;
          return {
            ...row,
            found: true,
            position: match.rank_absolute ?? null,
            searchVolume: row.searchVolume ?? knownVolume,
            cpc: row.cpc ?? knownCpc,
            source: 'live_serp',
          };
        });
      } else {
        serpWarning = `Live SERP cross-check failed (${serpErr}) — remaining "not ranking" rows are only as good as DataForSEO's indexed data.`;
      }
    }

    // Blocking error only when every domain-level call failed; the live-SERP
    // fallback failing is a soft warning since ranked_keywords rows may have already succeeded.
    const blockingError = errors.length > 0 && errors.length === results.length ? errors.join(' · ') : null;

    setLookup({
      loading: false,
      error: blockingError ?? serpWarning,
      keyword: trimmed,
      rows: sortRows(rows),
    });
  }

  return { lookup, runLookup };
}
