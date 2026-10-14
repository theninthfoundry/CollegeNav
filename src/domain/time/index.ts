import {
  Direction,
  RouteStopLike,
  StopCall,
  TripInstanceLike,
  TripLike,
} from "../types";

export const KOLKATA_TIMEZONE = "Asia/Kolkata";
export const KOLKATA_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30 in ms

/**
 * Computes day-of-week bitmask in Asia/Kolkata:
 * Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64
 */
export function getDowBit(dateInput: Date | string): number {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  // Shift UTC by Kolkata offset to get local day
  const localTime = new Date(d.getTime() + KOLKATA_OFFSET_MS);
  const day = localTime.getUTCDay(); // 0 is Sunday, 1 is Monday, ...
  const isoDow = day === 0 ? 7 : day; // ISO: 1 = Mon, 7 = Sun
  return 1 << (isoDow - 1);
}

/**
 * Creates a UTC Date representing the given service date (YYYY-MM-DD)
 * and time (HH:mm or HH:mm:ss) in Asia/Kolkata timezone.
 */
export function parseKolkataDateTime(serviceDate: string, timeStr: string): Date {
  const [yearStr, monthStr, dayStr] = serviceDate.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const [hourStr, minStr, secStr] = timeStr.split(":");
  const hour = parseInt(hourStr, 10);
  const min = parseInt(minStr, 10);
  const sec = secStr ? parseInt(secStr, 10) : 0;

  // UTC timestamp corresponding to that local clock time
  const utcMillis = Date.UTC(year, month, day, hour, min, sec) - KOLKATA_OFFSET_MS;
  return new Date(utcMillis);
}

/**
 * Formats a Date in Asia/Kolkata as ISO string with offset:
 * e.g. "2026-10-14T07:42:00+05:30"
 */
export function formatKolkataIso(date: Date): string {
  const kolkataDate = new Date(date.getTime() + KOLKATA_OFFSET_MS);
  const YYYY = kolkataDate.getUTCFullYear();
  const MM = String(kolkataDate.getUTCMonth() + 1).padStart(2, "0");
  const DD = String(kolkataDate.getUTCDate()).padStart(2, "0");
  const HH = String(kolkataDate.getUTCHours()).padStart(2, "0");
  const mm = String(kolkataDate.getUTCMinutes()).padStart(2, "0");
  const ss = String(kolkataDate.getUTCSeconds()).padStart(2, "0");

  return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}+05:30`;
}

/**
 * Formats time in Asia/Kolkata.
 * Default 12-hour (am/pm) for student app: "7:42 am", "12:05 pm".
 * 24-hour for admin tables: "07:42", "12:05".
 */
export function formatKolkataTime(date: Date, is24Hour = false): string {
  const kolkataDate = new Date(date.getTime() + KOLKATA_OFFSET_MS);
  const hours = kolkataDate.getUTCHours();
  const minutes = kolkataDate.getUTCMinutes();
  const mm = String(minutes).padStart(2, "0");

  if (is24Hour) {
    return `${String(hours).padStart(2, "0")}:${mm}`;
  }

  const ampm = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${mm} ${ampm}`;
}

export type ExpandTripsInput = {
  serviceDate: string; // "YYYY-MM-DD"
  trips: TripLike[];
  routeStops: RouteStopLike[];
  instances?: TripInstanceLike[];
};

/**
 * Expands scheduled trips into concrete stop calls for a specific service date,
 * merging overrides (delay, cancellation) from trip_instances.
 */
export function expandTrips(input: ExpandTripsInput): StopCall[] {
  const { serviceDate, trips, routeStops, instances = [] } = input;
  const targetDow = getDowBit(serviceDate);

  // Group route stops by `${route_id}:${direction}` sorted by seq
  const stopMap = new Map<string, RouteStopLike[]>();
  for (const rs of routeStops) {
    const key = `${rs.route_id}:${rs.direction}`;
    const list = stopMap.get(key) || [];
    list.push(rs);
    stopMap.set(key, list);
  }
  for (const list of stopMap.values()) {
    list.sort((a, b) => a.seq - b.seq);
  }

  // Index instances by trip_id
  const instanceMap = new Map<string, TripInstanceLike>();
  for (const inst of instances) {
    if (inst.service_date === serviceDate) {
      instanceMap.set(inst.trip_id, inst);
    }
  }

  const calls: StopCall[] = [];

  for (const trip of trips) {
    // 1. Check if active
    if (trip.is_active === false) continue;

    // 2. Check weekday bitmask
    if ((trip.days & targetDow) === 0) continue;

    // 3. Check validity range
    if (trip.valid_from && serviceDate < trip.valid_from) continue;
    if (trip.valid_to && serviceDate > trip.valid_to) continue;

    const routeStopList = stopMap.get(`${trip.route_id}:${trip.direction}`) || [];
    if (routeStopList.length === 0) continue;

    const instance = instanceMap.get(trip.id);
    const status = instance?.status || "scheduled";
    const delayMin = instance?.delay_min || 0;

    const baseDepartTime = parseKolkataDateTime(serviceDate, trip.depart_time);

    for (const rs of routeStopList) {
      const scheduledAt = new Date(baseDepartTime.getTime() + rs.offset_min * 60 * 1000);
      const expectedAt = new Date(scheduledAt.getTime() + delayMin * 60 * 1000);

      calls.push({
        tripId: trip.id,
        instanceId: instance?.id,
        routeId: trip.route_id,
        direction: trip.direction,
        stopId: rs.stop_id,
        seq: rs.seq,
        scheduledAt,
        expectedAt,
        status,
        delayMin,
      });
    }
  }

  return calls;
}
