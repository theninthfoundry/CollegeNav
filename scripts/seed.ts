import { db } from "../src/server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Starting CollegeNav database seed...");

  // 1. Settings
  console.log("1. Seeding settings...");
  await db.execute(sql`
    INSERT INTO settings (key, value) VALUES
      ('walk_radius_m', '800'::jsonb),
      ('walk_speed_mps', '1.33'::jsonb),
      ('circuity_factor', '1.25'::jsonb),
      ('freshness_verified_days', '14'::jsonb),
      ('freshness_aging_days', '45'::jsonb),
      ('delay_notice_threshold_min', '10'::jsonb),
      ('position_stale_live_s', '30'::jsonb),
      ('position_stale_lost_s', '120'::jsonb),
      ('quiet_hours', '{"from":"22:00","to":"05:00"}'::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
  `);

  // 2. Super admin profile
  console.log("2. Seeding admin profile...");
  const adminId = "00000000-0000-0000-0000-000000000001";
  await db.execute(sql`
    INSERT INTO profiles (id, display_name, role)
    VALUES (${adminId}::uuid, 'Transport Coordinator (Mr. Rao)', 'super_admin')
    ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, role = EXCLUDED.role;
  `);

  // 3. Stops
  console.log("3. Seeding stops...");
  const stopDefs = [
    { code: "CMP", name: "Main Campus", lat: 17.5400, lng: 78.3800, landmark: "College Administrative Block", step_free: true, is_campus: true },
    { code: "MYP", name: "Miyapur", lat: 17.4969, lng: 78.3548, landmark: "Near Miyapur Metro Station", step_free: true, is_campus: false },
    { code: "KPHB", name: "Kukatpally Housing Board", lat: 17.4948, lng: 78.3996, landmark: "Near KPHB Colony Gate 2", step_free: true, is_campus: false },
    { code: "JNTU", name: "JNTU Metro", lat: 17.4933, lng: 78.3914, landmark: "Opposite JNTU College Gate", step_free: true, is_campus: false },
    { code: "AMP", name: "Ameerpet", lat: 17.4375, lng: 78.4483, landmark: "Ameerpet Metro Interchange", step_free: true, is_campus: false },
    { code: "GCB", name: "Gachibowli", lat: 17.4401, lng: 78.3489, landmark: "Gachibowli Stadium Circle", step_free: false, is_campus: false },
    { code: "SEC", name: "Secunderabad Station", lat: 17.4344, lng: 78.5013, landmark: "Secunderabad East Metro", step_free: true, is_campus: false },
    { code: "UPL", name: "Uppal", lat: 17.4058, lng: 78.5591, landmark: "Uppal Ring Road Circle", step_free: false, is_campus: false },
    { code: "DSN", name: "Dilsukhnagar", lat: 17.3688, lng: 78.5247, landmark: "Dilsukhnagar Bus Depot", step_free: true, is_campus: false },
    { code: "MEH", name: "Mehdipatnam", lat: 17.3950, lng: 78.4400, landmark: "Mehdipatnam Rythu Bazar", step_free: false, is_campus: false },
    { code: "LBN", name: "LB Nagar", lat: 17.3457, lng: 78.5522, landmark: "LB Nagar Metro Station", step_free: true, is_campus: false },
  ];

  const stopMap = new Map<string, string>();

  for (const s of stopDefs) {
    const res = await db.execute<{ id: string }>(sql`
      INSERT INTO stops (code, name, geom, landmark, step_free, is_campus, is_active)
      VALUES (
        ${s.code},
        ${s.name},
        ST_SetSRID(ST_MakePoint(${s.lng}, ${s.lat}), 4326)::geography,
        ${s.landmark},
        ${s.step_free},
        ${s.is_campus},
        true
      )
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        geom = EXCLUDED.geom,
        landmark = EXCLUDED.landmark,
        step_free = EXCLUDED.step_free,
        is_campus = EXCLUDED.is_campus,
        is_active = true
      RETURNING id;
    `);
    stopMap.set(s.code, res.rows[0].id);
  }

  // Update campus stop in settings
  const campusId = stopMap.get("CMP");
  await db.execute(sql`
    INSERT INTO settings (key, value)
    VALUES ('campus_stop_id', ${JSON.stringify(campusId)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  `);

  // Stop aliases
  console.log("3b. Seeding stop aliases...");
  const aliases = [
    { code: "KPHB", alias: "Kukatpally" },
    { code: "KPHB", alias: "KPHB Colony" },
    { code: "JNTU", alias: "JNTUH" },
    { code: "SEC", alias: "Secunderabad" },
    { code: "MYP", alias: "Miyapur Metro" },
    { code: "AMP", alias: "Ameerpet Cross Roads" },
  ];

  for (const a of aliases) {
    const sid = stopMap.get(a.code);
    if (!sid) continue;
    await db.execute(sql`
      INSERT INTO stop_aliases (stop_id, alias)
      VALUES (${sid}::uuid, ${a.alias})
      ON CONFLICT DO NOTHING;
    `);
  }

  // 4. Routes
  console.log("4. Seeding routes...");
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  const routeDefs = [
    {
      code: "R1",
      name: "Miyapur to Campus",
      color_index: 1,
      status: "active",
      status_reason: null,
      verified_at: daysAgo(3), // Verified 3 days ago
      stops: ["MYP", "KPHB", "JNTU", "CMP"],
      offsets: [0, 12, 25, 55],
    },
    {
      code: "R2",
      name: "Secunderabad to Campus",
      color_index: 2,
      status: "active",
      status_reason: null,
      verified_at: daysAgo(30), // Aging (30 days ago)
      stops: ["SEC", "AMP", "KPHB", "CMP"],
      offsets: [0, 20, 45, 80],
    },
    {
      code: "R3",
      name: "Uppal and Dilsukhnagar to Campus",
      color_index: 3,
      status: "active",
      status_reason: null,
      verified_at: daysAgo(70), // Outdated (70 days ago)
      stops: ["UPL", "DSN", "MEH", "AMP", "CMP"],
      offsets: [0, 15, 35, 50, 90],
    },
    {
      code: "R4",
      name: "Gachibowli to Campus",
      color_index: 4,
      status: "suspended",
      status_reason: "Route suspended due to road widening near Gachibowli junction",
      verified_at: daysAgo(10),
      stops: ["GCB", "JNTU", "CMP"],
      offsets: [0, 25, 60],
    },
  ];

  const routeMap = new Map<string, string>();

  for (const r of routeDefs) {
    const res = await db.execute<{ id: string }>(sql`
      INSERT INTO routes (code, name, color_index, status, status_reason, verified_at, verified_by, valid_from, valid_to)
      VALUES (
        ${r.code},
        ${r.name},
        ${r.color_index},
        ${r.status}::route_status,
        ${r.status_reason},
        ${r.verified_at}::timestamptz,
        ${adminId}::uuid,
        '2026-01-01',
        '2026-12-31'
      )
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        color_index = EXCLUDED.color_index,
        status = EXCLUDED.status,
        status_reason = EXCLUDED.status_reason,
        verified_at = EXCLUDED.verified_at,
        updated_at = now()
      RETURNING id;
    `);
    const routeId = res.rows[0].id;
    routeMap.set(r.code, routeId);

    // Route directions & stops: to_campus
    await db.execute(sql`
      INSERT INTO route_directions (route_id, direction)
      VALUES (${routeId}::uuid, 'to_campus')
      ON CONFLICT (route_id, direction) DO NOTHING;
    `);

    // Delete existing route stops for clean re-seed
    await db.execute(sql`
      DELETE FROM route_stops WHERE route_id = ${routeId}::uuid AND direction = 'to_campus';
    `);

    for (let i = 0; i < r.stops.length; i++) {
      const sid = stopMap.get(r.stops[i]);
      if (!sid) continue;
      await db.execute(sql`
        INSERT INTO route_stops (route_id, direction, seq, stop_id, offset_min, dwell_s)
        VALUES (${routeId}::uuid, 'to_campus', ${i + 1}, ${sid}::uuid, ${r.offsets[i]}, 30);
      `);
    }

    // Generate line geometry from stops
    await db.execute(sql`
      UPDATE route_directions
      SET line = (
        SELECT ST_MakeLine(s.geom::geometry ORDER BY rs.seq)::geography
        FROM route_stops rs
        JOIN stops s ON s.id = rs.stop_id
        WHERE rs.route_id = ${routeId}::uuid AND rs.direction = 'to_campus'
      )
      WHERE route_id = ${routeId}::uuid AND direction = 'to_campus';
    `);

    // Direction: from_campus (reversed stops)
    await db.execute(sql`
      INSERT INTO route_directions (route_id, direction)
      VALUES (${routeId}::uuid, 'from_campus')
      ON CONFLICT (route_id, direction) DO NOTHING;
    `);

    await db.execute(sql`
      DELETE FROM route_stops WHERE route_id = ${routeId}::uuid AND direction = 'from_campus';
    `);

    const reversedStops = [...r.stops].reverse();
    const reversedOffsets = [0];
    for (let i = 1; i < r.offsets.length; i++) {
      reversedOffsets.push(reversedOffsets[i - 1] + (r.offsets[r.offsets.length - i] - r.offsets[r.offsets.length - i - 1]));
    }

    for (let i = 0; i < reversedStops.length; i++) {
      const sid = stopMap.get(reversedStops[i]);
      if (!sid) continue;
      await db.execute(sql`
        INSERT INTO route_stops (route_id, direction, seq, stop_id, offset_min, dwell_s)
        VALUES (${routeId}::uuid, 'from_campus', ${i + 1}, ${sid}::uuid, ${reversedOffsets[i]}, 30);
      `);
    }

    await db.execute(sql`
      UPDATE route_directions
      SET line = (
        SELECT ST_MakeLine(s.geom::geometry ORDER BY rs.seq)::geography
        FROM route_stops rs
        JOIN stops s ON s.id = rs.stop_id
        WHERE rs.route_id = ${routeId}::uuid AND rs.direction = 'from_campus'
      )
      WHERE route_id = ${routeId}::uuid AND direction = 'from_campus';
    `);
  }

  // 5. Buses
  console.log("5. Seeding buses...");
  const busDefs = [
    { reg_no: "TS09 UB 1234", name: "Bus 12 (Campus Express)", capacity: 54, route: "R1" },
    { reg_no: "TS09 UB 5678", name: "Bus 05 (Secunderabad Star)", capacity: 54, route: "R2" },
    { reg_no: "TS09 UB 9012", name: "Bus 08 (East City Cruiser)", capacity: 54, route: "R3" },
    { reg_no: "TS09 UB 3456", name: "Bus 21 (Cyber City Line)", capacity: 48, route: "R4" },
  ];

  const busMap = new Map<string, string>();
  for (const b of busDefs) {
    const rid = routeMap.get(b.route);
    const res = await db.execute<{ id: string }>(sql`
      INSERT INTO buses (reg_no, name, capacity, default_route_id, status)
      VALUES (${b.reg_no}, ${b.name}, ${b.capacity}, ${rid}::uuid, 'active')
      ON CONFLICT (reg_no) DO UPDATE SET
        name = EXCLUDED.name,
        capacity = EXCLUDED.capacity,
        default_route_id = EXCLUDED.default_route_id
      RETURNING id;
    `);
    busMap.set(b.reg_no, res.rows[0].id);
  }

  // 6. Drivers (including seeded driver code 246810)
  console.log("6. Seeding drivers...");
  // code_hash placeholder for "246810"
  const driversDefs = [
    { name: "Ravi Kumar", phone: "+91 98765 43210", bus: "TS09 UB 1234", code_hash: "246810" },
    { name: "Suresh Reddy", phone: "+91 98765 43211", bus: "TS09 UB 5678", code_hash: "123456" },
  ];

  const driverMap = new Map<string, string>();
  for (const d of driversDefs) {
    const bid = busMap.get(d.bus);
    const res = await db.execute<{ id: string }>(sql`
      INSERT INTO drivers (name, phone, bus_id, code_hash, is_active)
      VALUES (${d.name}, ${d.phone}, ${bid}::uuid, ${d.code_hash}, true)
      RETURNING id;
    `);
    driverMap.set(d.name, res.rows[0].id);
  }

  // 7. Trips (Mon to Sat = 63 bitmask)
  console.log("7. Seeding trips...");
  const daysMonToSat = 63; // 1+2+4+8+16+32

  const tripDefs = [
    // R1 trips
    { route: "R1", dir: "to_campus", time: "07:00", bus: "TS09 UB 1234" },
    { route: "R1", dir: "to_campus", time: "07:45", bus: "TS09 UB 1234" },
    { route: "R1", dir: "to_campus", time: "08:30", bus: "TS09 UB 1234" },
    { route: "R1", dir: "from_campus", time: "16:30", bus: "TS09 UB 1234" },
    { route: "R1", dir: "from_campus", time: "17:30", bus: "TS09 UB 1234" },
    // R2 trips
    { route: "R2", dir: "to_campus", time: "06:45", bus: "TS09 UB 5678" },
    { route: "R2", dir: "to_campus", time: "07:30", bus: "TS09 UB 5678" },
    { route: "R2", dir: "from_campus", time: "16:45", bus: "TS09 UB 5678" },
    // R3 trips
    { route: "R3", dir: "to_campus", time: "06:30", bus: "TS09 UB 9012" },
    { route: "R3", dir: "to_campus", time: "07:15", bus: "TS09 UB 9012" },
    { route: "R3", dir: "from_campus", time: "16:30", bus: "TS09 UB 9012" },
    // R4 trips
    { route: "R4", dir: "to_campus", time: "07:30", bus: "TS09 UB 3456" },
    { route: "R4", dir: "from_campus", time: "17:00", bus: "TS09 UB 3456" },
  ];

  const tripMap = new Map<string, string>();
  for (const t of tripDefs) {
    const rid = routeMap.get(t.route);
    const bid = busMap.get(t.bus);
    if (!rid) continue;

    const res = await db.execute<{ id: string }>(sql`
      INSERT INTO trips (route_id, direction, depart_time, days, bus_id, valid_from, valid_to, is_active)
      VALUES (${rid}::uuid, ${t.dir}::direction, ${t.time}::time, ${daysMonToSat}, ${bid}::uuid, '2026-01-01', '2026-12-31', true)
      ON CONFLICT (route_id, direction, depart_time, days) DO UPDATE SET
        bus_id = EXCLUDED.bus_id,
        is_active = true
      RETURNING id;
    `);
    tripMap.set(`${t.route}-${t.dir}-${t.time}`, res.rows[0].id);
  }

  // 8. Today's trip instances
  console.log("8. Seeding today's trip instances...");
  const todayStr = new Date().toISOString().split("T")[0];

  for (const t of tripDefs) {
    const tid = tripMap.get(`${t.route}-${t.dir}-${t.time}`);
    const bid = busMap.get(t.bus);
    if (!tid) continue;

    await db.execute(sql`
      INSERT INTO trip_instances (trip_id, service_date, status, bus_id)
      VALUES (${tid}::uuid, ${todayStr}::date, 'scheduled', ${bid}::uuid)
      ON CONFLICT (trip_id, service_date) DO NOTHING;
    `);
  }

  // For R1 07:45 trip: set status running to demonstrate simulated live state
  const r1TripId = tripMap.get("R1-to_campus-07:45") ?? tripMap.get("R1-to_campus-07:00");
  if (r1TripId) {
    const driverId = driverMap.get("Ravi Kumar");
    const kphbStop = stopMap.get("KPHB");
    await db.execute(sql`
      UPDATE trip_instances
      SET
        status = 'running',
        driver_id = ${driverId}::uuid,
        started_at = now() - interval '15 minutes',
        last_pos = (SELECT geom FROM stops WHERE id = ${kphbStop}::uuid),
        last_position_at = now() - interval '10 seconds',
        last_progress_m = 12000,
        last_speed_mps = 7.5
      WHERE trip_id = ${r1TripId}::uuid AND service_date = ${todayStr}::date;
    `);
  }

  // 9. Notices
  console.log("9. Seeding notices...");
  // Warning notice on R2
  const r2Id = routeMap.get("R2");
  const noticeRes = await db.execute<{ id: string }>(sql`
    INSERT INTO notices (type, severity, title, body, starts_at, ends_at, is_published, created_by)
    VALUES (
      'route_change',
      'warning',
      'Route 2 evening trips diverted via Ameerpet',
      'Due to emergency water pipeline repairs near Secunderabad Station, Route 2 will bypass Gandhi Hospital and divert via Ameerpet Main Road.',
      now() - interval '2 hours',
      now() + interval '10 hours',
      true,
      ${adminId}::uuid
    )
    RETURNING id;
  `);

  if (noticeRes.rows[0]?.id && r2Id) {
    await db.execute(sql`
      INSERT INTO notice_targets (notice_id, route_id)
      VALUES (${noticeRes.rows[0].id}::uuid, ${r2Id}::uuid);
    `);
  }

  // General info notice
  await db.execute(sql`
    INSERT INTO notices (type, severity, title, body, starts_at, ends_at, is_published, created_by)
    VALUES (
      'general',
      'info',
      'Semester end exam special bus schedule',
      'Special morning and evening express buses will operate for all engineering departments during final examination week.',
      now() - interval '1 day',
      now() + interval '5 days',
      true,
      ${adminId}::uuid
    );
  `);

  console.log("CollegeNav database seed completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
