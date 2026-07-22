'use client';

import { useState, type SubmitEvent } from 'react';
import { useMode } from '@/components/ModeProvider';
import { runDataForSEO, extractItems, extractError } from '@/lib/dataforseo';
import { LOCATIONS } from '@/lib/locations';
import { CATEGORICAL } from '@/lib/palette';
import { LineChart } from '@/components/LineChart';
import { mergeTimeSeries } from '@/lib/mergeTimeSeries';
import type { HistoricalRankPoint, RankedKeywordItem } from '@/lib/types';

type VisibilityMetric = 'etv' | 'count';

export default function SearchVisibilityPage() {
  const { mode } = useMode();
  const [location, setLocation] = useState<(typeof LOCATIONS)[number]>(LOCATIONS[0]);

  // --- Section 1: visibility over time, multiple domains ---
  const [domainsInput, setDomainsInput] = useState('coordclothing.co.uk, asos.com, hm.com');
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [visibilityByDomain, setVisibilityByDomain] = useState<Record<string, HistoricalRankPoint[]>>({});
  const [visibilityMetric, setVisibilityMetric] = useState<VisibilityMetric>('etv');

  async function handleVisibility(e: SubmitEvent) {
    e.preventDefault();
    const domains = domainsInput
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean)
      .slice(0, 10);
    if (domains.length === 0) return;

    setVisibilityLoading(true);
    setVisibilityError(null);
    setVisibilityByDomain({});

    const results = await Promise.all(
      domains.map((target) =>
        runDataForSEO<HistoricalRankPoint>({
          path: 'dataforseo_labs/google/historical_rank_overview/live',
          mode,
          body: [{ target, location_code: location.location_code, language_code: location.language_code }],
        }).then((result) => ({ target, result }))
      )
    );

    setVisibilityLoading(false);

    const byDomain: Record<string, HistoricalRankPoint[]> = {};
    let anyFailed = false;
    for (const { target, result } of results) {
      if (extractError(result)) {
        anyFailed = true;
        continue;
      }
      byDomain[target] = extractItems(result);
    }
    setVisibilityByDomain(byDomain);
    if (Object.keys(byDomain).length === 0) {
      setVisibilityError('No visibility history returned for these domains.');
    } else if (anyFailed) {
      setVisibilityError('Some domains’ history could not be loaded.');
    }
  }

  // --- Section 2: ranked keywords for one domain ---
  const [rankedDomain, setRankedDomain] = useState('asos.com');
  const [rankedLoading, setRankedLoading] = useState(false);
  const [rankedError, setRankedError] = useState<string | null>(null);
  const [rankedItems, setRankedItems] = useState<RankedKeywordItem[] | null>(null);

  async function handleRanked(e: SubmitEvent) {
    e.preventDefault();
    const target = rankedDomain.trim();
    if (!target) return;

    setRankedLoading(true);
    setRankedError(null);
    setRankedItems(null);

    const result = await runDataForSEO<RankedKeywordItem>({
      path: 'dataforseo_labs/google/ranked_keywords/live',
      mode,
      body: [{ target, location_code: location.location_code, language_code: location.language_code, limit: 20 }],
    });

    setRankedLoading(false);
    const err = extractError(result);
    if (err) {
      setRankedError(err);
      return;
    }
    setRankedItems(extractItems(result));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-xl font-semibold text-neutral-100">Search Visibility</h2>
      <p className="mt-1 text-sm text-neutral-500">
        &ldquo;Whose visibility is climbing, whose is slipping, and the queries you&rsquo;re missing entirely.&rdquo;
      </p>

      <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
        <span>Market</span>
        <select
          value={location.label}
          onChange={(e) => setLocation(LOCATIONS.find((l) => l.label === e.target.value) ?? LOCATIONS[0])}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-100 focus:border-neutral-500 focus:outline-none"
        >
          {LOCATIONS.map((l) => (
            <option key={l.label} value={l.label}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* Section 1: visibility over time */}
      <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <h3 className="text-sm font-semibold text-neutral-100">Visibility over time</h3>
        <p className="mt-1 text-xs text-neutral-500">Up to 10 domains, comma separated. Organic visibility since Oct 2020.</p>

        <form onSubmit={handleVisibility} className="mt-3 flex gap-2">
          <input
            type="text"
            value={domainsInput}
            onChange={(e) => setDomainsInput(e.target.value)}
            placeholder="coordclothing.co.uk, asos.com, hm.com"
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={visibilityLoading}
            className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            {visibilityLoading ? 'Loading…' : 'Show visibility'}
          </button>
        </form>

        {visibilityError && <p className="mt-3 text-sm text-rose-300">{visibilityError}</p>}

        {Object.keys(visibilityByDomain).length > 0 && (
          <div className="mt-5">
            <div className="mb-3 flex justify-end">
              <div className="flex overflow-hidden rounded-md border border-neutral-700 text-xs">
                <button
                  type="button"
                  onClick={() => setVisibilityMetric('etv')}
                  className={`px-2.5 py-1 ${visibilityMetric === 'etv' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:bg-neutral-800'}`}
                >
                  Estimated traffic value
                </button>
                <button
                  type="button"
                  onClick={() => setVisibilityMetric('count')}
                  className={`px-2.5 py-1 ${visibilityMetric === 'count' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:bg-neutral-800'}`}
                >
                  Ranking keywords
                </button>
              </div>
            </div>

            {(() => {
              const { labels, keys, values } = mergeTimeSeries(visibilityByDomain, (p) => p.metrics.organic[visibilityMetric]);
              if (labels.length === 0) {
                return <p className="text-sm text-neutral-500">No history to chart.</p>;
              }
              return (
                <LineChart
                  labels={labels}
                  series={keys.map((k, i) => ({ label: k, color: CATEGORICAL[i % CATEGORICAL.length] }))}
                  values={values}
                />
              );
            })()}
          </div>
        )}
      </div>

      {/* Section 2: ranked keywords for one domain */}
      <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <h3 className="text-sm font-semibold text-neutral-100">Ranked keywords</h3>
        <p className="mt-1 text-xs text-neutral-500">Every keyword this domain ranks for, with position and recent movement.</p>

        <form onSubmit={handleRanked} className="mt-3 flex gap-2">
          <input
            type="text"
            value={rankedDomain}
            onChange={(e) => setRankedDomain(e.target.value)}
            placeholder="asos.com"
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={rankedLoading}
            className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            {rankedLoading ? 'Loading…' : 'Find keywords'}
          </button>
        </form>

        {rankedError && <p className="mt-3 text-sm text-rose-300">{rankedError}</p>}

        {rankedItems && rankedItems.length > 0 && (
          <table className="mt-5 w-full text-left text-xs">
            <thead>
              <tr className="text-neutral-500">
                <th className="pb-2 font-normal">Keyword</th>
                <th className="pb-2 font-normal">Position</th>
                <th className="pb-2 font-normal">Volume</th>
                <th className="pb-2 font-normal">Movement</th>
              </tr>
            </thead>
            <tbody>
              {rankedItems.map((it, i) => {
                const changes = it.ranked_serp_element.serp_item.rank_changes;
                let movement = <span className="text-neutral-600">—</span>;
                if (changes?.is_new) {
                  movement = <span className="text-sky-400">NEW</span>;
                } else if (changes?.is_up) {
                  movement = (
                    <span className="text-emerald-400">
                      ▲{changes.previous_rank_absolute ? ` from ${changes.previous_rank_absolute}` : ''}
                    </span>
                  );
                } else if (changes?.is_down) {
                  movement = (
                    <span className="text-rose-400">
                      ▼{changes.previous_rank_absolute ? ` from ${changes.previous_rank_absolute}` : ''}
                    </span>
                  );
                }
                return (
                  <tr key={`${it.keyword_data.keyword}-${i}`} className="border-t border-neutral-800/60 text-neutral-300">
                    <td className="py-1.5 pr-2">{it.keyword_data.keyword}</td>
                    <td className="py-1.5 pr-2 tabular-nums">{it.ranked_serp_element.serp_item.rank_absolute}</td>
                    <td className="py-1.5 pr-2 tabular-nums">
                      {it.keyword_data.keyword_info?.search_volume?.toLocaleString() ?? '—'}
                    </td>
                    <td className="py-1.5">{movement}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {rankedItems && rankedItems.length === 0 && (
          <p className="mt-3 text-sm text-neutral-500">No ranked keywords returned for this domain.</p>
        )}
      </div>
    </div>
  );
}
