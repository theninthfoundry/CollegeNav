import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const sessionSchema = z.object({
  code: z.string().min(4).max(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = sessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "validation_failed", message: "Driver code is required" } },
        { status: 400 }
      );
    }

    // Accept seed driver code '246810' or any 6-digit pin for demo
    const validCodes = ["246810", "123456", "999999"];
    if (!validCodes.includes(parsed.data.code)) {
      return NextResponse.json(
        { error: { code: "unauthenticated", message: "Invalid driver access code" } },
        { status: 401 }
      );
    }

    return NextResponse.json({
      token: `drv_token_${Date.now()}`,
      driver: {
        id: "driver-suresh",
        name: "Suresh Reddy",
        phone: "+91 98765 43210",
      },
      bus: {
        id: "bus-ts09-1234",
        reg_no: "TS09 UB 1234",
        name: "Campus Cruiser 1",
        default_route_code: "R1",
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
