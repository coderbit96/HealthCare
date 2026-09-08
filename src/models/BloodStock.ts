import { Schema, model, models } from "mongoose";
const BloodStockSchema = new Schema({ bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], required: true, unique: true }, availableUnits: { type: Number, default: 0, min: 0 }, reservedUnits: { type: Number, default: 0, min: 0 }, updatedBy: String }, { timestamps: true });
export const BloodStock = models.BloodStock || model("BloodStock", BloodStockSchema);
