-- 0005_functions_views.sql
-- Spatial query functions, active notices view, and day-of-week bitmask

-- Stops within radius, ordered by distance
create or replace function stops_near(lat double precision, lng double precision, radius_m int)
returns table (stop_id uuid, distance_m double precision) language sql stable as $$
  select id as stop_id, st_distance(geom, st_point(lng, lat)::geography) as distance_m
  from stops
  where is_active and st_dwithin(geom, st_point(lng, lat)::geography, radius_m)
  order by 2;
$$;

-- Notices currently active and within active window
create or replace view active_notices as
select * from notices
where is_published and starts_at <= now() and (ends_at is null or ends_at > now());

-- Day-of-week helper: Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64
create or replace function dow_bit(d date) returns smallint language sql immutable as $$
  select (1 << (extract(isodow from d)::int - 1))::smallint;
$$;

-- Automatically create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger for auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
