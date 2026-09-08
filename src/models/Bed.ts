import { Schema, model, models } from "mongoose";
const BedSchema = new Schema({ ward: { type: Schema.Types.ObjectId, ref: "Ward", required: true }, room: { type: Schema.Types.ObjectId, ref: "Room" }, bedNumber: { type: String, required: true }, status: { type: String, enum: ["available", "occupied", "reserved", "cleaning", "maintenance"], default: "available", index: true } }, { timestamps: true });
BedSchema.index({ ward: 1, room: 1, bedNumber: 1 }, { unique: true });
export const Bed = models.Bed || model("Bed", BedSchema);
