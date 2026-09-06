import type { Metadata } from 'next';
import OrderForm from '@/components/OrderForm';
import { ENGAGEMENT_MODELS } from '@/lib/content';
import { PageHero } from '@/components/ui';
import Reveal from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Order a project',
  description: 'Send us a brief. An engineer reads it and replies within two working days.',
};

const WHAT_HAPPENS = [
  'An engineer — not a salesperson — reads your brief.',
  'We reply within two working days, even if the answer is no.',
  'If it looks like a fit, we book a one-hour scoping call.',
  'You get a written proposal with architecture, milestones and price.',
];

export default function OrderPage() {
  return (
    <>
      <PageHero
        eyebrow="Project orders"
        title="Tell us what you need built."
        lede="The more constraints you give us, the more useful our first reply will be. Rough ideas are welcome — so are fully specified RFPs."
      />

      <section className="section pt-12 sm:pt-16 lg:pt-20">
        <div className="container-page grid gap-8 lg:grid-cols-3 lg:gap-12">
          <Reveal className="lg:col-span-2">
            <OrderForm />
          </Reveal>

          <aside className="animate-fade-up space-y-5 delay-150 lg:sticky lg:top-24 lg:self-start">
            <div className="card card-hover">
              <h2 className="heading-3">What happens next</h2>
              <ol className="mt-4 space-y-3">
                {WHAT_HAPPENS.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm text-ink-600">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-grass-50 text-xs font-bold text-grass-700">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="card">
              <h2 className="heading-3">Engagement models</h2>
              <ul className="mt-4 space-y-4">
                {ENGAGEMENT_MODELS.map((model) => (
                  <li key={model.title}>
                    <h3 className="text-sm font-semibold text-ink">{model.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">{model.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
              <h2 className="text-sm font-semibold text-sky-800">Not a client — an engineer?</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                We are hiring at seven years and above.{' '}
                <a href="/join" className="font-semibold text-sky-700 underline underline-offset-2">
                  See the open roles
                </a>
                .
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
