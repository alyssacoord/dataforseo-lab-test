export interface YearMonthPoint {
  year: number;
  month: number;
}

export function monthKey(p: YearMonthPoint): string {
  return `${p.year}-${String(p.month).padStart(2, '0')}`;
}

// Merges N per-entity (brand/domain/etc.) year-month series into one aligned
// label set for a multi-series LineChart, null-filling any entity's missing months.
export function mergeTimeSeries<T extends YearMonthPoint>(
  byKey: Record<string, T[]>,
  getValue: (point: T) => number | null | undefined
) {
  const keys = Object.keys(byKey);
  const labelSet = new Set<string>();
  keys.forEach((k) => byKey[k].forEach((p) => labelSet.add(monthKey(p))));
  const labels = [...labelSet].sort();

  const values = keys.map((k) =>
    labels.map((label) => {
      const point = byKey[k].find((p) => monthKey(p) === label);
      return point ? (getValue(point) ?? null) : null;
    })
  );

  return { labels, keys, values };
}
