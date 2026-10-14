import { NextResponse } from "next/server";
import { adminRepository } from "@/server/repositories/admin.repository";

export async function GET() {
  try {
    const data = await adminRepository.getDashboard();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "internal", message: err.message } },
      { status: 500 }
    );
  }
}
