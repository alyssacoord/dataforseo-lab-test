'use client';

import { formatUsdToGbp } from '@/lib/currency';
import type { FxRate } from '@/lib/useFxRate';
import type { KeywordSetLookupState } from '@/lib/useKeywordSetLookup';

export function CompetitiveSetKeywordPanel({ lookup, fx }: { lookup: KeywordSetLookupState | null; fx: FxRate | null }) {
  if (!lookup) return null;

  return (
    <div className="mt-3 rounded-md border border-neutral-800 bg-neutral-950/40 p-3">
      <p className="text-xs font-medium text-neutral-200">&ldquo;{lookup.keyword}&rdquo; across your competitive set</p>

      {lookup.loading ? (
        <p className="mt-2 text-xs text-neutral-500">Looking up…</p>
      ) : lookup.error && lookup.rows.length === 0 ? (
        <p className="mt-2 text-xs text-rose-400">{lookup.error}</p>
      ) : (
        <>
          {lookup.error && <p className="mt-2 text-xs text-rose-400">{lookup.error}</p>}
          <table className="mt-3 w-full text-left text-xs">
            <thead>
              <tr className="text-neutral-500">
                <th className="pb-2 font-normal">Domain</th>
                <th className="pb-2 font-normal">Position</th>
                <th className="pb-2 font-normal">Search volume</th>
                <th className="pb-2 font-normal">CPC</th>
                <th className="pb-2 font-normal">Est. traffic (ETV)</th>
              </tr>
            </thead>
            <tbody>
              {lookup.rows.map((row) => (
                <tr key={row.domain} className="border-t border-neutral-800/60 text-neutral-300">
                  <td className="py-1.5 pr-2">
                    {row.domain}
                    {row.isTarget && <span className="ml-1.5 text-neutral-600">(you)</span>}
                  </td>
                  <td className="py-1.5 pr-2 tabular-nums">
                    {row.found ? (
                      <>
                        {row.position}
                        {row.source === 'live_serp' && (
                          <span
                            className="ml-1.5 rounded border border-neutral-700 px-1 text-[10px] font-normal text-neutral-500"
                            title="Not in DataForSEO's indexed keyword data — confirmed instead via a real-time Google SERP check"
                          >
                            live SERP
                          </span>
                        )}
                      </>
                    ) : (
                      'not ranking'
                    )}
                  </td>
                  <td className="py-1.5 pr-2 tabular-nums">{row.searchVolume?.toLocaleString() ?? '—'}</td>
                  <td className="py-1.5 pr-2 tabular-nums">
                    {row.cpc != null
                      ? (() => {
                          const { text, title } = formatUsdToGbp(row.cpc as number, fx, 2);
                          return <span title={title}>{text}</span>;
                        })()
                      : '—'}
                  </td>
                  <td className="py-1.5 tabular-nums">{row.etv != null ? Math.round(row.etv).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-neutral-600">
            Positions tagged &ldquo;live SERP&rdquo; weren&apos;t in DataForSEO&apos;s indexed keyword data for that domain
            but were confirmed ranking via a real-time Google check. &ldquo;Not ranking&rdquo; means neither check found
            it — still not a guarantee of zero visibility, just nothing found within the depth checked.
          </p>
        </>
      )}
    </div>
  );
}
