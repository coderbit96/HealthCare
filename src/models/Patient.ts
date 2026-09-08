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
}, { timestamps: true });

export const Patient = models.Patient || model("Patient", PatientSchema);
