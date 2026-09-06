'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme, normaliseHex, luminance, type ThemeMode } from '@/lib/theme';

/** A few tasteful starting points so nobody has to reach for the colour wheel. */
const SWATCHES: Array<{ hex: string; label: string }> = [
  { hex: '#0f2a3d', label: 'Midnight' },
  { hex: '#12261c', label: 'Forest' },
  { hex: '#1c1b22', label: 'Graphite' },
  { hex: '#f6f4ee', label: 'Paper' },
  { hex: '#eef3f7', label: 'Mist' },
  { hex: '#f3efe7', label: 'Sand' },
];

export default function ThemePicker() {
  const { mode, customColor, setMode, setCustomColor, reset, ready } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(customColor);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setDraft(customColor), [customColor]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!ready) return null;

  const pick = (next: ThemeMode) => setMode(next);

  const applyHex = (hex: string) => {
    const valid = normaliseHex(hex);
    if (!valid) return;
    setCustomColor(valid);
    setMode('custom');
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Change background colour"
        className="grid h-9 w-9 place-items-center rounded-lg border transition-all duration-300 hover:scale-105"
        style={{ borderColor: 'var(--border-strong)', background: 'var(--bg-surface)' }}
      >
        <span
          className="h-4 w-4 rounded-full border"
          style={{
            background: mode === 'custom' ? customColor : mode === 'dark' ? '#0a0d0c' : '#ffffff',
            borderColor: 'var(--border-strong)',
          }}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Background colour"
          className="absolute right-0 top-11 z-50 w-64 animate-scale-in rounded-2xl p-4 shadow-lift"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Background</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => pick('light')}
              aria-pressed={mode === 'light'}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                mode === 'light' ? 'border-grass-500 ring-2 ring-grass-500/20' : ''
              }`}
              style={{ borderColor: mode === 'light' ? undefined : 'var(--border-strong)', color: 'var(--fg)' }}
            >
              <span className="h-4 w-4 rounded-full border border-ink-200 bg-white" aria-hidden="true" />
              White
            </button>

            <button
              type="button"
              onClick={() => pick('dark')}
              aria-pressed={mode === 'dark'}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                mode === 'dark' ? 'border-grass-500 ring-2 ring-grass-500/20' : ''
              }`}
              style={{ borderColor: mode === 'dark' ? undefined : 'var(--border-strong)', color: 'var(--fg)' }}
            >
              <span className="h-4 w-4 rounded-full border border-ink-600 bg-ink" aria-hidden="true" />
              Black
            </button>
          </div>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-faint">Custom</p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {SWATCHES.map((s) => {
              const active = mode === 'custom' && customColor === s.hex;
              return (
                <button
                  key={s.hex}
                  type="button"
                  onClick={() => applyHex(s.hex)}
                  title={s.label}
                  aria-label={s.label}
                  aria-pressed={active}
                  className={`h-7 w-7 rounded-full border transition hover:scale-110 ${
                    active ? 'ring-2 ring-grass-500 ring-offset-2' : ''
                  }`}
                  style={{
                    background: s.hex,
                    borderColor: 'var(--border-strong)',
                    // @ts-expect-error -- CSS custom property
                    '--tw-ring-offset-color': 'var(--bg-surface)',
                  }}
                />
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="color"
              value={normaliseHex(draft) ?? '#000000'}
              onChange={(e) => applyHex(e.target.value)}
              aria-label="Pick any colour"
              className="h-9 w-10 cursor-pointer rounded-lg border bg-transparent p-1"
              style={{ borderColor: 'var(--border-strong)' }}
            />
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => applyHex(draft)}
              onKeyDown={(e) => e.key === 'Enter' && applyHex(draft)}
              spellCheck={false}
              aria-label="Hex colour"
              className="input py-1.5 font-mono text-xs"
              placeholder="#0f2a3d"
            />
          </div>

          {mode === 'custom' ? (
            <p className="mt-2 text-xs text-faint">
              Text switches to {luminance(customColor) < 0.4 ? 'light' : 'dark'} automatically.
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              reset();
              setOpen(false);
            }}
            className="mt-3 w-full rounded-lg py-1.5 text-xs font-medium text-muted transition hover:text-body"
          >
            Reset to default
          </button>
        </div>
      ) : null}
    </div>
  );
}
