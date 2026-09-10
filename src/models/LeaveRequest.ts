import { Schema, model, models } from "mongoose";

const LeaveRequestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    leaveType: { type: String, required: true, trim: true, default: "Annual leave" },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    totalDays: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true, trim: true, maxlength: 2_000 },
    attachment: { type: String, maxlength: 14_000_000 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    decidedBy: String,
    reviewerName: String,
    reviewedAt: Date,
    decisionNote: { type: String, maxlength: 2_000 },
  },
  { timestamps: true },
);

LeaveRequestSchema.index({ user: 1, status: 1 });

const existingLeaveRequest = models.LeaveRequest;
if (existingLeaveRequest) {
  if (!existingLeaveRequest.schema.path("leaveType")) existingLeaveRequest.schema.add({ leaveType: { type: String, default: "Annual leave" } });
  if (!existingLeaveRequest.schema.path("totalDays")) existingLeaveRequest.schema.add({ totalDays: { type: Number, min: 1 } });
  if (!existingLeaveRequest.schema.path("attachment")) existingLeaveRequest.schema.add({ attachment: { type: String, maxlength: 14_000_000 } });
  if (!existingLeaveRequest.schema.path("reviewerName")) existingLeaveRequest.schema.add({ reviewerName: String });
  if (!existingLeaveRequest.schema.path("reviewedAt")) existingLeaveRequest.schema.add({ reviewedAt: Date });
}

export const LeaveRequest = existingLeaveRequest || model("LeaveRequest", LeaveRequestSchema);
