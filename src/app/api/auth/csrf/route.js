import { NextResponse } from "next/server";
import { createCsrfToken, CSRF_COOKIE, CSRF_COOKIE_OPTIONS } from "@/lib/auth/csrf";

export async function GET() {
  const token = createCsrfToken();
  const response = NextResponse.json({ token });
  response.cookies.set(CSRF_COOKIE, token, CSRF_COOKIE_OPTIONS);
  return response;
}
