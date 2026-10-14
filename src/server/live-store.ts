export interface LiveTripItem {
  trip_instance_id: string;
  route: { id: string; code: string; name: string; color_index: number };
  direction: "to_campus" | "from_campus";
  bus: { reg_no: string };
  driver?: { name: string };
  position: {
    lat: number;
    lng: number;
    heading?: number;
    speed_kmh?: number;
    recorded_at: string;
  };
  age_s: number;
  tracking: "live" | "stale" | "lost" | "not_tracked";
  progress_m: number;
  delay_min: number;
}

// Global active store in memory (shared with simulator & driver endpoints)
export const globalLiveTrips: Map<string, LiveTripItem> = new Map([
  [
    "inst-r1-live",
    {
      trip_instance_id: "inst-r1-live",
      route: { id: "20000000-0000-0000-0000-000000000001", code: "R1", name: "Miyapur to Campus", color_index: 1 },
      direction: "to_campus",
      bus: { reg_no: "TS09 UB 1234" },
      driver: { name: "Ravi Kumar" },
      position: {
        lat: 17.4948,
        lng: 78.3996,
        heading: 75,
        speed_kmh: 28,
        recorded_at: new Date().toISOString(),
      },
      age_s: 5,
      tracking: "live",
      progress_m: 4200,
      delay_min: 0,
    },
  ],
]);
