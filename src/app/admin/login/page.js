import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/login-form";

export const metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (session.userId) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
        <LoginForm />
      </div>
    </div>
  );
}
