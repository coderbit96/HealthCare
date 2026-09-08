import { Schema, model, models } from "mongoose";
const MedicineBatchSchema = new Schema({ medicine: { type: Schema.Types.ObjectId, ref: "Medicine", required: true }, batchNumber: { type: String, required: true }, expiryDate: { type: Date, required: true }, quantity: { type: Number, required: true, min: 0 }, purchasePrice: Number, salePrice: Number, supplier: String }, { timestamps: true });
MedicineBatchSchema.index({ medicine: 1, batchNumber: 1 }, { unique: true });
export const MedicineBatch = models.MedicineBatch || model("MedicineBatch", MedicineBatchSchema);
