import { Injectable, Logger } from '@nestjs/common';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Outbound email.
 *
 * Delivery goes through Resend's HTTP API rather than SMTP: it needs no extra
 * dependency and no long-lived socket, which matters on serverless where the
 * function may be frozen the moment the response is sent.
 *
 * With no RESEND_API_KEY configured the service logs the message instead of
 * sending it. That keeps local development from mailing real clients by
 * accident, and makes a misconfigured deployment obvious in the logs rather
 * than silently dropping mail.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private get from(): string {
    return process.env.MAIL_FROM ?? 'StackForge <onboarding@resend.dev>';
  }

  get isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY);
  }

  /** Addresses that receive operational alerts — the management allowlist. */
  private get adminRecipients(): string[] {
    return (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e && !e.startsWith('@'));
  }

  /**
   * Fans an alert out to every management address.
   *
   * Sent one at a time rather than as a single multi-recipient message so the
   * admins never see each other's addresses, and one bad address cannot stop
   * the rest from arriving.
   */
  async sendToAdmins(build: (to: string) => MailMessage): Promise<{ sent: number; attempted: number }> {
    const recipients = this.adminRecipients;

    if (!recipients.length) {
      this.logger.warn('ADMIN_EMAILS is empty — no administrator alert was sent.');
      return { sent: 0, attempted: 0 };
    }

    const results = await Promise.all(recipients.map((to) => this.send(build(to))));
    return { sent: results.filter((r) => r.sent).length, attempted: recipients.length };
  }

  /**
   * Never throws. A failed notification must not roll back the state change
   * that triggered it — the admin's action already succeeded.
   */
  async send(message: MailMessage): Promise<{ sent: boolean; reason?: string }> {
    if (!this.isConfigured) {
      this.logger.warn(
        `RESEND_API_KEY not set — email NOT sent. Would have mailed "${message.subject}" to ${message.to}`,
      );
      return { sent: false, reason: 'not-configured' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(process.env.MAIL_REPLY_TO ? { reply_to: process.env.MAIL_REPLY_TO } : {}),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.error(`Email to ${message.to} rejected (${res.status}): ${body.slice(0, 300)}`);
        return { sent: false, reason: `http-${res.status}` };
      }

      this.logger.log(`Sent "${message.subject}" to ${message.to}`);
      return { sent: true };
    } catch (err) {
      this.logger.error(`Email to ${message.to} failed: ${(err as Error).message}`);
      return { sent: false, reason: 'network' };
    } finally {
      clearTimeout(timeout);
    }
  }
}
