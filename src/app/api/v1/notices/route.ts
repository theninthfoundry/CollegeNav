import { NextRequest, NextResponse } from "next/server";
import { getActiveNotices } from "@/server/repositories/notices.repository";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const route = searchParams.get("route") || undefined;
    const stop = searchParams.get("stop") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const items = await getActiveNotices({
      route,
      stop,
      limit,
    });

    return NextResponse.json({ items });
  } catch (error) {
    return handleApiError(error);
  }
}
