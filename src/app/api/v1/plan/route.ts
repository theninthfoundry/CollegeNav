import { NextRequest, NextResponse } from "next/server";
import { executePlan } from "@/server/services/plan.service";
import { PlannerMode } from "@/domain/types";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to") || undefined;
    const mode = (searchParams.get("mode") || "now") as PlannerMode;
    const atParam = searchParams.get("at") || undefined;
    const walkMax = searchParams.get("walk_max");
    const limitParam = searchParams.get("limit");

    const walkMaxMeters = walkMax ? parseInt(walkMax, 10) : 800;
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    const result = await executePlan({
      fromParam: fromParam || "",
      toParam,
      mode,
      atParam,
      walkMaxMeters,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
