import { Schema, model, models } from "mongoose";

const StaffSchema = new Schema({
  firebaseUid: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  role: { type: String, enum: ["admin", "doctor", "nurse", "receptionist", "hr", "lab_technician", "pharmacist"], required: true },
  department: String,
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const Staff = models.Staff || model("Staff", StaffSchema);
