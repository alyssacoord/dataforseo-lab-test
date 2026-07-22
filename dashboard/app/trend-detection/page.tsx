'use client';

import { useState, type SubmitEvent } from 'react';
import { useMode } from '@/components/ModeProvider';
import { runDataForSEO, extractItems, extractError } from '@/lib/dataforseo';
import { LOCATIONS } from '@/lib/locations';
import { CATEGORICAL, ORDINAL_BLUE } from '@/lib/palette';
import { LineChart } from '@/components/LineChart';
import { BarChart } from '@/components/BarChart';
import type { TrendGraphItem, DemographyItem } from '@/lib/types';

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

  const [keywordsInput, setKeywordsInput] = useState('barrel jeans, wide leg trousers');
  const [location, setLocation] = useState<(typeof LOCATIONS)[number]>(LOCATIONS[0]);
  const [apparelOnly, setApparelOnly] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ elapsedMs?: number; httpStatus?: number } | null>(null);

  const [trend, setTrend] = useState<TrendGraphItem | null>(null);
  const [demography, setDemography] = useState<DemographyItem | null>(null);

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
    setDemography(null);

    const trendsBody: Record<string, unknown> = {
      keywords,
      location_code: location.location_code,
      date_from: oneYearAgo(),
    };
    if (apparelOnly) trendsBody.category_code = APPAREL_CATEGORY_CODE;

    const [trendResult, demographyResult] = await Promise.all([
      runDataForSEO<TrendGraphItem>({
        path: 'keywords_data/google_trends/explore/live',
        mode,
        body: [trendsBody],
      }),
      runDataForSEO<DemographyItem>({
        path: 'keywords_data/dataforseo_trends/demography/live',
        mode,
        body: [{ keywords: [keywords[0]], location_code: location.location_code }],
      }),
    ]);

    setLoading(false);
    setMeta({ elapsedMs: trendResult.elapsedMs, httpStatus: trendResult.httpStatus });

    const trendError = extractError(trendResult);
    const demographyError = extractError(demographyResult);
    if (trendError && demographyError) {
      setError(trendError);
      return;
    }
    if (trendError) setError(`Trend chart: ${trendError}`);

    setTrend(extractItems(trendResult)[0] ?? null);
    setDemography(extractItems(demographyResult)[0] ?? null);
  }

  const trendKeywords = trend?.keywords ?? [];
  const trendLabels = trend?.data.map((d) => d.date_from) ?? [];
  const trendValues = trendKeywords.map((_, ki) => trend?.data.map((d) => d.values[ki] ?? null) ?? []);

  const ageSeries = demography?.demography.age[0];
  const genderSeries = demography?.demography.gender[0];

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-xl font-semibold text-neutral-100">Trend Detection</h2>
      <p className="mt-1 text-sm text-neutral-500">
        &ldquo;Spot the trend before it peaks.&rdquo; Momentum over the last 12 months, plus the age/gender breakdown Google
        Trends&rsquo; own API can&rsquo;t give you.
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
        </div>
      )}

      {demography && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <h3 className="text-sm font-semibold text-neutral-100">Interest by age — {demography.keywords[0]}</h3>
            <p className="mb-3 text-xs text-neutral-500">Relative interest, 0–100. Darker = older band.</p>
            {ageSeries ? (
              <BarChart
                data={ageSeries.values.map((b, i) => ({
                  label: b.type,
                  value: b.value,
                  color: ORDINAL_BLUE[Math.min(i, ORDINAL_BLUE.length - 1)],
                }))}
              />
            ) : (
              <p className="text-xs text-neutral-500">No age breakdown returned.</p>
            )}
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
            <h3 className="text-sm font-semibold text-neutral-100">Interest by gender — {demography.keywords[0]}</h3>
            <p className="mb-3 text-xs text-neutral-500">Relative interest, 0–100.</p>
            {genderSeries ? (
              <BarChart
                data={genderSeries.values.map((b, i) => ({
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
      )}

      {!error && !loading && meta !== null && !trend && !demography && (
        <p className="mt-6 text-sm text-neutral-500">No data returned for these keywords.</p>
      )}
    </div>
  );
}