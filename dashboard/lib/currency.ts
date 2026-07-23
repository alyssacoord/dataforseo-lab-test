import type { FxRate } from './useFxRate';

// DataForSEO's estimated_paid_traffic_cost is always USD-denominated regardless
// of location_code (confirmed via docs) — this converts it for display in a
// UK-focused app, while keeping the original USD figure and rate visible on hover.
export function formatAdEquivalent(usdAmount: number, fx: FxRate | null): { text: string; title: string } {
  if (!fx) {
    return {
      text: `$${Math.round(usdAmount).toLocaleString()} USD`,
      title: 'Exchange rate not yet loaded — showing original USD value',
    };
  }
  const gbp = Math.round(usdAmount * fx.rate);
  return {
    text: `£${gbp.toLocaleString()}`,
    title: `Converted from $${Math.round(usdAmount).toLocaleString()} USD at ${fx.rate.toFixed(4)} (rate as of ${fx.date})`,
  };
}
