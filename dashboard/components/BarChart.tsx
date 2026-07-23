'use client';

interface BarDatum {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  maxValue?: number;
}

export function BarChart({ data, height = 140, maxValue = 100 }: BarChartProps) {
  return (
    <div className="flex gap-4" style={{ height }}>
      {data.map((d) => {
        const pct = Math.max(0, Math.min(100, (d.value / maxValue) * 100));
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center justify-end">
            <span className="mb-1 text-xs font-medium tabular-nums text-neutral-300">{d.value.toLocaleString()}</span>
            <div className="flex w-6 flex-1 items-end">
              <div
                className="w-full rounded-t-[4px] transition-opacity hover:opacity-80"
                style={{ height: `${pct}%`, backgroundColor: d.color, minHeight: d.value > 0 ? 2 : 0 }}
                title={`${d.label}: ${d.value}`}
              />
            </div>
            <span className="mt-1.5 text-center text-[11px] text-neutral-500">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
