import { Schema, model, models } from "mongoose";
const BloodDonorSchema = new Schema({ name: { type: String, required: true }, phone: String, bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], required: true }, lastDonatedAt: Date, eligible: { type: Boolean, default: true } }, { timestamps: true });
export const BloodDonor = models.BloodDonor || model("BloodDonor", BloodDonorSchema);
