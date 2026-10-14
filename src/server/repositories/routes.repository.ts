import { db } from "../db";
import { sql } from "drizzle-orm";
import { Direction, RouteLike, RouteStopLike } from "@/domain/types";
import { computeFreshness } from "@/domain/freshness";

// Seeded fallback routes matching docs/07 section 7
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export const SEEDED_ROUTES: RouteLike[] = [
  {
    id: "20000000-0000-0000-0000-000000000001",
    code: "R1",
    name: "Miyapur to Campus",
    color_index: 1,
    status: "active",
    status_reason: null,
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
    verified_at: daysAgo(3),
  },
  {
    id: "20000000-0000-0000-0000-000000000002",
    code: "R2",
    name: "Secunderabad to Campus",
    color_index: 2,
    status: "active",
    status_reason: null,
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
    verified_at: daysAgo(30),
  },
  {
    id: "20000000-0000-0000-0000-000000000003",
    code: "R3",
    name: "Uppal and Dilsukhnagar to Campus",
    color_index: 3,
    status: "active",
    status_reason: null,
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
    verified_at: daysAgo(70),
  },
  {
    id: "20000000-0000-0000-0000-000000000004",
    code: "R4",
    name: "Gachibowli to Campus",
    color_index: 4,
    status: "suspended",
    status_reason: "Route suspended due to road widening near Gachibowli junction",
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
    verified_at: daysAgo(10),
  },
];

export const SEEDED_ROUTE_STOPS: RouteStopLike[] = [
  // R1 to campus: MYP (1) -> KPHB (2) -> JNTU (3) -> CMP (0)
  { route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", seq: 1, stop_id: "10000000-0000-0000-0000-000000000001", offset_min: 0 },
  { route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", seq: 2, stop_id: "10000000-0000-0000-0000-000000000002", offset_min: 12 },
  { route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", seq: 3, stop_id: "10000000-0000-0000-0000-000000000003", offset_min: 25 },
  { route_id: "20000000-0000-0000-0000-000000000001", direction: "to_campus", seq: 4, stop_id: "10000000-0000-0000-0000-000000000000", offset_min: 55 },
  // R1 from campus
  { route_id: "20000000-0000-0000-0000-000000000001", direction: "from_campus", seq: 1, stop_id: "10000000-0000-0000-0000-000000000000", offset_min: 0 },
  { route_id: "20000000-0000-0000-0000-000000000001", direction: "from_campus", seq: 2, stop_id: "10000000-0000-0000-0000-000000000003", offset_min: 30 },
  { route_id: "20000000-0000-0000-0000-000000000001", direction: "from_campus", seq: 3, stop_id: "10000000-0000-0000-0000-000000000002", offset_min: 43 },
  { route_id: "20000000-0000-0000-0000-000000000001", direction: "from_campus", seq: 4, stop_id: "10000000-0000-0000-0000-000000000001", offset_min: 55 },

  // R2 to campus: SEC (6) -> AMP (4) -> KPHB (2) -> CMP (0)
  { route_id: "20000000-0000-0000-0000-000000000002", direction: "to_campus", seq: 1, stop_id: "10000000-0000-0000-0000-000000000006", offset_min: 0 },
  { route_id: "20000000-0000-0000-0000-000000000002", direction: "to_campus", seq: 2, stop_id: "10000000-0000-0000-0000-000000000004", offset_min: 20 },
  { route_id: "20000000-0000-0000-0000-000000000002", direction: "to_campus", seq: 3, stop_id: "10000000-0000-0000-0000-000000000002", offset_min: 45 },
  { route_id: "20000000-0000-0000-0000-000000000002", direction: "to_campus", seq: 4, stop_id: "10000000-0000-0000-0000-000000000000", offset_min: 80 },

  // R3 to campus: UPL (7) -> DSN (8) -> MEH (9) -> AMP (4) -> CMP (0)
  { route_id: "20000000-0000-0000-0000-000000000003", direction: "to_campus", seq: 1, stop_id: "10000000-0000-0000-0000-000000000007", offset_min: 0 },
  { route_id: "20000000-0000-0000-0000-000000000003", direction: "to_campus", seq: 2, stop_id: "10000000-0000-0000-0000-000000000008", offset_min: 15 },
  { route_id: "20000000-0000-0000-0000-000000000003", direction: "to_campus", seq: 3, stop_id: "10000000-0000-0000-0000-000000000009", offset_min: 35 },
  { route_id: "20000000-0000-0000-0000-000000000003", direction: "to_campus", seq: 4, stop_id: "10000000-0000-0000-0000-000000000004", offset_min: 50 },
  { route_id: "20000000-0000-0000-0000-000000000003", direction: "to_campus", seq: 5, stop_id: "10000000-0000-0000-0000-000000000000", offset_min: 90 },

  // R4 to campus: GCB (5) -> JNTU (3) -> CMP (0)
  { route_id: "20000000-0000-0000-0000-000000000004", direction: "to_campus", seq: 1, stop_id: "10000000-0000-0000-0000-000000000005", offset_min: 0 },
  { route_id: "20000000-0000-0000-0000-000000000004", direction: "to_campus", seq: 2, stop_id: "10000000-0000-0000-0000-000000000003", offset_min: 25 },
  { route_id: "20000000-0000-0000-0000-000000000004", direction: "to_campus", seq: 3, stop_id: "10000000-0000-0000-0000-000000000000", offset_min: 60 },
];

export async function getAllRoutes(): Promise<(RouteLike & { stop_count: number })[]> {
  try {
    const res = await db.execute<{
      id: string;
      code: string;
      name: string;
      color_index: number;
      status: string;
      status_reason: string | null;
      valid_from: string | null;
      valid_to: string | null;
      verified_at: string | null;
      stop_count: number;
    }>(sql`
      SELECT
        r.id, r.code, r.name, r.color_index, r.status, r.status_reason,
        r.valid_from, r.valid_to, r.verified_at,
        COUNT(DISTINCT rs.stop_id) as stop_count
      FROM routes r
      LEFT JOIN route_stops rs ON rs.route_id = r.id AND rs.direction = 'to_campus'
      WHERE r.status <> 'archived'
      GROUP BY r.id
      ORDER BY r.code ASC;
    `);

    if (res.rows.length > 0) {
      return res.rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        color_index: Number(r.color_index),
        status: r.status as any,
        status_reason: r.status_reason,
        valid_from: r.valid_from,
        valid_to: r.valid_to,
        verified_at: r.verified_at,
        stop_count: Number(r.stop_count),
      }));
    }
  } catch (err) {
    // Return fallback
  }

  return SEEDED_ROUTES.map((r) => {
    const stopsCount = SEEDED_ROUTE_STOPS.filter(
      (rs) => rs.route_id === r.id && rs.direction === "to_campus"
    ).length;
    return {
      ...r,
      stop_count: stopsCount,
    };
  });
}

export async function getRouteByCode(code: string) {
  const routes = await getAllRoutes();
  return routes.find((r) => r.code.toLowerCase() === code.toLowerCase() || r.id === code) || null;
}

export async function getAllRouteStops(): Promise<RouteStopLike[]> {
  try {
    const res = await db.execute<{
      route_id: string;
      direction: string;
      seq: number;
      stop_id: string;
      offset_min: number;
      dwell_s: number;
      progress_m: number | null;
    }>(sql`
      SELECT route_id, direction, seq, stop_id, offset_min, dwell_s, progress_m
      FROM route_stops
      ORDER BY route_id, direction, seq ASC;
    `);

    if (res.rows.length > 0) {
      return res.rows.map((r) => ({
        route_id: r.route_id,
        direction: r.direction as Direction,
        seq: Number(r.seq),
        stop_id: r.stop_id,
        offset_min: Number(r.offset_min),
        dwell_s: Number(r.dwell_s),
        progress_m: r.progress_m ? Number(r.progress_m) : undefined,
      }));
    }
  } catch (err) {
    // Fallback
  }

  return SEEDED_ROUTE_STOPS;
}
