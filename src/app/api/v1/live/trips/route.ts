import { NextRequest, NextResponse } from "next/server";
import { globalLiveTrips } from "@/server/live-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const routeParam = searchParams.get("route");

  const items = Array.from(globalLiveTrips.values()).filter((item) => {
    if (routeParam && item.route.code !== routeParam) return false;
    return true;
  });

  return NextResponse.json({ items });
}
