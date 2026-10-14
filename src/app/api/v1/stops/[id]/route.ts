import { NextRequest, NextResponse } from "next/server";
import { getStopById } from "@/server/repositories/stops.repository";
import { getAllRoutes, getAllRouteStops } from "@/server/repositories/routes.repository";
import { getActiveNotices } from "@/server/repositories/notices.repository";
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

    const routeStops = await getAllRouteStops();
    const servingRouteIds = new Set(
      routeStops.filter((rs) => rs.stop_id === stop.id).map((rs) => rs.route_id)
    );

    const allRoutes = await getAllRoutes();
    const routes = allRoutes.filter((r) => servingRouteIds.has(r.id));
    const notices = await getActiveNotices({ stop: stop.id });

    return NextResponse.json({
      stop,
      routes,
      notices,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
