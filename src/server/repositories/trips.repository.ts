import { db } from "../db";
import { sql } from "drizzle-orm";
import { Direction, RunStatus, TripInstanceLike, TripLike } from "@/domain/types";
import { SEEDED_ROUTES, SEEDED_ROUTE_STOPS } from "./routes.repository";
import { SEEDED_STOPS } from "./stops.repository";
import { expandTrips, formatKolkataTime } from "@/domain/time";
import { computeFreshness } from "@/domain/freshness";

export const SEEDED_TRIPS: TripLike[] = [
  // R1: Miyapur to Campus
  { id: "30000000-0000-0000-0000-000000000001", route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", depart_time: "07:00", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000002", route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", depart_time: "07:45", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000003", route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", depart_time: "08:30", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000020", route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", depart_time: "09:30", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000021", route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", depart_time: "10:30", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000022", route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", depart_time: "11:30", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000023", route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", depart_time: "12:15", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000024", route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", depart_time: "13:00", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000025", route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", depart_time: "14:00", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000026", route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", depart_time: "15:00", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000027", route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", depart_time: "16:00", days: 63, is_active: true },
  // R1: From campus
  { id: "30000000-0000-0000-0000-000000000028", route_id: "20000000-0000-0000-0000-000000000001", direction: "from_campus", depart_time: "11:30", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000029", route_id: "20000000-0000-0000-0000-000000000001", direction: "from_campus", depart_time: "13:00", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000030", route_id: "20000000-0000-0000-0000-000000000001", direction: "from_campus", depart_time: "15:00", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000004", route_id: "20000000-0000-0000-0000-000000000001", direction: "from_campus", depart_time: "16:30", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000005", route_id: "20000000-0000-0000-0000-000000000001", direction: "from_campus", depart_time: "17:30", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000031", route_id: "20000000-0000-0000-0000-000000000001", direction: "from_campus", depart_time: "18:30", days: 63, is_active: true },

  // R2: Secunderabad to Campus
  { id: "30000000-0000-0000-0000-000000000006", route_id: "20000000-0000-0000-0000-000000000002", direction: "to_campus", depart_time: "06:45", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000007", route_id: "20000000-0000-0000-0000-000000000002", direction: "to_campus", depart_time: "07:30", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000032", route_id: "20000000-0000-0000-0000-000000000002", direction: "to_campus", depart_time: "08:30", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000033", route_id: "20000000-0000-0000-0000-000000000002", direction: "to_campus", depart_time: "10:00", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000034", route_id: "20000000-0000-0000-0000-000000000002", direction: "to_campus", depart_time: "11:45", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000035", route_id: "20000000-0000-0000-0000-000000000002", direction: "to_campus", depart_time: "12:30", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000036", route_id: "20000000-0000-0000-0000-000000000002", direction: "to_campus", depart_time: "14:15", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000008", route_id: "20000000-0000-0000-0000-000000000002", direction: "from_campus", depart_time: "16:45", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000037", route_id: "20000000-0000-0000-0000-000000000002", direction: "from_campus", depart_time: "17:45", days: 63, is_active: true },

  // R3: Uppal and Dilsukhnagar to Campus
  { id: "30000000-0000-0000-0000-000000000009", route_id: "20000000-0000-0000-0000-000000000003", direction: "to_campus", depart_time: "06:30", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000010", route_id: "20000000-0000-0000-0000-000000000003", direction: "to_campus", depart_time: "07:15", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000038", route_id: "20000000-0000-0000-0000-000000000003", direction: "to_campus", depart_time: "08:15", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000039", route_id: "20000000-0000-0000-0000-000000000003", direction: "to_campus", depart_time: "10:15", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000040", route_id: "20000000-0000-0000-0000-000000000003", direction: "to_campus", depart_time: "12:00", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000041", route_id: "20000000-0000-0000-0000-000000000003", direction: "to_campus", depart_time: "14:00", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000011", route_id: "20000000-0000-0000-0000-000000000003", direction: "from_campus", depart_time: "16:30", days: 63, is_active: true },

  // R4: Gachibowli to Campus (currently suspended route in seed, kept for completeness)
  { id: "30000000-0000-0000-0000-000000000012", route_id: "20000000-0000-0000-0000-000000000004", direction: "to_campus", depart_time: "07:30", days: 63, is_active: true },
  { id: "30000000-0000-0000-0000-000000000013", route_id: "20000000-0000-0000-0000-000000000004", direction: "from_campus", depart_time: "17:00", days: 63, is_active: true },
];

export async function getAllTrips(): Promise<TripLike[]> {
  try {
    const res = await db.execute<{
      id: string;
      route_id: string;
      direction: string;
      depart_time: string;
      days: number;
      bus_id: string | null;
      is_active: boolean;
      valid_from: string | null;
      valid_to: string | null;
      verified_at: string | null;
    }>(sql`
      SELECT id, route_id, direction, depart_time, days, bus_id, is_active, valid_from, valid_to, verified_at
      FROM trips
      WHERE is_active = true
      ORDER BY depart_time ASC;
    `);

    if (res.rows.length > 0) {
      return res.rows.map((r) => ({
        id: r.id,
        route_id: r.route_id,
        direction: r.direction as Direction,
        depart_time: r.depart_time,
        days: Number(r.days),
        bus_id: r.bus_id,
        is_active: r.is_active,
        valid_from: r.valid_from,
        valid_to: r.valid_to,
        verified_at: r.verified_at,
      }));
    }
  } catch (err) {
    // Fallback
  }

  return SEEDED_TRIPS;
}

export async function getTripInstances(serviceDate: string): Promise<TripInstanceLike[]> {
  try {
    const res = await db.execute<{
      id: string;
      trip_id: string;
      service_date: string;
      status: string;
      reason: string | null;
      delay_min: number;
      delay_source: string | null;
      bus_id: string | null;
      driver_id: string | null;
      started_at: string | null;
      ended_at: string | null;
      last_position_at: string | null;
      last_progress_m: number | null;
      last_speed_mps: number | null;
    }>(sql`
      SELECT id, trip_id, service_date, status, reason, delay_min, delay_source,
             bus_id, driver_id, started_at, ended_at, last_position_at, last_progress_m, last_speed_mps
      FROM trip_instances
      WHERE service_date = ${serviceDate}::date;
    `);

    if (res.rows.length > 0) {
      return res.rows.map((r) => ({
        id: r.id,
        trip_id: r.trip_id,
        service_date: r.service_date,
        status: r.status as RunStatus,
        reason: r.reason,
        delay_min: Number(r.delay_min || 0),
        delay_source: r.delay_source as any,
        bus_id: r.bus_id,
        driver_id: r.driver_id,
        started_at: r.started_at,
        ended_at: r.ended_at,
        last_position_at: r.last_position_at,
        last_progress_m: r.last_progress_m ? Number(r.last_progress_m) : null,
        last_speed_mps: r.last_speed_mps ? Number(r.last_speed_mps) : null,
      }));
    }
  } catch (err) {
    // Fallback
  }

  // Simulated running trip on R1 and R2 for today
  // Find R1 trip closest to current time so there's always an active or imminent trip
  const now = new Date();
  const kolkataOffsetMs = 5.5 * 3600 * 1000;
  const kolkataNow = new Date(now.getTime() + kolkataOffsetMs);
  const nowMin = kolkataNow.getUTCHours() * 60 + kolkataNow.getUTCMinutes();

  const r1Trips = SEEDED_TRIPS.filter((t) => t.route_id === "20000000-0000-0000-0000-000000000001" && t.direction === "to_campus");
  let activeR1Trip = r1Trips[0];
  let minDiff = Infinity;
  for (const t of r1Trips) {
    const [h, m] = t.depart_time.split(":").map(Number);
    const tripMin = h * 60 + m;
    const diff = Math.abs(tripMin - nowMin);
    if (diff < minDiff) {
      minDiff = diff;
      activeR1Trip = t;
    }
  }

  return [
    {
      id: "40000000-0000-0000-0000-000000000002",
      trip_id: activeR1Trip.id,
      service_date: serviceDate,
      status: "running",
      delay_min: 0,
      started_at: new Date(Date.now() - 15 * 60000).toISOString(),
      last_position_at: new Date(Date.now() - 10000).toISOString(),
      last_progress_m: 12000,
      last_speed_mps: 8,
    },
    {
      id: "40000000-0000-0000-0000-000000000003",
      trip_id: "30000000-0000-0000-0000-000000000034",
      service_date: serviceDate,
      status: "scheduled",
      delay_min: 4,
      delay_source: "manual",
      started_at: null,
      last_position_at: null,
      last_progress_m: null,
      last_speed_mps: null,
    },
  ];
}

export async function getDeparturesForStop(stopId: string, date: string, limit = 10) {
  const trips = await getAllTrips();
  const instances = await getTripInstances(date);
  const calls = expandTrips({
    serviceDate: date,
    trips,
    routeStops: SEEDED_ROUTE_STOPS,
    instances,
  });

  const stopCalls = calls.filter((c) => c.stopId === stopId);
  const routeMap = new Map(SEEDED_ROUTES.map((r) => [r.id, r]));

  // Sort by expectedAt
  stopCalls.sort((a, b) => a.expectedAt.getTime() - b.expectedAt.getTime());

  const items = stopCalls.slice(0, limit).map((c) => {
    const route = routeMap.get(c.routeId) || SEEDED_ROUTES[0];
    const instance = instances.find((inst) => inst.trip_id === c.tripId);
    const freshness = computeFreshness(route);

    let source = "scheduled";
    if (instance?.status === "running") {
      source = "live";
    } else if (c.delayMin !== 0 || instance?.last_position_at) {
      source = "estimated";
    }

    const scheduledIso = c.scheduledAt.toISOString();
    const expectedIso = c.expectedAt.toISOString();
    const nowMs = Date.now();
    const diffMin = Math.round((c.expectedAt.getTime() - nowMs) / 60000);
    const countdown = diffMin > 0 ? `in ${diffMin} min` : diffMin === 0 ? "Due" : "Departed";

    return {
      trip_instance_id: c.instanceId,
      trip_id: c.tripId,
      route: {
        id: route.id,
        code: route.code,
        name: route.name,
        color_index: route.color_index,
      },
      direction: c.direction,
      headsign: c.direction === "to_campus" ? "Main campus" : route.name,
      scheduled: scheduledIso,
      expected: {
        at: expectedIso,
        source: source as any,
      },
      status: c.status,
      delay_min: c.delayMin,
      reason: instance?.reason || null,
      freshness,
      countdown,
      time_formatted: formatKolkataTime(c.expectedAt),
    };
  });

  return items;
}
