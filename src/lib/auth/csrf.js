import crypto from "crypto";
import { cookies } from "next/headers";

export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";

export const CSRF_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24,
};

export function createCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function generateCsrfToken() {
  const token = createCsrfToken();
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, CSRF_COOKIE_OPTIONS);
  return token;
}

export function validateCsrfToken(request) {
  const headerToken = request.headers.get(CSRF_HEADER);
  const cookieToken = request.cookies?.get(CSRF_COOKIE)?.value;

  if (!headerToken || !cookieToken) {
    return false;
  }

  if (headerToken.length !== cookieToken.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(headerToken),
      Buffer.from(cookieToken)
    );
  } catch {
    return false;
  }
}
