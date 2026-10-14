import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FLEET_DRIVERS, FLEET_ROUTES, RAW_CAMPUS_BUS_ROUTES } from "@/server/bus-data";

const sessionSchema = z.object({
  code: z.string().min(1).max(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = sessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "validation_failed", message: "Driver code or PIN is required" } },
        { status: 400 }
      );
    }

    const inputCode = parsed.data.code.trim();

    // Check if code matches a route number (e.g. "1" to "54", "R1" to "R54")
    let matchedDriver = FLEET_DRIVERS[0];
    const cleanRouteNo = inputCode.replace(/^r/i, "");
    const routeNum = parseInt(cleanRouteNo, 10);

    if (!isNaN(routeNum) && routeNum >= 1 && routeNum <= 54) {
      matchedDriver = FLEET_DRIVERS[routeNum - 1] || FLEET_DRIVERS[0];
    } else {
      // Check phone or pin match
      const byPhone = FLEET_DRIVERS.find(
        (d) => d.phone.endsWith(inputCode) || d.phone === inputCode
      );
      if (byPhone) {
        matchedDriver = byPhone;
      } else if (!["246810", "123456", "999999", "000000"].includes(inputCode)) {
        return NextResponse.json(
          {
            error: {
              code: "unauthenticated",
              message: "Invalid driver access code. Enter your 6-digit PIN (246810) or route number (1-54).",
            },
          },
          { status: 401 }
        );
      }
    }

    const routeInfo =
      RAW_CAMPUS_BUS_ROUTES.find((r) => r.code === matchedDriver.route_code) ||
      RAW_CAMPUS_BUS_ROUTES[0];

    return NextResponse.json({
      token: `drv_token_${Date.now()}`,
      driver: {
        id: matchedDriver.id,
        name: matchedDriver.name,
        phone: matchedDriver.phone,
        route_code: matchedDriver.route_code,
      },
      bus: {
        id: `bus-${matchedDriver.bus_reg.replace(/\s+/g, "").toLowerCase()}`,
        reg_no: matchedDriver.bus_reg,
        name: `Fleet Bus ${matchedDriver.route_code}`,
        default_route_code: matchedDriver.route_code,
        origin: routeInfo.stops[0],
        destination: "College Campus",
        depart_time: routeInfo.depart_time,
      },
      expires_in: 43200,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "internal", message: err.message } },
      { status: 500 }
    );
  }
}
