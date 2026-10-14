import { NextResponse } from "next/server";
import { getAllPublicSettings } from "@/server/repositories/settings.repository";

export async function GET() {
  const config = await getAllPublicSettings();
  return NextResponse.json(config);
}
