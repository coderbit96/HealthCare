import { Schema, model, models } from "mongoose";
const PurchaseSchema = new Schema({ supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true }, items: [{ item: { type: Schema.Types.ObjectId, ref: "InventoryItem" }, quantity: Number, unitPrice: Number }], total: Number, reference: { type: String, unique: true, sparse: true }, receivedBy: String }, { timestamps: true });
export const Purchase = models.Purchase || model("Purchase", PurchaseSchema);
