import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { validateCsrfToken } from "@/lib/auth/csrf";
import { logAudit } from "@/lib/audit";

export async function PATCH(request, { params }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (!session.userId || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const csrfValid = await validateCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  if (userId === session.userId) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const { role } = await request.json();
  const validRoles = ["admin", "user"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id, username: users.username, role: users.role });

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await logAudit({
    actorUserId: session.userId,
    actionType: "user_role_change",
    targetType: "user",
    targetId: userId,
    metadata: { newRole: role },
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(request, { params }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (!session.userId || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const csrfValid = await validateCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  // Prevent deleting yourself
  if (userId === session.userId) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  // Prevent deleting last admin
  const [targetUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (targetUser.role === "admin") {
    const adminCount = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
    if (adminCount.length <= 1) {
      return NextResponse.json({ error: "Cannot delete the last admin" }, { status: 400 });
    }
  }

  await db.delete(users).where(eq(users.id, userId));

  await logAudit({
    actorUserId: session.userId,
    actionType: "user_delete",
    targetType: "user",
    targetId: userId,
    metadata: { username: targetUser.username },
  });

  return NextResponse.json({ success: true });
}
