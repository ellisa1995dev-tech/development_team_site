# EightEngineers — team introduction service

A public site introducing an eight-person engineering team, plus an admin console for
running the business side: visitor analytics on a map, team management, active
projects, incoming project orders and developer applications.

Built on the team's own stack — **Next.js** front end, **NestJS** API, **PostgreSQL**
database. (Rust is what the team ships for clients; the site itself doesn't need it.)

```
apps/
  web/   Next.js 15 (App Router, Tailwind) — public site + admin console
  api/   NestJS 11 + Prisma 6 — REST API
docker-compose.yml   PostgreSQL 16
```

---

## Quick start

```bash
npm install                 # installs both workspaces
npm run db:up               # starts PostgreSQL 16 in Docker
npm run db:migrate          # creates the schema
npm run db:seed             # 8 team members, 5 projects, admin user
npm run dev                 # API on :4000, web on :3000
```

Then open <http://localhost:3000>. The admin console is at `/admin`.

Seeded admin credentials come from `apps/api/.env` — **change `ADMIN_PASSWORD`,
`JWT_SECRET` and `IP_HASH_SALT` before deploying anywhere.** Defaults are
`admin@team.dev` / `change-me-now`.

No Docker? Point `DATABASE_URL` at any PostgreSQL 14+ instance and run
`npx prisma db push` from `apps/api` instead of `db:migrate`.

---

## Public site

| Route       | What it is |
|-------------|------------|
| `/`         | Hero, services, active projects, team preview, recruiting callout, order CTA |
| `/register` | Create a site account (required before ordering or applying) |
| `/login`    | Sign in to an existing account |
| `/services` | The four practices, engagement models, how an engagement runs |
| `/team`     | All eight profiles, team history, delivered projects |
| `/order`    | Project order form → `POST /api/orders` |
| `/join`     | Recruiting: open roles, idea-partnership pitch, application form |

The four main sections you asked for — **project orders, team joining, team
introduction, services** — each have a dedicated page and a section on the landing
page. Recruiting appears twice: as a section on `/` and as the whole of `/join`,
including the "bring us an innovative idea" pitch box.

### Design

- **Palette:** grass green `#3a9448`, sky blue `#00a5ec`, black `#0a0d0c`, white.
  Full scales are in [tailwind.config.ts](apps/web/tailwind.config.ts); components
  only reference those tokens.
- **Mobile:** single-column below `sm`, off-canvas nav drawer with body-scroll lock,
  44px minimum tap targets, 16px inputs (stops iOS zoom-on-focus), wide content
  scrolls inside its own container so the page body never scrolls sideways.
- **Accessibility:** skip link, visible focus rings, `aria-expanded`/`aria-pressed`
  on every toggle, form errors wired via `aria-describedby`, reduced-motion honoured.

If the API is unreachable the public pages fall back to static copies of the roster
and projects ([content.ts](apps/web/lib/content.ts)) rather than rendering empty.

---

## Registration gate

Ordering a project and applying to join the team both require a registered
account. The rule is enforced in two places:

- **Server** — `POST /api/orders` and `POST /api/applications` sit behind
  `UserGuard`, which rejects anonymous requests with `401 Please register.`
  Admin tokens are rejected too: the two audiences are deliberately separate.
- **Client** — both forms call `requireRegistration()` before validating. With
  no account it raises the **"Please register."** alert and stops. A banner
  above the form and the submit label ("Register to send") make the requirement
  visible before the visitor gets that far.

Every gated action confirms itself with an alert: registration complete, signed
in, signed out, brief submitted, application submitted, and a matching alert on
each failure.

Accounts are stored in `users` with a bcrypt hash and a coarse location
resolved once at sign-up — that location is what the admin user map plots.

---

## Admin console (`/admin`)

JWT login, then:

- **Overview** — visits, unique visitors, countries, active projects, new orders and
  applications at a glance.
- **Visitors & map** — see below.
- **Registered users** — live counters and a map of where accounts are, see below.
- **Projects** — active work with names, status, live progress slider, assigned engineers.
- **Orders** — every ordered task, expandable, status workflow `NEW → REVIEWING →
  QUOTED → ACCEPTED / DECLINED / ARCHIVED`.
- **Applications** — developers applying to join, their years of experience flagged
  against the 7-year bar, and their idea pitches highlighted.
- **Team** — add, activate/deactivate and remove members; shows current assignments.

### Live registered-user counters

`/admin/users` streams four counters over Server-Sent Events, pushed every
3 seconds — no polling, no refresh:

| Counter | Meaning |
|---|---|
| Registered users | Total accounts |
| **Signing up now** | People with the registration form open right now |
| Online now | Registered users active in the last 5 minutes |
| Registered today | Accounts created since midnight |

"Signing up now" is real, not inferred: the registration form pings
`POST /api/users/signup-activity` every 30s while it is open, and fires
`signup-abandon` on `pagehide` if the visitor leaves without finishing.
Completing registration marks the session done. "Online now" comes from a
60-second heartbeat sent while a user is signed in.

`EventSource` cannot set an `Authorization` header, so the stream authenticates
with `?token=` — `AdminGuard` accepts a query token in addition to the bearer
header. Unauthenticated stream requests get a 401.

The same page maps registered users, sized by how many accounts are at each
location, with the same circle/bar marker toggle as the visitor map.

### Visitor tracking and the map

Every page view posts to `POST /api/visits/track`. The API:

1. Reads the client IP (honouring `cf-connecting-ip` / `x-forwarded-for`, with
   `trust proxy` enabled).
2. Resolves a location — Cloudflare/Vercel edge headers first, then ip-api.com as a
   fallback, cached per IP for 24h. Configurable via `GEOIP_PROVIDER`; set it to
   `none`, or swap `lookupRemote` in [geoip.service.ts](apps/api/src/common/geoip.service.ts)
   for a local MaxMind GeoLite2 reader, if you'd rather not call a third party.
3. Stores a **salted SHA-256 hash of the IP, never the IP itself**, and drops
   obvious bots.

The map (`/admin/visitors`) is Leaflet with a CARTO light basemap and **two marker
styles you can toggle**:

- **Circle markers** — radius scales with the count on a square-root curve, so
  circle *area* tracks visitor numbers rather than radius.
- **Bar markers** — a vertical column per location with the count labelled above it.

Both scale off either total visits or unique visitors, and the busiest third of
locations renders in sky blue against grass green for the rest. Locations are
grouped server-side at ~1km precision so nearby lookups collapse into one marker.

---

## API

Public: `GET /api/members`, `GET /api/projects`, `POST /api/visits/track`,
`POST /api/users/register`, `POST /api/users/login`,
`POST /api/users/signup-activity`, `POST /api/users/signup-abandon`.

Registered users only (Bearer user token): `POST /api/orders`,
`POST /api/applications`, `GET /api/users/me`, `POST /api/users/heartbeat`.

Admin (Bearer token): `/api/auth/login`, `/api/auth/me`, full CRUD under
`/api/admin/{members,projects,orders,applications}`, and
`/api/admin/stats/{summary,geo,countries,timeseries,pages,devices}`.

All writes are validated by `class-validator` DTOs with `forbidNonWhitelisted`, and
the whole API sits behind a 60 req/min throttle.

---

## Data model

`TeamMember`, `Project`, `ProjectAssignment` (join table with per-project role),
`ProjectOrder`, `JoinApplication`, `Visit`, `AdminUser`, `User` (site accounts)
and `SignupSession` (ephemeral sign-up presence). Orders and applications carry
an optional `userId` back to the account that submitted them. Full schema in
[schema.prisma](apps/api/prisma/schema.prisma).

Analytics uses raw SQL for the aggregations Prisma can't express — geo grouping with
coordinate rounding, and a `generate_series` LEFT JOIN so the daily chart has no
missing days.

---

## Content to replace

The eight profiles, five projects and company history are **realistic placeholders**,
consistent with the brief (6 years as a team, AI since 2021, every engineer 7+ years,
combined 90 years). Swap them in [seed.ts](apps/api/prisma/seed.ts) and mirror the
change in [content.ts](apps/web/lib/content.ts), which holds the offline fallback.
The site name "EightEngineers" is a placeholder too.

---

## Verification status

Both apps build clean (`nest build`, `next build`). The full stack was run end to end
against a real PostgreSQL engine and exercised: schema push, seed, visit tracking with
geo resolution and mobile-device detection, both public forms, DTO validation
rejection, admin login (including bad-password and missing-token paths), every stats
endpoint, order status mutation, and all six pages rendering live database content.
