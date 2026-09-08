import { Schema, model, models } from "mongoose";
const SupplierSchema = new Schema({ name: { type: String, required: true, unique: true }, contact: String, phone: String, email: String, address: String, active: { type: Boolean, default: true } }, { timestamps: true });
export const Supplier = models.Supplier || model("Supplier", SupplierSchema);
