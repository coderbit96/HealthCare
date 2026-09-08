import { AuditLog } from "@/models/AuditLog";
export async function audit(actorUid: string, action: string, entityType: string, entityId: string, metadata?: Record<string, unknown>) { return AuditLog.create({ actorUid, action, entityType, entityId, after: metadata }); }
