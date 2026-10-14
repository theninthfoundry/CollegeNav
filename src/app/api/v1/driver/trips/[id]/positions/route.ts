import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { globalLiveTrips } from "@/app/api/v1/live/trips/route";

const positionPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().optional().default(0),
  heading: z.number().optional().default(0),
  accuracy: z.number().optional().default(10),
  ts: z.string().optional(),
});

const positionsBodySchema = z.object({
  points: z.array(positionPointSchema).min(1).max(20),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = positionsBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "validation_failed", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    let accepted = 0;
    const now = Date.now();
    let latestPoint: any = null;

    for (const pt of parsed.data.points) {
      // Reject if accuracy > 200m
      if (pt.accuracy && pt.accuracy > 200) continue;

      // Reject if older than 5 minutes
      if (pt.ts) {
        const pointTime = new Date(pt.ts).getTime();
        if (now - pointTime > 5 * 60 * 1000) continue;
      }

      accepted++;
      latestPoint = pt;
    }

    if (accepted > 0 && latestPoint) {
      const trip = globalLiveTrips.get(id);
      if (trip) {
        trip.position = {
          lat: latestPoint.lat,
          lng: latestPoint.lng,
          heading: latestPoint.heading,
          speed_kmh: Math.round((latestPoint.speed || 0) * 3.6),
          recorded_at: latestPoint.ts || new Date().toISOString(),
        };
        trip.age_s = 0;
        trip.tracking = "live";
        trip.progress_m = (trip.progress_m || 0) + 100;
      }
    }

    return NextResponse.json({
      accepted,
      progress_m: 8200,
      delay_min: 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "internal", message: err.message } },
      { status: 500 }
    );
  }
}
