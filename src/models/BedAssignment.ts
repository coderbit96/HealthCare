import { Schema, model, models } from "mongoose";
const BedAssignmentSchema = new Schema({ bed: { type: Schema.Types.ObjectId, ref: "Bed", required: true }, patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true }, assignedBy: { type: String, required: true }, assignedAt: { type: Date, default: Date.now }, releasedAt: Date, releaseReason: String, active: { type: Boolean, default: true } }, { timestamps: true });
BedAssignmentSchema.index({ bed: 1, active: 1 }, { unique: true, partialFilterExpression: { active: true } });
BedAssignmentSchema.index({ patient: 1, active: 1 }, { unique: true, partialFilterExpression: { active: true } });
export const BedAssignment = models.BedAssignment || model("BedAssignment", BedAssignmentSchema);
