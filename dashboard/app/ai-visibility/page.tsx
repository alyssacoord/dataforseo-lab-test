'use client';

import { useState, type SubmitEvent } from 'react';
import { useMode } from '@/components/ModeProvider';
import { runDataForSEO, extractItems, extractError } from '@/lib/dataforseo';
import { LOCATIONS } from '@/lib/locations';
import { CATEGORICAL } from '@/lib/palette';
import { BarChart } from '@/components/BarChart';
import { LineChart } from '@/components/LineChart';
import { mergeTimeSeries } from '@/lib/mergeTimeSeries';
import type { MultiTargetMetricsItem, TopMentionedBrandItem, HistoricalMentionPoint, AiModeItem } from '@/lib/types';

// LLM Mentions data only goes back to August 2025 — DataForSEO doesn't have anything earlier.
const AI_DATA_START = '2025-08-01';

type HistoricalMetric = 'mentions' | 'ai_search_volume';

// Light cleanup for display — strips image/link markdown syntax, keeps the readable text.
function stripMarkdown(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[\[\d+\]\]\([^)]*\)/g, '') // footnote-style citation links, e.g. [[1]](url)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // remaining links -> keep the text only
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function AIVisibilityPage() {
  const { mode } = useMode();
  const [location, setLocation] = useState<(typeof LOCATIONS)[number]>(LOCATIONS[0]);

  // --- Section 1: compare named brands head-to-head ---
  const [brandsInput, setBrandsInput] = useState('nike.com, adidas.co.uk, gap.com, asos.com, hm.com');
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareItems, setCompareItems] = useState<MultiTargetMetricsItem[] | null>(null);

  const [historicalByBrand, setHistoricalByBrand] = useState<Record<string, HistoricalMentionPoint[]>>({});
  const [historicalError, setHistoricalError] = useState<string | null>(null);
  const [historicalMetric, setHistoricalMetric] = useState<HistoricalMetric>('mentions');

  async function handleCompare(e: SubmitEvent) {
    e.preventDefault();
    const brands = brandsInput
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean)
      .slice(0, 10);
    if (brands.length === 0) return;

    setCompareLoading(true);
    setCompareError(null);
    setCompareItems(null);
    setHistoricalByBrand({});
    setHistoricalError(null);

    const [metricsResult, historicalResults] = await Promise.all([
      runDataForSEO<MultiTargetMetricsItem>({
        path: 'ai_optimization/llm_mentions/multi_target_metrics/live',
        mode,
        body: [
          {
            language_code: location.language_code,
            location_code: location.location_code,
            date_from: AI_DATA_START,
            targets: brands.map((domain) => ({ key: domain, target: [{ domain }] })),
          },
        ],
      }),
      Promise.all(
        brands.map((domain) =>
          runDataForSEO<HistoricalMentionPoint>({
            path: 'ai_optimization/llm_mentions/historical/live',
            mode,
            body: [{ target: [{ domain }], date_from: AI_DATA_START }],
          }).then((result) => ({ domain, result }))
        )
      ),
    ]);

    setCompareLoading(false);
    const err = extractError(metricsResult);
    if (err) {
      setCompareError(err);
    } else {
      setCompareItems(extractItems(metricsResult));
    }

    const byBrand: Record<string, HistoricalMentionPoint[]> = {};
    let anyHistoricalFailed = false;
    for (const { domain, result } of historicalResults) {
      if (extractError(result)) {
        anyHistoricalFailed = true;
        continue;
      }
      byBrand[domain] = [...extractItems(result)].reverse(); // API returns newest-first
    }
    setHistoricalByBrand(byBrand);
    if (anyHistoricalFailed) setHistoricalError('Some brands’ history could not be loaded.');
  }

  // --- Section 2: who dominates a category ---
  const [categoryInput, setCategoryInput] = useState('sustainable womenswear brands');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categoryItems, setCategoryItems] = useState<TopMentionedBrandItem[] | null>(null);

  async function handleCategory(e: SubmitEvent) {
    e.preventDefault();
    const keyword = categoryInput.trim();
    if (!keyword) return;

    setCategoryLoading(true);
    setCategoryError(null);
    setCategoryItems(null);

    const result = await runDataForSEO<TopMentionedBrandItem>({
      path: 'ai_optimization/llm_mentions/top_mentioned_brands/live',
      mode,
      body: [
        {
          target: [{ keyword }],
          location_code: location.location_code,
          language_code: location.language_code,
          limit: 10,
        },
      ],
    });

    setCategoryLoading(false);
    const err = extractError(result);
    if (err) {
      setCategoryError(err);
      return;
    }
    setCategoryItems(extractItems(result));
  }

  // --- Section 3: Google AI Mode SERP — the actual AI-generated answer, direct from Google ---
  const [aiModeQuery, setAiModeQuery] = useState('best sustainable gym leggings');
  const [aiModeLoading, setAiModeLoading] = useState(false);
  const [aiModeError, setAiModeError] = useState<string | null>(null);
  const [aiModeItem, setAiModeItem] = useState<AiModeItem | null>(null);

  async function handleAiMode(e: SubmitEvent) {
    e.preventDefault();
    const keyword = aiModeQuery.trim();
    if (!keyword) return;

    setAiModeLoading(true);
    setAiModeError(null);
    setAiModeItem(null);

    const result = await runDataForSEO<AiModeItem>({
      path: 'serp/google/ai_mode/live/advanced',
      mode,
      body: [{ keyword, location_code: location.location_code, language_code: location.language_code }],
    });

    setAiModeLoading(false);
    const err = extractError(result);
    if (err) {
      setAiModeError(err);
      return;
    }
    const items = extractItems(result);
    setAiModeItem(items[0] ?? null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-xl font-semibold text-neutral-100">AI Visibility</h2>
      <p className="mt-1 text-sm text-neutral-500">
        &ldquo;Measure how often AI assistants recommend your competitors — and whether you show up at all.&rdquo; Data covers
        LLM answers from {AI_DATA_START} onward.
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

      {/* Section 1: head-to-head brand comparison */}
      <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <h3 className="text-sm font-semibold text-neutral-100">Compare brands</h3>
        <p className="mt-1 text-xs text-neutral-500">Up to 10 domains, comma separated. Mentions across all tracked LLM platforms.</p>

        <form onSubmit={handleCompare} className="mt-3 flex gap-2">
          <input
            type="text"
            value={brandsInput}
            onChange={(e) => setBrandsInput(e.target.value)}
            placeholder="coordclothing.co.uk, asos.com, hm.com"
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={compareLoading}
            className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            {compareLoading ? 'Loading…' : 'Compare'}
          </button>
        </form>

        {compareError && <p className="mt-3 text-sm text-rose-300">{compareError}</p>}

        {compareItems && compareItems.length > 0 && (
          <div className="mt-5">
            <BarChart
              data={compareItems.map((it, i) => ({
                label: it.key,
                value: it.total.mentions,
                color: CATEGORICAL[i % CATEGORICAL.length],
              }))}
              maxValue={Math.max(...compareItems.map((it) => it.total.mentions), 1)}
            />
            <ul className="mt-4 space-y-1 text-xs text-neutral-400">
              {compareItems.map((it) => (
                <li key={it.key} className="flex justify-between">
                  <span>{it.key}</span>
                  <span className="tabular-nums text-neutral-300">
                    {it.total.mentions.toLocaleString()} mentions · {it.total.ai_search_volume.toLocaleString()} est. AI search volume
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {compareItems && compareItems.length === 0 && (
          <p className="mt-3 text-sm text-neutral-500">No mention data returned for these brands.</p>
        )}

        {Object.keys(historicalByBrand).length > 0 && (
          <div className="mt-6 border-t border-neutral-800 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-neutral-100">Mentions over time</h4>
              <div className="flex overflow-hidden rounded-md border border-neutral-700 text-xs">
                <button
                  type="button"
                  onClick={() => setHistoricalMetric('mentions')}
                  className={`px-2.5 py-1 ${historicalMetric === 'mentions' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:bg-neutral-800'}`}
                >
                  Mentions
                </button>
                <button
                  type="button"
                  onClick={() => setHistoricalMetric('ai_search_volume')}
                  className={`px-2.5 py-1 ${historicalMetric === 'ai_search_volume' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:bg-neutral-800'}`}
                >
                  Est. AI search volume
                </button>
              </div>
            </div>

            {historicalError && <p className="mt-2 text-xs text-rose-400">{historicalError}</p>}

            {(() => {
              const { labels, keys, values } = mergeTimeSeries(historicalByBrand, (p) => p.metrics[historicalMetric]);
              if (labels.length === 0) {
                return <p className="mt-3 text-sm text-neutral-500">No historical data returned for these brands.</p>;
              }
              return (
                <div className="mt-4">
                  <LineChart
                    labels={labels}
                    series={keys.map((k, i) => ({ label: k, color: CATEGORICAL[i % CATEGORICAL.length] }))}
                    values={values}
                  />
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Section 2: category discovery */}
      <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <h3 className="text-sm font-semibold text-neutral-100">Who dominates this category</h3>
        <p className="mt-1 text-xs text-neutral-500">A category or question, e.g. what you'd expect a customer to ask an AI assistant.</p>

        <form onSubmit={handleCategory} className="mt-3 flex gap-2">
          <input
            type="text"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            placeholder="sustainable womenswear brands"
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={categoryLoading}
            className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            {categoryLoading ? 'Loading…' : 'Find brands'}
          </button>
        </form>

        {categoryError && <p className="mt-3 text-sm text-rose-300">{categoryError}</p>}

        {categoryItems && categoryItems.length > 0 && (
          <div className="mt-5">
            <BarChart
              data={categoryItems.map((it, i) => ({
                label: it.brand,
                value: it.total.mentions,
                color: CATEGORICAL[i % CATEGORICAL.length],
              }))}
              maxValue={Math.max(...categoryItems.map((it) => it.total.mentions), 1)}
            />
          </div>
        )}

        {categoryItems && categoryItems.length === 0 && (
          <p className="mt-3 text-sm text-neutral-500">No brands returned for this category.</p>
        )}
      </div>

      {/* Section 3: Google AI Mode SERP — the actual AI-generated answer, not just mention counts */}
      <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <h3 className="text-sm font-semibold text-neutral-100">Google AI Mode</h3>
        <p className="mt-1 text-xs text-neutral-500">
          The actual AI Overview Google generates for a search — check whether you&rsquo;re cited, not just mentioned
          elsewhere. Only available in select countries; may return empty for some markets.
        </p>

        <form onSubmit={handleAiMode} className="mt-3 flex gap-2">
          <input
            type="text"
            value={aiModeQuery}
            onChange={(e) => setAiModeQuery(e.target.value)}
            placeholder="best sustainable gym leggings"
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={aiModeLoading}
            className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            {aiModeLoading ? 'Loading…' : 'Search'}
          </button>
        </form>

        {aiModeError && <p className="mt-3 text-sm text-rose-300">{aiModeError}</p>}

        {aiModeItem?.markdown && (
          <div className="mt-4 whitespace-pre-wrap rounded-md border border-neutral-800 bg-neutral-950/60 p-3 text-sm leading-relaxed text-neutral-300">
            {stripMarkdown(aiModeItem.markdown)}
          </div>
        )}

        {aiModeItem?.references && aiModeItem.references.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-neutral-600">Sources cited</p>
            <ul className="space-y-1">
              {[...new Map(aiModeItem.references.map((r) => [r.domain, r])).values()].map((ref) => (
                <li key={ref.domain} className="flex items-center justify-between gap-3 rounded bg-neutral-900 px-3 py-1.5 text-xs">
                  <span className="text-neutral-300">{ref.title ?? ref.domain}</span>
                  <span className="text-neutral-500">{ref.domain}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-neutral-600">
        &ldquo;Est. AI search volume&rdquo; is DataForSEO&rsquo;s estimate derived from Google People-Also-Ask data — a proxy for
        AI-adjacent demand, not a literal count of queries asked to AI assistants. Treat mentions as the harder number.
      </p>
    </div>
  );
}