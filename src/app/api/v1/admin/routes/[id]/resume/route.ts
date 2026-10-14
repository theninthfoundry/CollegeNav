import { NextRequest, NextResponse } from "next/server";
import { adminRepository } from "@/server/repositories/admin.repository";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await adminRepository.resumeRoute(id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "internal", message: err.message } },
      { status: 500 }
    );
  }
}
