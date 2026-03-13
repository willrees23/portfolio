import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import { createCsrfToken } from "@/lib/auth/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function POST(request) {
  const limit = rateLimit("login", request);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await logAudit({
      actorUserId: null,
      actionType: "login_failed",
      targetType: "user",
      targetId: username,
      metadata: { ip: request.headers.get("x-forwarded-for") || "unknown" },
    });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  session.userId = user.id;
  session.username = user.username;
  session.role = user.role;
  session.csrfToken = createCsrfToken();
  await session.save();

  await logAudit({
    actorUserId: user.id,
    actionType: "login_success",
    targetType: "user",
    targetId: user.id,
  });

  return NextResponse.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
}
