# 01. Product Requirements Document

## 1. Summary

CollegeNav is a transport information platform for a college bus fleet. Students find the right bus for where they live and when they travel. Transport administrators keep records current and broadcast changes. Where location data exists, students see buses move and get arrival estimates. Where it does not, the product says so plainly.

## 2. Problem

- Students rely on printed timetables, WhatsApp forwards and word of mouth.
- Route coverage is unclear: "Does any bus pass near my house?"
- Changes (a diverted route, a breakdown, a late bus) reach people late or not at all.
- Nobody can tell whether the schedule they are looking at is current.

## 3. Goals and non-goals

### Goals
1. One trusted source for buses, routes, stops and schedules.
2. Answer "which bus should I take?" in under ten seconds from app open.
3. Push changes and disruptions to affected students only.
4. Give administrators a fast, safe way to edit data, with an audit trail.
5. Offer live tracking and ETAs where data exists, and degrade honestly where it does not.
6. Always mark data that is stale, unverified or unavailable.

### Non-goals (v1)
- Ticketing, payments, seat booking.
- Public city transit integration.
- Turn-by-turn road navigation for drivers.
- Native iOS/Android apps (PWA instead).
- Hardware GPS trackers (supported by API design, not built).

## 4. Personas

**Aarav, first-year student.** Lives 6 km from campus. Does not know which stop is nearest. Wants one clear answer. Checks the app on his phone at the gate and at 7 am at home.

**Meera, final-year student.** Knows her route. Cares about "is it late today?" and "did the evening schedule change?" Wants a notification, not a search.

**Mr. Rao, transport coordinator.** Maintains data in spreadsheets today. Needs to change a stop or cancel a trip in under a minute, from a laptop or phone, and see who is affected.

**Suresh, bus driver.** Not technical. Needs one big button to start a trip and nothing else to think about.

**Parent or visitor.** Wants the timing of one route. No account.

## 5. Scope by priority

### P0, must ship (covers all nine outcomes in baseline form)
- Records: buses, routes, stops, route-stop sequences, trips (timetable).
- Search: from/to by stop name, landmark or "use my location".
- Results: ranked route options with walk, wait, ride, and arrival time.
- Route detail with ordered stops and timetable.
- Stop detail with next departures.
- Notices: create, target, publish, show as banners and a feed.
- Admin console: CRUD for all records, notice composer, verify data.
- Freshness and source labels on every data surface.
- Mobile-first responsive UI and PWA manifest.

### P1, should ship
- Driver mode with live location broadcast.
- Live map with moving buses and ETA on stop and route screens.
- Web push notifications for followed routes.
- Follow routes and stops, saved places.
- Audit log and CSV import for stops and trips.
- Delay detection that drafts a notice.

### P2, if time permits
- One-transfer journeys.
- Offline timetable cache with sync indicator.
- Admin analytics (most searched stops, uncovered origins).
- Multi-language strings.
- Email digest.

## 6. Functional requirements

IDs are referenced throughout the other documents.

### Records (outcome 01)
- FR-01 Admin can create, edit, deactivate and archive buses, routes, stops and trips.
- FR-02 A route has an ordered list of stops per direction (`to_campus`, `from_campus`) with minute offsets from departure.
- FR-03 A trip is a scheduled run of one route in one direction at a time on selected weekdays within a validity window.
- FR-04 Deleting is soft. Records are archived, never destroyed, so history and audit stay intact.

### Search and suggestion (outcomes 02, 04)
- FR-05 User can search from any stop, landmark, or current location to any stop or the campus.
- FR-06 System finds boardable trips whose stops fall within a configurable walk radius (default 800 m) of both ends.
- FR-07 Results are ranked by total door-to-door time with transparent breakdown.
- FR-08 User can choose "leave now", "leave at", or "arrive by".
- FR-09 When nothing is found, the system explains why and shows the nearest stops and the largest gap.

### Information display (outcome 03)
- FR-10 Route screen shows ordered stops, times, direction toggle, map polyline and days of operation.
- FR-11 Stop screen shows the next departures across all routes and what the stop is near.
- FR-12 Timetable is viewable by day of week.

### Notifications (outcome 05)
- FR-13 Admin can publish a notice with type, severity, text, affected routes/stops/trips, and an active window.
- FR-14 Notices appear as a banner on affected screens and in a Notices feed.
- FR-15 Users who follow an affected route receive a push notification (if permitted).
- FR-16 Cancelled trips are visibly struck through in departures and route timetables.
- FR-17 Notices expire automatically at the end of their window.

### Admin (outcome 06)
- FR-18 Role-based access: `admin` and `super_admin`. Drivers and students cannot write records.
- FR-19 Every write is recorded in an audit log with actor, entity, before and after.
- FR-20 Admin can mark a route or trip as verified, which resets its freshness clock.
- FR-21 Admin can cancel or delay a specific trip for a specific date without editing the base schedule.

### Live tracking (outcome 07)
- FR-22 Driver can start and end a trip and broadcast position every 5 seconds.
- FR-23 Students see live bus position on the route map, snapped to the route line.
- FR-24 The system computes ETA for the next stops using live data when fresh, and schedule plus current delay otherwise.
- FR-25 If live data is absent or older than 120 seconds, the UI falls back and labels the source.

### Interface (outcome 08)
- FR-26 All student screens work at 360 px width, one-handed.
- FR-27 Installable PWA with app icon and splash.

### Data honesty (outcome 09)
- FR-28 Every route has a freshness state derived from last verification and validity window.
- FR-29 Every time shown has a source: Live, Estimated, Scheduled.
- FR-30 Routes past `valid_to`, suspended routes, and stops removed from service are shown as Unavailable with a reason.
- FR-31 Offline or failed fetches show "Last updated" with the cache time.

## 7. Non-functional requirements

| Area | Target |
|---|---|
| Performance | First contentful paint under 1.8 s on mid-range phone, 4G. Plan query under 400 ms server time for 50 routes. |
| Availability | Static timetable remains readable offline once visited. |
| Accessibility | WCAG 2.2 AA. Touch targets at least 44 px. |
| Security | Row-level security on all tables. No driver or admin writes without role. Rate limiting on public endpoints. |
| Privacy | No student location is stored. "Use my location" runs in the browser only. Driver positions are retained 7 days. |
| Scalability | Designed for 5,000 students, 40 buses, 5 s position updates. |
| Observability | Structured logs, error boundary, health endpoint. |

## 8. Success metrics

- Time from app open to first route suggestion: under 10 s (median).
- Share of searches returning at least one option: above 85% after data is loaded.
- Share of routes in Verified or Aging state: above 90%.
- Notice reach: percentage of followers who receive a push within 30 s of publish.
- Admin time to publish a change: under 60 s.

For the hackathon, demonstrate metrics 1, 4 and 5 live.

## 9. Assumptions

- The college can supply stop names and approximate coordinates; admins can correct them on a map.
- Most college buses run fixed daily trips (morning to campus, evening from campus).
- A phone in the driver's hand is an acceptable GPS source for v1.
- One campus. The schema allows more.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| No live data in the real world | Live is optional by design. Scheduled mode is complete without it. |
| Admins stop updating data | Freshness badges expose staleness publicly. Dashboard lists what needs verification. |
| Wrong ETA damages trust | Confidence labels, conservative speed floor, "Estimated" wording. |
| Geocoding gaps for local landmarks | Landmarks are admin-managed records attached to stops. |
| Driver phone sleeps and stops reporting | Wake Lock API, visible "Broadcasting" indicator, signal-lost fallback. |
| Hackathon time | P0 first, phased plan, simulator for demo. |
