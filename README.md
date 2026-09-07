# StackForge — team introduction service

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

The seed creates no accounts. Register on the site, then put that address in
`ADMIN_EMAILS` to unlock the management overview and the admin console.

**Change `JWT_SECRET` and `IP_HASH_SALT` before deploying anywhere** — the
defaults are obvious placeholders.

No Docker? Point `DATABASE_URL` at any PostgreSQL 14+ instance and run
`npx prisma db push` from `apps/api` instead of `db:migrate`.

**Open the site at `http://localhost:3000`,** not `127.0.0.1:3000` or a LAN IP.
The API's `CORS_ORIGIN` allows `http://localhost:3000` only, so any other host
silently fails every API call — the admin console bounces you back to the login
screen. Add the other origin to `CORS_ORIGIN` (comma-separated) if you need it.

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

### Contact

The CTO's WhatsApp number lives in `CONTACT` in
[content.ts](apps/web/lib/content.ts) and surfaces in the footer, the order page
sidebar and the services CTA. Links go through `wa.me` with a pre-filled
message, so they open the app on mobile and WhatsApp Web on desktop.

### Design

- **Palette:** grass green `#3a9448`, sky blue `#00a5ec`, black `#0a0d0c`, white.
  Full scales are in [tailwind.config.ts](apps/web/tailwind.config.ts); components
  only reference those tokens.
- **Motion:** drifting aurora gradients on the dark bands, scroll-reveal with
  stagger ([Reveal.tsx](apps/web/components/Reveal.tsx)), count-up stats
  ([AnimatedCounter.tsx](apps/web/components/AnimatedCounter.tsx)), a sheen that
  sweeps across buttons on hover, card lift with a gradient-border glow, an
  animated hamburger, and a scroll-progress hairline in the header. Every one is
  disabled under `prefers-reduced-motion`, and the scroll-reveal components skip
  straight to visible rather than staying hidden.
- **Background colour:** visitors pick white (default), black, or any custom
  colour from the header swatch. The whole token set — surfaces, text, borders —
  is derived from that one colour by luminance, so text stays readable on
  anything. Stored in `localStorage` and applied by an inline script in
  `<head>` before first paint, so there is no flash on reload.
  See [theme.tsx](apps/web/lib/theme.tsx) and [ThemePicker.tsx](apps/web/components/ThemePicker.tsx).
- **Notifications:** there are no `window.alert` calls. Feedback goes through a
  toast system ([Toast.tsx](apps/web/components/Toast.tsx)) — four variants,
  stacked, auto-dismissing with a time-remaining bar, animated in and out, and
  wired to `role="status"` / `role="alert"` so screen readers announce them.
- **Mobile:** single-column below `sm`, off-canvas nav drawer with body-scroll lock,
  44px minimum tap targets, 16px inputs (stops iOS zoom-on-focus), wide content
  scrolls inside its own container so the page body never scrolls sideways.
- **Accessibility:** skip link, visible focus rings, `aria-expanded`/`aria-pressed`
  on every toggle, form errors wired via `aria-describedby`, reduced-motion honoured.

If the API is unreachable the public pages fall back to static copies of the roster
and projects ([content.ts](apps/web/lib/content.ts)) rather than rendering empty.

---

## Management access

A registered site user whose email is on the `ADMIN_EMAILS` allowlist gets the
`MANAGER` role and sees a **Management** section — a read-only operations
overview at `/management`: projects in progress with their assignees, latest
orders and applications, and user counts. Regular users never see the link, and
the section refuses to render for them.

```
ADMIN_EMAILS="boss@yourcompany.com,ops@yourcompany.com"
```

**Why an allowlist and not a pattern.** Nothing in this application verifies
that someone owns the address they register with. If the role were derived from
a pattern the visitor types — `admin@*`, or a company domain — anyone could
sign up with a qualifying address and grant themselves access. The allowlist
lives in the server environment, so only whoever controls the deployment can
change it. A whole-domain entry (`@yourcompany.com`) is supported and logs a
warning at startup, because it reintroduces exactly that risk.

The role is re-evaluated on every sign-in, so adding or removing an address
takes effect on the user's next login — in both directions.

### One account system

There is a single login at `/login`. Registering is ordinary; elevation comes
from the allowlist, and one session unlocks everything it should:

| Account | Gets |
|---|---|
| Site user | Ordering a project, applying to join |
| Allowlisted user | The above, plus `/management` **and** the full `/admin` console |

There is no separate admin password and no `admin_users` table — both were
retired. `/api/management/*` and `/api/admin/*` each check the `MANAGER` claim
on the signed token, so hiding a navigation link is a convenience, never the
control.

**Setting yourself up:** register on the site as normal, add that address to
`ADMIN_EMAILS`, then sign in. The role is re-evaluated on every sign-in, so no
re-registration is needed — and removing an address revokes access the same way.

---

## Order lifecycle and email

Accepting an order in the console is the moment work starts, so it does three
things at once:

1. Creates a **project in progress** — status `ACTIVE`, `startedAt` set to the
   moment of acceptance, carrying the order's stack and description across.
2. Emails the client to say their project has been added.
3. Links the project to the order via a unique `sourceOrderId`, so re-accepting
   can never produce a duplicate.

New projects are created with `isPublic: false`. Client work does not appear on
the public site until someone deliberately publishes it.

Archiving an order emails the client that it has been archived, making clear
nothing was deleted.

Delivery goes through Resend's HTTP API — no extra dependency and no long-lived
socket, which matters on serverless. **With no `RESEND_API_KEY` set the API logs
the message instead of sending it**, so local development cannot mail a real
client by accident. Set these to turn it on:

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Enables real delivery. Unset = log only |
| `MAIL_FROM` | Sender, e.g. `StackForge <hello@yourdomain.com>` |
| `MAIL_REPLY_TO` | Optional reply-to address |
| `SITE_URL` | Used for links inside the emails |

Notifications are best-effort: a mail failure is logged but never rolls back the
status change the operator asked for.

---

## Requirements documents

Clients can attach a requirements document to a project order — PDF, Word, ODT,
text, Markdown, CSV, Excel or an image, up to **4 MB**. Vercel caps a serverless
request body at 4.5 MB, so that ceiling is a platform limit, not a preference.

Bytes are stored in Postgres (`order_attachments`) rather than object storage:
it keeps the deployment to two services, and files this small do not justify a
third. The blob lives in its own table so listing orders never drags it along —
list responses carry filename, type and size only.

In the console, attachments **view inline** (PDFs and images open in a tab) or
**download**. Both go through `fetch` with the admin bearer token and a blob
URL, because a plain `<a href>` cannot send an Authorization header and putting
a token in a query string would leak it into access logs.

Uploads are validated twice — MIME allow-list and size on the client for fast
feedback, and again on the server, which is the check that counts. Filenames are
stripped of path components, quotes and control characters before they reach a
`Content-Disposition` header.

---

## Registration gate

Ordering a project and applying to join the team both require a registered
account. The rule is enforced in two places:

- **Server** — `POST /api/orders` and `POST /api/applications` sit behind
  `UserGuard`, which rejects anonymous requests with `401 Please register.`
  Admin tokens are rejected too: the two audiences are deliberately separate.
- **Client** — both forms call `requireRegistration()` before validating. With
  no account it raises the **"Please register."** toast and stops. A banner
  above the form and the submit label ("Register to send") make the requirement
  visible before the visitor gets that far.

Every gated action confirms itself with a toast: registration complete, signed
in, signed out, brief submitted, application submitted, and a matching error
toast on each failure.

Accounts are stored in `users` with a bcrypt hash and a coarse location
resolved once at sign-up — that location is what the admin user map plots.

---

## Admin console (`/admin`)

JWT login, then:

- **Overview** — visits, unique visitors, countries, active projects, new orders and
  applications at a glance.
- **Visitors & map** — see below.
- **Registered users** — live counters and a map of where accounts are, see below.
- **Projects** — sortable table with search across name, domain, stack and
  assigned engineer. Inline status and progress editing; a status change offers
  **Undo** in the toast, and the wheel is blocked over the controls so scrolling
  the table cannot silently rewrite a row.
- **Orders** — every ordered task, expandable, status workflow `NEW → REVIEWING →
  QUOTED → ACCEPTED / DECLINED / ARCHIVED`, plus any **requirements document**
  the client attached (view inline or download).
- **Applications** — developers applying to join, their years of experience flagged
  against the 7-year bar, and their idea pitches highlighted.
- **Team** — sortable table with search across name, role, title, skills and
  location, plus a role filter. Add, activate/deactivate and remove members;
  years below the 7-year bar are flagged amber.

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
   Local requests have no routable IP, so set `GEOIP_DEV_LATLNG="lat,lng"` to pin a
   placeholder while developing (already set in `apps/api/.env`). Leave it blank in
   production — without it, local registrations simply carry no coordinates.
3. Stores a **salted SHA-256 hash of the IP, never the IP itself**, and drops
   obvious bots.

The map (`/admin/visitors`) is Leaflet over standard OpenStreetMap tiles,
desaturated in CSS to keep the palette calm. OSM needs no API key — CARTO's
basemaps now watermark unkeyed requests. OSM's tile policy suits low-volume use;
for heavy traffic, move to a keyed provider. There are **two marker styles you can
toggle**:

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
The site name is **StackForge**, and the logo lives in
[apps/web/components/Logo.tsx](apps/web/components/Logo.tsx). Assets generated
from the supplied artwork:

| File | Purpose |
|---|---|
| `apps/web/public/logo-mark.png` | Transparent mark used in the header, footer and auth screens |
| `apps/web/public/logo-original.png` | The original artwork, dark backdrop intact |
| `apps/web/app/icon.png` | Favicon (512px, auto-detected by Next.js) |
| `apps/web/app/apple-icon.png` | iOS home-screen icon (180px) |
| `apps/web/app/opengraph-image.png` | Social share card (1200x630) |

To change the logo, replace `logo-mark.png` (transparent PNG or SVG) and update
`MARK_W` / `MARK_H` in `Logo.tsx` if the aspect ratio differs.

---

## Verification status

Both apps build clean (`nest build`, `next build`). The full stack was run end to end
against a real PostgreSQL engine and exercised: schema push, seed, visit tracking with
geo resolution and mobile-device detection, both public forms, DTO validation
rejection, admin login (including bad-password and missing-token paths), every stats
endpoint, order status mutation, and all six pages rendering live database content.
