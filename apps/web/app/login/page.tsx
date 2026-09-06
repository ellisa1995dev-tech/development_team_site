import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your account.',
};

export default function LoginPage() {
  return (
    <section className="bg-ink-50">
      <div className="container-page grid min-h-[70vh] place-items-center py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="heading-2">Sign in</h1>
            <p className="lede mt-2 text-base">Welcome back.</p>
          </div>
          <Suspense fallback={<div className="card text-sm text-ink-400">Loading…</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
