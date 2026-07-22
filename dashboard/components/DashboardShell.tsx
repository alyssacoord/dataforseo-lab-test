'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useMode } from './ModeProvider';

const NAV_ITEMS = [
  { href: '/competitive-set', label: 'Competitive Set', status: 'live' as const },
  { href: '/trend-detection', label: 'Trend Detection', status: 'live' as const },
  { href: '/ai-visibility', label: 'AI Visibility', status: 'live' as const },
  { href: '/search-visibility', label: 'Search Visibility', status: 'soon' as const },
];

interface CredStatus {
  credentialsLoaded: boolean;
  login: string | null;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { mode, setMode } = useMode();
  const [cred, setCred] = useState<CredStatus | null>(null);

  useEffect(() => {
    fetch('/api/dataforseo/status')
      .then((r) => r.json())
      .then(setCred)
      .catch(() => setCred({ credentialsLoaded: false, login: null }));
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-6 py-3">
        <div>
          <h1 className="text-sm font-semibold text-neutral-100">Coord — Competitive Intelligence</h1>
          <p className="text-xs text-neutral-500">Powered by DataForSEO</p>
        </div>

        <div className="flex items-center gap-5 text-xs">
          <span className={cred?.credentialsLoaded ? 'text-emerald-400' : 'text-rose-400'}>
            {cred === null
              ? 'checking credentials…'
              : cred.credentialsLoaded
                ? `credentials loaded (${cred.login})`
                : 'missing credentials'}
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={mode === 'live'}
            onClick={() => setMode(mode === 'sandbox' ? 'live' : 'sandbox')}
            className="flex items-center gap-2"
          >
            <span className={mode === 'sandbox' ? 'font-medium text-neutral-100' : 'text-neutral-500'}>Sandbox</span>
            <span className={`relative h-5 w-9 rounded-full transition-colors ${mode === 'live' ? 'bg-rose-500' : 'bg-neutral-700'}`}>
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  mode === 'live' ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </span>
            <span className={mode === 'live' ? 'font-medium text-rose-400' : 'text-neutral-500'}>Live</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-56 shrink-0 border-r border-neutral-800 bg-neutral-950 p-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-1 flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
              >
                <span>{item.label}</span>
                {item.status === 'soon' && (
                  <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-500">
                    soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
