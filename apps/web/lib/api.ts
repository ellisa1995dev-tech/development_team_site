/**
 * Base URL of the API.
 *
 * Set NEXT_PUBLIC_API_URL in Vercel to the deployed API origin — it is inlined
 * at build time, so changing it needs a redeploy, not just a restart.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === 'production') {
  // Loud in the build log rather than a silent site full of failed fetches.
  console.warn('[api] NEXT_PUBLIC_API_URL is unset — falling back to http://localhost:4000, which will not work once deployed.');
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${API_URL}/api${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      // Nest's ValidationPipe returns message as string | string[].
      if (Array.isArray(body?.message)) message = body.message.join(', ');
      else if (typeof body?.message === 'string') message = body.message;
    } catch {
      /* non-JSON error body — keep the generic message */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Server components fetch public data directly; never cache stale rosters for long. */
export async function fetchPublic<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/api${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // The site must still render if the API is briefly unavailable.
    return null;
  }
}
