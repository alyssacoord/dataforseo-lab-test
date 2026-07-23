import { NextResponse } from 'next/server';

interface FxCache {
  rate: number;
  date: string;
  fetchedAt: number;
}

let cached: FxCache | null = null;
const CACHE_MS = 24 * 60 * 60 * 1000; // 24h

export async function GET() {
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) {
    return NextResponse.json({ rate: cached.rate, date: cached.date });
  }

  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=GBP');
    const data = await res.json();
    const rate = data?.rates?.GBP;
    if (typeof rate !== 'number') throw new Error('Malformed FX response');

    cached = { rate, date: data.date, fetchedAt: Date.now() };
    return NextResponse.json({ rate: cached.rate, date: cached.date });
  } catch (err) {
    // Serve a stale cache rather than break the page if the FX API is down.
    if (cached) {
      return NextResponse.json({ rate: cached.rate, date: cached.date, stale: true });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Could not fetch exchange rate: ${message}` }, { status: 502 });
  }
}
