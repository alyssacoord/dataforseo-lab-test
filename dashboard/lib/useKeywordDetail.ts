'use client';

import { useState } from 'react';
import { runDataForSEO, extractItems, extractError, type Mode } from './dataforseo';
import type { DemographyItem, KeywordVolumeItem, SubregionInterestsItem, SubregionInterestValue } from './types';

export interface KeywordDetailState {
  loading: boolean;
  error: string | null;
  volume: KeywordVolumeItem | null;
  demography: DemographyItem | null;
  regions: SubregionInterestValue[] | null;
}

// Shared by Trend Detection and Competitive Set — click any keyword, get its
// full profile (real volume/CPC/competition, age/gender demography, UK
// regional interest), fetched on demand and cached. Same interaction pattern
// as Competitive Set's "Show overlap" (one expanded item at a time, cached).
export function useKeywordDetail(mode: Mode, locationCode: number, languageCode: string) {
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  const [keywordDetails, setKeywordDetails] = useState<Record<string, KeywordDetailState>>({});

  async function handleKeywordClick(keyword: string) {
    if (expandedKeyword === keyword) {
      setExpandedKeyword(null);
      return;
    }
    setExpandedKeyword(keyword);

    if (keywordDetails[keyword]) return; // already fetched

    setKeywordDetails((prev) => ({
      ...prev,
      [keyword]: { loading: true, error: null, volume: null, demography: null, regions: null },
    }));

    const [volumeResult, demographyResult, regionResult] = await Promise.all([
      runDataForSEO<KeywordVolumeItem>({
        path: 'keywords_data/google_ads/search_volume/live',
        mode,
        body: [{ keywords: [keyword], location_code: locationCode, language_code: languageCode }],
      }),
      runDataForSEO<DemographyItem>({
        path: 'keywords_data/dataforseo_trends/demography/live',
        mode,
        body: [{ keywords: [keyword], location_code: locationCode }],
      }),
      runDataForSEO<SubregionInterestsItem>({
        path: 'keywords_data/dataforseo_trends/subregion_interests/live',
        mode,
        body: [{ keywords: [keyword], location_code: locationCode }],
      }),
    ]);

    const volumeErr = extractError(volumeResult);
    const demographyErr = extractError(demographyResult);
    const regionErr = extractError(regionResult);

    const volume = volumeErr ? null : (extractItems(volumeResult)[0] ?? null);
    const demography = demographyErr ? null : (extractItems(demographyResult)[0] ?? null);
    const regionItem = regionErr ? null : (extractItems(regionResult)[0] ?? null);
    const regions = regionItem?.interests?.[0]?.values
      ? [...regionItem.interests[0].values].sort((a, b) => b.value - a.value).slice(0, 8)
      : null;

    const errors = [volumeErr, demographyErr, regionErr].filter((e): e is string => e !== null);

    setKeywordDetails((prev) => ({
      ...prev,
      [keyword]: {
        loading: false,
        error: errors.length > 0 ? errors.join(' · ') : null,
        volume,
        demography,
        regions,
      },
    }));
  }

  return { expandedKeyword, keywordDetails, handleKeywordClick };
}
