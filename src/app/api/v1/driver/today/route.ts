import { NextRequest, NextResponse } from "next/server";
import { RAW_CAMPUS_BUS_ROUTES } from "@/server/bus-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const routeCode = searchParams.get("route_code") || "R1";

  const routeData =
    RAW_CAMPUS_BUS_ROUTES.find(
      (r) => r.code.toLowerCase() === routeCode.toLowerCase()
    ) || RAW_CAMPUS_BUS_ROUTES[0];

  const origin = routeData.stops[0] || "Origin";
  const destination = "College Campus";

  return NextResponse.json({
    trips: [
      {
        instance_id: `inst-${routeData.code.toLowerCase()}-morning`,
        trip_id: `trip-${routeData.code.toLowerCase()}-morning`,
        route_code: routeData.code,
        route_name: `${origin} to Campus`,
        direction: "to_campus",
        scheduled_depart: `${routeData.depart_time} AM`,
        scheduled_arrive: "08:25 AM",
        status: "running",
        stops_count: routeData.stops.length,
        first_stop: origin,
        last_stop: destination,
        stops: routeData.stops,
      },
      {
        instance_id: `inst-${routeData.code.toLowerCase()}-return`,
        trip_id: `trip-${routeData.code.toLowerCase()}-return`,
        route_code: routeData.code,
        route_name: `Campus to ${origin}`,
        direction: "from_campus",
        scheduled_depart: "04:30 PM",
        scheduled_arrive: "05:55 PM",
        status: "scheduled",
        stops_count: routeData.stops.length,
        first_stop: destination,
        last_stop: origin,
        stops: [...routeData.stops].reverse(),
      },
    ],
  });
}
