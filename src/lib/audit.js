import { db } from "./db/index.js";
import { auditLogs } from "./db/schema.js";

export async function logAudit({ actorUserId, actionType, targetType, targetId, metadata }) {
  await db.insert(auditLogs).values({
    actorUserId,
    actionType,
    targetType,
    targetId: targetId?.toString(),
    metadata: metadata || null,
  });
}
