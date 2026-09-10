import { Schema, model, models } from "mongoose";

const PatientSchema = new Schema({
  patientId: { type: String, required: true, unique: true, index: true },
  uhid: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, index: true, required: true, trim: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ["female", "male", "other", "prefer_not_to_say"] },
  address: String,
  emergencyContact: { name: String, phone: String, relation: String },
  active: { type: Boolean, default: true, index: true },
  allergies: [String],
  medicalHistory: { type: String, maxlength: 5000 },
  documents: [{ name: String, type: String, data: String, uploadedAt: { type: Date, default: Date.now } }],
}, { timestamps: true });

const existingPatient = models.Patient;
if (existingPatient) {
  const additions: Record<string, unknown> = {};
  if (!existingPatient.schema.path("active")) additions.active = { type: Boolean, default: true, index: true };
  if (!existingPatient.schema.path("allergies")) additions.allergies = [String];
  if (!existingPatient.schema.path("medicalHistory")) additions.medicalHistory = { type: String, maxlength: 5000 };
  if (!existingPatient.schema.path("documents")) additions.documents = [{ name: String, type: String, data: String, uploadedAt: { type: Date, default: Date.now } }];
  if (Object.keys(additions).length) existingPatient.schema.add(additions as never);
}

export const Patient = existingPatient || model("Patient", PatientSchema);
