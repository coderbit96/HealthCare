import { Schema, model, models } from "mongoose";
const DoctorProfileSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true }, registrationNumber: { type: String, unique: true, sparse: true }, specialties: [String], qualifications: [String], experienceYears: { type: Number, min: 0 }, bio: String, consultationFee: Number, chamber: String, photo: String, active: { type: Boolean, default: true } }, { timestamps: true });
export const DoctorProfile = models.DoctorProfile || model("DoctorProfile", DoctorProfileSchema);
