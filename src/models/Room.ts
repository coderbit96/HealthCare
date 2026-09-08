import { Schema, model, models } from "mongoose";
const RoomSchema = new Schema({ ward: { type: Schema.Types.ObjectId, ref: "Ward", required: true }, roomNumber: { type: String, required: true }, active: { type: Boolean, default: true } }, { timestamps: true });
RoomSchema.index({ ward: 1, roomNumber: 1 }, { unique: true });
export const Room = models.Room || model("Room", RoomSchema);
