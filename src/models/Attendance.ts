import { Schema, model, models } from "mongoose";
const AttendanceSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: "User", required: true }, date: { type: String, required: true }, checkIn: Date, checkOut: Date, status: { type: String, enum: ["present", "absent", "late", "leave"], default: "present" } }, { timestamps: true });
AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });
export const Attendance = models.Attendance || model("Attendance", AttendanceSchema);
