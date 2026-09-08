import { Schema, model, models } from "mongoose";
const LeaveRequestSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: "User", required: true }, from: Date, to: Date, reason: String, status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }, decidedBy: String, decisionNote: String }, { timestamps: true });
LeaveRequestSchema.index({ user: 1, status: 1 });
export const LeaveRequest = models.LeaveRequest || model("LeaveRequest", LeaveRequestSchema);
