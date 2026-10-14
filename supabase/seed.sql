-- supabase/seed.sql
-- Default configuration settings

insert into settings (key, value) values
  ('walk_radius_m', '800'::jsonb),
  ('walk_speed_mps', '1.33'::jsonb),
  ('circuity_factor', '1.25'::jsonb),
  ('freshness_verified_days', '14'::jsonb),
  ('freshness_aging_days', '45'::jsonb),
  ('delay_notice_threshold_min', '10'::jsonb),
  ('position_stale_live_s', '30'::jsonb),
  ('position_stale_lost_s', '120'::jsonb),
  ('quiet_hours', '{"from":"22:00","to":"05:00"}'::jsonb)
on conflict (key) do update set value = excluded.value;
