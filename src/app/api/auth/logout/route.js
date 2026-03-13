import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { validateCsrfToken } from "@/lib/auth/csrf";

export async function POST(request) {
  const csrfValid = await validateCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  session.destroy();

  return NextResponse.json({ success: true });
}
