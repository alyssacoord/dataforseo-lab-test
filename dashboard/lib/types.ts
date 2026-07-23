export interface CompetitorDomainItem {
  domain: string;
  avg_position: number;
  sum_position: number;
  intersections: number;
  full_domain_metrics?: {
    organic?: {
      etv?: number;
      count?: number;
      pos_1?: number;
      estimated_paid_traffic_cost?: number;
    };
  };
}

export interface DomainIntersectionSerpElement {
  rank_absolute?: number;
  url?: string;
}

export interface DomainIntersectionItem {
  keyword_data: {
    keyword: string;
    keyword_info?: {
      search_volume?: number;
      cpc?: number;
      competition_level?: string;
    };
  };
  first_domain_serp_element?: DomainIntersectionSerpElement | null;
  second_domain_serp_element?: DomainIntersectionSerpElement | null;
}

export interface ConfirmedCompetitor {
  domain: string;
  addedAt: string;
  source: 'suggested' | 'manual';
  intersections?: number;
  etv?: number;
  count?: number;
  estimatedPaidTrafficCost?: number;
  avgPosition?: number;
}

export interface TrendGraphPoint {
  date_from: string;
  date_to: string;
  timestamp: number;
  missing_data: boolean;
  values: number[];
}

export interface TrendGraphItem {
  position: number;
  type: string;
  title: string | null;
  keywords: string[];
  data: TrendGraphPoint[];
}

export interface DemographyBucket {
  type: string;
  value: number;
}

export interface DemographyKeywordSeries {
  keyword: string;
  values: DemographyBucket[];
}

export interface DemographyItem {
  position: number;
  type: string;
  keywords: string[];
  demography: {
    age: DemographyKeywordSeries[];
    gender: DemographyKeywordSeries[];
  };
  demography_comparison: unknown;
}

export interface AiMentionSummary {
  mentions: number;
  ai_search_volume: number;
}

export interface MultiTargetMetricsItem {
  key: string;
  total: AiMentionSummary;
}

export interface TopMentionedBrandItem {
  brand: string;
  total: AiMentionSummary;
}

export interface HistoricalMentionPoint {
  year: number;
  month: number;
  metrics: AiMentionSummary;
}

export interface AiModeReference {
  domain: string;
  title: string | null;
  url: string;
}

export interface AiModeItem {
  markdown: string | null;
  references: AiModeReference[] | null;
}

export interface RankChanges {
  previous_rank_absolute?: number | null;
  is_new?: boolean;
  is_up?: boolean;
  is_down?: boolean;
}

export interface RankedKeywordItem {
  keyword_data: {
    keyword: string;
    keyword_info?: {
      search_volume?: number;
      cpc?: number;
      competition_level?: string;
    };
  };
  ranked_serp_element: {
    serp_item: {
      rank_absolute: number;
      url: string;
      etv?: number;
      rank_changes?: RankChanges;
    };
  };
}

export interface HistoricalRankMetrics {
  etv: number;
  count: number;
  is_new?: number;
  is_up?: number;
  is_down?: number;
  is_lost?: number;
}

export interface HistoricalRankPoint {
  year: number;
  month: number;
  metrics: {
    // Confirmed null for months where the domain had no organic presence
    // (e.g. before it started ranking) — always guard before reading a field off this.
    organic: HistoricalRankMetrics | null;
  };
}

export interface MonthlySearchPoint {
  year: number;
  month: number;
  search_volume: number;
}

export interface KeywordVolumeItem {
  keyword: string;
  competition: string | null; // "LOW" | "MEDIUM" | "HIGH"
  competition_index: number | null;
  search_volume: number | null;
  cpc: number | null; // confirmed USD, regardless of location_code
  low_top_of_page_bid: number | null;
  high_top_of_page_bid: number | null;
  monthly_searches: MonthlySearchPoint[];
}

export interface SubregionInterestValue {
  geo_name: string;
  value: number;
}

export interface SubregionInterestsItem {
  keywords: string[];
  interests: Array<{ keyword: string; values: SubregionInterestValue[] }>;
}

export interface KeywordDomainRank {
  domain: string;
  isTarget: boolean;
  found: boolean;
  position: number | null;
  searchVolume: number | null;
  cpc: number | null;
  etv: number | null;
  // 'ranked_keywords' = DataForSEO's indexed keyword-rank data for this domain.
  // 'live_serp' = not found there, confirmed instead via a real-time Google SERP check.
  source: 'ranked_keywords' | 'live_serp' | null;
}

export interface OrganicSerpItem {
  type?: string;
  domain?: string;
  rank_absolute?: number;
}
