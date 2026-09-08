import { Schema, model, models } from "mongoose";
const RefundSchema = new Schema({ invoice: { type: Schema.Types.ObjectId, ref: "Invoice", required: true }, payment: { type: Schema.Types.ObjectId, ref: "PaymentTransaction" }, amount: { type: Number, required: true }, reason: String, status: { type: String, enum: ["requested", "approved", "rejected", "processed"], default: "requested" }, requestedBy: String, approvedBy: String }, { timestamps: true });
export const Refund = models.Refund || model("Refund", RefundSchema);
