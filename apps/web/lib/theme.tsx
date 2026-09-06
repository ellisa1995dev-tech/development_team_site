'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'te_theme';

export type ThemeMode = 'light' | 'dark' | 'custom';

export interface ThemeState {
  mode: ThemeMode;
  /** Only meaningful when mode is 'custom'. */
  customColor: string;
  ready: boolean;
  setMode: (mode: ThemeMode) => void;
  setCustomColor: (hex: string) => void;
  reset: () => void;
}

export const DEFAULT_CUSTOM = '#0f2a3d';

const ThemeContext = createContext<ThemeState | null>(null);

/* ------------------------------------------------------------------ colour */

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function normaliseHex(input: string): string | null {
  const v = input.trim().replace(/^#/, '');
  const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
  return /^[0-9a-fA-F]{6}$/.test(full) ? `#${full.toLowerCase()}` : null;
}

function toRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => clamp(c).toString(16).padStart(2, '0')).join('')}`;
}

/** WCAG relative luminance — decides whether text should be dark or light. */
export function luminance(hex: string): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = toRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Moves a colour toward white or black by `amount` (0-1). */
function shift(hex: string, amount: number, toward: 'light' | 'dark'): string {
  const [r, g, b] = toRgb(hex);
  const target = toward === 'light' ? 255 : 0;
  return toHex(r + (target - r) * amount, g + (target - g) * amount, b + (target - b) * amount);
}

function mix(hex: string, other: string, amount: number): string {
  const [r1, g1, b1] = toRgb(hex);
  const [r2, g2, b2] = toRgb(other);
  return toHex(r1 + (r2 - r1) * amount, g1 + (g2 - g1) * amount, b1 + (b2 - b1) * amount);
}

/**
 * Derives a full, readable token set from a single background colour.
 *
 * Everything is computed relative to the background's luminance, so a light
 * choice gets dark text and subtly darker surfaces, and a dark choice gets the
 * inverse — without the caller having to pick eight colours by hand.
 */
export function tokensFor(bg: string): Record<string, string> {
  const isDark = luminance(bg) < 0.4;
  const away = isDark ? 'light' : 'dark';

  return {
    '--bg-page': bg,
    // Cards lift off the page rather than matching it exactly. On a light
    // background that means pulling toward white; on a dark one, away from it.
    '--bg-surface': isDark ? shift(bg, 0.08, 'light') : mix(bg, '#ffffff', 0.65),
    '--bg-subtle': shift(bg, isDark ? 0.04 : 0.03, away),
    '--bg-inset': shift(bg, isDark ? 0.11 : 0.06, away),
    '--fg': isDark ? '#f4f7f6' : '#0a0d0c',
    '--fg-muted': isDark ? mix(bg, '#ffffff', 0.62) : mix(bg, '#000000', 0.55),
    '--fg-subtle': isDark ? mix(bg, '#ffffff', 0.42) : mix(bg, '#000000', 0.38),
    '--border': shift(bg, isDark ? 0.16 : 0.1, away),
    '--border-strong': shift(bg, isDark ? 0.28 : 0.18, away),
    '--scheme': isDark ? 'dark' : 'light',
  };
}

const PRESETS: Record<Exclude<ThemeMode, 'custom'>, string> = {
  light: '#ffffff',
  dark: '#0a0d0c',
};

export function backgroundFor(mode: ThemeMode, customColor: string): string {
  return mode === 'custom' ? customColor : PRESETS[mode];
}

/** Writes the derived tokens onto <html>. Exported so the pre-paint script can reuse the shape. */
export function applyTheme(mode: ThemeMode, customColor: string) {
  const bg = backgroundFor(mode, customColor);
  const tokens = tokensFor(bg);
  const root = document.documentElement;

  for (const [key, value] of Object.entries(tokens)) {
    if (key === '--scheme') {
      root.dataset.scheme = value;
      root.style.colorScheme = value;
    } else {
      root.style.setProperty(key, value);
    }
  }
  root.dataset.theme = mode;
}

/* ---------------------------------------------------------------- provider */

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [customColor, setCustomColorState] = useState(DEFAULT_CUSTOM);
  const [ready, setReady] = useState(false);

  // Read the stored preference. The inline script in the layout has already
  // painted it; this just syncs React's copy so the controls show the truth.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { mode?: ThemeMode; customColor?: string };
        if (saved.mode === 'light' || saved.mode === 'dark' || saved.mode === 'custom') setModeState(saved.mode);
        const hex = saved.customColor ? normaliseHex(saved.customColor) : null;
        if (hex) setCustomColorState(hex);
      }
    } catch {
      /* storage blocked — defaults stand */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyTheme(mode, customColor);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, customColor }));
    } catch {
      /* ignore */
    }
  }, [mode, customColor, ready]);

  const setCustomColor = useCallback((hex: string) => {
    const valid = normaliseHex(hex);
    if (valid) setCustomColorState(valid);
  }, []);

  const reset = useCallback(() => {
    setModeState('light');
    setCustomColorState(DEFAULT_CUSTOM);
  }, []);

  const value = useMemo<ThemeState>(
    () => ({ mode, customColor, ready, setMode: setModeState, setCustomColor, reset }),
    [mode, customColor, ready, setCustomColor, reset],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
