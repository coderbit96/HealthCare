import { Schema, model, models } from "mongoose";
const PharmacySaleSchema = new Schema({ patient: { type: Schema.Types.ObjectId, ref: "Patient" }, dispenses: [{ type: Schema.Types.ObjectId, ref: "Dispense" }], invoice: { type: Schema.Types.ObjectId, ref: "Invoice" }, total: Number, soldBy: String }, { timestamps: true });
export const PharmacySale = models.PharmacySale || model("PharmacySale", PharmacySaleSchema);
