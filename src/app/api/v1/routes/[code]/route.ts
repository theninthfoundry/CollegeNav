import { NextRequest, NextResponse } from "next/server";
import { getRouteByCode, getAllRouteStops } from "@/server/repositories/routes.repository";
import { getAllStops } from "@/server/repositories/stops.repository";
import { getActiveNotices } from "@/server/repositories/notices.repository";
import { computeFreshness } from "@/domain/freshness";
import { ApiError, handleApiError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const route = await getRouteByCode(code);

    if (!route) {
      throw new ApiError("not_found", `Route ${code} not found`, 404);
    }

    const freshness = computeFreshness(route);
    const allStops = await getAllStops();
    const stopMap = new Map(allStops.map((s) => [s.id, s]));
    const routeStops = await getAllRouteStops();

    const toCampusStops = routeStops
      .filter((rs) => rs.route_id === route.id && rs.direction === "to_campus")
      .sort((a, b) => a.seq - b.seq)
      .map((rs) => ({
        seq: rs.seq,
        stop: stopMap.get(rs.stop_id),
        offset_min: rs.offset_min,
        dwell_s: rs.dwell_s,
      }));

    const fromCampusStops = routeStops
      .filter((rs) => rs.route_id === route.id && rs.direction === "from_campus")
      .sort((a, b) => a.seq - b.seq)
      .map((rs) => ({
        seq: rs.seq,
        stop: stopMap.get(rs.stop_id),
        offset_min: rs.offset_min,
        dwell_s: rs.dwell_s,
      }));

    const notices = await getActiveNotices({ route: route.code });

    return NextResponse.json({
      route: {
        id: route.id,
        code: route.code,
        name: route.name,
        color_index: route.color_index,
      },
      status: route.status,
      status_reason: route.status_reason,
      freshness,
      valid_from: route.valid_from,
      valid_to: route.valid_to,
      directions: [
        {
          direction: "to_campus",
          stops: toCampusStops,
        },
        {
          direction: "from_campus",
          stops: fromCampusStops,
        },
      ],
      notices,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
