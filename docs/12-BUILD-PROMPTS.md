# 12. Build prompts

Use with Claude Code, Antigravity, Cursor or any coding agent. Place the doc set in `docs/` and `AGENTS.md` in the repo root first. Run the prompts in order. After each, run `pnpm typecheck && pnpm test` and look at the result in the browser before moving on.

General rule to append to every prompt: *"Follow AGENTS.md. Use only design tokens. Do not add features outside the referenced docs. If a doc is ambiguous, pick the simpler option and note it in a TODO comment."*

---

## Prompt 1: Scaffold
```
Create the CollegeNav Next.js 15 app (App Router, TypeScript strict, Tailwind) following docs/10-FOLDER-STRUCTURE.md exactly.
Add src/styles/tokens.css and the Tailwind mapping from docs/03-DESIGN-SYSTEM.md section 5.
Load Geist and Instrument Serif via next/font and expose --font-geist and --font-instrument.
Add lib/env.ts (zod), lib/errors.ts, copy/en.ts, an /api/health route, and a root layout with a skip link.
Add Vitest and Playwright config. Add the package.json scripts listed in the folder doc.
```

## Prompt 2: Database
```
Create Supabase migrations 0001 to 0005 from docs/07-DATA-MODEL.md (extensions and enums, tables, live and notices tables, RLS, functions and views).
Create src/server/schema.ts (Drizzle) mirroring the tables, and src/server/db.ts.
Write scripts/seed.ts that is idempotent and follows the seed plan in section 7: stops, aliases, four routes with directions and stop sequences, line geometry generated from stops, trips Mon to Sat, today's trip instances, notices, a super admin profile, a driver with code 246810, and the settings keys.
```

## Prompt 3: Domain logic (tests first)
```
Implement src/domain/{time,geo,freshness} per docs/09-CORE-LOGIC.md sections 1 and 2, with Vitest tests in tests/domain.
Then implement src/domain/planner per section 3 including cost, ranking, reasons, and arrive-by. Write every test listed in 3.10 before the implementation, and make them pass.
Keep domain pure: no imports from server, app or components.
```

## Prompt 4: UI primitives and transit components
```
Build src/components/ui and src/components/transit per docs/03-DESIGN-SYSTEM.md section 7: Button, Input, Segmented, Tabs, Dialog, Toast, Popover, Skeleton, Sheet (with peek, half, full snaps and a keyboard alternative), RouteBadge, StatusTag, SourceLabel, FreshnessTag, DepartureRow, JourneyCard, StopTimeline, NoticeBanner.
Create a /dev/components page (not linked anywhere) that renders every component in every state so we can review them. White background, black text, hairline borders, no shadows except on floating elements. Lucide icons only from the allowed list.
```

## Prompt 5: Read APIs and pages
```
Implement the public read endpoints from docs/08-API-SPEC.md section 2: config, stops (search and near), stop detail, departures, routes, route detail, timetable, notices.
Add repositories and services. Cache with tag revalidation.
Build pages: Route detail (docs/04 S4), Stop detail (S5), Notices (S8) with loading, empty, error and stale states from docs/05-UX-SPEC.md. Show freshness and source labels everywhere times appear.
```

## Prompt 6: Plan
```
Implement plan.service and GET /api/v1/plan from docs/08 section 2 using the domain planner.
Build Home (S1), Place picker (S2) and Results (S3, S3b) with the bottom sheet over a MapLibre map (OpenFreeMap positron). Implement the signature route-line draw animation (480 ms) and fit-bounds on selection.
Wire "Use my location" in the browser only; do not send coordinates anywhere except the plan request.
Desktop: fixed 420 px left panel with the map filling the rest.
```

## Prompt 7: Auth and admin shell
```
Add Supabase email OTP sign-in, profiles trigger, role guard middleware for /admin and /driver.
Build the admin layout with left nav and the Dashboard (A1) reading from /api/v1/admin/dashboard.
Implement the audit.service and ensure every admin mutation writes an audit row inside the same transaction.
```

## Prompt 8: Admin CRUD
```
Implement admin endpoints and screens for stops (with map pin placement), buses, drivers, routes, and the route editor with StopSequencer (dnd-kit), the diff dialog from the dry_run response, verify, suspend and resume (docs/08 section 5).
Enforce the invariants in docs/09 section 9 on the server and show rule violations inline.
Build the timetable grid with bus conflict detection.
```

## Prompt 9: Notices and operations
```
Implement notice endpoints, the composer with live preview (banner, feed card, push text), reach count, publish and end.
Implement day-of operations: cancel, delay, reassign bus for a trip instance, with the optional notify flag that drafts a notice.
Student side: banners on Home, Route and Stop screens, cancelled departures struck through, delayed tags.
```

## Prompt 10: Live tracking
```
Implement driver session (code to JWT), today list, start, positions (batch), events, end per docs/08 section 4.
Implement src/domain/eta per docs/09 section 4 with the tests in 4.6, and live.service that snaps, updates trip_instances, appends bus_positions, and broadcasts on live:route:{code}.
Build driver mode UI (docs/04 driver section) with Wake Lock, press-and-hold end, and clear broadcasting indicator.
Build the Live trip screen (S6) and the bus layer on the Map tab (S7) with marker interpolation and tracking-state degradation (live, stale, lost, not tracked).
Write scripts/simulate-bus.ts that logs in as the seeded driver and replays a route.
```

## Prompt 11: Follow and push
```
Implement subscriptions API, Account screen (S9), service worker, VAPID push registration, push.service with batching, tag-based replacement and quiet hours (docs/09 section 6).
Add the delay detection cron (docs/09 section 5) and the other cron endpoints in docs/08 section 6, plus vercel.json schedules.
```

## Prompt 12: Hardening and polish
```
Do a full pass against docs/05-UX-SPEC.md: every screen has loading, empty, error and offline states; keyboard operability; focus rings; aria-live for ETA and notices; reduced motion.
Add rate limiting from docs/06 section 7, security headers, and CSP.
Add PWA manifest, icons and installability.
Write Playwright tests for: find a bus, view outdated route, admin publishes notice and student sees it, cancelled trip appears struck through.
Run lighthouse on Home and fix anything under 90 for performance or accessibility.
```

---

## Review prompts (use after any UI task)

```
Review this screen against docs/03-DESIGN-SYSTEM.md and docs/04-UI-SCREENS.md. List every deviation: colours not from tokens, radii outside the scale, shadows on non-floating elements, uppercase labels, arrows in button text, decorative icons, missing source or freshness labels, touch targets under 44 px, text under 12 px. Fix them.
```

```
Audit the honesty rules in docs/05-UX-SPEC.md section 3 across all student screens. For each place a time is shown, confirm a source label is present and degrades correctly when live data goes stale. Report and fix gaps.
```
