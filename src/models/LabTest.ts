import { Schema, model, models } from "mongoose";
const LabTestSchema = new Schema({ name: { type: String, required: true, unique: true }, category: String, unit: String, referenceRange: String, price: Number, active: { type: Boolean, default: true } }, { timestamps: true });
export const LabTest = models.LabTest || model("LabTest", LabTestSchema);
