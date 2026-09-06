import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';
import Logo from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your account.',
};

export default function LoginPage() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-ink-50 to-white">
      <div
        className="pointer-events-none absolute -right-32 -top-24 h-[28rem] w-[28rem] animate-float rounded-full bg-sky-100/60 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-page relative grid min-h-[78vh] place-items-center py-16">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-7 text-center">
            <Logo size={36} withWordmark={false} className="justify-center" />
            <h1 className="heading-2 mt-5">Welcome back</h1>
            <p className="lede mt-2 text-base">Sign in to continue where you left off.</p>
          </div>
          <Suspense fallback={<div className="card"><div className="skeleton h-52 w-full" /></div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
