import { Schema, model, models } from "mongoose";
const HospitalSettingSchema = new Schema({ key: { type: String, required: true, unique: true }, value: Schema.Types.Mixed, updatedBy: String }, { timestamps: true });
export const HospitalSetting = models.HospitalSetting || model("HospitalSetting", HospitalSettingSchema);
