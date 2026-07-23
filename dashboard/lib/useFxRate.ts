'use client';

import { useEffect, useState } from 'react';

export interface FxRate {
  rate: number; // USD -> GBP multiplier
  date: string; // as-of date from the FX source
}

export function useFxRate(): FxRate | null {
  const [fx, setFx] = useState<FxRate | null>(null);

  useEffect(() => {
    fetch('/api/fx-rate')
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.rate === 'number' && typeof d.date === 'string') {
          setFx({ rate: d.rate, date: d.date });
        }
      })
      .catch(() => {}); // formatAdEquivalent degrades to USD when fx is null
  }, []);

  return fx;
}
