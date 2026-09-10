import { Schema, model, models } from "mongoose";
const AuditLogSchema = new Schema({ actorUid: { type: String, required: true, index: true }, action: { type: String, required: true, index: true }, entityType: { type: String, required: true, index: true }, entityId: { type: String, required: true, index: true }, ipAddress: String, userAgent: String, before: Schema.Types.Mixed, after: Schema.Types.Mixed }, { timestamps: true });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.pre(["findOneAndUpdate", "updateOne", "updateMany", "findOneAndDelete", "deleteOne", "deleteMany"], function immutableAuditLog() { throw new Error("Audit logs are immutable"); });
const existingAuditLog = models.AuditLog;
if (existingAuditLog) { if (!existingAuditLog.schema.path("ipAddress")) existingAuditLog.schema.add({ ipAddress: String }); if (!existingAuditLog.schema.path("userAgent")) existingAuditLog.schema.add({ userAgent: String }); }
export const AuditLog = existingAuditLog || model("AuditLog", AuditLogSchema);
