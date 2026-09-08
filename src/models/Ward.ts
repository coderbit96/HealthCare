import { Schema, model, models } from "mongoose";
const WardSchema = new Schema({ name: { type: String, required: true, unique: true }, type: { type: String, enum: ["general", "private", "semi_private", "icu", "nicu", "ccu", "emergency"], required: true }, active: { type: Boolean, default: true } }, { timestamps: true });
export const Ward = models.Ward || model("Ward", WardSchema);
