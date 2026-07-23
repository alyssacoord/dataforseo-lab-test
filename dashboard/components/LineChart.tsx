'use client';

import { useRef, useState } from 'react';
import { CHART_TOKENS } from '@/lib/palette';

interface LineChartSeries {
  label: string;
  color: string;
}

interface LineChartProps {
  labels: string[];
  series: LineChartSeries[];
  values: (number | null)[][]; // one array per series, aligned to labels
  height?: number;
  yMax?: number;
}

const VIEW_WIDTH = 640;
const MIN_PAD_LEFT = 34; // enough for a narrow scale like Trend Detection's 0-100 index
const CHAR_WIDTH_PX = 5.2; // rough average glyph width at fontSize 9, digits + comma
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 26;

// Rounds up to a "nice" 1/2/5 * 10^n ceiling so axis ticks read as clean numbers.
function niceMax(raw: number): number {
  if (raw <= 0) return 1;
  const exponent = Math.floor(Math.log10(raw));
  const fraction = raw / 10 ** exponent;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * 10 ** exponent;
}

function formatTick(v: number): string {
  return v >= 1000 ? v.toLocaleString() : String(v);
}

export function LineChart({ labels, series, values, height = 220, yMax }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const n = labels.length;
  const plotHeight = height - PAD_TOP - PAD_BOTTOM;

  const resolvedYMax =
    yMax ??
    niceMax(Math.max(...values.flat().filter((v): v is number => v !== null && v !== undefined), 1));

  const gridSteps = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(resolvedYMax * f));

  // Left padding scales with the widest tick label so large numbers (thousands+) don't
  // render past x=0 and get clipped by the SVG viewBox — that's what "blank axis" was.
  const widestTickChars = Math.max(...gridSteps.map((s) => formatTick(s).length));
  const padLeft = Math.max(MIN_PAD_LEFT, Math.ceil(widestTickChars * CHAR_WIDTH_PX) + 16);

  const plotWidth = VIEW_WIDTH - padLeft - PAD_RIGHT;

  const xAt = (i: number) => padLeft + (n <= 1 ? 0 : (i / (n - 1)) * plotWidth);
  const yAt = (v: number) => PAD_TOP + (1 - v / resolvedYMax) * plotHeight;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * VIEW_WIDTH;
    const ratio = n <= 1 ? 0 : (relX - padLeft) / plotWidth;
    const idx = Math.round(ratio * (n - 1));
    setHoverIndex(Math.min(n - 1, Math.max(0, idx)));
  }

  const tooltipLeft = hoverIndex !== null ? (xAt(hoverIndex) / VIEW_WIDTH) * 100 : 0;
  const flipTooltip = tooltipLeft > 65;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        className="w-full"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {gridSteps.map((step) => (
          <g key={step}>
            <line
              x1={padLeft}
              x2={VIEW_WIDTH - PAD_RIGHT}
              y1={yAt(step)}
              y2={yAt(step)}
              stroke={CHART_TOKENS.gridline}
              strokeWidth={1}
            />
            <text x={padLeft - 8} y={yAt(step) + 3} textAnchor="end" fontSize={9} fill={CHART_TOKENS.textMuted}>
              {formatTick(step)}
            </text>
          </g>
        ))}

        {series.map((s, si) => {
          const pts = values[si]
            .map((v, i) => (v === null ? null : `${xAt(i)},${yAt(v)}`))
            .filter((p): p is string => p !== null)
            .join(' ');
          return <polyline key={s.label} points={pts} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />;
        })}

        {hoverIndex !== null && (
          <line
            x1={xAt(hoverIndex)}
            x2={xAt(hoverIndex)}
            y1={PAD_TOP}
            y2={height - PAD_BOTTOM}
            stroke={CHART_TOKENS.axis}
            strokeWidth={1}
          />
        )}

        {series.map((s, si) => {
          const v = hoverIndex !== null ? values[si][hoverIndex] : null;
          if (v === null || v === undefined || hoverIndex === null) return null;
          return (
            <circle
              key={s.label}
              cx={xAt(hoverIndex)}
              cy={yAt(v)}
              r={4}
              fill={s.color}
              stroke={CHART_TOKENS.surface}
              strokeWidth={2}
            />
          );
        })}

        {n > 0 && (
          <>
            <text x={xAt(0)} y={height - 8} textAnchor="start" fontSize={9} fill={CHART_TOKENS.textMuted}>
              {labels[0]}
            </text>
            <text x={xAt(n - 1)} y={height - 8} textAnchor="end" fontSize={9} fill={CHART_TOKENS.textMuted}>
              {labels[n - 1]}
            </text>
          </>
        )}
      </svg>

      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute top-2 min-w-32 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs shadow-lg"
          style={{ left: `${tooltipLeft}%`, transform: flipTooltip ? 'translateX(-100%)' : 'none' }}
        >
          <p className="mb-1 text-neutral-500">{labels[hoverIndex]}</p>
          {series.map((s, si) => {
            const v = values[si][hoverIndex];
            return (
              <div key={s.label} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <span className="inline-block h-0.5 w-3" style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
                <span className="font-medium tabular-nums text-neutral-100">{v !== null && v !== undefined ? formatTick(v) : '—'}</span>
              </div>
            );
          })}
        </div>
      )}

      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-3" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
