import type { Metadata } from 'next';
import { Suspense } from 'react';
import RegisterForm from '@/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create an account to order a project or apply to join the team.',
};

export default function RegisterPage() {
  return (
    <section className="bg-ink-50">
      <div className="container-page grid min-h-[70vh] place-items-center py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="heading-2">Create your account</h1>
            <p className="lede mt-2 text-base">
              Registration is required before ordering a project or applying to join the team.
            </p>
          </div>
          <Suspense fallback={<div className="card text-sm text-ink-400">Loading…</div>}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
