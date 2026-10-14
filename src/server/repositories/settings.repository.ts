import { db } from "../db";
import { settings } from "../schema";
import { eq } from "drizzle-orm";

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const res = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    if (res.length > 0 && res[0].value !== null) {
      return res[0].value as T;
    }
  } catch (err) {
    // Return default value on connection failure
  }
  return defaultValue;
}

export async function getAllPublicSettings() {
  const walkRadiusM = await getSetting("walk_radius_m", 800);
  const campusStopId = await getSetting("campus_stop_id", "00000000-0000-0000-0000-000000000000");
  const freshnessVerifiedDays = await getSetting("freshness_verified_days", 14);
  const freshnessAgingDays = await getSetting("freshness_aging_days", 45);

  return {
    walk_radius_m: walkRadiusM,
    campus_stop_id: campusStopId,
    freshness: {
      verified_days: freshnessVerifiedDays,
      aging_days: freshnessAgingDays,
    },
    map_style: "https://tiles.openfreemap.org/styles/positron",
    default_center: [78.4867, 17.385],
    campus_name: "Main campus",
    vapid_public_key: process.env.VAPID_PUBLIC_KEY || "",
  };
}
