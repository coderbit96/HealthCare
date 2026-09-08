import { Schema, model, models } from "mongoose";
const ShiftSchema = new Schema({ name: { type: String, required: true, unique: true }, startTime: String, endTime: String, department: String, staff: [{ type: Schema.Types.ObjectId, ref: "User" }], date: String }, { timestamps: true });
ShiftSchema.index({ date: 1, department: 1 });
export const Shift = models.Shift || model("Shift", ShiftSchema);
