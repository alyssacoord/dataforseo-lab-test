'use client';

import { useState, type SubmitEvent } from 'react';
import { useMode } from '@/components/ModeProvider';
import { runDataForSEO, extractItems, extractError } from '@/lib/dataforseo';
import { LOCATIONS } from '@/lib/locations';
import { CATEGORICAL } from '@/lib/palette';
import { useFxRate } from '@/lib/useFxRate';
import { useKeywordDetail } from '@/lib/useKeywordDetail';
import { LineChart } from '@/components/LineChart';
import { KeywordDetailPanel } from '@/components/KeywordDetailPanel';
import type { TrendGraphItem } from '@/lib/types';

const MAX_KEYWORDS = 5;
// Confirmed against the real keywords_data/google_trends/categories list (free lookup,
// not the DataForSEO Labs product taxonomy — Google Trends uses its own category codes).
const APPAREL_CATEGORY_CODE = 68;

function oneYearAgo(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

export default function TrendDetectionPage() {
  const { mode } = useMode();
  const fx = useFxRate();

  const [keywordsInput, setKeywordsInput] = useState('barrel jeans, wide leg trousers');
  const [location, setLocation] = useState<(typeof LOCATIONS)[number]>(LOCATIONS[0]);
  const [apparelOnly, setApparelOnly] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ elapsedMs?: number; httpStatus?: number } | null>(null);

  const [trend, setTrend] = useState<TrendGraphItem | null>(null);

  const { expandedKeyword, keywordDetails, handleKeywordClick } = useKeywordDetail(
    mode,
    location.location_code,
    location.language_code
  );

  async function handleSearch(e: SubmitEvent) {
    e.preventDefault();
    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, MAX_KEYWORDS);
    if (keywords.length === 0) return;

    setLoading(true);
    setError(null);
    setTrend(null);

    const trendsBody: Record<string, unknown> = {
      keywords,
      location_code: location.location_code,
      date_from: oneYearAgo(),
    };
    if (apparelOnly) trendsBody.category_code = APPAREL_CATEGORY_CODE;

    const result = await runDataForSEO<TrendGraphItem>({
      path: 'keywords_data/google_trends/explore/live',
      mode,
      body: [trendsBody],
    });

    setLoading(false);
    setMeta({ elapsedMs: result.elapsedMs, httpStatus: result.httpStatus });

    const trendError = extractError(result);
    if (trendError) {
      setError(trendError);
      return;
    }

    setTrend(extractItems(result)[0] ?? null);
  }

  const trendKeywords = trend?.keywords ?? [];
  const trendLabels = trend?.data.map((d) => d.date_from) ?? [];
  const trendValues = trendKeywords.map((_, ki) => trend?.data.map((d) => d.values[ki] ?? null) ?? []);

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-xl font-semibold text-neutral-100">Trend Detection</h2>
      <p className="mt-1 text-sm text-neutral-500">
        &ldquo;Spot the trend before it peaks.&rdquo; Momentum over the last 12 months — click any keyword below for its full
        detail: real search volume/CPC, age/gender breakdown, and regional interest.
      </p>

      <form onSubmit={handleSearch} className="mt-6 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={keywordsInput}
            onChange={(e) => setKeywordsInput(e.target.value)}
            placeholder="up to 5 keywords, comma separated"
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
          <select
            value={location.label}
            onChange={(e) => setLocation(LOCATIONS.find((l) => l.label === e.target.value) ?? LOCATIONS[0])}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
          >
            {LOCATIONS.map((l) => (
              <option key={l.label} value={l.label}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Show trend'}
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs text-neutral-500">
          <input
            type="checkbox"
            checked={apparelOnly}
            onChange={(e) => setApparelOnly(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-neutral-700 bg-neutral-900"
          />
          Apparel category filter (Google Trends category 68, confirmed)
        </label>
      </form>

      <p className="mt-2 text-xs text-neutral-600">
        Location: {location.label} ({location.location_code}) · Mode: <span className="font-medium">{mode}</span>
        {meta?.httpStatus !== undefined && (
          <>
            {' '}
            · last call: HTTP {meta.httpStatus} in {meta.elapsedMs}ms
          </>
        )}
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-rose-900 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">{error}</div>
      )}

      {trend && (
        <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <h3 className="text-sm font-semibold text-neutral-100">Momentum — last 12 months</h3>
          <div className="mt-4">
            <LineChart
              labels={trendLabels}
              series={trendKeywords.map((k, i) => ({ label: k, color: CATEGORICAL[i % CATEGORICAL.length] }))}
              values={trendValues}
            />
          </div>

          {trendKeywords.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-800 pt-4">
              <span className="text-xs text-neutral-500">See details for</span>
              {trendKeywords.map((k, i) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeywordClick(k)}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${
                    expandedKeyword === k
                      ? 'border-neutral-100 bg-neutral-100 text-neutral-900'
                      : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: expandedKeyword === k ? undefined : CATEGORICAL[i % CATEGORICAL.length] }}
                  />
                  {k}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {expandedKeyword && (
        <KeywordDetailPanel
          keyword={expandedKeyword}
          detail={keywordDetails[expandedKeyword]}
          fx={fx}
          locationLabel={location.label}
        />
      )}

      {!error && !loading && meta !== null && !trend && (
        <p className="mt-6 text-sm text-neutral-500">No data returned for these keywords.</p>
      )}
    </div>
  );
}
