import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { globalLiveTrips } from "@/app/api/v1/live/trips/route";
import { adminRepository } from "@/server/repositories/admin.repository";

const eventSchema = z.object({
  type: z.enum(["late", "breakdown"]),
  delay_min: z.number().optional(),
  note: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "validation_failed", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { type, delay_min = 10, note } = parsed.data;
    const trip = globalLiveTrips.get(id);

    if (type === "late") {
      if (trip) trip.delay_min = delay_min;
      await adminRepository.delayTrip(id, delay_min, note || "Driver reported traffic delay", true);
    } else if (type === "breakdown") {
      if (trip) trip.tracking = "lost";
      await adminRepository.cancelTrip(id, note || "Vehicle breakdown reported by driver", true);
    }

    return NextResponse.json({
      success: true,
      event_type: type,
      recorded_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "internal", message: err.message } },
      { status: 500 }
    );
  }
}
