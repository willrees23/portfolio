import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { getCsrfToken } from "@/lib/auth/csrf";
import UserTable from "@/components/admin/user-table";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (session.role !== "admin") {
    redirect("/admin");
  }

  const csrfToken = await getCsrfToken();

  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <UserTable users={allUsers} csrfToken={csrfToken} currentUserId={session.userId} />
    </div>
  );
}
