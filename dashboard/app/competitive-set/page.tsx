'use client';

import { useMemo, useState, type MouseEvent, type SubmitEvent } from 'react';
import { useMode } from '@/components/ModeProvider';
import { runDataForSEO, extractItems, extractError, extractTotalCount } from '@/lib/dataforseo';
import { useCompetitiveSet } from '@/lib/useCompetitiveSet';
import { LOCATIONS } from '@/lib/locations';
import { FASHION_KEYWORD_REGEX } from '@/lib/keywordVocabulary';
import { CATEGORICAL } from '@/lib/palette';
import { BarChart } from '@/components/BarChart';
import { useFxRate } from '@/lib/useFxRate';
import { formatUsdToGbp } from '@/lib/currency';
import type { CompetitorDomainItem, DomainIntersectionItem } from '@/lib/types';

type SortBy = 'intersections' | 'etv';
type FilterMode = 'none' | 'regex' | 'langchain';

interface OverlapState {
  loading: boolean;
  error: string | null;
  items: DomainIntersectionItem[];
  totalCount: number | null;
}

interface ComparisonRow {
  sharedKeywords: number;
  avgPositionOnShared: number | null; // averaged from this run's own sample, not an add-time snapshot
  count: number | null; // peer's own total ranking-keyword footprint
  etv: number | null; // peer's own traffic value
  adEquivalentCost: number | null; // peer's own ad-equivalent value
}

function OverlapPanel({ overlap, filterMode }: { overlap?: OverlapState; filterMode: FilterMode }) {
  if (!overlap) return null;
  if (overlap.loading) return <p className="px-4 py-3 text-xs text-neutral-500">Loading overlapping keywords…</p>;
  if (overlap.error) return <p className="px-4 py-3 text-xs text-rose-400">{overlap.error}</p>;
  if (overlap.items.length === 0) return <p className="px-4 py-3 text-xs text-neutral-500">No overlapping keywords returned.</p>;

  return (
    <div className="border-t border-neutral-800 px-4 py-3">
      {overlap.totalCount !== null && (
        <p className="mb-2 text-[11px] text-neutral-600">
          {overlap.totalCount.toLocaleString()} shared keywords total{filterMode === 'regex' ? ' (fashion vocabulary only)' : ''}{' '}
          — showing top {overlap.items.length} by volume
        </p>
      )}
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-neutral-500">
            <th className="pb-2 font-normal">Keyword</th>
            <th className="pb-2 font-normal">Volume</th>
            <th className="pb-2 font-normal">Your position</th>
            <th className="pb-2 font-normal">Their position</th>
          </tr>
        </thead>
        <tbody>
          {overlap.items.slice(0, 10).map((kw, i) => (
            <tr key={`${kw.keyword_data.keyword}-${i}`} className="border-t border-neutral-800/60 text-neutral-300">
              <td className="py-1.5 pr-2">{kw.keyword_data.keyword}</td>
              <td className="py-1.5 pr-2">{kw.keyword_data.keyword_info?.search_volume ?? '—'}</td>
              <td className="py-1.5 pr-2">{kw.first_domain_serp_element?.rank_absolute ?? '—'}</td>
              <td className="py-1.5">{kw.second_domain_serp_element?.rank_absolute ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CompetitiveSetPage() {
  const { mode } = useMode();
  const fx = useFxRate();

  const [domain, setDomain] = useState('very.co.uk');
  const [searchedDomain, setSearchedDomain] = useState('very.co.uk');
  const [location, setLocation] = useState<(typeof LOCATIONS)[number]>(LOCATIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawCandidates, setRawCandidates] = useState<CompetitorDomainItem[]>([]);
  const [meta, setMeta] = useState<{ elapsedMs?: number; httpStatus?: number } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [overlaps, setOverlaps] = useState<Record<string, OverlapState>>({});
  const [filterMode, setFilterMode] = useState<FilterMode>('none');

  const [sortBy, setSortBy] = useState<SortBy>('intersections');
  const [minIntersections, setMinIntersections] = useState(0);

  const [manualDomain, setManualDomain] = useState('');

  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [comparisonResults, setComparisonResults] = useState<Record<string, ComparisonRow | null>>({});

  const competitiveSet = useCompetitiveSet(searchedDomain);

  const candidates = useMemo(() => {
    return rawCandidates
      .filter((item) => item.intersections >= minIntersections)
      .sort((a, b) => {
        if (sortBy === 'etv') {
          return (b.full_domain_metrics?.organic?.etv ?? 0) - (a.full_domain_metrics?.organic?.etv ?? 0);
        }
        return b.intersections - a.intersections;
      });
  }, [rawCandidates, sortBy, minIntersections]);

  async function handleSearch(e: SubmitEvent) {
    e.preventDefault();
    const target = domain.trim();
    if (!target) return;

    setSearchedDomain(target);
    setLoading(true);
    setError(null);
    setRawCandidates([]);
    setExpanded(null);
    setOverlaps({});

    const result = await runDataForSEO<CompetitorDomainItem>({
      path: 'dataforseo_labs/google/competitors_domain/live',
      mode,
      body: [{ target, location_code: location.location_code, language_code: location.language_code, limit: 20 }],
    });

    setLoading(false);
    setMeta({ elapsedMs: result.elapsedMs, httpStatus: result.httpStatus });

    const taskError = extractError(result);
    if (taskError) {
      setError(taskError);
      return;
    }

    setRawCandidates(extractItems(result));
  }

  async function handleExpand(candidateDomain: string) {
    if (expanded === candidateDomain) {
      setExpanded(null);
      return;
    }
    setExpanded(candidateDomain);

    if (overlaps[candidateDomain]) return; // already fetched under the current fashion-only setting

    setOverlaps((prev) => ({ ...prev, [candidateDomain]: { loading: true, error: null, items: [], totalCount: null } }));

    const body: Record<string, unknown> = {
      target1: searchedDomain,
      target2: candidateDomain,
      location_code: location.location_code,
      language_code: location.language_code,
      limit: 20,
      order_by: ['keyword_data.keyword_info.search_volume,desc'],
    };
    if (filterMode === 'regex') {
      body.filters = ['keyword_data.keyword', 'regex', FASHION_KEYWORD_REGEX];
    }

    const result = await runDataForSEO<DomainIntersectionItem>({
      path: 'dataforseo_labs/google/domain_intersection/live',
      mode,
      body: [body],
    });

    const taskError = extractError(result);
    const items = taskError ? [] : extractItems(result);
    const totalCount = taskError ? null : extractTotalCount(result);

    setOverlaps((prev) => ({ ...prev, [candidateDomain]: { loading: false, error: taskError, items, totalCount } }));
  }

  function selectFilterMode(next: FilterMode) {
    if (next === filterMode) return;
    setFilterMode(next);
    setOverlaps({}); // cached results reflect the old filter setting — clear so the next expand refetches
    setExpanded(null);
  }

  async function handleCompareAll() {
    const peers = competitiveSet.set.map((c) => c.domain);
    if (peers.length === 0) return;

    setComparisonLoading(true);
    setComparisonError(null);
    setComparisonResults({});

    const intersectionBody: Record<string, unknown> = {
      location_code: location.location_code,
      language_code: location.language_code,
      limit: 20, // enough to average a real "avg position on shared keywords", not just get the total
      order_by: ['keyword_data.keyword_info.search_volume,desc'],
    };
    if (filterMode === 'regex') {
      intersectionBody.filters = ['keyword_data.keyword', 'regex', FASHION_KEYWORD_REGEX];
    }

    const results = await Promise.all(
      peers.map(async (peer) => {
        const [intersectionResult, rankedResult] = await Promise.all([
          runDataForSEO<DomainIntersectionItem>({
            path: 'dataforseo_labs/google/domain_intersection/live',
            mode,
            body: [{ ...intersectionBody, target1: searchedDomain, target2: peer }],
          }),
          // Peer's own domain-level footprint — works for ANY peer, including manually-added
          // ones with no add-time snapshot. limit:1 is enough — confirmed the aggregate
          // metrics.organic fields are independent of the item limit.
          runDataForSEO<unknown>({
            path: 'dataforseo_labs/google/ranked_keywords/live',
            mode,
            body: [{ target: peer, location_code: location.location_code, language_code: location.language_code, limit: 1 }],
          }),
        ]);
        return { peer, intersectionResult, rankedResult };
      })
    );

    setComparisonLoading(false);

    const next: Record<string, ComparisonRow | null> = {};
    let anyFailed = false;
    for (const { peer, intersectionResult, rankedResult } of results) {
      const intersectionErr = extractError(intersectionResult);
      if (intersectionErr) {
        anyFailed = true;
        next[peer] = null;
        continue;
      }

      const sharedKeywords = extractTotalCount(intersectionResult) ?? 0;
      const items = extractItems(intersectionResult);
      const positions = items
        .map((it) => it.second_domain_serp_element?.rank_absolute)
        .filter((p): p is number => p !== undefined && p !== null);
      const avgPositionOnShared = positions.length > 0 ? positions.reduce((a, b) => a + b, 0) / positions.length : null;

      const rankedData = rankedResult.data?.tasks?.[0]?.result?.[0] as
        | { metrics?: { organic?: { count?: number; etv?: number; estimated_paid_traffic_cost?: number } } }
        | undefined;
      const organic = rankedData?.metrics?.organic;

      next[peer] = {
        sharedKeywords,
        avgPositionOnShared,
        count: organic?.count ?? null,
        etv: organic?.etv ?? null,
        adEquivalentCost: organic?.estimated_paid_traffic_cost ?? null,
      };
    }
    setComparisonResults(next);
    if (anyFailed) setComparisonError('Some peers could not be compared — see the chart for which ones came back.');
  }

  function toggleConfirmed(item: CompetitorDomainItem, e: MouseEvent) {
    e.stopPropagation();
    if (competitiveSet.has(item.domain)) {
      competitiveSet.remove(item.domain);
      return;
    }
    competitiveSet.add({
      domain: item.domain,
      addedAt: new Date().toISOString(),
      source: 'suggested',
      intersections: item.intersections,
      etv: item.full_domain_metrics?.organic?.etv,
      count: item.full_domain_metrics?.organic?.count,
      estimatedPaidTrafficCost: item.full_domain_metrics?.organic?.estimated_paid_traffic_cost,
      avgPosition: item.avg_position,
    });
  }

  function handleManualAdd(e: SubmitEvent) {
    e.preventDefault();
    const targets = manualDomain
      .split(/[,\n]/)
      .map((d) => d.trim())
      .filter(Boolean);
    if (targets.length === 0) return;
    targets.forEach((target) => competitiveSet.add({ domain: target, addedAt: new Date().toISOString(), source: 'manual' }));
    setManualDomain('');
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-xl font-semibold text-neutral-100">Competitive Set Auto-Detection</h2>
      <p className="mt-1 text-sm text-neutral-500">
        &ldquo;Agents propose your competitive set on day one — you just add or remove brands.&rdquo; Enter a domain to see who
        DataForSEO thinks competes with it, ranked by keyword overlap.
      </p>

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="e.g. coordclothing.co.uk"
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
          {loading ? 'Searching…' : 'Find competitors'}
        </button>
      </form>

      <p className="mt-2 text-xs text-neutral-600">
        Location: {location.label} ({location.location_code}) · Language: {location.language_code} · Mode:{' '}
        <span className="font-medium">{mode}</span>
        {meta?.httpStatus !== undefined && (
          <>
            {' '}
            · last call: HTTP {meta.httpStatus} in {meta.elapsedMs}ms
          </>
        )}
      </p>

      {/* Confirmed competitive set — the actual product artifact, persisted per customer domain */}
      <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-100">Your Competitive Set — {searchedDomain}</h3>
          <span className="text-xs text-neutral-500">{competitiveSet.set.length} brand(s)</span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="text-neutral-500">Keyword filter for &ldquo;Show overlap&rdquo;</span>
          <div className="flex overflow-hidden rounded-md border border-neutral-700">
            <button
              type="button"
              onClick={() => selectFilterMode('none')}
              className={`px-2.5 py-1 ${filterMode === 'none' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:bg-neutral-800'}`}
            >
              None
            </button>
            <button
              type="button"
              onClick={() => selectFilterMode('regex')}
              className={`px-2.5 py-1 ${filterMode === 'regex' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:bg-neutral-800'}`}
            >
              Fashion vocabulary
            </button>
            <button
              type="button"
              disabled
              title="Planned: semantic keyword filtering via a LangChain agent, replacing this vocabulary-regex stopgap"
              className="cursor-not-allowed px-2.5 py-1 text-neutral-700"
            >
              LangChain (coming soon)
            </button>
          </div>
        </div>
        {filterMode === 'regex' && (
          <p className="mt-1 text-[11px] text-neutral-600">
            Filters out brand-name noise (nike, mango, birkenstock…) using a garment-vocabulary regex — a stopgap until the
            LangChain option above is built.
          </p>
        )}

        {competitiveSet.set.length === 0 ? (
          <p className="mt-2 text-xs text-neutral-500">
            Nothing confirmed yet. Add suggestions from the list below, or add brands directly.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {competitiveSet.set.map((c) => (
              <li key={c.domain} className="rounded-md bg-neutral-950/60 text-xs text-neutral-200">
                <div className="flex items-center justify-between px-3 py-2">
                  <span>
                    {c.domain}{' '}
                    <span className="text-neutral-600">
                      {c.source === 'manual' ? (
                        '· added manually'
                      ) : (
                        <>
                          · {c.intersections ?? '—'} shared keywords
                          {c.count !== undefined && <> · {c.count.toLocaleString()} total ranking keywords</>}
                          {c.etv !== undefined && <> · est. traffic value {Math.round(c.etv).toLocaleString()}</>}
                          {c.estimatedPaidTrafficCost !== undefined &&
                            (() => {
                              const { text, title } = formatUsdToGbp(c.estimatedPaidTrafficCost, fx);
                              return (
                                <>
                                  {' '}
                                  · <span title={title}>{text}</span> ad-equivalent
                                </>
                              );
                            })()}
                        </>
                      )}
                    </span>
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleExpand(c.domain)}
                      className="text-neutral-500 hover:text-neutral-300"
                    >
                      {expanded === c.domain ? 'Hide overlap ▲' : 'Show overlap ▾'}
                    </button>
                    <button
                      type="button"
                      onClick={() => competitiveSet.remove(c.domain)}
                      className="text-neutral-500 hover:text-rose-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {expanded === c.domain && <OverlapPanel overlap={overlaps[c.domain]} filterMode={filterMode} />}
              </li>
            ))}
          </ul>
        )}

        {competitiveSet.set.length >= 2 && (
          <div className="mt-3 rounded-md border border-neutral-800 bg-neutral-950/40 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-neutral-200">
                Peer overlap comparison — shared keywords vs. {searchedDomain}
                {filterMode === 'regex' ? ' (fashion vocabulary only)' : ''}
              </p>
              <button
                type="button"
                onClick={handleCompareAll}
                disabled={comparisonLoading}
                className="shrink-0 rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
              >
                {comparisonLoading ? 'Comparing…' : 'Compare all'}
              </button>
            </div>

            {comparisonError && <p className="mt-2 text-xs text-rose-400">{comparisonError}</p>}

            {Object.keys(comparisonResults).length > 0 &&
              (() => {
                const entries = Object.entries(comparisonResults).filter(
                  (entry): entry is [string, ComparisonRow] => entry[1] !== null
                );
                entries.sort((a, b) => b[1].sharedKeywords - a[1].sharedKeywords);
                if (entries.length === 0) {
                  return <p className="mt-2 text-xs text-neutral-500">No comparisons came back — try again.</p>;
                }
                const topCount = entries[0][1].sharedKeywords;

                return (
                  <div className="mt-4">
                    <BarChart
                      data={entries.map(([peer, row], i) => ({
                        label: peer,
                        value: row.sharedKeywords,
                        color: CATEGORICAL[i % CATEGORICAL.length],
                      }))}
                      maxValue={Math.max(topCount, 1)}
                    />

                    <table className="mt-5 w-full text-left text-xs">
                      <thead>
                        <tr className="text-neutral-500">
                          <th className="pb-2 font-normal">Peer</th>
                          <th className="pb-2 font-normal">Shared keywords</th>
                          <th className="pb-2 font-normal">% of tightest peer</th>
                          <th className="pb-2 font-normal">Total ranking keywords</th>
                          <th className="pb-2 font-normal">Avg position (shared)</th>
                          <th className="pb-2 font-normal">Est. traffic value</th>
                          <th className="pb-2 font-normal">Est. ad-equivalent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map(([peer, row]) => (
                          <tr key={peer} className="border-t border-neutral-800/60 text-neutral-300">
                            <td className="py-1.5 pr-2">{peer}</td>
                            <td className="py-1.5 pr-2 tabular-nums">{row.sharedKeywords.toLocaleString()}</td>
                            <td className="py-1.5 pr-2 tabular-nums">{Math.round((row.sharedKeywords / topCount) * 100)}%</td>
                            <td className="py-1.5 pr-2 tabular-nums">{row.count?.toLocaleString() ?? '—'}</td>
                            <td className="py-1.5 pr-2 tabular-nums">{row.avgPositionOnShared?.toFixed(1) ?? '—'}</td>
                            <td className="py-1.5 pr-2 tabular-nums">
                              {row.etv !== null ? Math.round(row.etv).toLocaleString() : '—'}
                            </td>
                            <td className="py-1.5 tabular-nums">
                              {row.adEquivalentCost !== null ? (
                                (() => {
                                  const { text, title } = formatUsdToGbp(row.adEquivalentCost, fx);
                                  return <span title={title}>{text}</span>;
                                })()
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-2 text-[11px] text-neutral-600">
                      Avg position is sampled from this run's SERP data.
                    </p>
                  </div>
                );
              })()}
          </div>
        )}

        <form onSubmit={handleManualAdd} className="mt-3 flex gap-2">
          <textarea
            value={manualDomain}
            onChange={(e) => setManualDomain(e.target.value)}
            placeholder="add brands directly — one, or paste several separated by commas or new lines, e.g. next.co.uk, argos.co.uk"
            rows={2}
            className="flex-1 resize-none rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            className="self-start rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800"
          >
            Add
          </button>
        </form>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-rose-900 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">{error}</div>
      )}

      {rawCandidates.length > 0 && (
        <>
          <h3 className="mt-8 text-sm font-semibold text-neutral-100">Suggested competitors</h3>

          <div className="mt-3 flex flex-wrap items-center gap-4 rounded-md border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Sort by</span>
              <div className="flex overflow-hidden rounded-md border border-neutral-700">
                <button
                  type="button"
                  onClick={() => setSortBy('intersections')}
                  className={`px-2.5 py-1 ${sortBy === 'intersections' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:bg-neutral-800'}`}
                >
                  Shared keywords
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('etv')}
                  className={`px-2.5 py-1 ${sortBy === 'etv' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:bg-neutral-800'}`}
                >
                  Traffic value
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2">
              <span className="text-neutral-500">Min shared keywords</span>
              <input
                type="number"
                min={0}
                value={minIntersections}
                onChange={(e) => setMinIntersections(Math.max(0, Number(e.target.value) || 0))}
                className="w-16 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-100 focus:border-neutral-500 focus:outline-none"
              />
            </label>

            <span className="text-neutral-600">
              Showing {candidates.length} of {rawCandidates.length}
            </span>
          </div>
        </>
      )}

      {!error && !loading && rawCandidates.length === 0 && meta !== null && (
        <p className="mt-6 text-sm text-neutral-500">No candidates returned for this domain.</p>
      )}

      {!error && !loading && rawCandidates.length > 0 && candidates.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">
          No candidates meet the current filter — lower &ldquo;Min shared keywords&rdquo;.
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {candidates.map((item) => {
          const isOpen = expanded === item.domain;
          const overlap = overlaps[item.domain];
          const organic = item.full_domain_metrics?.organic;
          const isConfirmed = competitiveSet.has(item.domain);

          return (
            <li key={item.domain} className="rounded-lg border border-neutral-800 bg-neutral-900/50">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <button type="button" onClick={() => handleExpand(item.domain)} className="flex-1 text-left">
                  <p className="text-sm font-medium text-neutral-100">{item.domain}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {item.intersections} shared keywords · avg position {item.avg_position?.toFixed(1)}
                    {organic?.count !== undefined && <> · {organic.count.toLocaleString()} total ranking keywords</>}
                    {organic?.etv !== undefined && <> · est. traffic value {Math.round(organic.etv).toLocaleString()}</>}
                    {organic?.estimated_paid_traffic_cost !== undefined &&
                      (() => {
                        const { text, title } = formatUsdToGbp(organic.estimated_paid_traffic_cost, fx);
                        return (
                          <>
                            {' '}
                            · est. ad-equivalent value <span title={title}>{text}</span>
                          </>
                        );
                      })()}
                    {organic?.pos_1 !== undefined && <> · {organic.pos_1.toLocaleString()} #1 rankings</>}
                  </p>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => toggleConfirmed(item, e)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                      isConfirmed
                        ? 'bg-emerald-900/60 text-emerald-300 hover:bg-emerald-900'
                        : 'border border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    {isConfirmed ? '✓ In your set' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExpand(item.domain)}
                    className="text-xs text-neutral-500 hover:text-neutral-300"
                  >
                    {isOpen ? 'Hide overlap ▲' : 'Show overlap ▾'}
                  </button>
                </div>
              </div>

              {isOpen && <OverlapPanel overlap={overlap} filterMode={filterMode} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
