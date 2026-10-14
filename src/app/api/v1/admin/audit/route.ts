import { NextResponse } from "next/server";
import { adminRepository } from "@/server/repositories/admin.repository";

export async function GET() {
  try {
    const items = await adminRepository.getAuditLog(50);
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "internal", message: err.message } },
      { status: 500 }
    );
  }
}
