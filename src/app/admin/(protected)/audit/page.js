import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import AuditTable from "@/components/admin/audit-table";

export default async function AuditPage() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (session.role !== "admin") {
    redirect("/admin");
  }

  const logs = await db
    .select({
      id: auditLogs.id,
      actionType: auditLogs.actionType,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorUsername: users.username,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorUserId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>
      <AuditTable logs={logs} initialPage={1} />
    </div>
  );
}
