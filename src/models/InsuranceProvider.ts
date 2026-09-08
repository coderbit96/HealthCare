import { Schema, model, models } from "mongoose";
const InsuranceProviderSchema = new Schema({ name: { type: String, required: true, unique: true }, contactEmail: String, contactPhone: String, active: { type: Boolean, default: true } }, { timestamps: true });
export const InsuranceProvider = models.InsuranceProvider || model("InsuranceProvider", InsuranceProviderSchema);
