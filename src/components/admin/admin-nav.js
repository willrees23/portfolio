"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminNav({ username, role }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      window.location.href = "/admin/login";
    }
  }

  const links = [
    { href: "/admin/images", label: "Images" },
    { href: "/admin/video-cropper", label: "Video Cropper" },
    ...(role === "admin" ? [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/audit", label: "Audit Log" },
    ] : []),
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold">Admin Panel</h2>
        <p className="text-sm text-gray-500 mt-1">{username} ({role})</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-4 py-2 rounded text-sm font-medium transition-colors ${
              pathname === link.href
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
