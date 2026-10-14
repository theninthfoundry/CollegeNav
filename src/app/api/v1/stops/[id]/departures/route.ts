import { NextRequest, NextResponse } from "next/server";
import { getStopById } from "@/server/repositories/stops.repository";
import { getDeparturesForStop } from "@/server/repositories/trips.repository";
import { ApiError, handleApiError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stop = await getStopById(id);

    if (!stop) {
      throw new ApiError("not_found", `Stop ${id} not found`, 404);
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const departures = await getDeparturesForStop(stop.id, date, limit);

    return NextResponse.json({
      stop_id: stop.id,
      stop_name: stop.name,
      generated_at: new Date().toISOString(),
      items: departures,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
