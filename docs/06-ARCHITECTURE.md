# 06. Architecture

## 1. Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript strict | One codebase for UI and API, fast to ship, PWA friendly |
| Styling | Tailwind CSS, CSS variables for tokens | Direct mapping from `03-DESIGN-SYSTEM.md` |
| Primitives | Radix UI + custom components | Accessible dialogs, popovers, tabs without visual opinions |
| Data | Supabase (Postgres 15, PostGIS, Auth, Realtime, RLS) | Spatial queries, realtime and auth in one service |
| ORM / queries | Drizzle ORM for typed queries, raw SQL for spatial functions | Types without hiding PostGIS |
| Validation | Zod, shared between client and server | Single source of truth for payloads |
| Client data | TanStack Query | Caching, stale-while-revalidate, retries |
| Map | MapLibre GL JS with OpenFreeMap `positron` style | Free, no key, light style |
| Geometry | Turf.js (client and server) | Snap to line, distance along line |
| Push | Web Push (VAPID) via `web-push` | No third-party dependency |
| Forms | React Hook Form + Zod resolver | Admin forms |
| Drag and drop | dnd-kit | Stop sequencer |
| Icons, fonts | Lucide, Geist, Instrument Serif | Per design system |
| Hosting | Vercel (app), Supabase (data) | Fast deploy, free tiers |
| Tests | Vitest (logic), Playwright (flows) | Planner and ETA need unit tests |

## 2. System diagram

```
 Student PWA ──────┐                              ┌── Supabase Realtime
 (Next.js client)  │                              │   channels: live:route:{code}, notices
                   ▼                              │
            Next.js server (Route Handlers, Server Actions)
              │  │  │
              │  │  └── Planner service      (pure TS, unit tested)
              │  └───── ETA / delay engine   (pure TS, unit tested)
              └──────── Notification service (web-push)
                   │
                   ▼
            Supabase Postgres + PostGIS  (RLS enforced)
                   ▲
 Admin console ────┤  (same app, /admin, role gated)
 Driver mode ──────┘  (same app, /driver, driver code session)
 Vercel Cron  ──────► /api/cron/* (freshness sweep, notice expiry, delay detection, retention)
```

## 3. Rendering strategy

| Route | Strategy |
|---|---|
| `/` Home | Static shell, client hydrate nearby and notices |
| `/routes/[code]`, `/stops/[id]` | Server render with `revalidate: 60`, live portions client-side |
| `/plan` | Client-driven, calls `/api/v1/plan` |
| `/map` | Client only (MapLibre) |
| `/notices` | Server render, `revalidate: 30`, realtime updates |
| `/admin/*` | Server components behind auth, client forms |
| `/driver/*` | Client heavy, minimal bundle |

## 4. Modules and boundaries

```
domain/         Pure TypeScript. No framework or DB imports. Fully unit tested.
  planner/      stop-matching, journey generation, scoring
  eta/          snapping, progress, ETA, confidence
  freshness/    freshness state calculation
  notices/      targeting, expiry, dedupe
  time/         service day, timezone, timetable expansion
server/         DB access, services that orchestrate domain + DB
  repositories/ stops, routes, trips, notices, live
  services/     plan.service, live.service, notice.service, push.service
app/            Next.js routes and API handlers
components/     UI (ui/, domain widgets, map/)
lib/            supabase clients, env, logging, auth guards
```

Rule: `domain/` never imports from `server/`, `app/` or `components/`. This keeps the hard logic testable and reusable if the API is split out later.

## 5. Key runtime flows

### Plan query
1. Client calls `GET /api/v1/plan`.
2. Service loads active route stop sequences and today's `trip_instances` (cached 30 s in memory).
3. Domain planner matches stops near origin and destination, builds boardable journeys, scores, returns top 5 with reasons.
4. Response includes `source` for each time and `freshness` for each route.

### Live position ingest
1. Driver client posts position to `POST /api/v1/driver/trips/:id/positions` every 5 s (batched if offline).
2. Server validates session, rate-limits (1 per 2 s per trip), checks accuracy.
3. Snaps to route polyline, computes progress, speed EMA, delay.
4. Upserts `live_trips.last_*` fields and appends to `bus_positions`.
5. Realtime broadcast on `live:route:{code}` with a compact payload.
6. If delay crosses threshold, enqueue delay draft notice.

### Notice publish
1. Admin publishes. Server writes notice and targets in a transaction.
2. Resolves affected followers from `subscriptions` using targets.
3. Sends push to subscribers (batched, TTL 1 hour, same tag for updates).
4. Broadcasts to `notices` channel. Clients invalidate their query.

### Freshness
Computed, not stored, from `verified_at`, `valid_to`, `status` and settings. Cron only exists to send admin reminders and to compute dashboard counts.

## 6. Authentication and authorization

| Actor | Auth | Capabilities |
|---|---|---|
| Anonymous | none | Read everything public. Search. No follows. |
| Student | Supabase email OTP, optional domain restriction to the college | Follow, saved places, push |
| Driver | Driver code (6 digits per driver, hashed) exchanged for a short-lived signed JWT limited to `/driver` endpoints | Start trips, post positions, report events for their assigned bus only |
| Admin | Supabase email OTP plus `profiles.role in ('admin','super_admin')` | All admin writes |
| Super admin | Same | Manage admins and settings |

Enforcement is layered:
1. **RLS** in Postgres: public tables are `select` for everyone, writes require admin role, user-owned tables restrict to `auth.uid()`.
2. **Route guards**: middleware checks role for `/admin`, driver token for `/driver`.
3. **Server validation**: Zod on every handler. Never trust client-provided role or ids.

## 7. Security and privacy

- Rate limits: public endpoints 60 req/min per IP; plan 20/min; driver positions 1 per 2 s per trip; OTP requests 5 per hour per email.
- Input sanitisation on all admin text. Notices render as plain text, no HTML.
- CSRF: server actions with same-site cookies; API endpoints for admin require bearer session.
- Secrets in environment variables only. Service role key is server only.
- Student location is never sent to the server by default. Plan takes coordinates only when the user taps "Use my location", and they are not stored. `plan_no_result` telemetry rounds to a 500 m cell.
- Driver positions: retained 7 days then deleted by cron.
- Audit log is append-only (no update or delete policy).
- Security headers: CSP, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy` with geolocation self.

## 8. Realtime design

- Channel `live:route:{code}`: events `position` (trip id, lat, lng, heading, speed, progress, delay, ts), `status` (trip started, ended, cancelled).
- Channel `notices`: events `published`, `updated`, `ended`.
- Clients subscribe only to what is on screen. Map tab subscribes to all active routes with a 1 Hz client-side throttle.
- Fallback: if the socket fails, poll `GET /live/trips` every 10 s.

## 9. Caching

| Data | Cache |
|---|---|
| Stops, routes, stop sequences | CDN `s-maxage=60, stale-while-revalidate=600`, invalidated on admin write by tag |
| Trip instances for today | In-memory 30 s per server instance |
| Plan results | None (cheap to compute), but loaded datasets cached |
| Live positions | No cache, realtime |
| Map tiles | Browser and service worker |

## 10. Observability

- Structured JSON logs with request id.
- Health endpoint `/api/health` checks DB and realtime.
- Error boundary at the root with Sentry-compatible hook (optional).
- Admin dashboard shows last position age per live trip.

## 11. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # server only
DATABASE_URL=                          # pooled
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:transport@college.edu
DRIVER_JWT_SECRET=
CRON_SECRET=
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/positron
NEXT_PUBLIC_DEFAULT_CENTER=78.4867,17.3850
NEXT_PUBLIC_CAMPUS_NAME=Main campus
ALLOWED_EMAIL_DOMAIN=                  # optional, e.g. college.edu
```

## 11a. Deployment

1. Create Supabase project, enable PostGIS, run migrations, run seed.
2. Deploy to Vercel with env vars. Add cron jobs from `vercel.json`.
3. Generate VAPID keys once (`npx web-push generate-vapid-keys`).
4. Create first super admin by inserting into `profiles` after first sign-in.
5. Verify `/api/health`, then run the demo script in `11-BUILD-PLAN-AND-DEMO.md`.
