'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Mode } from '@/lib/dataforseo';

interface ModeContextValue {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextValue | undefined>(undefined);
const STORAGE_KEY = 'coord-dataforseo-mode';

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>('sandbox');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'sandbox' || stored === 'live') {
      setModeState(stored);
    }
  }, []);

  const setMode = (next: Mode) => {
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used inside ModeProvider');
  return ctx;
}
