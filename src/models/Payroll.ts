import { Schema, model, models } from "mongoose";
const PayrollSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: "User", required: true }, period: { type: String, required: true }, basic: Number, overtime: Number, deductions: Number, net: Number, status: { type: String, enum: ["draft", "approved", "paid"], default: "draft" } }, { timestamps: true });
PayrollSchema.index({ user: 1, period: 1 }, { unique: true });
export const Payroll = models.Payroll || model("Payroll", PayrollSchema);
