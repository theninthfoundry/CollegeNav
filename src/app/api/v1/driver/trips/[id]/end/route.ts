import { NextRequest, NextResponse } from "next/server";
import { globalLiveTrips } from "@/server/live-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  globalLiveTrips.delete(id);

  return NextResponse.json({
    success: true,
    trip_instance_id: id,
    status: "completed",
    ended_at: new Date().toISOString(),
  });
}
