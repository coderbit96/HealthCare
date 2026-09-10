import { Schema, model, models } from "mongoose";
const AttendanceSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: "User", required: true }, date: { type: String, required: true }, checkIn: Date, checkOut: Date, workingMinutes: { type: Number, default: 0 }, overtimeMinutes: { type: Number, default: 0 }, remarks: { type: String, maxlength: 1000 }, status: { type: String, enum: ["present", "absent", "late", "half_day", "leave", "holiday", "week_off"], default: "present" } }, { timestamps: true });
AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });
export const Attendance = models.Attendance || model("Attendance", AttendanceSchema);
