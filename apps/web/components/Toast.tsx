'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds on screen. Pass 0 to keep it until dismissed. */
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
  toast: (options: ToastOptions) => number;
  success: (title: string, description?: string) => number;
  error: (title: string, description?: string) => number;
  info: (title: string, description?: string) => number;
  warning: (title: string, description?: string) => number;
  /** Sticky spinner toast; resolve it with `update`. */
  loading: (title: string, description?: string) => number;
  update: (id: number, options: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const MAX_VISIBLE = 4;
const EXIT_MS = 240;

interface VariantStyle {
  rail: string;
  iconBg: string;
  iconFg: string;
  ring: string;
  icon: ReactNode;
}

const VARIANT: Record<ToastVariant, VariantStyle> = {
  success: {
    rail: 'bg-grass-500',
    iconBg: 'bg-grass-500/12',
    iconFg: 'text-grass-600',
    ring: 'ring-grass-500/20',
    icon: (
      <path d="M5 10.5l3.5 3.5L15 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  error: {
    rail: 'bg-red-500',
    iconBg: 'bg-red-500/12',
    iconFg: 'text-red-600',
    ring: 'ring-red-500/20',
    icon: <path d="M6.5 6.5l7 7M13.5 6.5l-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />,
  },
  warning: {
    rail: 'bg-amber-500',
    iconBg: 'bg-amber-500/14',
    iconFg: 'text-amber-600',
    ring: 'ring-amber-500/20',
    icon: (
      <>
        <path d="M10 5.5v5.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="10" cy="14.4" r="1.15" fill="currentColor" />
      </>
    ),
  },
  info: {
    rail: 'bg-sky-500',
    iconBg: 'bg-sky-500/12',
    iconFg: 'text-sky-600',
    ring: 'ring-sky-500/20',
    icon: (
      <>
        <path d="M10 9v5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="10" cy="5.6" r="1.15" fill="currentColor" />
      </>
    ),
  },
  loading: {
    rail: 'bg-ink-400',
    iconBg: 'bg-ink-400/12',
    iconFg: 'text-ink-500',
    icon: (
      <>
        <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="2" opacity="0.25" />
        <path d="M16 10a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    ring: 'ring-ink-400/20',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const [paused, setPaused] = useState(false);

  const clearTimer = (id: number) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  };

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    clearTimer(id);
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      clearTimer(id);
      timers.current.set(id, setTimeout(() => remove(id), EXIT_MS));
    },
    [remove],
  );

  const schedule = useCallback(
    (id: number, duration: number) => {
      if (duration <= 0) return;
      clearTimer(id);
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
    },
    [dismiss],
  );

  const toast = useCallback(
    (options: ToastOptions) => {
      const variant = options.variant ?? 'info';
      const id = nextId.current++;
      const duration =
        options.duration ?? (variant === 'loading' ? 0 : variant === 'error' ? 7000 : 4500);

      setToasts((list) => [
        ...list.slice(-(MAX_VISIBLE - 1)),
        {
          id,
          title: options.title,
          description: options.description,
          variant,
          duration,
          action: options.action,
          leaving: false,
        },
      ]);

      schedule(id, duration);
      return id;
    },
    [schedule],
  );

  /** Turns a pending 'loading' toast into its result without it jumping position. */
  const update = useCallback(
    (id: number, options: ToastOptions) => {
      const variant = options.variant ?? 'info';
      const duration = options.duration ?? (variant === 'error' ? 7000 : 4500);

      setToasts((list) =>
        list.map((t) =>
          t.id === id
            ? { ...t, title: options.title, description: options.description, variant, duration, action: options.action }
            : t,
        ),
      );
      schedule(id, duration);
    },
    [schedule],
  );

  // Hovering the stack holds everything on screen so a message cannot vanish
  // mid-read, or while reaching for its action button.
  useEffect(() => {
    if (paused) {
      timers.current.forEach((t) => clearTimeout(t));
      return;
    }
    toasts.forEach((t) => {
      if (!t.leaving && t.duration > 0) schedule(t.id, t.duration);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

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
      update,
      dismiss,
      success: (title, description) => toast({ title, description, variant: 'success' }),
      error: (title, description) => toast({ title, description, variant: 'error' }),
      info: (title, description) => toast({ title, description, variant: 'info' }),
      warning: (title, description) => toast({ title, description, variant: 'warning' }),
      loading: (title, description) => toast({ title, description, variant: 'loading' }),
    }),
    [toast, update, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2.5 p-4 sm:inset-x-auto sm:right-0 sm:items-end sm:p-6"
        role="region"
        aria-label="Notifications"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {toasts.map((t) => {
          const v = VARIANT[t.variant];
          return (
            <div
              key={t.id}
              role={t.variant === 'error' ? 'alert' : 'status'}
              aria-live={t.variant === 'error' ? 'assertive' : 'polite'}
              className={`pointer-events-auto relative flex w-full max-w-md overflow-hidden rounded-2xl shadow-toast ring-1 backdrop-blur-xl ${v.ring} ${
                t.leaving ? 'animate-toast-out' : 'animate-toast-in'
              }`}
              style={{
                background: 'color-mix(in srgb, var(--bg-surface) 94%, transparent)',
                color: 'var(--fg)',
              }}
            >
              {/* Colour rail: the variant is readable before a word is read. */}
              <span className={`w-1 shrink-0 ${v.rail}`} aria-hidden="true" />

              <div className="flex min-w-0 flex-1 items-start gap-3 py-3.5 pl-3.5 pr-10">
                <span
                  className={`mt-px grid h-7 w-7 shrink-0 place-items-center rounded-full ${v.iconBg} ${v.iconFg}`}
                  aria-hidden="true"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 20 20"
                    fill="none"
                    className={t.variant === 'loading' ? 'animate-spin' : undefined}
                  >
                    {v.icon}
                  </svg>
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-semibold leading-snug">{t.title}</p>
                  {t.description ? (
                    <p className="mt-1 text-[0.8rem] leading-relaxed text-muted">{t.description}</p>
                  ) : null}

                  {t.action ? (
                    <button
                      type="button"
                      onClick={() => {
                        t.action?.onClick();
                        dismiss(t.id);
                      }}
                      className="mt-2.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-grass-700 ring-1 ring-inset ring-grass-500/30 transition hover:bg-grass-500/10"
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
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg text-faint transition hover:bg-black/5 hover:text-body"
              >
                <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </button>

              {t.duration > 0 ? (
                <span
                  className={`absolute bottom-0 left-0 h-[2px] w-full origin-left opacity-45 ${v.rail}`}
                  style={{
                    animation: `progress-shrink ${t.duration}ms linear forwards`,
                    animationPlayState: paused ? 'paused' : 'running',
                  }}
                  aria-hidden="true"
                />
              ) : null}
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
