import { Schema, model, models } from "mongoose";

const VisitSchema = new Schema({
  visitNumber: { type: String, required: true, unique: true, index: true },
  patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  appointment: { type: Schema.Types.ObjectId, ref: "Appointment", unique: true, sparse: true },
  doctorUid: String,
  type: { type: String, enum: ["opd", "ipd", "emergency", "follow_up"], required: true },
  status: { type: String, enum: ["open", "completed", "cancelled"], default: "open" },
  token: Number,
  room: String,
  checkedInAt: Date,
  completedAt: Date,
}, { timestamps: true });
VisitSchema.index({ patient: 1, createdAt: -1 });

const existingVisit = models.Visit;
if (existingVisit) {
  if (!existingVisit.schema.path("visitNumber")) existingVisit.schema.add({ visitNumber: String });
  if (!existingVisit.schema.path("token")) existingVisit.schema.add({ token: Number });
  if (!existingVisit.schema.path("room")) existingVisit.schema.add({ room: String });
  if (!existingVisit.schema.path("checkedInAt")) existingVisit.schema.add({ checkedInAt: Date });
  if (!existingVisit.schema.path("completedAt")) existingVisit.schema.add({ completedAt: Date });
}

export const Visit = existingVisit || model("Visit", VisitSchema);
