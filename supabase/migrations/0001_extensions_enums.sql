-- 0001_extensions_enums.sql
-- Enables PostGIS, pg_trgm and creates domain enums

create extension if not exists postgis;
create extension if not exists pg_trgm;

do $$ begin
  create type user_role as enum ('student', 'admin', 'super_admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type direction as enum ('to_campus', 'from_campus');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type route_status as enum ('active', 'suspended', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type run_status as enum ('scheduled', 'running', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type notice_type as enum ('delay', 'cancellation', 'route_change', 'stop_change', 'schedule_change', 'general');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type notice_severity as enum ('info', 'warning', 'critical');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type delay_source as enum ('admin', 'driver', 'live');
exception
  when duplicate_object then null;
end $$;
