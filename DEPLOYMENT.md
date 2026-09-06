# Deploying to Vercel

This repo holds two apps. Vercel builds one framework per project, so it needs
**two Vercel projects pointed at the same GitHub repo**, distinguished by their
Root Directory. Both live on Vercel; there is nothing else to host except the
database, which is already on Neon.

| Project | Root Directory | What it is |
|---|---|---|
| `stackforge-web` | `apps/web` | Next.js frontend + admin console |
| `stackforge-api` | `apps/api` | NestJS API as a serverless function |

Deploy the **API first** — the web app needs its URL at build time.

---

## 1. API project

**New Project → import the repo → set Root Directory to `apps/api`.**

Leave the build settings alone: [apps/api/vercel.json](apps/api/vercel.json)
already sets them.

```jsonc
{
  "buildCommand": "npx prisma generate && npx nest build",
  "functions": { "api/index.js": { "includeFiles": "dist/**", "maxDuration": 30 } },
  "rewrites": [{ "source": "/(.*)", "destination": "/api/index" }]
}
```

The API is compiled ahead of time by `nest build` rather than by Vercel's
bundler. That is deliberate: Vercel compiles functions with esbuild, which does
not emit the decorator metadata Nest needs for dependency injection. The
handler in [apps/api/api/index.js](apps/api/api/index.js) boots the compiled app
and caches it, so warm invocations reuse one Express app and one Prisma pool.

### Environment variables

Set these in the API project (Production **and** Preview):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon **pooled** URL, with `&pgbouncer=true` appended |
| `JWT_SECRET` | A long random string — not the dev placeholder |
| `IP_HASH_SALT` | A long random string. Changing it later invalidates existing visitor hashes |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used only when you run the seed |
| `CORS_ORIGIN` | The web project's URL, e.g. `https://stackforge-web.vercel.app` |
| `GEOIP_PROVIDER` | `ipapi` |
| `GEOIP_DEV_LATLNG` | **Leave unset in production** — it is a local-dev placeholder |

`pgbouncer=true` is not optional. Neon's pooler is PgBouncer in transaction
mode; without that flag Prisma reuses prepared statement names across pooled
connections and fails with `prepared statement "s0" already exists` under any
concurrency. The app logs a warning on boot if it is missing.

---

## 2. Web project

**New Project → same repo → Root Directory `apps/web`.** Vercel detects Next.js
and installs from the workspace root on its own.

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | The API project's URL, e.g. `https://stackforge-api.vercel.app` |

This is inlined at build time, so changing it needs a **redeploy**, not just a
restart. If it is missing the build logs a warning and falls back to
`http://localhost:4000`, which will not work once deployed.

The browser calls the API directly rather than being proxied through Next.js.
That is on purpose: a proxy would make every request appear to come from
Vercel's infrastructure, and the visitor map would plot Vercel's data centres
instead of your visitors.

---

## 3. Seed the database

Only needed once, and only if this Neon database is not already seeded. From
your machine, with `DATABASE_URL` pointing at the production database:

```bash
cd apps/api
npx prisma db push      # create tables
npm run prisma:seed     # 8 members, 5 projects, admin user
```

---

## What changed for serverless

Three things assumed a long-running process and have been reworked:

**Live counters no longer stream.** The `@Sse('users/live')` endpoint is gone.
A serverless function is billed for the whole time a connection is held and is
killed at the timeout, so an SSE stream would disconnect on a fixed cycle.
[use-live-users.ts](apps/web/lib/use-live-users.ts) polls `/admin/stats/users`
every 3 seconds instead, and pauses entirely while the tab is hidden. The admin
console behaves identically.

**Geo-IP lookups are cached in Postgres.** The cache used to be an in-process
`Map`, which a cold start wipes — that would have meant re-querying ip-api.com
constantly and hitting its 45 requests/minute limit. It is now a `geo_cache`
table keyed by a salted hash of the IP, with a 24-hour TTL.

**Prisma reuses its connection pool.** The client is held on `globalThis` and
`$disconnect()` is skipped on Vercel, where functions are frozen rather than
shut down.

One security tidy-up came with it: `AdminGuard` used to accept `?token=` in the
query string because `EventSource` cannot set headers. With SSE gone, that path
is removed — query strings end up in access logs.

---

## Troubleshooting

**"No Next.js version detected"** — Root Directory is still the repo root. The
root `package.json` only has `concurrently`. Set it to `apps/web`.

**Every API call fails with a CORS error** — `CORS_ORIGIN` on the API project
does not exactly match the web origin. It must include the scheme and no
trailing slash. Preview deployments get their own URLs, so add them
comma-separated or use a stable domain.

**`prepared statement "s0" already exists`** — `DATABASE_URL` is missing
`pgbouncer=true`, or points at Neon's direct (non-pooled) host.

**`Cannot find module '../dist/app.module'`** — the build did not run. Confirm
the API project's Root Directory is `apps/api` so its `vercel.json` is picked up.

**Admin console bounces back to the login screen** — the token verify call is
failing, almost always CORS or a wrong `NEXT_PUBLIC_API_URL`. Check the browser
network tab for `/api/auth/me`.
