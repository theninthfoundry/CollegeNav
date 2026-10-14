import { NextRequest, NextResponse } from "next/server";
import { getRouteByCode, getAllRouteStops } from "@/server/repositories/routes.repository";
import { getAllTrips, getTripInstances } from "@/server/repositories/trips.repository";
import { computeFreshness } from "@/domain/freshness";
import { expandTrips, formatKolkataTime } from "@/domain/time";
import { Direction } from "@/domain/types";
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

    const { searchParams } = new URL(request.url);
    const direction = (searchParams.get("direction") || "to_campus") as Direction;
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const allTrips = await getAllTrips();
    const routeTrips = allTrips.filter(
      (t) => t.route_id === route.id && t.direction === direction
    );

    const routeStops = await getAllRouteStops();
    const instances = await getTripInstances(date);
    const freshness = computeFreshness(route);

    const expanded = expandTrips({
      serviceDate: date,
      trips: routeTrips,
      routeStops,
      instances,
    });

    // Group by trip
    const tripsGrouped = routeTrips.map((t) => {
      const calls = expanded.filter((c) => c.tripId === t.id);
      const instance = instances.find((i) => i.trip_id === t.id);
      return {
        trip_id: t.id,
        trip_instance_id: instance?.id || null,
        depart: t.depart_time,
        status: instance?.status || "scheduled",
        delay_min: instance?.delay_min || 0,
        stops: calls.map((c) => ({
          stop_id: c.stopId,
          time: formatKolkataTime(c.scheduledAt),
          expected_time: formatKolkataTime(c.expectedAt),
        })),
        freshness,
      };
    });

    return NextResponse.json({
      date,
      direction,
      days_label: "Mon to Sat",
      trips: tripsGrouped,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
