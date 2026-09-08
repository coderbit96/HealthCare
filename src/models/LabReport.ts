import { Schema, model, models } from "mongoose";
const LabReportSchema = new Schema({ order: { type: Schema.Types.ObjectId, ref: "LabOrder", required: true, unique: true }, patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true }, verifiedBy: String, publishedBy: String, publishedAt: Date, pdfUrl: String }, { timestamps: true });
export const LabReport = models.LabReport || model("LabReport", LabReportSchema);
