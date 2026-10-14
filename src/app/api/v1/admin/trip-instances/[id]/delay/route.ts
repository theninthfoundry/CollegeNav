import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminRepository } from "@/server/repositories/admin.repository";

const delaySchema = z.object({
  delay_min: z.number().int().min(1).max(180),
  reason: z.string().min(1, "Reason is required"),
  notify: z.boolean().default(true),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = delaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "validation_failed", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const result = await adminRepository.delayTrip(
      id,
      parsed.data.delay_min,
      parsed.data.reason,
      parsed.data.notify
    );
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "internal", message: err.message } },
      { status: 500 }
    );
  }
}
