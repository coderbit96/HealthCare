import { Schema, model, models } from "mongoose";
const DispenseSchema = new Schema({ patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true }, prescription: { type: Schema.Types.ObjectId, ref: "MedicalRecord" }, batch: { type: Schema.Types.ObjectId, ref: "MedicineBatch", required: true }, quantity: { type: Number, required: true }, dispensedBy: { type: String, required: true }, billingReference: String }, { timestamps: true });
export const Dispense = models.Dispense || model("Dispense", DispenseSchema);
