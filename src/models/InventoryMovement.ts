import { Schema, model, models } from "mongoose";
const InventoryMovementSchema = new Schema({ item: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true, index: true }, type: { type: String, enum: ["purchase", "stock_in", "stock_out", "allocation", "adjustment"], required: true }, quantity: { type: Number, required: true }, department: String, supplier: String, performedBy: { type: String, required: true }, note: String }, { timestamps: true });
export const InventoryMovement = models.InventoryMovement || model("InventoryMovement", InventoryMovementSchema);
