# 09. Core logic

All logic here lives in `src/domain/` as pure TypeScript with unit tests. No database or framework imports. Inputs are plain objects, outputs are plain objects.

## 1. Time model

- Timezone is `Asia/Kolkata` (no DST). Use `date-fns-tz` or Temporal; never `new Date("07:30")`.
- A **service day** is a calendar date. A **trip** has a `depart_time` and a weekday bitmask. A **trip instance** is a trip on a date.
- Stop time = `depart_time + offset_min + delay_min` on the service date.
- Trips are assumed not to cross midnight. Validate this on save.
- `expandTrips(date, trips, routeStops, instances)` returns concrete stop times for every active trip on the date, applying overrides (cancelled, delay, bus reassignment).

```ts
type StopCall = { tripId: string; instanceId?: string; routeId: string; direction: Direction;
  stopId: string; seq: number; scheduledAt: Date; expectedAt: Date; status: RunStatus; delayMin: number };
function expandTrips(date: string, input: ExpandInput): StopCall[];
```

## 2. Freshness

Inputs: `verified_at`, `valid_from`, `valid_to`, `status`, `now`, settings (`verifiedDays` default 14, `agingDays` default 45).

```ts
function computeFreshness(r: RouteLike, now: Date, s: Settings): Freshness {
  if (r.status === "suspended") return { state: "outdated", message: r.status_reason ?? "Route is not running" };
  if (r.valid_to && now > endOfDay(r.valid_to)) return { state: "outdated", message: "Schedule ended on " + fmt(r.valid_to) };
  if (!r.verified_at) return { state: "unverified", message: "Not yet verified by the transport office" };
  const d = daysBetween(r.verified_at, now);
  if (d <= s.verifiedDays) return { state: "verified", message: `Verified ${rel(d)}` };
  if (d <= s.agingDays)   return { state: "aging",    message: `Last verified ${d} days ago` };
  return { state: "outdated", message: "Schedule may be outdated" };
}
```

Effects of state:

| State | UI | Planner |
|---|---|---|
| verified | Green tag | normal |
| aging | Amber tag | normal |
| outdated | Red tag and banner | ranked after all non-outdated options, never "Best option" |
| unverified | Grey tag | ranked normally with warning |
| suspended | Unavailable, reason shown | excluded from results, listed under "Not running" |

A trip's freshness is the worse of its own `verified_at` and its route's.

## 3. Journey planner

Goal: given a start and end (stops or points), return the best direct journeys by door-to-door time. P2 adds one transfer.

### 3.1 Inputs
- `origin`, `destination`: stop or coordinate.
- `mode`: now, depart at T, arrive by T.
- `walkMax` (default 800 m), walking speed 1.33 m/s (80 m/min), circuity factor 1.25 applied to straight-line distance.

### 3.2 Candidate stops
```
nearOrigin  = stops within walkMax of origin   (distance d_o)
nearDest    = stops within walkMax of destination (distance d_d)
```
If origin is a stop, it is included with distance 0. If destination is the campus stop, it is included with distance 0.
Walk distance = `straight_line * 1.25`. Walk minutes = `ceil(walkMeters / 80)`.

Exclude inactive stops.

### 3.3 Candidate trips
For each stop call at an origin-near stop `a` on a trip instance (today, plus tomorrow when needed):

```
for each trip instance T on the service day, not cancelled, route not suspended/archived:
  for each (a in nearOrigin) where T visits a at seq i:
    for each (b in nearDest) where T visits b at seq j and j > i:
      boardAt = T.expectedAt(a)
      leaveAt = boardAt - walk(origin -> a)
      if mode is now/depart and leaveAt < queryTime: skip   (cannot make it)
      if mode is arrive and T.expectedAt(b) + walk(b -> dest) > queryTime: skip
      candidate = { T, a, b, boardAt, alightAt = T.expectedAt(b), walkIn, walkOut }
```

Efficient query: for the loaded day, build an index `stopId -> [StopCall sorted by time]` and a map `instanceId -> [StopCall by seq]`. With 50 routes and 200 trips this is well under 10 ms in memory.

### 3.4 Pick the best pairing per trip
A single trip can match several `(a, b)` pairs (two stops near the origin, two near the destination). Keep the pair with minimum **cost** per trip instance.

### 3.5 Cost function (lower is better)

```
walk_min  = walkIn + walkOut
wait_min  = max(0, boardAt - (queryTime + walkIn))        // time standing at the stop
ride_min  = alightAt - boardAt
cost = 2.0 * walk_min      // walking is penalised: it is the least pleasant minute
     + 1.0 * wait_min
     + 1.0 * ride_min
     + 5   * (route.freshness == "aging" ? 1 : 0)
     + 10  * (route.freshness == "unverified" ? 1 : 0)
     + 25  * (route.freshness == "outdated" ? 1 : 0)
```

For `arrive by` mode, choose the **latest** departure that still arrives on time among candidates, then sort by cost, so students are not told to leave an hour early.

### 3.6 Ranking and output
1. Sort by cost, ties by earlier arrival, then fewer walking minutes.
2. De-duplicate: keep the best option per route and direction, then take top `limit` (default 5). A student sees "next bus" and "the one after" for the best route as secondary options inside the same card (`later_departures`, P1).
3. Mark `best = true` on the first option unless its route is `outdated` (then no option is labelled best).
4. Attach `warnings` from freshness and notices affecting the route or stops on the path.

### 3.7 Source labelling
```
if trip instance is running and position age <= 30s:      board/alight time source = "live"
else if instance has delay_min != 0 or position age <= 120s: source = "estimated"
else:                                                       source = "scheduled"
```

### 3.8 Empty result reasons

```
if nearOrigin empty:           reason = no_stop_near_origin       (suggest nearest stop overall)
else if nearDest empty:        reason = no_stop_near_destination
else if no route links them:   reason = no_route_connects         (show routes touching either side)
else:                          reason = no_service_remaining_today (show first trip tomorrow)
```

### 3.9 One transfer (P2)
Find pairs of trips T1, T2 where T1 alights at `x`, T2 boards at `y`, `walk(x, y) <= 300 m`, and `T2.board >= T1.alight + walk + 3 min buffer`. Cost adds a 15 minute penalty. Limit to top 20 first-leg candidates to bound cost.

### 3.10 Tests (Vitest)
- Origin at a stop on R1 with a trip in 10 minutes returns R1 with correct wait.
- Origin 1.2 km from any stop returns `no_stop_near_origin` with nearest stop distance.
- Cancelled trip is skipped; next trip returned.
- Stop order enforcement: alight stop before board stop is rejected.
- Outdated route ranked after verified route even if faster, and is never best.
- Arrive-by picks latest feasible departure.
- Suspended route excluded and listed under not running.
- Delay of 8 minutes shifts wait and arrival, source becomes estimated.

## 4. Live position processing

### 4.1 Snapping
Use Turf `nearestPointOnLine` with the direction's polyline. Accept the snap if distance to line is under 120 m, otherwise mark `off_route` (still broadcast, ETA falls back to schedule). Compute `progress_m = along-line distance`. Enforce monotonic progress: if new progress is more than 200 m behind the last, treat as GPS noise and ignore for ETA.

### 4.2 Speed estimate
Exponential moving average over the last 3 minutes of reported speeds from snapped positions, ignoring points under 1 m/s unless the bus has been stopped over 2 minutes.
```
v_eff = clamp(ema_speed, 4 m/s (14 km/h), 11 m/s (40 km/h))
fallback if no speed: 5.5 m/s (20 km/h)
```

### 4.3 Current delay
When progress passes a stop (`progress_m >= stop.progress_m`), record the actual passing time and:
```
delay_min = round((actual_time - scheduled_time_at_that_stop) / 60)
```
Between stops, delay equals the last measured delay, adjusted if the bus is already later than the next stop's scheduled time: `max(last_delay, now - scheduled_next)`.

### 4.4 ETA to stop S (ahead of the bus)

```
remaining_m = S.progress_m - progress_m
stops_between = number of stops before S

if tracking is live and stops_between <= 3:
   eta = now + remaining_m / v_eff + dwell_sum(stops between)
   source = "estimated"   (we never label a prediction "live", the position is live)
else if tracking is live or stale:
   eta = scheduled(S) + delay_min
   source = "estimated"
else:
   eta = scheduled(S)
   source = "scheduled"
```
Round to the minute. For display, suppress changes under 1 minute and rate limit updates to once per 15 s.

Confidence: attach `±` range of `max(1, round(0.15 * minutes_to_arrival))` minutes for display in the live sheet ("about 6 min").

### 4.5 Tracking state
```
age = now - last_position_at
live      age <= 30s
stale     30s < age <= 120s       UI: "Last seen 45 s ago"
lost      age > 120s              UI: "Signal lost", ETA from schedule
not_tracked  no live start        UI: schedule only
```

### 4.6 Tests
- Bus exactly on a stop yields remaining 0 and ETA now.
- Noisy backward jump is ignored.
- Off-route position triggers off_route and schedule fallback.
- Lost signal degrades source label to scheduled after 120 s.
- Delay computed correctly at stop pass.

## 5. Delay detection and auto-notice

Cron every minute scans running instances.

```
for each running instance with live tracking:
  if delay_min >= settings.delay_notice_threshold_min (default 10)
     for the last 2 consecutive stop passes
     and no active notice already targets this route with type delay today:
        create notice draft:
          type delay, severity warning, is_auto true
          title:  "{Route code} running about {delay} min late"
          body:   "The {time} bus from {first stop} is running late. Expect arrivals around {delay} min after the timetable."
          targets: route
        notify admins (in-app badge, optional email)
        if setting auto_publish_delays is true: publish immediately
```
Auto notices end automatically when the instance completes or delay returns under 5 min.

Admins can also set delay manually via day-of operations (`delay_source = admin`), which overrides live delay for display until the bus passes the next stop.

## 6. Notice targeting and reach

- A notice targets routes, stops, or trips. Effective routes = targeted routes ∪ routes serving targeted stops ∪ routes of targeted trips.
- **Visible on a screen** if the screen's route or stop is in the effective set and the notice is active.
- **Reach** = distinct users with a subscription to any effective route, or to any targeted stop.
- Push dedupe: one push per user per notice, tag `notice:{id}` so updates replace earlier ones.
- Quiet hours: non-critical pushes between 22:00 and 05:00 are held until 05:00.
- Severity escalation (warning to critical) re-sends once regardless of quiet hours.

## 7. Search ranking for stop autocomplete

Score = `0.5 * trigram_similarity(name or alias) + 0.3 * prefix_match + 0.2 * proximity` where proximity is `1 - min(distance, 5000) / 5000` when `near` is provided, else 0. Exact code match short-circuits to rank 1. Alias hits show the alias in the secondary line ("Also known as KPHB").

## 8. Route line generation

When an admin has not drawn a line: connect stops in order with straight segments. Compute `progress_m` per stop along that line. Mark the route `line_source = "auto"` (shown to admins) because ETAs on straight segments are less accurate. Optional improvement: call a routing service (OSRM) once at save time and store the road-following line.

## 9. Invariants checked on every admin save

- A direction has at least two stops, no duplicates, offsets strictly increasing.
- A trip's bus is not assigned to overlapping trips on the same day.
- A trip's `valid_from <= valid_to`.
- A stop removed from service is not part of an active route unless forced, and forcing creates a prompt to publish a stop_change notice.
- Departure never crosses midnight.
