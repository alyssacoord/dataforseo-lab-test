'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ConfirmedCompetitor } from './types';

const STORAGE_KEY = 'coord-competitive-set';

type Store = Record<string, ConfirmedCompetitor[]>;

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function readStore(): Store {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function useCompetitiveSet(customerDomain: string) {
  const key = normalizeDomain(customerDomain);
  const [set, setSet] = useState<ConfirmedCompetitor[]>([]);

  useEffect(() => {
    setSet(readStore()[key] ?? []);
  }, [key]);

  const persist = useCallback(
    (next: ConfirmedCompetitor[]) => {
      setSet(next);
      const store = readStore();
      store[key] = next;
      writeStore(store);
    },
    [key]
  );

  const add = useCallback(
    (competitor: ConfirmedCompetitor) => {
      const normalized = { ...competitor, domain: normalizeDomain(competitor.domain) };
      persist([...set.filter((c) => c.domain !== normalized.domain), normalized]);
    },
    [set, persist]
  );

  const remove = useCallback(
    (domain: string) => {
      const normalized = normalizeDomain(domain);
      persist(set.filter((c) => c.domain !== normalized));
    },
    [set, persist]
  );

  const has = useCallback((domain: string) => set.some((c) => c.domain === normalizeDomain(domain)), [set]);

  return { set, add, remove, has };
}
