'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { STACK_OPTIONS, ROLE_LABEL } from '@/lib/content';
import type { ApplicationPosition } from '@/lib/types';

const POSITIONS: ApplicationPosition[] = ['BACKEND', 'FRONTEND', 'DEVOPS', 'AI_ENGINEER', 'OTHER'];

interface FormState {
  fullName: string;
  email: string;
  position: ApplicationPosition;
  yearsExperience: string;
  location: string;
  portfolioUrl: string;
  githubUrl: string;
  motivation: string;
  ideaPitch: string;
}

const EMPTY: FormState = {
  fullName: '',
  email: '',
  position: 'BACKEND',
  yearsExperience: '',
  location: '',
  portfolioUrl: '',
  githubUrl: '',
  motivation: '',
  ideaPitch: '',
};

export default function JoinForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [stack, setStack] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const toggleStack = (tech: string) =>
    setStack((prev) => (prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]));

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'A valid email address is required.';

    const years = Number(form.yearsExperience);
    if (!Number.isFinite(years) || years < 0 || years > 60) {
      next.yearsExperience = 'Enter your years of experience.';
    } else if (years < 7) {
      // Not a hard block — the team still wants to see exceptional people.
      next.yearsExperience = 'We hire at 7+ years. You can still apply, but expect a higher bar.';
    }

    if (form.motivation.trim().length < 20) next.motivation = 'Tell us a bit more — at least 20 characters.';

    setErrors(next);
    // Only the years hint is non-blocking.
    return Object.keys(next).filter((k) => k !== 'yearsExperience').length === 0 &&
      Number.isFinite(years) && years >= 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await apiFetch('/applications', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          position: form.position,
          yearsExperience: Number(form.yearsExperience),
          primaryStack: stack,
          location: form.location.trim() || undefined,
          portfolioUrl: form.portfolioUrl.trim() || undefined,
          githubUrl: form.githubUrl.trim() || undefined,
          motivation: form.motivation.trim(),
          ideaPitch: form.ideaPitch.trim() || undefined,
        }),
      });
      setDone(true);
      setForm(EMPTY);
      setStack([]);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card border-sky-200 bg-sky-50 text-center" role="status">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sky-500 text-white">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M5 11.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="heading-3 mt-4">Application received.</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          The CTO reads every application personally. If there is a fit, you will hear from us within a week — and if
          there is not, you will still hear from us.
        </p>
        <button type="button" onClick={() => setDone(false)} className="btn-outline mt-6">
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="fullName">
            Full name <span className="text-grass-600">*</span>
          </label>
          <input
            id="fullName"
            className="input"
            value={form.fullName}
            onChange={set('fullName')}
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
          {errors.fullName ? (
            <p id="fullName-error" className="field-error">
              {errors.fullName}
            </p>
          ) : null}
        </div>

        <div>
          <label className="label" htmlFor="join-email">
            Email <span className="text-grass-600">*</span>
          </label>
          <input
            id="join-email"
            type="email"
            inputMode="email"
            className="input"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'join-email-error' : undefined}
          />
          {errors.email ? (
            <p id="join-email-error" className="field-error">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label className="label" htmlFor="position">
            Position
          </label>
          <select id="position" className="input" value={form.position} onChange={set('position')}>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {ROLE_LABEL[p] ?? p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="yearsExperience">
            Years of experience <span className="text-grass-600">*</span>
          </label>
          <input
            id="yearsExperience"
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            className="input"
            value={form.yearsExperience}
            onChange={set('yearsExperience')}
            aria-describedby="yearsExperience-hint"
          />
          <p id="yearsExperience-hint" className={errors.yearsExperience ? 'field-error' : 'mt-1.5 text-xs text-ink-400'}>
            {errors.yearsExperience ?? 'We hire at seven years and above.'}
          </p>
        </div>

        <div>
          <label className="label" htmlFor="location">
            Location
          </label>
          <input id="location" className="input" value={form.location} onChange={set('location')} placeholder="City, country" />
        </div>

        <div>
          <label className="label" htmlFor="githubUrl">
            GitHub
          </label>
          <input id="githubUrl" type="url" inputMode="url" className="input" value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/…" />
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="portfolioUrl">
            Portfolio, site or CV link
          </label>
          <input id="portfolioUrl" type="url" inputMode="url" className="input" value={form.portfolioUrl} onChange={set('portfolioUrl')} placeholder="https://…" />
        </div>
      </div>

      <fieldset>
        <legend className="label">Primary stack</legend>
        <div className="flex flex-wrap gap-2">
          {STACK_OPTIONS.map((tech) => {
            const on = stack.includes(tech);
            return (
              <button
                key={tech}
                type="button"
                onClick={() => toggleStack(tech)}
                aria-pressed={on}
                className={`min-h-[2.25rem] rounded-full border px-3.5 text-sm font-medium transition ${
                  on
                    ? 'border-sky-500 bg-sky-500 text-white'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-sky-300 hover:text-sky-700'
                }`}
              >
                {tech}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="motivation">
          Why this team? <span className="text-grass-600">*</span>
        </label>
        <textarea
          id="motivation"
          rows={5}
          className="input resize-y"
          placeholder="What you have built, what you want to build next, and what you are looking for in a team."
          value={form.motivation}
          onChange={set('motivation')}
          aria-invalid={!!errors.motivation}
          aria-describedby={errors.motivation ? 'motivation-error' : undefined}
        />
        {errors.motivation ? (
          <p id="motivation-error" className="field-error">
            {errors.motivation}
          </p>
        ) : null}
      </div>

      <div id="idea" className="rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:p-5">
        <label className="label" htmlFor="ideaPitch">
          Have an innovative idea? Pitch it.
        </label>
        <p className="mb-3 text-xs leading-relaxed text-ink-500">
          Optional, and the part we read first. If you are carrying an idea that needs eight senior engineers behind it,
          describe it here — we prototype the ones that convince us.
        </p>
        <textarea
          id="ideaPitch"
          rows={5}
          className="input resize-y"
          placeholder="The idea, why now, and why it needs to be built properly."
          value={form.ideaPitch}
          onChange={set('ideaPitch')}
        />
      </div>

      {serverError ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-ink-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-400">Every application gets a reply.</p>
        <button type="submit" className="btn-sky w-full sm:w-auto" disabled={submitting}>
          {submitting ? 'Sending…' : 'Submit application'}
        </button>
      </div>
    </form>
  );
}
