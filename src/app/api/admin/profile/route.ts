import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getRequestUser } from "@/lib/server-auth";
import { User } from "@/models/User";

const imageSchema = z.string().max(14_000_000).refine(
  (value) => value === "" || /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value),
  "Profile image must be a PNG, JPEG, or WebP file.",
);

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  profileImage: imageSchema.optional().default(""),
});

async function requireAdministrator(request: NextRequest) {
  const user = await getRequestUser(request);
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdministrator(request);
    return NextResponse.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load profile";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireAdministrator(request);
    const input = profileSchema.parse(await request.json());
    const profileFields = {
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone || undefined,
      department: input.department || undefined,
    };
    const imageUpdate = input.profileImage
      ? { $set: { ...profileFields, profileImage: input.profileImage } }
      : { $set: profileFields, $unset: { profileImage: 1 } };

    const updated = await User.findByIdAndUpdate(actor.id, imageUpdate, {
      new: true,
      runValidators: true,
      // Keeps the update safe during hot reloads where an earlier Mongoose
      // model instance may not yet include the profileImage schema field.
      strict: false,
    }).lean();
    if (!updated) return NextResponse.json({ error: "Administrator account not found" }, { status: 404 });
    await audit(actor.firebaseUid, "admin.profile.updated", "User", actor.id, { fields: ["name", "email", "phone", "department", "profileImage"] });
    return NextResponse.json({ id: updated._id.toString(), name: updated.name, email: updated.email, phone: updated.phone, department: updated.department, profileImage: updated.profileImage });
  } catch (error) {
    const mongoCode = typeof error === "object" && error && "code" in error ? Number(error.code) : undefined;
    const message = error instanceof z.ZodError ? "Please check your profile details" : mongoCode === 11000 ? "That email address is already in use" : error instanceof Error ? error.message : "Unable to save profile";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : mongoCode === 11000 ? 409 : 400 });
  }
}
