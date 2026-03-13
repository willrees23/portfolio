import { getSession } from "./session.js";
import { redirect } from "next/navigation";

export async function requireAuth(cookies) {
  const session = await getSession(cookies);
  if (!session.userId) {
    redirect("/admin/login");
  }
  return session;
}

export async function requireAdmin(cookies) {
  const session = await requireAuth(cookies);
  if (session.role !== "admin") {
    redirect("/admin");
  }
  return session;
}
