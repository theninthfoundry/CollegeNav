import { describe, it, expect } from "vitest";
import { planJourney } from "../../src/domain/planner";
import {
  RouteLike,
  RouteStopLike,
  StopLike,
  TripInstanceLike,
  TripLike,
} from "../../src/domain/types";
import { parseKolkataDateTime } from "../../src/domain/time";

describe("domain/planner (docs/09 section 3.10 test suite)", () => {
  const serviceDate = "2026-10-14"; // Wednesday
  const now = parseKolkataDateTime(serviceDate, "07:20"); // 7:20 am

  const stops: StopLike[] = [
    { id: "s-myp", code: "MYP", name: "Miyapur", lat: 17.4969, lng: 78.3548, is_campus: false },
    { id: "s-kphb", code: "KPHB", name: "Kukatpally Housing Board", lat: 17.4948, lng: 78.3996, is_campus: false },
    { id: "s-jntu", code: "JNTU", name: "JNTU Metro", lat: 17.4933, lng: 78.3914, is_campus: false },
    { id: "s-cmp", code: "CMP", name: "Main Campus", lat: 17.5400, lng: 78.3800, is_campus: true },
    { id: "s-sec", code: "SEC", name: "Secunderabad", lat: 17.4344, lng: 78.5013, is_campus: false },
    { id: "s-gcb", code: "GCB", name: "Gachibowli", lat: 17.4401, lng: 78.3489, is_campus: false },
  ];

  const routes: RouteLike[] = [
    {
      id: "r1",
      code: "R1",
      name: "Miyapur to Campus",
      color_index: 1,
      status: "active",
      verified_at: new Date("2026-10-11T00:00:00+05:30"), // 3 days ago (verified)
    },
    {
      id: "r2",
      code: "R2",
      name: "Secunderabad to Campus",
      color_index: 2,
      status: "active",
      verified_at: new Date("2026-09-14T00:00:00+05:30"), // 30 days ago (aging)
    },
    {
      id: "r3",
      code: "R3",
      name: "Outdated Route",
      color_index: 3,
      status: "active",
      verified_at: new Date("2026-08-01T00:00:00+05:30"), // 74 days ago (outdated)
    },
    {
      id: "r4",
      code: "R4",
      name: "Suspended Route",
      color_index: 4,
      status: "suspended",
      status_reason: "Road widening near Gachibowli",
      verified_at: new Date("2026-10-10T00:00:00+05:30"),
    },
  ];

  const routeStops: RouteStopLike[] = [
    // R1: MYP -> KPHB (+12 min) -> JNTU (+25 min) -> CMP (+55 min)
    { route_id: "r1", direction: "to_campus", seq: 1, stop_id: "s-myp", offset_min: 0 },
    { route_id: "r1", direction: "to_campus", seq: 2, stop_id: "s-kphb", offset_min: 12 },
    { route_id: "r1", direction: "to_campus", seq: 3, stop_id: "s-jntu", offset_min: 25 },
    { route_id: "r1", direction: "to_campus", seq: 4, stop_id: "s-cmp", offset_min: 55 },

    // R3 (Outdated): KPHB -> CMP (+40 min)
    { route_id: "r3", direction: "to_campus", seq: 1, stop_id: "s-kphb", offset_min: 0 },
    { route_id: "r3", direction: "to_campus", seq: 2, stop_id: "s-cmp", offset_min: 40 },

    // R4 (Suspended): GCB -> JNTU -> CMP
    { route_id: "r4", direction: "to_campus", seq: 1, stop_id: "s-gcb", offset_min: 0 },
    { route_id: "r4", direction: "to_campus", seq: 2, stop_id: "s-jntu", offset_min: 25 },
    { route_id: "r4", direction: "to_campus", seq: 3, stop_id: "s-cmp", offset_min: 60 },
  ];

  const trips: TripLike[] = [
    // R1: departs 07:18 (at KPHB at 07:30, 10 min wait from 07:20)
    {
      id: "trip-r1-1",
      route_id: "r1",
      direction: "to_campus",
      depart_time: "07:18",
      days: 63,
    },
    // R1: departs 08:00
    {
      id: "trip-r1-2",
      route_id: "r1",
      direction: "to_campus",
      depart_time: "08:00",
      days: 63,
    },
    // R3: departs 07:25 (at KPHB at 07:25)
    {
      id: "trip-r3-1",
      route_id: "r3",
      direction: "to_campus",
      depart_time: "07:25",
      days: 63,
    },
    // R4: departs 07:30
    {
      id: "trip-r4-1",
      route_id: "r4",
      direction: "to_campus",
      depart_time: "07:30",
      days: 63,
    },
  ];

  // 1. Origin at a stop on R1 with a trip in 10 minutes returns R1 with correct wait
  it("returns R1 with correct wait when origin is at KPHB with trip in 10 minutes", () => {
    const res = planJourney({
      origin: { type: "stop", stopId: "s-kphb" },
      destination: { type: "stop", stopId: "s-cmp" },
      mode: "now",
      queryTime: now, // 07:20
      serviceDate,
      stops,
      routes: [routes[0]], // R1 only
      routeStops,
      trips,
    });

    expect(res.options).toHaveLength(1);
    const opt = res.options[0];
    expect(opt.route.code).toBe("R1");
    expect(opt.board.stop.id).toBe("s-kphb");
    // Trip departs MYP at 07:18, reaches KPHB at 07:30. Now is 07:20 -> wait is 10 min.
    expect(opt.wait_min).toBe(10);
    expect(opt.best).toBe(true);
  });

  // 2. Origin 1.2 km from any stop returns no_stop_near_origin with nearest stop distance
  it("returns no_stop_near_origin when origin is 1.2 km from nearest stop", () => {
    // Coordinate far from all stops (approx 1.5 km north of KPHB)
    const farPoint = { type: "point" as const, lat: 17.5100, lng: 78.4050 };

    const res = planJourney({
      origin: farPoint,
      destination: { type: "stop", stopId: "s-cmp" },
      mode: "now",
      queryTime: now,
      serviceDate,
      stops,
      routes,
      routeStops,
      trips,
      walkMaxMeters: 800,
    });

    expect(res.options).toHaveLength(0);
    expect(res.reason).toBe("no_stop_near_origin");
    expect(res.nearest_origin_stop).toBeDefined();
    expect(res.nearest_origin_stop?.distance_m).toBeGreaterThan(800);
  });

  // 3. Cancelled trip is skipped; next trip returned
  it("skips cancelled trip and returns next active trip", () => {
    const instances: TripInstanceLike[] = [
      {
        id: "inst-r1-1",
        trip_id: "trip-r1-1", // 07:18 trip is cancelled
        service_date: serviceDate,
        status: "cancelled",
        reason: "Engine check",
      },
    ];

    const res = planJourney({
      origin: { type: "stop", stopId: "s-kphb" },
      destination: { type: "stop", stopId: "s-cmp" },
      mode: "now",
      queryTime: now,
      serviceDate,
      stops,
      routes: [routes[0]],
      routeStops,
      trips,
      instances,
    });

    expect(res.options).toHaveLength(1);
    const opt = res.options[0];
    // Next trip is trip-r1-2 (08:00 depart MYP, reaches KPHB at 08:12)
    expect(opt.trip_instance_id).not.toBe("inst-r1-1");
    expect(opt.board.time.at).toContain("08:12");
  });

  // 4. Stop order enforcement: alight stop before board stop is rejected
  it("enforces stop order: alight stop before board stop is rejected", () => {
    // Attempting to travel backward on R1: CMP -> KPHB on to_campus direction
    const res = planJourney({
      origin: { type: "stop", stopId: "s-cmp" },
      destination: { type: "stop", stopId: "s-kphb" },
      mode: "now",
      queryTime: now,
      serviceDate,
      stops,
      routes: [routes[0]],
      routeStops,
      trips,
    });

    expect(res.options).toHaveLength(0);
    expect(res.reason).toBe("no_route_connects");
  });

  // 5. Outdated route ranked after verified route even if faster, and is never best
  it("ranks outdated route after verified route and never marks it best option", () => {
    const res = planJourney({
      origin: { type: "stop", stopId: "s-kphb" },
      destination: { type: "stop", stopId: "s-cmp" },
      mode: "now",
      queryTime: now,
      serviceDate,
      stops,
      routes: [routes[0], routes[2]], // R1 (verified) and R3 (outdated)
      routeStops,
      trips,
    });

    expect(res.options.length).toBeGreaterThanOrEqual(2);
    // Verified R1 must be ranked first and marked best
    expect(res.options[0].route.code).toBe("R1");
    expect(res.options[0].best).toBe(true);

    // Outdated R3 must NOT be marked best and must carry warning
    const r3Option = res.options.find((o) => o.route.code === "R3");
    expect(r3Option).toBeDefined();
    expect(r3Option?.best).toBe(false);
    expect(r3Option?.warnings).toContain("Schedule may be outdated");
  });

  // 6. Arrive-by picks latest feasible departure
  it("picks latest feasible departure for arrive-by mode", () => {
    // User wants to arrive at campus by 09:30 am
    const arriveBy = parseKolkataDateTime(serviceDate, "09:30");

    const res = planJourney({
      origin: { type: "stop", stopId: "s-kphb" },
      destination: { type: "stop", stopId: "s-cmp" },
      mode: "arrive",
      queryTime: arriveBy,
      serviceDate,
      stops,
      routes: [routes[0]], // R1 has 07:18 trip (arrives 08:13) and 08:00 trip (arrives 08:55)
      routeStops,
      trips,
    });

    expect(res.options.length).toBeGreaterThan(0);
    // Latest feasible arrival that is <= 09:30 is 08:00 trip (arriving at 08:55)
    expect(res.options[0].depart_at).toContain("08:12");
  });

  // 7. Suspended route excluded and not returned as viable result
  it("excludes suspended route from plan options", () => {
    const res = planJourney({
      origin: { type: "stop", stopId: "s-gcb" },
      destination: { type: "stop", stopId: "s-cmp" },
      mode: "now",
      queryTime: now,
      serviceDate,
      stops,
      routes: [routes[3]], // R4 only (suspended)
      routeStops,
      trips,
    });

    expect(res.options).toHaveLength(0);
  });

  // 8. Delay of 8 minutes shifts wait and arrival, source becomes estimated
  it("shifts wait and arrival when trip has delay, marking source estimated", () => {
    const instances: TripInstanceLike[] = [
      {
        id: "inst-r1-delay",
        trip_id: "trip-r1-1",
        service_date: serviceDate,
        status: "scheduled",
        delay_min: 8,
      },
    ];

    const res = planJourney({
      origin: { type: "stop", stopId: "s-kphb" },
      destination: { type: "stop", stopId: "s-cmp" },
      mode: "now",
      queryTime: now, // 07:20
      serviceDate,
      stops,
      routes: [routes[0]],
      routeStops,
      trips,
      instances,
    });

    expect(res.options).toHaveLength(1);
    const opt = res.options[0];
    // Base time at KPHB was 07:30. With 8 min delay -> 07:38. Wait is 18 min from 07:20.
    expect(opt.wait_min).toBe(18);
    expect(opt.board.time.source).toBe("estimated");
  });
});
