import { Schema, model, models } from "mongoose";
const InventoryItemSchema = new Schema({ name: { type: String, required: true, unique: true }, category: { type: String, enum: ["medical_equipment", "surgical_supply", "disposable", "lab_supply", "office_supply"], required: true }, unit: String, quantity: { type: Number, default: 0, min: 0 }, reorderLevel: { type: Number, default: 0 }, supplier: String }, { timestamps: true });
export const InventoryItem = models.InventoryItem || model("InventoryItem", InventoryItemSchema);
