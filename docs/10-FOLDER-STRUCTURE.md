# 10. Folder structure

Single Next.js repository. Strict boundaries: `domain/` is pure, `server/` talks to the database, `app/` wires HTTP and pages, `components/` renders.

```
collegenav/
├─ AGENTS.md
├─ README.md
├─ docs/                          # this doc set (00 to 12)
├─ package.json
├─ tsconfig.json                  # strict, path alias "@/*" -> src/*
├─ next.config.ts
├─ tailwind.config.ts
├─ vercel.json                    # cron schedules
├─ .env.example
├─ public/
│  ├─ manifest.webmanifest
│  ├─ icons/                      # app icons 192, 512, maskable
│  └─ sw.js                       # service worker (or generated)
├─ supabase/
│  ├─ migrations/
│  │  ├─ 0001_extensions_enums.sql
│  │  ├─ 0002_core_tables.sql
│  │  ├─ 0003_live_notices.sql
│  │  ├─ 0004_rls.sql
│  │  └─ 0005_functions_views.sql
│  └─ seed.sql                    # settings keys only; data via scripts/seed.ts
├─ scripts/
│  ├─ seed.ts                     # stops, routes, trips, notices, users
│  ├─ simulate-bus.ts             # replays a route polyline as a driver
│  └─ gen-vapid.ts
├─ tests/
│  ├─ domain/                     # Vitest, mirrors src/domain
│  └─ e2e/                        # Playwright flows
└─ src/
   ├─ app/
   │  ├─ layout.tsx               # fonts, providers, skip link
   │  ├─ globals.css              # imports styles/tokens.css
   │  ├─ (student)/
   │  │  ├─ layout.tsx            # bottom tabs, desktop split view
   │  │  ├─ page.tsx              # Home / Plan
   │  │  ├─ plan/page.tsx         # Results (query in URL)
   │  │  ├─ map/page.tsx
   │  │  ├─ routes/[code]/page.tsx
   │  │  ├─ stops/[id]/page.tsx
   │  │  ├─ trips/[instanceId]/page.tsx   # live trip
   │  │  ├─ notices/page.tsx
   │  │  ├─ notices/[id]/page.tsx
   │  │  └─ account/page.tsx
   │  ├─ admin/
   │  │  ├─ layout.tsx            # auth gate, left nav
   │  │  ├─ page.tsx              # dashboard
   │  │  ├─ operations/page.tsx
   │  │  ├─ routes/page.tsx
   │  │  ├─ routes/[id]/page.tsx  # editor
   │  │  ├─ stops/page.tsx
   │  │  ├─ buses/page.tsx
   │  │  ├─ timetable/page.tsx
   │  │  ├─ notices/page.tsx
   │  │  ├─ notices/new/page.tsx
   │  │  ├─ audit/page.tsx
   │  │  └─ settings/page.tsx
   │  ├─ driver/
   │  │  ├─ layout.tsx
   │  │  ├─ page.tsx              # code entry and today's trips
   │  │  └─ trip/[instanceId]/page.tsx
   │  ├─ login/page.tsx
   │  └─ api/
   │     ├─ health/route.ts
   │     ├─ cron/{instances,notices,delays,stale,retention,freshness}/route.ts
   │     └─ v1/
   │        ├─ config/route.ts
   │        ├─ stops/route.ts
   │        ├─ stops/[id]/route.ts
   │        ├─ stops/[id]/departures/route.ts
   │        ├─ routes/route.ts
   │        ├─ routes/[code]/route.ts
   │        ├─ routes/[code]/timetable/route.ts
   │        ├─ plan/route.ts
   │        ├─ live/trips/route.ts
   │        ├─ live/trips/[id]/route.ts
   │        ├─ notices/route.ts
   │        ├─ me/...               # subscriptions, push, places
   │        ├─ driver/...           # session, today, start, positions, events, end
   │        └─ admin/...            # stops, routes, buses, drivers, trips, operations, notices, audit, settings, import
   ├─ domain/                       # PURE. No imports from server, app, components
   │  ├─ time/                     # tz helpers, expandTrips, day bitmask
   │  ├─ freshness/                # computeFreshness
   │  ├─ planner/                  # candidates, cost, rank, reasons
   │  ├─ eta/                      # snap, speed, delay, etaForStop, trackingState
   │  ├─ notices/                  # effective routes, reach, quiet hours
   │  ├─ geo/                      # haversine, walk time, bbox
   │  └─ types.ts                  # shared domain types
   ├─ server/
   │  ├─ db.ts                     # drizzle + pg client
   │  ├─ schema.ts                 # drizzle schema mirroring migrations
   │  ├─ repositories/             # stops, routes, trips, instances, notices, subscriptions
   │  ├─ services/
   │  │  ├─ plan.service.ts
   │  │  ├─ live.service.ts
   │  │  ├─ notice.service.ts
   │  │  ├─ push.service.ts
   │  │  ├─ instance.service.ts     # create daily instances, apply overrides
   │  │  └─ audit.service.ts
   │  ├─ auth/                     # session, role guards, driver JWT
   │  ├─ ratelimit.ts
   │  └─ cache.ts                  # tag revalidation helpers
   ├─ lib/
   │  ├─ supabase/{client,server,admin}.ts
   │  ├─ env.ts                    # zod-validated env
   │  ├─ errors.ts                 # ApiError, error mapping
   │  ├─ api.ts                    # fetch wrappers for the client
   │  └─ format.ts                 # time, distance, duration formatting
   ├─ schemas/                      # Zod schemas shared by client and server
   ├─ components/
   │  ├─ ui/                       # Button, Input, Segmented, Tabs, Dialog, Toast, Popover, Skeleton, Table, Sheet
   │  ├─ transit/                  # RouteBadge, StatusTag, SourceLabel, FreshnessTag, DepartureRow,
   │  │                            # JourneyCard, StopTimeline, NoticeBanner, PlaceField, TimeModeSwitch
   │  ├─ map/                      # MapView, RouteLayer, StopLayer, BusLayer, JourneyLayer, MapControls
   │  ├─ admin/                    # StopSequencer, RouteForm, TripGrid, NoticeComposer, DiffDialog, AuditTable
   │  ├─ driver/                   # TripPanel, BroadcastIndicator, HoldButton
   │  └─ layout/                   # BottomTabs, SplitView, AdminNav, TopBar
   ├─ hooks/                        # useGeolocation, usePlan, useLiveTrips, useNotices, useSubscriptions, useWakeLock
   ├─ styles/tokens.css
   ├─ copy/en.ts                    # all user-facing strings
   └─ middleware.ts                 # role gating for /admin and /driver
```

## Module rules

1. `domain/*` has no I/O. It receives data and returns data. Every function has a test.
2. `server/repositories/*` return plain objects typed from `schema.ts`. No business logic.
3. `server/services/*` orchestrate: load via repositories, call `domain`, write, audit, broadcast.
4. Route handlers do three things only: parse and validate with Zod, call one service, shape the response.
5. Components never import `server/*`. They call the API via `lib/api.ts` and TanStack Query.
6. All user-visible strings come from `copy/en.ts`.
7. Tokens come from CSS variables. No hex values in components.
8. Admin write endpoints always call `audit.service` in the same transaction.

## Naming

- Files kebab-case, components PascalCase, hooks `useX`.
- DB columns snake_case, API JSON snake_case, TypeScript camelCase mapped at the repository boundary.
- Tests named `{unit}.test.ts` beside the matching path under `tests/domain`.

## Scripts (`package.json`)

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "db:migrate": "supabase db push",
  "db:seed": "tsx scripts/seed.ts",
  "sim": "tsx scripts/simulate-bus.ts --route R1 --speed 8",
  "vapid": "tsx scripts/gen-vapid.ts"
}
```

## Dependencies

```
runtime: next react react-dom typescript zod drizzle-orm pg @supabase/supabase-js @supabase/ssr
         @tanstack/react-query maplibre-gl @turf/turf date-fns date-fns-tz web-push
         @radix-ui/* react-hook-form @hookform/resolvers @dnd-kit/core @dnd-kit/sortable
         lucide-react clsx tailwind-merge geist
dev:     tailwindcss postcss autoprefixer vitest @playwright/test tsx eslint prettier drizzle-kit
```
Instrument Serif is loaded with `next/font/google`.
