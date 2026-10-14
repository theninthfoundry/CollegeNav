import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminRepository } from "@/server/repositories/admin.repository";

const suspendSchema = z.object({
  reason: z.string().min(1, "Suspension reason is required"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = suspendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "validation_failed", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const result = await adminRepository.suspendRoute(id, parsed.data.reason);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "internal", message: err.message } },
      { status: 500 }
    );
  }
}
