import { UserRole } from '@prisma/client';

/**
 * Decides whether a registering address gets management access.
 *
 * This reads an explicit allowlist from the server environment
 * (`ADMIN_EMAILS`, comma-separated) rather than matching a pattern such as
 * `admin@*` or a company domain.
 *
 * The distinction matters: nothing in this application verifies that someone
 * owns the address they sign up with. A pattern rule would therefore let any
 * visitor type a qualifying address and grant themselves management access.
 * An allowlist can only be changed by whoever controls the deployment.
 *
 * A wildcard domain entry (`@example.com`) is supported for convenience, but
 * it carries exactly that risk and should only be used once email ownership is
 * actually verified — see the warning logged at startup.
 */
export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/** True when the allowlist contains a whole-domain entry. */
export function hasDomainWildcard(allowlist: string[]): boolean {
  return allowlist.some((entry) => entry.startsWith('@'));
}

export function isAdminEmail(email: string, allowlist: string[]): boolean {
  const normalised = email.trim().toLowerCase();
  if (!normalised || !allowlist.length) return false;

  return allowlist.some((entry) =>
    entry.startsWith('@') ? normalised.endsWith(entry) : normalised === entry,
  );
}

export function roleForEmail(email: string, allowlist: string[]): UserRole {
  return isAdminEmail(email, allowlist) ? UserRole.MANAGER : UserRole.USER;
}
