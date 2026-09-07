import type { Metadata } from 'next';
import AccountPanel from '@/components/AccountPanel';
import { PageHero } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Your account',
  description: 'Manage your StackForge account.',
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Your account"
        lede="Your details, your membership, and the option to close the account if you no longer need it."
      />

      <section className="section pt-12 sm:pt-16">
        <div className="container-page max-w-3xl">
          <AccountPanel />
        </div>
      </section>
    </>
  );
}
