# 08. API specification

Base path `/api/v1`. JSON in and out. All handlers validate with Zod. Times in responses are ISO 8601 with offset (`2026-10-14T07:42:00+05:30`). Dates are `YYYY-MM-DD` in Asia/Kolkata.

## 1. Conventions

### Errors
```json
{ "error": { "code": "validation_failed", "message": "from is required", "details": { "field": "from" } } }
```
| HTTP | code | When |
|---|---|---|
| 400 | `validation_failed` | Zod failure |
| 401 | `unauthenticated` | Missing or invalid session |
| 403 | `forbidden` | Role insufficient |
| 404 | `not_found` | Unknown id or code |
| 409 | `conflict` | Version mismatch (`If-Match` on admin updates) |
| 422 | `rule_violation` | Business rule (offsets not increasing, bus double-booked) |
| 429 | `rate_limited` | Includes `Retry-After` |
| 500 | `internal` | Includes `request_id` |

### Pagination
`?limit=50&cursor=...` returns `{ "items": [...], "next_cursor": "..." | null }`.

### Shared types

```ts
type Source = "live" | "estimated" | "scheduled" | "unavailable";
type Freshness = { state: "verified" | "aging" | "outdated" | "unverified"; verified_at: string | null; days_since: number | null; valid_to: string | null; message: string };
type Place = { type: "stop"; stop_id: string } | { type: "point"; lat: number; lng: number };
type RouteRef = { id: string; code: string; name: string; color_index: number };
type TimePoint = { at: string; source: Source };
```

## 2. Public endpoints

### Stops
`GET /stops?q=&near=lat,lng&radius=1000&limit=20`
```json
{ "items": [{ "id": "…", "code": "KPHB", "name": "Kukatpally Housing Board", "landmark": "Near KPHB Colony Gate 2",
  "lat": 17.4948, "lng": 78.3996, "step_free": true, "distance_m": 420, "routes": [RouteRef] }] }
```
Search uses trigram on name, code and aliases. Ranking: exact code, prefix, trigram similarity, distance if `near` given.

`GET /stops/{id}` returns stop with routes serving it, aliases, active notices.

`GET /stops/{id}/departures?date=&after=07:00&limit=10`
```json
{ "stop_id": "…", "generated_at": "…", "items": [{
  "trip_instance_id": "…", "route": RouteRef, "direction": "to_campus", "headsign": "Main campus",
  "scheduled": "2026-10-14T07:42:00+05:30",
  "expected": { "at": "2026-10-14T07:49:00+05:30", "source": "estimated" },
  "status": "delayed", "delay_min": 7, "reason": "Heavy traffic",
  "freshness": Freshness, "notices": ["notice-id"] }] }
```
`status` is one of `scheduled | on_time | delayed | cancelled | running | completed`.

### Routes
`GET /routes` returns routes with status, freshness, direction summary, stop count.

`GET /routes/{code}` returns:
```json
{ "route": RouteRef, "status": "active", "status_reason": null, "freshness": Freshness,
  "valid_from": "2026-06-01", "valid_to": null,
  "directions": [{ "direction": "to_campus", "line": GeoJSONLineString,
    "stops": [{ "seq": 1, "stop": {...}, "offset_min": 0, "progress_m": 0 }] }],
  "notices": [Notice] }
```

`GET /routes/{code}/timetable?direction=to_campus&date=2026-10-14`
```json
{ "date": "2026-10-14", "days_label": "Mon to Sat", "trips": [{
  "trip_id": "…", "trip_instance_id": "…|null", "depart": "07:30", "status": "scheduled",
  "stops": [{ "stop_id": "…", "time": "07:42" }], "freshness": Freshness }] }
```

### Plan (core)
`GET /plan`

| Param | Type | Notes |
|---|---|---|
| `from` | `stop:{uuid}` or `pt:{lat},{lng}` | required |
| `to` | same, default campus stop | optional |
| `mode` | `now` `depart` `arrive` | default `now` |
| `at` | ISO datetime | required unless `now` |
| `walk_max` | meters | default setting, max 2000 |
| `limit` | int | default 5 |

Response:
```json
{
  "query": { "from": {...}, "to": {...}, "mode": "now", "at": "2026-10-14T07:30:00+05:30" },
  "options": [{
    "id": "opt_1",
    "rank": 1,
    "best": true,
    "route": RouteRef,
    "trip_instance_id": "…",
    "board": { "stop": {...}, "time": TimePoint },
    "alight": { "stop": {...}, "time": TimePoint },
    "walk_to_board": { "meters": 480, "minutes": 6 },
    "walk_from_alight": { "meters": 120, "minutes": 2 },
    "wait_min": 9,
    "ride_min": 42,
    "total_min": 59,
    "depart_at": "2026-10-14T07:24:00+05:30",
    "arrive_at": "2026-10-14T08:23:00+05:30",
    "freshness": Freshness,
    "warnings": ["Schedule may be outdated"],
    "notices": ["notice-id"],
    "geometry": { "walk_in": GeoJSONLine, "ride": GeoJSONLine, "walk_out": GeoJSONLine }
  }],
  "reason": null
}
```
When `options` is empty, `reason` is one of `no_stop_near_origin`, `no_stop_near_destination`, `no_route_connects`, `no_service_remaining_today`, and the response includes `nearest_origin_stop`, `nearest_destination_stop`, and `suggestion`.

### Live
`GET /live/trips?route=R3` returns running instances with last position and status.
```json
{ "items": [{ "trip_instance_id": "…", "route": RouteRef, "direction": "to_campus", "bus": { "reg_no": "TS09 UB 1234" },
  "position": { "lat": 17.49, "lng": 78.39, "heading": 80, "speed_kmh": 24, "recorded_at": "…" },
  "age_s": 6, "tracking": "live", "progress_m": 8200, "delay_min": 3 }] }
```
`tracking` is `live` (age under 30 s), `stale` (30 to 120 s), `lost` (over 120 s), or `not_tracked`.

`GET /live/trips/{id}` adds upcoming stops with ETAs:
```json
{ "upcoming": [{ "stop": {...}, "eta": { "at": "…", "source": "estimated" }, "scheduled": "…", "delta_min": 3 }] }
```

### Notices
`GET /notices?active=true&route=R3&stop=…&limit=` returns notices with targets expanded to route refs.
```json
{ "id": "…", "type": "route_change", "severity": "warning", "title": "Route 3 diverted today",
  "body": "…", "starts_at": "…", "ends_at": "…", "routes": [RouteRef], "stops": [...], "is_auto": false }
```

### Settings (public subset)
`GET /config` returns walk radius, campus stop, freshness thresholds, map style, VAPID public key.

## 3. Authenticated user endpoints

| Method and path | Purpose |
|---|---|
| `GET /me` | Profile, role |
| `GET /me/subscriptions` | Followed routes and stops |
| `POST /me/subscriptions` | Body `{ "route_id" }` or `{ "stop_id" }` |
| `DELETE /me/subscriptions/{id}` | Unfollow |
| `POST /me/push` | Register push subscription `{ endpoint, keys: { p256dh, auth } }` |
| `DELETE /me/push` | Remove push subscription for this endpoint |
| `GET /me/places`, `POST /me/places`, `DELETE /me/places/{id}` | Saved places |

## 4. Driver endpoints (driver JWT)

`POST /driver/session` body `{ "code": "246810" }` returns `{ "token": "…", "driver": {...}, "bus": {...}, "expires_in": 43200 }`.

`GET /driver/today` returns trips for the driver's bus with instance ids.

`POST /driver/trips/{instanceId}/start` sets `running`, `started_at`. Idempotent.

`POST /driver/trips/{instanceId}/positions`
```json
{ "points": [{ "lat": 17.49, "lng": 78.39, "speed": 6.4, "heading": 80, "accuracy": 12, "ts": "2026-10-14T07:31:05+05:30" }] }
```
Accepts up to 20 points (offline batch). Server rejects points older than 5 minutes, accuracy over 200 m, or jumps above 40 m/s. Returns `{ "accepted": 1, "progress_m": 8200, "delay_min": 3 }`.

`POST /driver/trips/{instanceId}/events` body `{ "type": "late" | "breakdown", "delay_min"?: number, "note"?: string }`. `late` sets `delay_source = driver`. `breakdown` creates a draft notice and alerts admins.

`POST /driver/trips/{instanceId}/end` sets `completed`, `ended_at`.

## 5. Admin endpoints (role admin)

All writes: validate, write in a transaction, append to `audit_log`, bust cache tags, return the updated entity. Updates require `If-Match: <updated_at>`; mismatch returns 409.

### Stops
`GET/POST /admin/stops`, `GET/PATCH /admin/stops/{id}`, `POST /admin/stops/{id}/deactivate` body `{ reason }`. A stop used by an active route cannot be deactivated without `force=true`, and the response lists affected routes.

### Routes
- `GET/POST /admin/routes`, `PATCH /admin/routes/{id}`.
- `PUT /admin/routes/{id}/directions/{direction}/stops` replaces the full ordered sequence atomically:
  ```json
  { "stops": [{ "stop_id": "…", "offset_min": 0, "dwell_s": 30 }, { "stop_id": "…", "offset_min": 12 }] }
  ```
  Validation: at least 2 stops, offsets strictly increasing, no duplicate stops. Returns the diff (`added`, `removed`, `moved`, `offset_changed`) for the confirm dialog. Pass `?dry_run=true` to get the diff only.
- `PUT /admin/routes/{id}/directions/{direction}/line` accepts GeoJSON LineString or `{ "auto": true }` to generate from stops (straight segments) and compute `progress_m` per stop.
- `POST /admin/routes/{id}/verify` sets `verified_at = now()`, `verified_by`.
- `POST /admin/routes/{id}/suspend` body `{ reason, until? }` and `POST /admin/routes/{id}/resume`.
- `POST /admin/routes/{id}/archive`.

### Buses and drivers
`GET/POST/PATCH /admin/buses`, `GET/POST/PATCH /admin/drivers`, `POST /admin/drivers/{id}/reset-code` returns the new code once.

### Trips
`GET/POST/PATCH /admin/trips`, `POST /admin/trips/{id}/verify`, `POST /admin/trips/bulk` for copy and shift operations. Rule 422 `bus_conflict` if one bus overlaps in time across trips on the same day.

### Day-of operations
`GET /admin/operations/today` returns trip instances with live tracking state.

`POST /admin/trip-instances/{id}/cancel` body `{ reason, notify: true }`
`POST /admin/trip-instances/{id}/delay` body `{ delay_min, reason, notify: true }`
`POST /admin/trip-instances/{id}/reassign-bus` body `{ bus_id }`

When `notify` is true the server drafts a notice and returns its id for one-click publish.

### Notices
`GET/POST /admin/notices`, `PATCH /admin/notices/{id}`, `POST /admin/notices/{id}/publish`, `POST /admin/notices/{id}/end`, `GET /admin/notices/{id}/reach` returns `{ followers: 214, push_enabled: 160 }`.

### Import and export
`POST /admin/import/stops` and `POST /admin/import/trips` take CSV, return a validation report first (`?dry_run=true`), then apply. `GET /admin/export/{entity}.csv`.

### Dashboard, audit, settings
`GET /admin/dashboard` returns counts: running, live, active notices, routes by freshness, trips today by status.
`GET /admin/audit?entity=&actor=&cursor=`.
`GET/PUT /admin/settings`.

## 6. Cron endpoints (`Authorization: Bearer $CRON_SECRET`)

| Path | Schedule | Job |
|---|---|---|
| `/api/cron/instances` | 00:05 IST daily | Create `trip_instances` for today, plus tomorrow |
| `/api/cron/notices` | every 5 min | End expired notices, send scheduled ones |
| `/api/cron/delays` | every minute | Detect sustained delay, draft notices |
| `/api/cron/stale` | every minute | Mark running instances with lost signal; no deletion |
| `/api/cron/retention` | 03:00 IST daily | Delete `bus_positions` older than 7 days |
| `/api/cron/freshness` | 08:00 IST daily | Count routes needing verification, email admins (P2) |

## 7. Realtime channels (Supabase Realtime broadcast)

`live:route:{code}` events:
```json
{ "event": "position", "payload": { "trip_instance_id": "…", "lat": 0, "lng": 0, "heading": 80, "speed_kmh": 24, "progress_m": 8200, "delay_min": 3, "ts": "…" } }
{ "event": "status",   "payload": { "trip_instance_id": "…", "status": "running|completed|cancelled", "reason": null } }
```
`notices` events: `published`, `updated`, `ended` with `{ id }`. Clients refetch `/notices` on any event.

## 8. Versioning and compatibility

- Additive changes only within `v1`.
- Enums are open in clients: unknown values render as a neutral state.
- The planner response shape is stable because the UI depends on its `warnings` and `reason` fields.
