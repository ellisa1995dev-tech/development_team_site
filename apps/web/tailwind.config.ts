import type { Config } from 'tailwindcss';

/**
 * Palette: grass green + sky blue on a black/white base.
 * Every colour below is a scale around those four so components never
 * reach for an off-brand default.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        grass: {
          50: '#f0f9f1',
          100: '#dcf1de',
          200: '#bbe3c0',
          300: '#8bcd95',
          400: '#57b065',
          500: '#3a9448', // primary grass green
          600: '#2b7737',
          700: '#245e2e',
          800: '#204b28',
          900: '#1c3e23',
        },
        sky: {
          50: '#eff9ff',
          100: '#dcf2ff',
          200: '#b2e7ff',
          300: '#6dd5ff',
          400: '#20bfff',
          500: '#00a5ec', // primary sky blue
          600: '#0083c4',
          700: '#00689e',
          800: '#065883',
          900: '#0b496c',
        },
        ink: {
          DEFAULT: '#0a0d0c',
          900: '#0d1211',
          800: '#141a18',
          700: '#1f2724',
          600: '#333d39',
          500: '#4c5854',
          400: '#6f7d78',
          300: '#9aa7a2',
          200: '#c6cfcb',
          100: '#e5eae8',
          50: '#f4f7f6',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
      boxShadow: {
        card: '0 1px 2px rgba(10,13,12,0.04), 0 8px 24px -12px rgba(10,13,12,0.14)',
        lift: '0 2px 4px rgba(10,13,12,0.05), 0 24px 48px -20px rgba(10,13,12,0.26)',
        glow: '0 0 0 1px rgba(58,148,72,0.18), 0 18px 40px -18px rgba(58,148,72,0.45)',
        'glow-sky': '0 0 0 1px rgba(0,165,236,0.18), 0 18px 40px -18px rgba(0,165,236,0.45)',
        toast: '0 8px 16px -6px rgba(10,13,12,0.14), 0 24px 56px -20px rgba(10,13,12,0.36)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.08)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(14px) scale(0.96)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'toast-out': {
          from: { opacity: '1', transform: 'translateY(0) scale(1)' },
          to: { opacity: '0', transform: 'translateY(6px) scale(0.97)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(4%, -3%, 0) scale(1.08)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'progress-shrink': {
          from: { transform: 'scaleX(1)' },
          to: { transform: 'scaleX(0)' },
        },
        'draw-underline': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in': 'fade-in 0.5s ease-out both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'slide-down': 'slide-down 0.25s cubic-bezier(0.22,1,0.36,1) both',
        'toast-in': 'toast-in 0.36s cubic-bezier(0.22,1,0.36,1) both',
        'toast-out': 'toast-out 0.22s ease-in forwards',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.2,0.6,0.35,1) infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
