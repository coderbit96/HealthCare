import { Schema, model, models } from "mongoose";
const OperationTheatreSchema = new Schema({ name: { type: String, required: true, unique: true }, active: { type: Boolean, default: true } }, { timestamps: true });
export const OperationTheatre = models.OperationTheatre || model("OperationTheatre", OperationTheatreSchema);
