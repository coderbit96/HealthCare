import { Schema, model, models } from "mongoose";
const AuditLogSchema = new Schema({ actorUid: { type: String, required: true, index: true }, action: { type: String, required: true }, entityType: { type: String, required: true }, entityId: { type: String, required: true }, before: Schema.Types.Mixed, after: Schema.Types.Mixed }, { timestamps: true });
export const AuditLog = models.AuditLog || model("AuditLog", AuditLogSchema);
