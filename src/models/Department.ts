import { Schema, model, models } from "mongoose";

const DepartmentSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, maxlength: 2_000 },
  image: String,
  icon: String,
  doctors: [String],
  nurses: [String],
  departmentHeadUid: String,
  rooms: [{ type: Schema.Types.ObjectId, ref: "Room" }],
  services: [String],
  consultationInfo: { type: String, maxlength: 2_000 },
  active: { type: Boolean, default: true },
  published: { type: Boolean, default: false, index: true },
}, { timestamps: true });

const existingDepartment = models.Department;
if (existingDepartment) {
  if (!existingDepartment.schema.path("consultationInfo")) existingDepartment.schema.add({ consultationInfo: String });
  if (!existingDepartment.schema.path("published")) existingDepartment.schema.add({ published: { type: Boolean, default: false, index: true } });
}

export const Department = existingDepartment || model("Department", DepartmentSchema);
