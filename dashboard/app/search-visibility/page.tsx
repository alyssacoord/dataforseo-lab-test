import { ComingSoon } from '@/components/ComingSoon';

export default function SearchVisibilityPage() {
  return (
    <ComingSoon
      title="Search Visibility"
      description="Whose organic visibility is climbing, whose is slipping, and the queries Coord is missing entirely."
      endpoints={[
        'dataforseo_labs/google/ranked_keywords/live',
        'dataforseo_labs/google/historical_rank_overview/live',
        'dataforseo_labs/google/bulk_traffic_estimation/live',
        'dataforseo_labs/google/historical_bulk_traffic_estimation/live',
        'dataforseo_labs/google/serp_competitors/live',
        'dataforseo_labs/google/relevant_pages/live',
      ]}
    />
  );
}
