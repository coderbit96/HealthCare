import { Schema, model, models } from "mongoose";
const AmbulanceTripSchema = new Schema({ ambulance: { type: Schema.Types.ObjectId, ref: "Ambulance", required: true, index: true }, patient: { type: Schema.Types.ObjectId, ref: "Patient" }, pickup: String, destination: String, status: { type: String, enum: ["on_trip", "completed", "cancelled"], default: "on_trip" }, startedAt: Date, endedAt: Date, recordedBy: String }, { timestamps: true });
export const AmbulanceTrip = models.AmbulanceTrip || model("AmbulanceTrip", AmbulanceTripSchema);
