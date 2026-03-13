import crypto from "crypto";
import { cookies } from "next/headers";
import { getSession } from "./session.js";

export const CSRF_HEADER = "x-csrf-token";

export async function generateCsrfToken() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  const token = crypto.randomBytes(32).toString("hex");
  session.csrfToken = token;
  await session.save();
  return token;
}

export async function getCsrfToken() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (!session.csrfToken) {
    return generateCsrfToken();
  }
  return session.csrfToken;
}

export async function validateCsrfToken(request) {
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!headerToken) return false;

  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  const sessionToken = session.csrfToken;

  if (!sessionToken) return false;
  if (headerToken.length !== sessionToken.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(headerToken),
      Buffer.from(sessionToken)
    );
  } catch {
    return false;
  }
}
