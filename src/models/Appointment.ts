import { Schema, model, models } from "mongoose";

const AppointmentSchema = new Schema({
  reference: { type: String, required: true, unique: true, index: true },
  patientName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  phone: { type: String, required: true, trim: true },
  department: { type: String, required: true },
  doctor: String,
  doctorUid: { type: String, index: true },
  patient: { type: Schema.Types.ObjectId, ref: "Patient" },
  startAt: Date,
  endAt: Date,
  token: Number,
  walkIn: { type: Boolean, default: false },
  preferredDate: { type: Date, required: true },
  message: { type: String, maxlength: 1000 },
  status: { type: String, enum: ["pending", "confirmed", "checked_in", "waiting", "in_consultation", "completed", "cancelled", "no_show"], default: "pending" },
}, { timestamps: true });
AppointmentSchema.index({ doctorUid: 1, startAt: 1 }, { unique: true, partialFilterExpression: { status: { $ne: "cancelled" }, doctorUid: { $exists: true }, startAt: { $exists: true } } });
AppointmentSchema.index({ patient: 1, startAt: 1 }, { unique: true, partialFilterExpression: { patient: { $exists: true }, startAt: { $exists: true }, status: { $ne: "cancelled" } } });

export const Appointment = models.Appointment || model("Appointment", AppointmentSchema);
