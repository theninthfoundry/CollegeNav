import { describe, it, expect } from "vitest";
import {
  getDowBit,
  parseKolkataDateTime,
  formatKolkataTime,
  formatKolkataIso,
  expandTrips,
} from "../../src/domain/time";
import { RouteStopLike, TripInstanceLike, TripLike } from "../../src/domain/types";

describe("domain/time", () => {
  it("computes ISO day-of-week bitmask correctly", () => {
    // 2026-10-12 is Monday (bit 1)
    expect(getDowBit("2026-10-12")).toBe(1);
    // 2026-10-13 is Tuesday (bit 2)
    expect(getDowBit("2026-10-13")).toBe(2);
    // 2026-10-14 is Wednesday (bit 4)
    expect(getDowBit("2026-10-14")).toBe(4);
    // 2026-10-17 is Saturday (bit 32)
    expect(getDowBit("2026-10-17")).toBe(32);
    // 2026-10-18 is Sunday (bit 64)
    expect(getDowBit("2026-10-18")).toBe(64);
  });

  it("parses and formats Kolkata clock times accurately", () => {
    const dt = parseKolkataDateTime("2026-10-14", "07:42");
    expect(formatKolkataTime(dt)).toBe("7:42 am");
    expect(formatKolkataTime(dt, true)).toBe("07:42");

    const noon = parseKolkataDateTime("2026-10-14", "12:05");
    expect(formatKolkataTime(noon)).toBe("12:05 pm");

    const iso = formatKolkataIso(dt);
    expect(iso).toBe("2026-10-14T07:42:00+05:30");
  });

  it("expands trips with offset calculation and instance delay overrides", () => {
    const serviceDate = "2026-10-14"; // Wednesday, bitmask 4

    const trips: TripLike[] = [
      {
        id: "trip-1",
        route_id: "r1",
        direction: "to_campus",
        depart_time: "07:30",
        days: 63, // Mon to Sat
      },
      {
        id: "trip-sunday",
        route_id: "r1",
        direction: "to_campus",
        depart_time: "09:00",
        days: 64, // Sun only -> should be skipped on Wed
      },
    ];

    const routeStops: RouteStopLike[] = [
      { route_id: "r1", direction: "to_campus", seq: 1, stop_id: "s1", offset_min: 0 },
      { route_id: "r1", direction: "to_campus", seq: 2, stop_id: "s2", offset_min: 12 },
    ];

    const instances: TripInstanceLike[] = [
      {
        id: "inst-1",
        trip_id: "trip-1",
        service_date: "2026-10-14",
        status: "scheduled",
        delay_min: 8,
      },
    ];

    const calls = expandTrips({ serviceDate, trips, routeStops, instances });

    expect(calls).toHaveLength(2); // Only trip-1 calls
    expect(calls[0].stopId).toBe("s1");
    expect(formatKolkataTime(calls[0].scheduledAt)).toBe("7:30 am");
    expect(formatKolkataTime(calls[0].expectedAt)).toBe("7:38 am"); // 7:30 + 8 min delay
    expect(calls[0].status).toBe("scheduled");
    expect(calls[0].delayMin).toBe(8);

    expect(calls[1].stopId).toBe("s2");
    expect(formatKolkataTime(calls[1].scheduledAt)).toBe("7:42 am"); // 7:30 + 12 min
    expect(formatKolkataTime(calls[1].expectedAt)).toBe("7:50 am"); // 7:42 + 8 min
  });

  it("marks cancelled trips appropriately in expanded stop calls", () => {
    const serviceDate = "2026-10-14";
    const trips: TripLike[] = [
      {
        id: "trip-cancelled",
        route_id: "r1",
        direction: "to_campus",
        depart_time: "08:00",
        days: 63,
      },
    ];
    const routeStops: RouteStopLike[] = [
      { route_id: "r1", direction: "to_campus", seq: 1, stop_id: "s1", offset_min: 0 },
    ];
    const instances: TripInstanceLike[] = [
      {
        id: "inst-c",
        trip_id: "trip-cancelled",
        service_date: "2026-10-14",
        status: "cancelled",
        reason: "Driver unavailable",
      },
    ];

    const calls = expandTrips({ serviceDate, trips, routeStops, instances });
    expect(calls).toHaveLength(1);
    expect(calls[0].status).toBe("cancelled");
  });
});
