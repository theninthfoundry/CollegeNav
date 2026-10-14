-- 0003_live_notices.sql
-- Live operations, positions, notices, subscriptions, push, and audit logging

create table if not exists trip_instances (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id),
  service_date date not null,
  status run_status not null default 'scheduled',
  reason text,
  delay_min smallint not null default 0,
  delay_source delay_source,
  bus_id uuid references buses(id),
  driver_id uuid references drivers(id),
  started_at timestamptz,
  ended_at timestamptz,
  last_pos geography(Point, 4326),
  last_position_at timestamptz,
  last_progress_m integer,
  last_speed_mps real,
  unique (trip_id, service_date)
);

create index if not exists trip_instances_date_idx on trip_instances(service_date, status);

create table if not exists bus_positions (
  id bigserial primary key,
  trip_instance_id uuid not null references trip_instances(id) on delete cascade,
  recorded_at timestamptz not null,
  pos geography(Point, 4326) not null,
  speed_mps real,
  heading smallint,
  accuracy_m real,
  progress_m integer
);

create index if not exists bus_positions_ti_time on bus_positions(trip_instance_id, recorded_at desc);

create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  type notice_type not null,
  severity notice_severity not null,
  title text not null check (char_length(title) <= 80),
  body text not null check (char_length(body) <= 280),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_published boolean not null default false,
  is_auto boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notices_active_idx on notices(is_published, starts_at, ends_at);

create table if not exists notice_targets (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references notices(id) on delete cascade,
  route_id uuid references routes(id),
  stop_id uuid references stops(id),
  trip_id uuid references trips(id),
  check (num_nonnulls(route_id, stop_id, trip_id) = 1)
);

create index if not exists notice_targets_route on notice_targets(route_id);
create index if not exists notice_targets_stop on notice_targets(stop_id);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  route_id uuid references routes(id) on delete cascade,
  stop_id uuid references stops(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(route_id, stop_id) = 1),
  unique (user_id, route_id, stop_id)
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  last_success_at timestamptz
);

create table if not exists saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text not null,
  geom geography(Point, 4326) not null
);

create table if not exists audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_id uuid references profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  summary text,
  before jsonb,
  after jsonb
);

create index if not exists audit_entity_idx on audit_log(entity, entity_id, at desc);
