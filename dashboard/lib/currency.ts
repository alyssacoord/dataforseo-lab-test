import type { FxRate } from './useFxRate';

// Several DataForSEO fields are confirmed USD-denominated regardless of
// location_code (estimated_paid_traffic_cost, cpc — both confirmed via docs).
// This converts any such USD amount for display in a UK-focused app, keeping
// the original USD figure and rate visible on hover rather than discarding it.
export function formatUsdToGbp(usdAmount: number, fx: FxRate | null, decimals = 0): { text: string; title: string } {
  const round = (n: number) => (decimals === 0 ? Math.round(n) : Number(n.toFixed(decimals)));

  if (!fx) {
    return {
      text: `$${round(usdAmount).toLocaleString()} USD`,
      title: 'Exchange rate not yet loaded — showing original USD value',
    };
  }
  const gbp = round(usdAmount * fx.rate);
  return {
    text: `£${gbp.toLocaleString()}`,
    title: `Converted from $${round(usdAmount).toLocaleString()} USD at ${fx.rate.toFixed(4)} (rate as of ${fx.date})`,
  };
}
