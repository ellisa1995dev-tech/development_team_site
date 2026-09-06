'use client';

import { useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useUserAuth } from '@/lib/user-auth';
import { useToast } from '@/components/Toast';
import RegistrationGate from './RegistrationGate';

/** Mirrors MAX_UPLOAD_BYTES in the API; Vercel caps a request body at 4.5 MB. */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
import { PROJECT_TYPES, BUDGET_RANGES, TIMELINES, STACK_OPTIONS } from '@/lib/content';

interface FormState {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  projectType: string;
  budgetRange: string;
  timeline: string;
  description: string;
}

const EMPTY: FormState = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  projectType: PROJECT_TYPES[0],
  budgetRange: BUDGET_RANGES[0],
  timeline: TIMELINES[0],
  description: '',
};

export default function OrderForm() {
  const { token, isRegistered, requireRegistration } = useUserAuth();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [stack, setStack] = useState<string[]>([]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleStack = (tech: string) =>
    setStack((prev) => (prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]));

  // Mirrors the DTO rules in apps/api so the user sees problems before a round trip.
  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.contactName.trim().length < 2) next.contactName = 'Please tell us your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'A valid email address is required.';
    if (form.description.trim().length < 20) next.description = 'A little more detail, please — at least 20 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    // Registration gate: alert and stop if there is no account.
    if (!requireRegistration('ordering a project')) return;

    if (!validate()) return;

    setSubmitting(true);
    try {
      const body = new FormData();
      if (form.companyName.trim()) body.append('companyName', form.companyName.trim());
      body.append('contactName', form.contactName.trim());
      body.append('email', form.email.trim());
      if (form.phone.trim()) body.append('phone', form.phone.trim());
      body.append('projectType', form.projectType);
      // Flat form fields cannot carry an array, so the API parses this back.
      body.append('stack', JSON.stringify(stack));
      body.append('budgetRange', form.budgetRange);
      body.append('timeline', form.timeline);
      body.append('description', form.description.trim());
      if (docFile) body.append('document', docFile);

      await apiFetch('/orders', { method: 'POST', token: token ?? undefined, body });
      toast.success('Brief received', 'An engineer will read it and reply within two working days.');
      setDone(true);
      setForm(EMPTY);
      setStack([]);
      setDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setServerError(message);
      toast.error('Could not send your brief', message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card border-grass-200 bg-grass-50 text-center" role="status">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-grass-500 text-white">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M5 11.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="heading-3 mt-4">Brief received.</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          An engineer will read it and reply within two working days. If it is urgent, say so in a follow-up and we will
          bump it.
        </p>
        <button type="button" onClick={() => setDone(false)} className="btn-outline mt-6">
          Send another brief
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-6">
      <RegistrationGate action="ordering a project" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="contactName">
            Your name <span className="text-grass-600">*</span>
          </label>
          <input
            id="contactName"
            className="input"
            value={form.contactName}
            onChange={set('contactName')}
            autoComplete="name"
            aria-invalid={!!errors.contactName}
            aria-describedby={errors.contactName ? 'contactName-error' : undefined}
          />
          {errors.contactName ? (
            <p id="contactName-error" className="field-error">
              {errors.contactName}
            </p>
          ) : null}
        </div>

        <div>
          <label className="label" htmlFor="companyName">
            Company
          </label>
          <input id="companyName" className="input" value={form.companyName} onChange={set('companyName')} autoComplete="organization" />
        </div>

        <div>
          <label className="label" htmlFor="email">
            Email <span className="text-grass-600">*</span>
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            className="input"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email ? (
            <p id="email-error" className="field-error">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label className="label" htmlFor="phone">
            Phone
          </label>
          <input id="phone" type="tel" inputMode="tel" className="input" value={form.phone} onChange={set('phone')} autoComplete="tel" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="projectType">
            Project type
          </label>
          <select id="projectType" className="input" value={form.projectType} onChange={set('projectType')}>
            {PROJECT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="budgetRange">
            Budget
          </label>
          <select id="budgetRange" className="input" value={form.budgetRange} onChange={set('budgetRange')}>
            {BUDGET_RANGES.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="timeline">
            Timeline
          </label>
          <select id="timeline" className="input" value={form.timeline} onChange={set('timeline')}>
            {TIMELINES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="label">Technologies involved (optional)</legend>
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
                    ? 'border-grass-500 bg-grass-500 text-white'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-grass-300 hover:text-grass-700'
                }`}
              >
                {tech}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="description">
          What are you building? <span className="text-grass-600">*</span>
        </label>
        <textarea
          id="description"
          rows={6}
          className="input resize-y"
          placeholder="The problem, who it is for, what exists today, and any constraints we should know about."
          value={form.description}
          onChange={set('description')}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description ? (
          <p id="description-error" className="field-error">
            {errors.description}
          </p>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="document">
          Requirements document <span className="text-faint">(optional)</span>
        </label>
        <p className="mb-2 text-xs text-faint">
          PDF, Word, ODT, text, Markdown, CSV, Excel or an image. Up to 4 MB.
        </p>

        <input
          ref={fileInputRef}
          id="document"
          type="file"
          accept=".pdf,.doc,.docx,.odt,.txt,.md,.csv,.xls,.xlsx,.png,.jpg,.jpeg,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text,text/plain,text/markdown,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const picked = e.target.files?.[0] ?? null;
            setFileError(null);
            if (picked && picked.size > MAX_UPLOAD_BYTES) {
              setFileError(`That file is ${(picked.size / 1024 / 1024).toFixed(1)} MB. The maximum is 4 MB.`);
              setDocFile(null);
              e.target.value = '';
              return;
            }
            setDocFile(picked);
          }}
          className="block w-full cursor-pointer rounded-xl border px-3.5 py-2.5 text-sm transition file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-grass-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-grass-600"
          style={{ borderColor: 'var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--fg)' }}
        />

        {docFile ? (
          <p className="mt-2 flex items-center gap-2 text-xs text-muted">
            <span className="chip-grass">{(docFile.size / 1024).toFixed(0)} KB</span>
            <span className="truncate">{docFile.name}</span>
            <button
              type="button"
              onClick={() => {
                setDocFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="ml-auto shrink-0 font-medium text-red-600 underline underline-offset-2"
            >
              Remove
            </button>
          </p>
        ) : null}

        {fileError ? <p className="field-error">{fileError}</p> : null}
      </div>

      {serverError ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-ink-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-400">We reply within two working days. No sales sequence.</p>
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitting}>
          {submitting ? 'Sending…' : isRegistered ? 'Send the brief' : 'Register to send'}
        </button>
      </div>
    </form>
  );
}
