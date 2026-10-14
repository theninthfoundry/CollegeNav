-- 0002_core_tables.sql
-- Core transit entities: settings, profiles, stops, routes, buses, drivers, trips

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table if not exists stops (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  geom geography(Point, 4326) not null,
  landmark text,
  step_free boolean,
  is_campus boolean not null default false,
  is_active boolean not null default true,
  inactive_reason text,
  updated_at timestamptz not null default now()
);

create index if not exists stops_geom_idx on stops using gist (geom);
create index if not exists stops_name_trgm on stops using gin (name gin_trgm_ops);

create table if not exists stop_aliases (
  id uuid primary key default gen_random_uuid(),
  stop_id uuid not null references stops(id) on delete cascade,
  alias text not null
);

create index if not exists stop_aliases_trgm on stop_aliases using gin (alias gin_trgm_ops);

create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  color_index smallint not null check (color_index between 1 and 8),
  status route_status not null default 'active',
  status_reason text,
  valid_from date,
  valid_to date,
  verified_at timestamptz,
  verified_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists route_directions (
  route_id uuid references routes(id) on delete cascade,
  direction direction not null,
  line geography(LineString, 4326),
  length_m integer,
  primary key (route_id, direction)
);

create table if not exists route_stops (
  route_id uuid not null,
  direction direction not null,
  seq smallint not null,
  stop_id uuid not null references stops(id),
  offset_min smallint not null,
  dwell_s smallint not null default 30,
  progress_m integer,
  primary key (route_id, direction, seq),
  foreign key (route_id, direction) references route_directions(route_id, direction) on delete cascade,
  constraint offset_nonneg check (offset_min >= 0)
);

create index if not exists route_stops_stop_idx on route_stops(stop_id);

create table if not exists buses (
  id uuid primary key default gen_random_uuid(),
  reg_no text not null unique,
  name text,
  capacity smallint,
  default_route_id uuid references routes(id),
  status text not null default 'active' check (status in ('active','maintenance','retired')),
  updated_at timestamptz not null default now()
);

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  bus_id uuid references buses(id),
  code_hash text not null,
  is_active boolean not null default true
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id),
  direction direction not null,
  depart_time time not null,
  days smallint not null,
  bus_id uuid references buses(id),
  valid_from date,
  valid_to date,
  is_active boolean not null default true,
  verified_at timestamptz,
  verified_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  unique (route_id, direction, depart_time, days)
);

create index if not exists trips_route_idx on trips(route_id, direction);
