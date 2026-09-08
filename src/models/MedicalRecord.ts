import { Schema, model, models } from "mongoose";

const MedicalRecordSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  clinicianUid: { type: String, required: true },
  diagnosis: { type: String, required: true },
  visitDate: { type: Date, default: Date.now },
  symptoms: [String],
  allergies: [String],
  existingConditions: [String],
  medicalHistory: String,
  familyHistory: String,
  surgeries: [String],
  procedures: [String],
  treatmentPlan: String,
  dischargeSummary: String,
  notes: String,
  nursingNotes: [{ authorUid: String, note: String, createdAt: { type: Date, default: Date.now } }],
  prescriptions: [{ medicine: String, dosage: String, duration: String }],
  attachments: [{ name: String, url: String, uploadedAt: { type: Date, default: Date.now } }],
  status: { type: String, enum: ["draft", "finalized"], default: "draft" },
  finalizedAt: Date,
  finalizedBy: String,
}, { timestamps: true });

export const MedicalRecord = models.MedicalRecord || model("MedicalRecord", MedicalRecordSchema);
