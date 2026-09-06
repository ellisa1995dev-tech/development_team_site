import type { MailMessage } from './mail.service';

const BRAND = 'StackForge';
const GRASS = '#3a9448';
const INK = '#0a0d0c';

/** Escapes user-supplied values before they go into an HTML email. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function siteUrl(): string {
  return (process.env.SITE_URL ?? 'https://stackforge.example').replace(/\/$/, '');
}

/**
 * Table-based layout with inline styles — the only thing that renders
 * consistently across Outlook, Gmail and Apple Mail.
 */
function shell(heading: string, bodyHtml: string, cta?: { label: string; href: string }): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f7f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5eae8;">
        <tr><td style="background:${INK};padding:22px 28px;">
          <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:-0.02em;">Stack<span style="color:#00a5ec;">Forge</span></span>
        </td></tr>
        <tr><td style="padding:32px 28px 8px;">
          <h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;color:${INK};font-weight:600;">${heading}</h1>
          ${bodyHtml}
        </td></tr>
        ${
          cta
            ? `<tr><td style="padding:8px 28px 32px;">
                 <a href="${cta.href}" style="display:inline-block;background:${GRASS};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600;">${cta.label}</a>
               </td></tr>`
            : `<tr><td style="padding:0 28px 32px;"></td></tr>`
        }
        <tr><td style="background:#f4f7f6;padding:18px 28px;border-top:1px solid #e5eae8;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#6f7d78;">
            ${BRAND} — eight senior engineers building in Rust, Next.js and NestJS.<br>
            Questions? Reply to this email, or message the CTO on WhatsApp.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const p = (text: string) =>
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#333d39;">${text}</p>`;

function detailRows(rows: Array<[string, string]>): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;width:100%;border-collapse:collapse;">
    ${rows
      .map(
        ([k, v]) => `<tr>
        <td style="padding:7px 0;font-size:13px;color:#6f7d78;width:38%;vertical-align:top;">${esc(k)}</td>
        <td style="padding:7px 0;font-size:14px;color:${INK};font-weight:500;">${esc(v)}</td>
      </tr>`,
      )
      .join('')}
  </table>`;
}

export interface OrderMailContext {
  contactName: string;
  email: string;
  projectName: string;
  projectType: string;
  timeline: string;
  startedAt: Date;
}

/** Sent when the team accepts an order and it becomes a project in progress. */
export function projectAddedEmail(ctx: OrderMailContext): MailMessage {
  const started = ctx.startedAt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const html = shell(
    `Your project is now in progress`,
    [
      p(`Hi ${esc(ctx.contactName)},`),
      p(
        `Good news — we have accepted your brief and added <strong>${esc(ctx.projectName)}</strong> to our active work. It now appears under projects in progress.`,
      ),
      detailRows([
        ['Project', ctx.projectName],
        ['Type', ctx.projectType],
        ['Start date', started],
        ['Timeline', ctx.timeline],
      ]),
      p(`An engineer will be in touch shortly to arrange the kick-off call. You can reply to this email at any time.`),
    ].join(''),
    { label: 'View active projects', href: `${siteUrl()}/#work` },
  );

  const text = [
    `Hi ${ctx.contactName},`,
    ``,
    `Good news - we have accepted your brief and added "${ctx.projectName}" to our active work.`,
    `It now appears under projects in progress.`,
    ``,
    `Project:    ${ctx.projectName}`,
    `Type:       ${ctx.projectType}`,
    `Start date: ${started}`,
    `Timeline:   ${ctx.timeline}`,
    ``,
    `An engineer will be in touch shortly to arrange the kick-off call.`,
    ``,
    `- ${BRAND}`,
  ].join('\n');

  return { to: ctx.email, subject: `Your project "${ctx.projectName}" is now in progress`, html, text };
}

/** Sent when an order is archived. */
export function projectArchivedEmail(ctx: Omit<OrderMailContext, 'startedAt' | 'timeline'>): MailMessage {
  const html = shell(
    `Your project has been archived`,
    [
      p(`Hi ${esc(ctx.contactName)},`),
      p(
        `We have archived <strong>${esc(ctx.projectName)}</strong>. It is no longer on our active board, but nothing has been deleted — everything you sent us, including any requirements document, is kept on file.`,
      ),
      detailRows([
        ['Project', ctx.projectName],
        ['Type', ctx.projectType],
        ['Status', 'Archived'],
      ]),
      p(`If this was not what you expected, or you would like to pick it back up, just reply to this email and we will reopen it.`),
    ].join(''),
    { label: 'Start a new project', href: `${siteUrl()}/order` },
  );

  const text = [
    `Hi ${ctx.contactName},`,
    ``,
    `We have archived "${ctx.projectName}". It is no longer on our active board, but nothing`,
    `has been deleted - everything you sent us is kept on file.`,
    ``,
    `Project: ${ctx.projectName}`,
    `Type:    ${ctx.projectType}`,
    `Status:  Archived`,
    ``,
    `If you would like to pick it back up, just reply to this email.`,
    ``,
    `- ${BRAND}`,
  ].join('\n');

  return { to: ctx.email, subject: `"${ctx.projectName}" has been archived`, html, text };
}
