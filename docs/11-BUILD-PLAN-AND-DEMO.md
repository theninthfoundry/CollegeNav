# 11. Build plan and demo

Sized for a 36 to 48 hour hackathon with one to three builders. Adjust by cutting from the bottom of each phase, never from the top.

## 1. Phases

### Phase 0: Foundation (about 3 hours)
- [ ] Create repo, Next.js, TypeScript strict, Tailwind, ESLint, Prettier.
- [ ] Drop in `tokens.css`, Tailwind mapping, fonts (Geist, Instrument Serif).
- [ ] Supabase project, PostGIS on, run migrations 0001 to 0005.
- [ ] `lib/env.ts`, Supabase clients, health endpoint.
- [ ] Seed script with stops, routes, trips, notices, admin user.
- [ ] Deploy to Vercel on day one so the live URL exists.

Exit: `/api/health` green on production, seed loaded.

### Phase 1: Read path and design primitives (about 7 hours)
- [ ] UI primitives: Button, Input, Segmented, Tabs, Sheet, Skeleton, Toast.
- [ ] Transit components: RouteBadge, StatusTag, SourceLabel, FreshnessTag, DepartureRow.
- [ ] `domain/time`, `domain/freshness` with tests.
- [ ] API: stops, routes, route detail, timetable, stop departures, notices, config.
- [ ] Pages: Route detail, Stop detail, Notices feed.
- [ ] Bottom tabs and desktop split layout.

Exit: browse any route or stop with correct times, freshness tags, and notices. Outcomes 03, 09 (baseline), 08 visible.

### Phase 2: Planner (about 7 hours)
- [ ] `domain/geo`, `domain/planner` with the test list from `09-CORE-LOGIC.md`.
- [ ] `plan.service` and `/api/v1/plan`.
- [ ] Place picker with stop autocomplete and "Use my location".
- [ ] Results sheet with JourneyCard, no-result explainer.
- [ ] MapView with route and journey layers, signature line-draw animation.

Exit: from any seeded origin, correct ranked options and a clean no-result state. Outcomes 02, 04.

### Phase 3: Admin console (about 8 hours)
- [ ] Login, role gate, admin layout.
- [ ] Stops manager with map pin placement.
- [ ] Route editor with StopSequencer, diff dialog, verify.
- [ ] Buses manager and timetable grid.
- [ ] Notice composer with preview and publish.
- [ ] Day-of operations: cancel and delay trip for today.
- [ ] Audit log writes on every mutation.

Exit: an admin changes a route, publishes a notice, cancels a trip; student screens reflect it. Outcomes 01, 05, 06.

### Phase 4: Live (about 7 hours)
- [ ] Driver session, today list, start, positions, end.
- [ ] `domain/eta` with tests, live service, realtime broadcast.
- [ ] Live trip screen and Map tab bus layer.
- [ ] Tracking state and source label degradation.
- [ ] `scripts/simulate-bus.ts` for demo and tests.

Exit: simulator moves a bus on the student map, ETA appears, killing the simulator degrades labels within two minutes. Outcome 07.

### Phase 5: Notifications and follow (about 4 hours)
- [ ] Email OTP sign-in for students, subscriptions API and UI.
- [ ] Service worker, VAPID, push subscribe, push on publish.
- [ ] Delay detection cron drafting notices.

Exit: following R2 then publishing a notice produces a push on a real phone. Outcome 05 complete.

### Phase 6: Polish and demo prep (about 5 hours)
- [ ] State matrix pass: loading, empty, error, offline on every screen.
- [ ] Accessibility pass: keyboard, focus rings, labels, contrast.
- [ ] PWA manifest and icons, install prompt guidance.
- [ ] Performance pass: lazy-load map, check bundle size.
- [ ] Playwright smoke tests for the three headline flows.
- [ ] Rehearse the demo twice. Record a fallback video.

## 2. If time runs short, cut in this order

1. One-transfer journeys (never started).
2. CSV import, insights, command palette.
3. Push notifications (keep in-app notices).
4. Delay detection auto-draft (keep manual delay).
5. Route line drawing in admin (keep auto line).
6. Offline cache.

Never cut: planner, freshness labels, notices, admin CRUD, live simulator. Those are what the problem statement scores.

## 3. Definition of done (per feature)

- Works at 360 px width and at 1280 px.
- Has loading, empty, and error states from `05-UX-SPEC.md`.
- Strings in `copy/en.ts`. Tokens only, no raw hex.
- Domain logic covered by tests.
- Keyboard operable, focus visible.
- Writes appear in the audit log.

## 4. Outcome checklist for judges

| # | Outcome | Proof in the demo |
|---|---|---|
| 01 | Digital records | Admin: stops, routes, buses, timetable lists |
| 02 | Search start to destination | Plan with "From: JNTU Metro" to campus |
| 03 | Stops, sequences, schedules | Route detail timeline and timetable |
| 04 | Suggest suitable routes | Ranked results with walk, wait, ride breakdown |
| 05 | Notify on changes | Publish notice, watch banner and phone push arrive |
| 06 | Admin updates | Reorder a stop, diff dialog, audit log entry |
| 07 | Optional live tracking | Simulator bus on the map, ETA, then signal lost fallback |
| 08 | Mobile-friendly | Demo on phone, installed PWA |
| 09 | Identify unavailable or outdated | R3 Outdated banner, R4 Suspended with reason, source labels |

## 5. Demo script (about 5 minutes)

**0:00 Problem (20 s).** "Students rely on screenshots of timetables. Nobody knows if they are current."

**0:20 Find a bus (60 s).** On phone. Open the app. From: "JNTU" (autocomplete), To defaults to campus. Tap Find buses. Show the three options, the route drawing onto the map, the breakdown (walk, wait, ride), the source labels. Point out "Best option".

**1:20 Honesty (45 s).** Open R3 from results. Show the Outdated banner, "Schedule may be outdated", and that it is never marked best. Open R4: "Route 4 is not running", with the admin's reason.

**2:05 Live (60 s).** Start the simulator. Open the live trip. The bus glides, ETA shows "Estimated". Stop the simulator. After a moment the label drops to "Last seen" then "Estimated from the schedule".

**3:05 Admin change and notice (80 s).** On laptop. Admin dashboard. Edit R2: move a stop, show the diff, mark verified. Cancel the 8:00 trip for today. Publish a Warning notice. On the phone, the banner appears and a push arrives; the cancelled departure is struck through.

**4:25 Close (35 s).** Show the audit log entry, the outcome checklist slide, and the architecture in one sentence: "Pure domain logic, Postgres with PostGIS, realtime over Supabase, installable PWA."

### Demo safety net
- Pre-load the app on the phone and keep it signed in.
- Keep the simulator command in a terminal tab: `pnpm sim --route R1 --speed 8`.
- Have a screen recording of the full flow ready.
- Seed script is idempotent: `pnpm db:seed` resets demo state in 10 seconds.
- Disable auto push during rehearsal to avoid surprise notifications; enable before the demo.

## 6. Questions judges may ask

| Question | Answer |
|---|---|
| What if the college has no GPS hardware? | Live is optional. Driver mode uses a phone. Without it, everything works on schedules and labels itself honestly. |
| How do you stop wrong ETAs hurting trust? | Source labels, conservative speed floor, schedule fallback within two minutes of signal loss, and a visible confidence wording. |
| How do you keep data current? | Freshness is public and computed. Admin dashboard lists what needs verification. Every change is audited. |
| Privacy of students? | Location never stored. Telemetry rounds to 500 m cells. Browsing needs no account. |
| Scale? | 5,000 students and 40 buses: planner runs in memory in under 10 ms per query; realtime payloads are tiny. |
| What would you build next? | One-transfer journeys, offline planner, admin analytics, Telugu and Hindi. |
