import { Schema, model, models } from "mongoose";
const InsurancePolicySchema = new Schema({ patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true }, provider: { type: Schema.Types.ObjectId, ref: "InsuranceProvider", required: true }, policyNumber: { type: String, required: true }, validFrom: Date, validUntil: Date, coverage: Number }, { timestamps: true });
InsurancePolicySchema.index({ provider: 1, policyNumber: 1 }, { unique: true });
export const InsurancePolicy = models.InsurancePolicy || model("InsurancePolicy", InsurancePolicySchema);
