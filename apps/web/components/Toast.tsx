'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds on screen. Errors linger by default. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface Toast extends Required<Pick<ToastOptions, 'title' | 'variant' | 'duration'>> {
  id: number;
  description?: string;
  action?: ToastOptions['action'];
  leaving: boolean;
}

interface ToastApi {
  toast: (options: ToastOptions) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const MAX_VISIBLE = 4;
const EXIT_MS = 220;

const VARIANT: Record<ToastVariant, { accent: string; ring: string; icon: ReactNode; bar: string }> = {
  success: {
    accent: 'bg-grass-500',
    ring: 'ring-grass-200/70',
    bar: 'bg-grass-500',
    icon: (
      <path d="M5 10.5l3.5 3.5L15 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  error: {
    accent: 'bg-red-500',
    ring: 'ring-red-200/70',
    bar: 'bg-red-500',
    icon: <path d="M6.5 6.5l7 7M13.5 6.5l-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />,
  },
  warning: {
    accent: 'bg-amber-500',
    ring: 'ring-amber-200/70',
    bar: 'bg-amber-500',
    icon: (
      <>
        <path d="M10 5.5v5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="10" cy="14.5" r="1.15" fill="currentColor" />
      </>
    ),
  },
  info: {
    accent: 'bg-sky-500',
    ring: 'ring-sky-200/70',
    bar: 'bg-sky-500',
    icon: (
      <>
        <path d="M10 9v5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="10" cy="5.6" r="1.15" fill="currentColor" />
      </>
    ),
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  // Animate out first, then unmount.
  const dismiss = useCallback(
    (id: number) => {
      setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      const timer = setTimeout(() => remove(id), EXIT_MS);
      timers.current.set(id, timer);
    },
    [remove],
  );

  const toast = useCallback(
    (options: ToastOptions) => {
      const variant = options.variant ?? 'info';
      const id = nextId.current++;
      const duration = options.duration ?? (variant === 'error' ? 7000 : 4500);

      setToasts((list) => [
        ...list.slice(-(MAX_VISIBLE - 1)),
        { id, title: options.title, description: options.description, variant, duration, action: options.action, leaving: false },
      ]);

      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      dismiss,
      success: (title, description) => toast({ title, description, variant: 'success' }),
      error: (title, description) => toast({ title, description, variant: 'error' }),
      info: (title, description) => toast({ title, description, variant: 'info' }),
      warning: (title, description) => toast({ title, description, variant: 'warning' }),
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Bottom-centre on mobile, bottom-right from sm up. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2.5 p-4 sm:inset-x-auto sm:right-0 sm:items-end sm:p-6"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const v = VARIANT[t.variant];
          return (
            <div
              key={t.id}
              role={t.variant === 'error' ? 'alert' : 'status'}
              aria-live={t.variant === 'error' ? 'assertive' : 'polite'}
              className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl bg-white/95 shadow-toast ring-1 backdrop-blur-xl ${v.ring} ${
                t.leaving ? 'animate-toast-out' : 'animate-toast-in'
              }`}
            >
              <div className="flex items-start gap-3 p-4 pr-10">
                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${v.accent}`}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    {v.icon}
                  </svg>
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-ink">{t.title}</p>
                  {t.description ? (
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">{t.description}</p>
                  ) : null}
                  {t.action ? (
                    <button
                      type="button"
                      onClick={() => {
                        t.action?.onClick();
                        dismiss(t.id);
                      }}
                      className="mt-2.5 text-sm font-semibold text-grass-700 underline underline-offset-2 transition hover:text-grass-800"
                    >
                      {t.action.label}
                    </button>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg text-ink-300 transition hover:bg-ink-50 hover:text-ink-600"
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>

              {/* Time-remaining bar. */}
              <span
                className={`absolute bottom-0 left-0 h-[3px] w-full origin-left ${v.bar}`}
                style={{ animation: `progress-shrink ${t.duration}ms linear forwards` }}
                aria-hidden="true"
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
