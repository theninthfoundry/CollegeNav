# 07. Data model

Postgres 15 with PostGIS and `pg_trgm`. All timestamps `timestamptz` in UTC; service dates and clock times are interpreted in `Asia/Kolkata`.

## 1. Entity overview

```
stops ──< stop_aliases
routes ──< route_directions ──< route_stops >── stops
routes ──< trips ──< trip_instances ──< bus_positions
buses ──< trips            drivers >── buses
notices ──< notice_targets (route | stop | trip)
profiles ──< subscriptions (route | stop)      profiles ──< push_subscriptions
profiles ──< saved_places                      audit_log (append only)
settings (key/value)
```

## 2. Extensions and enums

```sql
create extension if not exists postgis;
create extension if not exists pg_trgm;

create type user_role       as enum ('student', 'admin', 'super_admin');
create type direction       as enum ('to_campus', 'from_campus');
create type route_status    as enum ('active', 'suspended', 'archived');
create type run_status      as enum ('scheduled', 'running', 'completed', 'cancelled');
create type notice_type     as enum ('delay', 'cancellation', 'route_change', 'stop_change', 'schedule_change', 'general');
create type notice_severity as enum ('info', 'warning', 'critical');
create type delay_source    as enum ('admin', 'driver', 'live');
```

## 3. Tables

```sql
-- Configuration (single row per key)
create table settings (
  key   text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
-- Seed keys: walk_radius_m (800), walk_speed_mps (1.33), circuity_factor (1.25),
-- freshness_verified_days (14), freshness_aging_days (45),
-- delay_notice_threshold_min (10), position_stale_live_s (30), position_stale_lost_s (120),
-- campus_stop_id, quiet_hours ({"from":"22:00","to":"05:00"})

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table stops (
  id uuid primary key default gen_random_uuid(),
  code text unique,                         -- short code, e.g. "KPHB"
  name text not null,
  geom geography(Point, 4326) not null,
  landmark text,                            -- "Near KPHB Colony Gate 2"
  step_free boolean,                        -- null means unknown
  is_campus boolean not null default false,
  is_active boolean not null default true,
  inactive_reason text,
  updated_at timestamptz not null default now()
);
create index stops_geom_idx on stops using gist (geom);
create index stops_name_trgm on stops using gin (name gin_trgm_ops);

create table stop_aliases (
  id uuid primary key default gen_random_uuid(),
  stop_id uuid not null references stops(id) on delete cascade,
  alias text not null
);
create index stop_aliases_trgm on stop_aliases using gin (alias gin_trgm_ops);

create table routes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                -- "R3"
  name text not null,                       -- "Kukatpally to Campus"
  color_index smallint not null check (color_index between 1 and 8),
  status route_status not null default 'active',
  status_reason text,                       -- shown to students when suspended
  valid_from date,
  valid_to date,
  verified_at timestamptz,
  verified_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create table route_directions (
  route_id uuid references routes(id) on delete cascade,
  direction direction not null,
  line geography(LineString, 4326),         -- null until drawn; generated from stops if absent
  length_m integer,
  primary key (route_id, direction)
);

create table route_stops (
  route_id uuid not null,
  direction direction not null,
  seq smallint not null,
  stop_id uuid not null references stops(id),
  offset_min smallint not null,             -- minutes after trip departure, first stop = 0
  dwell_s smallint not null default 30,
  progress_m integer,                       -- distance along line, computed on save
  primary key (route_id, direction, seq),
  foreign key (route_id, direction) references route_directions(route_id, direction) on delete cascade,
  constraint offset_nonneg check (offset_min >= 0)
);
create index route_stops_stop_idx on route_stops(stop_id);
-- Application rule: offset_min strictly increases with seq. A stop appears at most once per direction.

create table buses (
  id uuid primary key default gen_random_uuid(),
  reg_no text not null unique,              -- "TS09 UB 1234"
  name text,
  capacity smallint,
  default_route_id uuid references routes(id),
  status text not null default 'active' check (status in ('active','maintenance','retired')),
  updated_at timestamptz not null default now()
);

create table drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  bus_id uuid references buses(id),
  code_hash text not null,                  -- argon2 or bcrypt of 6 digit code
  is_active boolean not null default true
);

-- Scheduled template: "R3 to campus departs 7:30 on Mon to Fri"
create table trips (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id),
  direction direction not null,
  depart_time time not null,                -- local clock time at first stop
  days smallint not null,                   -- bitmask: Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64
  bus_id uuid references buses(id),
  valid_from date,
  valid_to date,
  is_active boolean not null default true,
  verified_at timestamptz,
  verified_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  unique (route_id, direction, depart_time, days)
);
create index trips_route_idx on trips(route_id, direction);

-- One row per trip per service date: carries overrides and live state
create table trip_instances (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id),
  service_date date not null,
  status run_status not null default 'scheduled',
  reason text,                              -- cancellation or delay reason (student visible)
  delay_min smallint not null default 0,
  delay_source delay_source,
  bus_id uuid references buses(id),         -- override
  driver_id uuid references drivers(id),
  started_at timestamptz,
  ended_at timestamptz,
  last_pos geography(Point, 4326),
  last_position_at timestamptz,
  last_progress_m integer,
  last_speed_mps real,
  unique (trip_id, service_date)
);
create index trip_instances_date_idx on trip_instances(service_date, status);

create table bus_positions (
  id bigserial primary key,
  trip_instance_id uuid not null references trip_instances(id) on delete cascade,
  recorded_at timestamptz not null,
  pos geography(Point, 4326) not null,
  speed_mps real,
  heading smallint,
  accuracy_m real,
  progress_m integer
);
create index bus_positions_ti_time on bus_positions(trip_instance_id, recorded_at desc);
-- Retention: delete rows older than 7 days (cron)

create table notices (
  id uuid primary key default gen_random_uuid(),
  type notice_type not null,
  severity notice_severity not null,
  title text not null check (char_length(title) <= 80),
  body text not null check (char_length(body) <= 280),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_published boolean not null default false,
  is_auto boolean not null default false,   -- drafted by the delay detector
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notices_active_idx on notices(is_published, starts_at, ends_at);

create table notice_targets (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references notices(id) on delete cascade,
  route_id uuid references routes(id),
  stop_id uuid references stops(id),
  trip_id uuid references trips(id),
  check (num_nonnulls(route_id, stop_id, trip_id) = 1)
);
create index notice_targets_route on notice_targets(route_id);
create index notice_targets_stop on notice_targets(stop_id);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  route_id uuid references routes(id) on delete cascade,
  stop_id uuid references stops(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(route_id, stop_id) = 1),
  unique (user_id, route_id, stop_id)
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  last_success_at timestamptz
);

create table saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text not null,
  geom geography(Point, 4326) not null
);

create table audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_id uuid references profiles(id),
  action text not null,                     -- 'route.update', 'notice.publish', 'trip.cancel'
  entity text not null,
  entity_id uuid,
  summary text,
  before jsonb,
  after jsonb
);
create index audit_entity_idx on audit_log(entity, entity_id, at desc);
```

## 4. Views and functions

```sql
-- Stops within radius, nearest first
create function stops_near(lat double precision, lng double precision, radius_m int)
returns table (stop_id uuid, distance_m double precision) language sql stable as $$
  select id, st_distance(geom, st_point(lng, lat)::geography)
  from stops
  where is_active and st_dwithin(geom, st_point(lng, lat)::geography, radius_m)
  order by 2;
$$;

-- Notices currently live
create view active_notices as
select * from notices
where is_published and starts_at <= now() and (ends_at is null or ends_at > now());

-- Day-of-week helper: Mon=1 ... Sun=64
create function dow_bit(d date) returns smallint language sql immutable as $$
  select (1 << (extract(isodow from d)::int - 1))::smallint;
$$;
```

## 5. Row-level security

```sql
alter table stops enable row level security;
-- Repeat for every table.

-- Public read for operational data
create policy public_read on stops           for select using (true);
create policy public_read on stop_aliases    for select using (true);
create policy public_read on routes          for select using (status <> 'archived');
create policy public_read on route_directions for select using (true);
create policy public_read on route_stops     for select using (true);
create policy public_read on trips           for select using (is_active);
create policy public_read on trip_instances  for select using (true);
create policy public_read on notices         for select using (is_published);
create policy public_read on notice_targets  for select using (true);
create policy public_read on buses           for select using (true);

-- Admin writes
create function is_admin() returns boolean language sql stable security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin','super_admin'));
$$;

create policy admin_write on stops for all using (is_admin()) with check (is_admin());
-- Repeat admin_write for routes, route_directions, route_stops, buses, drivers, trips,
-- trip_instances, notices, notice_targets, settings.

-- User-owned rows
create policy own_rows on subscriptions      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on saved_places       for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_profile on profiles        for select using (id = auth.uid() or is_admin());

-- Audit: admins read, nobody updates or deletes. Inserts via server only (service role).
create policy admin_read on audit_log for select using (is_admin());

-- bus_positions, drivers: no public policy. Reads and writes go through server (service role).
```

Notes:
- Driver writes use the service role on the server after validating the driver JWT. Drivers never hold a Supabase session.
- Public map reads of live position come from `trip_instances.last_pos` and the Realtime broadcast, not from `bus_positions`.

## 6. Derived values (not stored)

| Value | Derived from |
|---|---|
| Freshness state | `routes.verified_at`, `valid_to`, `status`, settings thresholds. See `09-CORE-LOGIC.md` |
| Stop times for a trip | `trips.depart_time` + `route_stops.offset_min` + `trip_instances.delay_min` |
| Source label for a time | Live position age, delay source, instance status |
| Trips per day | `trips` filtered by `dow_bit` and validity |

## 7. Seed plan

Seed through `scripts/seed.ts` so the demo is repeatable. Coordinates below are approximate placeholders for Hyderabad localities. Replace with the real stops and campus location before presenting.

**Campus:** "Main campus", one stop with `is_campus = true`. Placeholder at 17.5400, 78.3800.

**Stops (approximate):**

| Code | Name | Lat | Lng |
|---|---|---|---|
| MYP | Miyapur | 17.4969 | 78.3548 |
| KPHB | Kukatpally Housing Board | 17.4948 | 78.3996 |
| JNTU | JNTU Metro | 17.4933 | 78.3914 |
| AMP | Ameerpet | 17.4375 | 78.4483 |
| GCB | Gachibowli | 17.4401 | 78.3489 |
| SEC | Secunderabad Station | 17.4344 | 78.5013 |
| UPL | Uppal | 17.4058 | 78.5591 |
| DSN | Dilsukhnagar | 17.3688 | 78.5247 |
| MEH | Mehdipatnam | 17.3950 | 78.4400 |
| LBN | LB Nagar | 17.3457 | 78.5522 |

**Routes (four, to demonstrate states):**

| Code | Name | Stops in order (to campus) | Demo state |
|---|---|---|---|
| R1 | Miyapur to Campus | MYP, KPHB, JNTU, Campus | Verified, live (simulated) |
| R2 | Secunderabad to Campus | SEC, AMP, KPHB, Campus | Aging (verified 30 days ago) |
| R3 | Uppal and Dilsukhnagar to Campus | UPL, DSN, MEH, AMP, Campus | Outdated (verified 70 days ago) |
| R4 | Gachibowli to Campus | GCB, JNTU, Campus | Suspended with reason, to show Unavailable |

**Trips:** each route has two to three morning trips (6:45 to 8:15) and two evening trips from campus, Mon to Sat.

**Notices:** one live Warning on R2 (diverted), one Info general, one ended.

**Users:** one super admin, one driver with code `246810`, a few followers for R1 and R2.

The seed also creates today's `trip_instances` and one simulated live run on R1 (see `scripts/simulate-bus.ts`).
