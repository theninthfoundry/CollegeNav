import { StopLike } from "../types";

export const DEFAULT_WALK_MAX_METERS = 800;
export const DEFAULT_CIRCUITY_FACTOR = 1.25;
export const DEFAULT_WALK_SPEED_METERS_PER_MIN = 80; // 1.33 m/s

/**
 * Calculates Haversine distance in meters between two lat/lng points.
 */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Computes walking distance and time accounting for circuity factor.
 */
export function calculateWalk(
  metersStraightLine: number,
  circuityFactor = DEFAULT_CIRCUITY_FACTOR,
  speedMetersPerMin = DEFAULT_WALK_SPEED_METERS_PER_MIN
): { meters: number; minutes: number } {
  const meters = Math.round(metersStraightLine * circuityFactor);
  const minutes = Math.ceil(meters / speedMetersPerMin);
  return { meters, minutes };
}

export type CandidateStop = {
  stop: StopLike;
  straightLineMeters: number;
  walkMeters: number;
  walkMinutes: number;
};

/**
 * Finds candidate stops within walkMax meters from an origin or destination.
 */
export function findCandidateStops(
  target: { type: "stop"; stopId: string } | { type: "point"; lat: number; lng: number },
  allStops: StopLike[],
  walkMaxMeters = DEFAULT_WALK_MAX_METERS
): CandidateStop[] {
  const activeStops = allStops.filter((s) => s.is_active !== false);

  if (target.type === "stop") {
    const matched = activeStops.find((s) => s.id === target.stopId);
    if (!matched) return [];
    return [
      {
        stop: matched,
        straightLineMeters: 0,
        walkMeters: 0,
        walkMinutes: 0,
      },
    ];
  }

  const results: CandidateStop[] = [];

  for (const s of activeStops) {
    const dist = haversineDistanceMeters(target.lat, target.lng, s.lat, s.lng);
    if (dist <= walkMaxMeters) {
      const walk = calculateWalk(dist);
      results.push({
        stop: s,
        straightLineMeters: dist,
        walkMeters: walk.meters,
        walkMinutes: walk.minutes,
      });
    }
  }

  // Sort nearest first
  return results.sort((a, b) => a.straightLineMeters - b.straightLineMeters);
}
