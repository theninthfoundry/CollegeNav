-- 0004_rls.sql
-- Row Level Security policies

-- Helper function to check if the current user has admin or super_admin role
create or replace function is_admin() returns boolean language sql stable security definer as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

-- Enable RLS on tables
alter table stops enable row level security;
alter table stop_aliases enable row level security;
alter table routes enable row level security;
alter table route_directions enable row level security;
alter table route_stops enable row level security;
alter table buses enable row level security;
alter table drivers enable row level security;
alter table trips enable row level security;
alter table trip_instances enable row level security;
alter table bus_positions enable row level security;
alter table notices enable row level security;
alter table notice_targets enable row level security;
alter table subscriptions enable row level security;
alter table push_subscriptions enable row level security;
alter table saved_places enable row level security;
alter table profiles enable row level security;
alter table settings enable row level security;
alter table audit_log enable row level security;

-- Public read for operational data
create policy public_read_stops on stops for select using (true);
create policy public_read_aliases on stop_aliases for select using (true);
create policy public_read_routes on routes for select using (status <> 'archived');
create policy public_read_directions on route_directions for select using (true);
create policy public_read_route_stops on route_stops for select using (true);
create policy public_read_trips on trips for select using (is_active);
create policy public_read_instances on trip_instances for select using (true);
create policy public_read_notices on notices for select using (is_published);
create policy public_read_notice_targets on notice_targets for select using (true);
create policy public_read_buses on buses for select using (true);
create policy public_read_settings on settings for select using (true);

-- Admin writes
create policy admin_write_stops on stops for all using (is_admin()) with check (is_admin());
create policy admin_write_aliases on stop_aliases for all using (is_admin()) with check (is_admin());
create policy admin_write_routes on routes for all using (is_admin()) with check (is_admin());
create policy admin_write_directions on route_directions for all using (is_admin()) with check (is_admin());
create policy admin_write_route_stops on route_stops for all using (is_admin()) with check (is_admin());
create policy admin_write_buses on buses for all using (is_admin()) with check (is_admin());
create policy admin_write_drivers on drivers for all using (is_admin()) with check (is_admin());
create policy admin_write_trips on trips for all using (is_admin()) with check (is_admin());
create policy admin_write_instances on trip_instances for all using (is_admin()) with check (is_admin());
create policy admin_write_notices on notices for all using (is_admin()) with check (is_admin());
create policy admin_write_notice_targets on notice_targets for all using (is_admin()) with check (is_admin());
create policy admin_write_settings on settings for all using (is_admin()) with check (is_admin());

-- User-owned rows
create policy own_rows_subscriptions on subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows_push on push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows_saved_places on saved_places for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_profile on profiles for select using (id = auth.uid() or is_admin());

-- Audit: admins read, append-only via service role
create policy admin_read_audit on audit_log for select using (is_admin());
