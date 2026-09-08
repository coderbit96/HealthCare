import { Schema, model, models } from "mongoose";
const VisitSchema = new Schema({ patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true }, appointment: { type: Schema.Types.ObjectId, ref: "Appointment" }, doctorUid: String, type: { type: String, enum: ["opd", "ipd", "emergency", "follow_up"], required: true }, status: { type: String, enum: ["open", "completed", "cancelled"], default: "open" } }, { timestamps: true });
VisitSchema.index({ patient: 1, createdAt: -1 });
export const Visit = models.Visit || model("Visit", VisitSchema);
