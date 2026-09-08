import { Schema, model, models } from "mongoose";
const DepartmentSchema = new Schema({ name: { type: String, required: true, unique: true }, description: String, image: String, icon: String, doctors: [String], nurses: [String], departmentHeadUid: String, rooms: [{ type: Schema.Types.ObjectId, ref: "Room" }], services: [String], active: { type: Boolean, default: true } }, { timestamps: true });
export const Department = models.Department || model("Department", DepartmentSchema);
