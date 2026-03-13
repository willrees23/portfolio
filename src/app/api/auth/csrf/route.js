import { NextResponse } from "next/server";
import { createCsrfToken, CSRF_COOKIE } from "@/lib/auth/csrf";

export async function GET(request) {
  const token = createCsrfToken();
  const isSecure = request.nextUrl.protocol === "https:";
  const response = NextResponse.json({ token });
  response.headers.append(
    "Set-Cookie",
    `${CSRF_COOKIE}=${token}; Path=/; Max-Age=86400; SameSite=Lax${isSecure ? "; Secure" : ""}`
  );
  return response;
}
