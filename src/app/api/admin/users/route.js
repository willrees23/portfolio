import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { validateCsrfToken } from "@/lib/auth/csrf";
import { hashPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (!session.userId || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users);

  return NextResponse.json({ users: allUsers });
}

export async function POST(request) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (!session.userId || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const csrfValid = validateCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const { username, email, password, role } = await request.json();

  if (!username || !email || !password) {
    return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 });
  }

  const validRoles = ["admin", "user"];
  const userRole = validRoles.includes(role) ? role : "user";

  const passwordHash = await hashPassword(password);

  try {
    const [created] = await db.insert(users).values({
      username,
      email,
      passwordHash,
      role: userRole,
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });

    await logAudit({
      actorUserId: session.userId,
      actionType: "user_create",
      targetType: "user",
      targetId: created.id,
      metadata: { username, role: userRole },
    });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err) {
    if (err.code === "23505") {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    throw err;
  }
}
