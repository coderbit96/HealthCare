import { Schema, model, models } from "mongoose";
const VitalSchema = new Schema({ patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true }, recordedBy: { type: String, required: true }, temperature: Number, systolic: Number, diastolic: Number, pulse: Number, spo2: Number, glucose: Number, intake: Number, output: Number, bedsideStatus: String, observation: { type: String, maxlength: 1500 } }, { timestamps: true });
export const Vital = models.Vital || model("Vital", VitalSchema);
