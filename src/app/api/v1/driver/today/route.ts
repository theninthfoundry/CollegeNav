import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    trips: [
      {
        instance_id: "inst-r1-live",
        trip_id: "trip-r1-morning",
        route_code: "R1",
        route_name: "Miyapur to Campus",
        direction: "to_campus",
        scheduled_depart: "07:00 am",
        scheduled_arrive: "08:15 am",
        status: "running",
        stops_count: 5,
        first_stop: "Miyapur",
        last_stop: "Main campus",
      },
      {
        instance_id: "inst-r1-noon",
        trip_id: "trip-r1-afternoon",
        route_code: "R1",
        route_name: "Campus to Miyapur",
        direction: "from_campus",
        scheduled_depart: "04:30 pm",
        scheduled_arrive: "05:45 pm",
        status: "scheduled",
        stops_count: 5,
        first_stop: "Main campus",
        last_stop: "Miyapur",
      },
    ],
  });
}
