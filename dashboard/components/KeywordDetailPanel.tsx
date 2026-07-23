'use client';

import { ORDINAL_BLUE, CATEGORICAL } from '@/lib/palette';
import { formatUsdToGbp } from '@/lib/currency';
import { BarChart } from './BarChart';
import type { FxRate } from '@/lib/useFxRate';
import type { KeywordDetailState } from '@/lib/useKeywordDetail';

export function KeywordDetailPanel({
  keyword,
  detail,
  fx,
  locationLabel,
}: {
  keyword: string;
  detail: KeywordDetailState | undefined;
  fx: FxRate | null;
  locationLabel: string;
}) {
  return (
    <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      <h3 className="text-sm font-semibold text-neutral-100">Keyword detail — {keyword}</h3>

      {!detail || detail.loading ? (
        <p className="mt-3 text-xs text-neutral-500">Loading…</p>
      ) : detail.error && !detail.volume && !detail.demography && !detail.regions ? (
        <p className="mt-3 text-xs text-rose-400">{detail.error}</p>
      ) : (
        <>
          {detail.error && <p className="mt-2 text-xs text-rose-400">{detail.error}</p>}

          {detail.volume && (
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-300">
              <span>
                Search volume:{' '}
                <strong className="text-neutral-100">{detail.volume.search_volume?.toLocaleString() ?? '—'}</strong>/mo
              </span>
              <span>
                Competition: <strong className="text-neutral-100">{detail.volume.competition ?? '—'}</strong>
                {detail.volume.competition_index != null && ` (${detail.volume.competition_index}/100)`}
              </span>
              {detail.volume.cpc != null &&
                (() => {
                  const { text, title } = formatUsdToGbp(detail.volume!.cpc!, fx, 2);
                  return (
                    <span title={title}>
                      CPC: <strong className="text-neutral-100">{text}</strong>
                    </span>
                  );
                })()}
              {detail.volume.low_top_of_page_bid != null &&
                detail.volume.high_top_of_page_bid != null &&
                (() => {
                  const low = formatUsdToGbp(detail.volume!.low_top_of_page_bid!, fx, 2);
                  const high = formatUsdToGbp(detail.volume!.high_top_of_page_bid!, fx, 2);
                  return (
                    <span title={`${low.title} / ${high.title}`}>
                      Bid range:{' '}
                      <strong className="text-neutral-100">
                        {low.text}–{high.text}
                      </strong>
                    </span>
                  );
                })()}
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium text-neutral-200">Interest by age</p>
              {detail.demography?.demography.age[0] ? (
                <BarChart
                  data={detail.demography.demography.age[0].values.map((b, i) => ({
                    label: b.type,
                    value: b.value,
                    color: ORDINAL_BLUE[Math.min(i, ORDINAL_BLUE.length - 1)],
                  }))}
                />
              ) : (
                <p className="text-xs text-neutral-500">No age breakdown returned.</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-neutral-200">Interest by gender</p>
              {detail.demography?.demography.gender[0] ? (
                <BarChart
                  data={detail.demography.demography.gender[0].values.map((b, i) => ({
                    label: b.type,
                    value: b.value,
                    color: CATEGORICAL[i % CATEGORICAL.length],
                  }))}
                />
              ) : (
                <p className="text-xs text-neutral-500">No gender breakdown returned.</p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-neutral-200">Regional interest — {locationLabel}</p>
            {detail.regions && detail.regions.length > 0 ? (
              <BarChart
                data={detail.regions.map((r, i) => ({
                  label: r.geo_name,
                  value: r.value,
                  color: CATEGORICAL[i % CATEGORICAL.length],
                }))}
              />
            ) : (
              <p className="text-xs text-neutral-500">No regional breakdown returned.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
