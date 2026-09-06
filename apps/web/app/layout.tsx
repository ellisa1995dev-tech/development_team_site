import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import VisitTracker from '@/components/VisitTracker';
import { UserAuthProvider } from '@/lib/user-auth';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider } from '@/lib/theme';
import ThemeScript from './theme-script';

export const metadata: Metadata = {
  metadataBase: new URL('https://stackforge.example'),
  title: {
    default: 'StackForge — Rust, Next.js & NestJS product team',
    template: '%s · StackForge',
  },
  description:
    'Eight senior engineers with six years building together and AI in production since 2021. We design and ship products in Rust, Next.js and NestJS.',
  openGraph: {
    type: 'website',
    siteName: 'StackForge',
    title: 'StackForge — Rust, Next.js & NestJS product team',
    description:
      'Eight senior engineers. Six years together. AI in production since 2021. Rust, Next.js and NestJS.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#3a9448',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>

        <ThemeProvider>
        <ToastProvider>
          <UserAuthProvider>
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </UserAuthProvider>
        </ToastProvider>
        </ThemeProvider>

        <Suspense fallback={null}>
          <VisitTracker />
        </Suspense>
      </body>
    </html>
  );
}
