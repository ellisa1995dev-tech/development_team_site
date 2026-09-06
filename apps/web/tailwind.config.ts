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
          500: '#3a9448',   // primary grass green
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
          500: '#00a5ec',   // primary sky blue
          600: '#0083c4',
          700: '#00689e',
          800: '#065883',
          900: '#0b496c',
        },
        ink: {
          DEFAULT: '#0a0d0c',
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
      boxShadow: {
        card: '0 1px 2px rgba(10,13,12,0.04), 0 8px 24px -12px rgba(10,13,12,0.18)',
        lift: '0 2px 4px rgba(10,13,12,0.06), 0 18px 40px -16px rgba(10,13,12,0.28)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.2,0.6,0.35,1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
