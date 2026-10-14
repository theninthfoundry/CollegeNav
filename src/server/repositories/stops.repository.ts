import { db } from "../db";
import { stops, stopAliases } from "../schema";
import { eq, sql } from "drizzle-orm";
import { haversineDistanceMeters } from "@/domain/geo";
import { StopLike } from "@/domain/types";

import { FLEET_STOPS } from "../bus-data";

// Seeded fallback stops matching the 54 campus routes
export const SEEDED_STOPS: (StopLike & { landmark?: string; step_free?: boolean; aliases?: string[] })[] = FLEET_STOPS;

export async function getAllStops(): Promise<StopLike[]> {
  try {
    const rows = await db.execute<{
      id: string;
      code: string | null;
      name: string;
      landmark: string | null;
      step_free: boolean | null;
      is_campus: boolean;
      is_active: boolean;
      lat: number;
      lng: number;
    }>(sql`
      SELECT
        id, code, name, landmark, step_free, is_campus, is_active,
        ST_Y(geom::geometry) as lat,
        ST_X(geom::geometry) as lng
      FROM stops
      WHERE is_active = true
      ORDER BY name ASC;
    `);

    if (rows.rows.length > 0) {
      return rows.rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        lat: Number(r.lat),
        lng: Number(r.lng),
        landmark: r.landmark,
        step_free: r.step_free,
        is_campus: r.is_campus,
        is_active: r.is_active,
      }));
    }
  } catch (err) {
    // Return fallback
  }

  return SEEDED_STOPS;
}

export async function getStopById(id: string): Promise<StopLike | null> {
  const all = await getAllStops();
  return all.find((s) => s.id === id || s.code === id) || null;
}

export async function searchStops(params: {
  query?: string;
  near?: { lat: number; lng: number };
  radiusM?: number;
  limit?: number;
}) {
  const { query = "", near, radiusM = 1000, limit = 20 } = params;
  const all = await getAllStops();
  const q = query.trim().toLowerCase();

  let results = all.map((stop) => {
    let distance_m: number | undefined;
    if (near) {
      distance_m = haversineDistanceMeters(near.lat, near.lng, stop.lat, stop.lng);
    }
    return {
      ...stop,
      distance_m,
    };
  });

  if (near && radiusM) {
    results = results.filter((s) => (s.distance_m ?? Infinity) <= radiusM);
  }

  if (q.length > 0) {
    results = results.filter((s) => {
      const matchName = s.name.toLowerCase().includes(q);
      const matchCode = s.code?.toLowerCase().includes(q);
      const matchLandmark = s.landmark?.toLowerCase().includes(q);
      return matchName || matchCode || matchLandmark;
    });
  }

  // Sort
  if (near) {
    results.sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0));
  } else {
    results.sort((a, b) => a.name.localeCompare(b.name));
  }

  return results.slice(0, limit);
}
