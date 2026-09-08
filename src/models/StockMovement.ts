import { Schema, model, models } from "mongoose";
const StockMovementSchema = new Schema({ batch: { type: Schema.Types.ObjectId, ref: "MedicineBatch", required: true }, medicine: { type: Schema.Types.ObjectId, ref: "Medicine", required: true }, type: { type: String, enum: ["purchase", "dispense", "return", "adjustment"], required: true }, quantity: { type: Number, required: true }, reference: String, performedBy: { type: String, required: true } }, { timestamps: true });
export const StockMovement = models.StockMovement || model("StockMovement", StockMovementSchema);
