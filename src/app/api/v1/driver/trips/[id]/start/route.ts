import { NextRequest, NextResponse } from "next/server";
import { globalLiveTrips } from "@/app/api/v1/live/trips/route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Initialize or update live trip
  const existing = globalLiveTrips.get(id);
  if (existing) {
    existing.tracking = "live";
  } else {
    globalLiveTrips.set(id, {
      trip_instance_id: id,
      route: { id: "20000000-0000-0000-0000-000000000001", code: "R1", name: "Miyapur to Campus", color_index: 1 },
      direction: "to_campus",
      bus: { reg_no: "TS09 UB 1234" },
      position: { lat: 17.4948, lng: 78.3996, heading: 0, speed_kmh: 0, recorded_at: new Date().toISOString() },
      age_s: 0,
      tracking: "live",
      progress_m: 0,
      delay_min: 0,
    });
  }

  return NextResponse.json({
    success: true,
    trip_instance_id: id,
    status: "running",
    started_at: new Date().toISOString(),
  });
}
