import { Schema, model, models } from "mongoose";
const MedicineSchema = new Schema({ name: { type: String, required: true }, genericName: String, brand: String, category: String, reorderLevel: { type: Number, default: 0 }, active: { type: Boolean, default: true } }, { timestamps: true });
export const Medicine = models.Medicine || model("Medicine", MedicineSchema);
