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
