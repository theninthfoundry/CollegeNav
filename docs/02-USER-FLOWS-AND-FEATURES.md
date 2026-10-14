# 02. Features and user flows

## 1. Feature catalogue

Priority: **P0** ship, **P1** should, **P2** stretch. "FR" links to `01-PRD.md`.

### Student app

| ID | Feature | Pri | FR |
|---|---|---|---|
| S-01 | Home with search card, nearby stops, active notices | P0 | 05, 14 |
| S-02 | Origin/destination picker (stop, landmark, current location, saved place) | P0 | 05 |
| S-03 | Time mode: leave now, leave at, arrive by | P0 | 08 |
| S-04 | Ranked route options with breakdown | P0 | 06, 07 |
| S-05 | Route detail: stop timeline, timetable, map | P0 | 10, 12 |
| S-06 | Stop detail: next departures, routes serving, nearby landmarks | P0 | 11 |
| S-07 | Notices feed and in-context banners | P0 | 14, 16 |
| S-08 | Freshness and source labels | P0 | 28, 29, 30 |
| S-09 | Network map of all routes | P0 | 10 |
| S-10 | Live bus positions and ETA | P1 | 23, 24, 25 |
| S-11 | Follow routes and stops | P1 | 15 |
| S-12 | Web push notifications | P1 | 15 |
| S-13 | Saved places (home, other) | P1 | |
| S-14 | "No service" explainer with nearest alternatives | P0 | 09 |
| S-15 | Offline timetable cache | P2 | 31 |
| S-16 | One-transfer journeys | P2 | |

### Admin console

| ID | Feature | Pri | FR |
|---|---|---|---|
| A-01 | Dashboard: live trips, active notices, data needing verification | P0 | 20, 28 |
| A-02 | Stops manager with map pin placement | P0 | 01 |
| A-03 | Routes manager with stop sequencer (drag to reorder) per direction | P0 | 01, 02 |
| A-04 | Route line drawing (auto from stops, editable) | P1 | |
| A-05 | Buses manager | P0 | 01 |
| A-06 | Trip and timetable editor (weekly grid) | P0 | 03 |
| A-07 | Notice composer with targeting and preview | P0 | 13 |
| A-08 | Day-of operations: cancel or delay a trip for a date | P0 | 21 |
| A-09 | Mark verified | P0 | 20 |
| A-10 | Audit log | P1 | 19 |
| A-11 | CSV import for stops and trips | P1 | |
| A-12 | Live operations map | P1 | 22 |
| A-13 | Insights: searches with no result, popular stops | P2 | |

### Driver mode

| ID | Feature | Pri | FR |
|---|---|---|---|
| D-01 | Sign in with driver code | P1 | 22 |
| D-02 | Pick today's trip and start | P1 | 22 |
| D-03 | Broadcast location every 5 s with status indicator | P1 | 22 |
| D-04 | Report delay or breakdown in one tap | P1 | |
| D-05 | End trip | P1 | 22 |
| D-06 | Demo simulator that replays a route | P1 | |

## 2. Core flows

### Flow A: Find a bus (student)

1. Open app. Home shows search card, nearby stops (if location allowed), active notices.
2. Tap "From". Choose a stop, type a landmark, or tap "Use my location".
3. "To" defaults to Campus. Student can change it.
4. Time defaults to "Leave now". Student can switch.
5. Tap **Find buses**.
6. Results sheet lists options. First is highlighted as best. Each card shows route badge, board stop, depart time, arrive time, walk, wait, ride, and source label.
7. Tap an option. Route detail opens with the journey highlighted on the map: walk to boarding stop, ride, alight stop, walk.
8. Tap **Follow route** to receive notices.

Failure branches: no results show S-14 (nearest stops, why nothing matched, who to contact). Location denied shows a stop search instead.

### Flow B: Check a stop

1. From map or search, tap a stop.
2. Stop sheet lists next departures grouped by time, each with route badge, destination, countdown, source label, status (On time, Delayed 8 min, Cancelled).
3. Tap a departure to open the trip with live position if available.

### Flow C: Receive a disruption (student)

1. Admin publishes notice affecting Route 3.
2. Followers get a push: "Route 3: Evening trips diverted via Ameerpet".
3. Opening the app shows a red-bordered banner on Home and on the Route 3 screen.
4. Affected departures carry a "Diverted" tag. Cancelled trips show struck through with reason.

### Flow D: Publish a notice (admin)

1. Notices, then **New notice**.
2. Choose type, severity, title, message.
3. Choose targets: routes, stops, specific trips. Preview shows number of followers affected.
4. Set active window (now to end of day by default).
5. **Publish**. Toast "Published to 214 followers". Notice appears in feed and on affected screens within seconds.
6. Optional: edit or **End now**.

### Flow E: Cancel a trip for a day (admin)

1. Operations, then Today.
2. Pick trip row, **Cancel for today**, choose reason.
3. System creates a `trip_instance` override and an auto-notice draft. Admin confirms. Departures update instantly.

### Flow F: Update a route (admin)

1. Routes, select route, **Edit stops**.
2. Drag to reorder, add or remove stops, set minute offsets.
3. Save. Diff view shows what changed. Confirm.
4. Prompt: "Mark as verified?" Yes resets freshness. Audit log records before and after.
5. Optional: publish a route-change notice from the same screen.

### Flow G: Run a live trip (driver)

1. Sign in with code. Today's trips for the assigned bus are listed.
2. Tap **Start trip**. Browser asks for location. Screen shows "Broadcasting" with a steady indicator.
3. Screen shows current stop and next stop. Buttons: **Running late**, **Breakdown**, **End trip**.
4. Screen stays awake. If the signal drops, a visible banner appears and the app retries.

## 3. Rules the product follows

- Time is always shown in 12-hour format with am/pm for students, 24-hour in admin tables. Timezone fixed to Asia/Kolkata.
- A route with no valid trips today still shows its timetable for other days.
- A cancelled trip is never hidden. It is struck through.
- A source label never lies. If live is unavailable, the label drops to Estimated or Scheduled.
- Searching never requires an account.
