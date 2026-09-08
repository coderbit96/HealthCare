import { Schema, model, models } from "mongoose";
const AmbulanceSchema = new Schema({ vehicleNumber: { type: String, required: true, unique: true }, driver: String, phone: String, status: { type: String, enum: ["available", "on_trip", "returning", "maintenance"], default: "available" }, trips: [{ patient: { type: Schema.Types.ObjectId, ref: "Patient" }, pickup: String, destination: String, startedAt: Date, endedAt: Date }] }, { timestamps: true });
export const Ambulance = models.Ambulance || model("Ambulance", AmbulanceSchema);
