import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";

export async function middleware(request) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  const { pathname } = request.nextUrl;

  // Protect admin routes (except login page)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = await getIronSession(request.cookies, {
      password: process.env.SESSION_SECRET,
      cookieName: "portfolio_session",
    });

    if (!session.userId) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
