import { Schema, model, models } from "mongoose";
const SurgerySchema = new Schema({ theatre: { type: Schema.Types.ObjectId, ref: "OperationTheatre", required: true }, patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true }, surgeonUid: { type: String, required: true }, assistants: [String], anesthetist: String, procedure: { type: String, required: true }, startAt: { type: Date, required: true }, endAt: { type: Date, required: true }, preOpChecklist: [{ item: String, complete: Boolean }], operationNotes: String, postOpNotes: String, status: { type: String, enum: ["scheduled", "preparing", "in_progress", "completed", "cancelled"], default: "scheduled" } }, { timestamps: true });
const existingSurgery = models.Surgery;
if (existingSurgery) { const status = existingSurgery.schema.path("status") as { enumValues?: string[] }; if (status.enumValues && !status.enumValues.includes("preparing")) status.enumValues.push("preparing"); }
SurgerySchema.index({ theatre: 1, startAt: 1 }, { unique: true, partialFilterExpression: { status: { $ne: "cancelled" } } });
export const Surgery = existingSurgery || model("Surgery", SurgerySchema);
