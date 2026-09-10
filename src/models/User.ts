import { Schema, model, models } from "mongoose";
import { ROLES } from "@/lib/roles";

const UserSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    profileImage: { type: String },
    role: { type: String, enum: ROLES, required: true, index: true },
    active: { type: Boolean, default: true, index: true },
    status: { type: String, enum: ["active", "inactive", "suspended"], default: "active", index: true },
    department: { type: String, trim: true },
    permissions: [{ type: String }],
    patient: { type: Schema.Types.ObjectId, ref: "Patient" },
    profile: { type: Schema.Types.ObjectId },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

// During `next dev`, Mongoose retains an existing model across hot reloads. Add
// newly introduced profile fields to that retained schema so update operations
// do not silently discard them until the server is restarted.
const existingUser = models.User;
if (existingUser) {
  const missingFields: Record<string, { type: StringConstructor; trim?: boolean }> = {};
  if (!existingUser.schema.path("phone")) missingFields.phone = { type: String, trim: true };
  if (!existingUser.schema.path("profileImage")) missingFields.profileImage = { type: String };
  if (Object.keys(missingFields).length) existingUser.schema.add(missingFields);
}

export const User = existingUser || model("User", UserSchema);
