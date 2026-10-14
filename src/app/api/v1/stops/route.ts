import { NextRequest, NextResponse } from "next/server";
import { searchStops } from "@/server/repositories/stops.repository";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const nearParam = searchParams.get("near");
    const radiusParam = searchParams.get("radius");
    const limitParam = searchParams.get("limit");

    let near: { lat: number; lng: number } | undefined;
    if (nearParam) {
      const [latStr, lngStr] = nearParam.split(",");
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        near = { lat, lng };
      }
    }

    const radiusM = radiusParam ? parseInt(radiusParam, 10) : undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const items = await searchStops({
      query: q,
      near,
      radiusM,
      limit,
    });

    return NextResponse.json({ items });
  } catch (error) {
    return handleApiError(error);
  }
}
