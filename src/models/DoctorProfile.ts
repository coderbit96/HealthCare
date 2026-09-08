import { Schema, model, models } from "mongoose";
const DoctorProfileSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true }, registrationNumber: { type: String, unique: true, sparse: true }, specialties: [String], qualifications: [String], bio: String, consultationFee: Number, active: { type: Boolean, default: true } }, { timestamps: true });
export const DoctorProfile = models.DoctorProfile || model("DoctorProfile", DoctorProfileSchema);
