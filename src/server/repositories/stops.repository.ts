import { db } from "../db";
import { stops, stopAliases } from "../schema";
import { eq, sql } from "drizzle-orm";
import { haversineDistanceMeters } from "@/domain/geo";
import { StopLike } from "@/domain/types";

// Seeded fallback stops matching docs/07 section 7
export const SEEDED_STOPS: (StopLike & { landmark?: string; step_free?: boolean; aliases?: string[] })[] = [
  { id: "10000000-0000-0000-0000-000000000000", code: "CMP", name: "Main Campus", lat: 17.54, lng: 78.38, landmark: "College Administrative Block", step_free: true, is_campus: true, is_active: true },
  { id: "10000000-0000-0000-0000-000000000001", code: "MYP", name: "Miyapur", lat: 17.4969, lng: 78.3548, landmark: "Near Miyapur Metro Station", step_free: true, is_campus: false, is_active: true, aliases: ["Miyapur Metro"] },
  { id: "10000000-0000-0000-0000-000000000002", code: "KPHB", name: "Kukatpally Housing Board", lat: 17.4948, lng: 78.3996, landmark: "Near KPHB Colony Gate 2", step_free: true, is_campus: false, is_active: true, aliases: ["Kukatpally", "KPHB Colony"] },
  { id: "10000000-0000-0000-0000-000000000003", code: "JNTU", name: "JNTU Metro", lat: 17.4933, lng: 78.3914, landmark: "Opposite JNTU College Gate", step_free: true, is_campus: false, is_active: true, aliases: ["JNTUH"] },
  { id: "10000000-0000-0000-0000-000000000004", code: "AMP", name: "Ameerpet", lat: 17.4375, lng: 78.4483, landmark: "Ameerpet Metro Interchange", step_free: true, is_campus: false, is_active: true, aliases: ["Ameerpet Cross Roads"] },
  { id: "10000000-0000-0000-0000-000000000005", code: "GCB", name: "Gachibowli", lat: 17.4401, lng: 78.3489, landmark: "Gachibowli Stadium Circle", step_free: false, is_campus: false, is_active: true },
  { id: "10000000-0000-0000-0000-000000000006", code: "SEC", name: "Secunderabad Station", lat: 17.4344, lng: 78.5013, landmark: "Secunderabad East Metro", step_free: true, is_campus: false, is_active: true, aliases: ["Secunderabad"] },
  { id: "10000000-0000-0000-0000-000000000007", code: "UPL", name: "Uppal", lat: 17.4058, lng: 78.5591, landmark: "Uppal Ring Road Circle", step_free: false, is_campus: false, is_active: true },
  { id: "10000000-0000-0000-0000-000000000008", code: "DSN", name: "Dilsukhnagar", lat: 17.3688, lng: 78.5247, landmark: "Dilsukhnagar Bus Depot", step_free: true, is_campus: false, is_active: true },
  { id: "10000000-0000-0000-0000-000000000009", code: "MEH", name: "Mehdipatnam", lat: 17.395, lng: 78.44, landmark: "Mehdipatnam Rythu Bazar", step_free: false, is_campus: false, is_active: true },
  { id: "10000000-0000-0000-0000-000000000010", code: "LBN", name: "LB Nagar", lat: 17.3457, lng: 78.5522, landmark: "LB Nagar Metro Station", step_free: true, is_campus: false, is_active: true },
];

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
