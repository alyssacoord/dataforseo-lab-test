'use client';

import { useState } from 'react';
import { runDataForSEO, extractItems, extractError, type Mode } from './dataforseo';
import type { RankedKeywordItem, KeywordDomainRank } from './types';

export interface KeywordSetLookupState {
  loading: boolean;
  error: string | null;
  keyword: string;
  rows: KeywordDomainRank[];
}

// Competitive-set-relative keyword lookup: for one typed keyword, fires a
// ranked_keywords call per domain (target + confirmed peers) filtered to an
// exact keyword match, so every row answers "does THIS domain rank for
// THIS keyword, and where" — unlike the generic, domain-agnostic Trends data.
export function useKeywordSetLookup(mode: Mode, locationCode: number, languageCode: string) {
  const [lookup, setLookup] = useState<KeywordSetLookupState | null>(null);

  async function runLookup(keyword: string, domains: Array<{ domain: string; isTarget: boolean }>) {
    const trimmed = keyword.trim();
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
              filters: ['keyword_data.keyword', '=', trimmed],
            },
          ],
        });
        return { domain, isTarget, result };
      })
    );

    const errors: string[] = [];
    const rows: KeywordDomainRank[] = results.map(({ domain, isTarget, result }) => {
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
      };
    });

    rows.sort((a, b) => {
      if (a.position === null && b.position === null) return 0;
      if (a.position === null) return 1;
      if (b.position === null) return -1;
      return a.position - b.position;
    });

    setLookup({
      loading: false,
      error: errors.length === results.length ? errors.join(' · ') : null,
      keyword: trimmed,
      rows,
    });
  }

  return { lookup, runLookup };
}
