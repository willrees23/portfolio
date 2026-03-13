import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/admin-nav";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminProtectedLayout({ children }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (!session.userId) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminNav username={session.username} role={session.role} />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
