import { db } from "../db";
import { sql } from "drizzle-orm";
import { Direction, RouteLike, RouteStopLike } from "@/domain/types";
import { computeFreshness } from "@/domain/freshness";

// Seeded fallback routes matching docs/07 section 7
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

import { FLEET_ROUTES, FLEET_ROUTE_STOPS } from "../bus-data";

export const SEEDED_ROUTES: (RouteLike & { stop_count: number; driver_name?: string; driver_phone?: string; bus_reg?: string; corridor?: string })[] = FLEET_ROUTES;

export const SEEDED_ROUTE_STOPS: RouteStopLike[] = FLEET_ROUTE_STOPS;

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
