import { getCsrfToken } from "@/lib/auth/csrf";
import { NextResponse } from "next/server";

export async function GET() {
  const token = await getCsrfToken();
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ token });
}
