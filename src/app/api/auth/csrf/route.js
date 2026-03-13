import { generateCsrfToken } from "@/lib/auth/csrf";
import { NextResponse } from "next/server";

export async function GET() {
  const token = await generateCsrfToken();
  return NextResponse.json({ token });
}
