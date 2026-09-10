import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getRequestUser } from "@/lib/server-auth";
import { DoctorProfile } from "@/models/DoctorProfile";
import { DoctorSchedule } from "@/models/DoctorSchedule";
import { EmployeeProfile } from "@/models/EmployeeProfile";
import { User } from "@/models/User";
import { PERMISSIONS, type Permission } from "@/lib/roles";

const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid staff id");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const photo = z.string().max(14_000_000).refine((value) => value === "" || /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value));
const doctorProfileSchema = z.object({ registrationNumber: z.string().trim().max(80).optional().or(z.literal("")), specialties: z.array(z.string().trim().min(1).max(100)).max(20).optional(), qualifications: z.array(z.string().trim().min(1).max(140)).max(20).optional(), experienceYears: z.number().int().min(0).max(80).optional(), consultationFee: z.number().min(0).max(1_000_000).optional(), chamber: z.string().trim().max(120).optional().or(z.literal("")), photo: photo.optional(), bio: z.string().trim().max(5_000).optional().or(z.literal("")) });
const scheduleSchema = z.object({ workingDays: z.array(z.number().int().min(0).max(6)).min(1).max(7).optional(), startTime: time.optional(), endTime: time.optional(), breakStart: time.optional().or(z.literal("")), breakEnd: time.optional().or(z.literal("")), consultationMinutes: z.number().int().min(5).max(120).optional(), dailyLimit: z.number().int().min(1).max(200).optional() });
const nurseProfileSchema = z.object({ staffId: z.string().trim().min(2).max(50).optional(), designation: z.string().trim().max(120).optional(), department: z.string().trim().max(120).optional(), ward: id.optional().or(z.literal("")), shift: id.optional().or(z.literal("")), assignedPatients: z.array(id).max(200).optional(), qualifications: z.array(z.string().trim().min(1).max(140)).max(20).optional(), photo: photo.optional(), employmentType: z.enum(["full_time", "part_time", "contract", "intern"]).optional(), joinedOn: z.coerce.date().optional(), status: z.enum(["active", "on_leave", "inactive"]).optional() });
const permissionSchema = z.array(z.string()).max(PERMISSIONS.length).refine((items) => items.every((item) => PERMISSIONS.includes(item as Permission)), "Invalid permission selection");
const patchSchema = z.object({ name: z.string().trim().min(2).max(120).optional(), department: z.string().trim().min(2).max(120).optional(), active: z.boolean().optional(), permissions: permissionSchema.optional(), permissionMode: z.enum(["role_default", "custom"]).optional(), doctorProfile: doctorProfileSchema.optional(), schedule: scheduleSchema.optional(), nurseProfile: nurseProfileSchema.optional() });

async function requireAdmin(request: NextRequest) { const user = await getRequestUser(request); if (user.role !== "admin") throw new Error("Forbidden"); return user; }

export async function PATCH(request: NextRequest, context: RouteContext<"/api/admin/staff/[id]">) {
  try {
    const actor = await requireAdmin(request);
    const staffId = id.parse((await context.params).id);
    const input = patchSchema.parse(await request.json());
    const user = await User.findOne({ _id: staffId, role: { $in: ["doctor", "nurse", "receptionist", "hr", "lab_technician", "pharmacist"] } });
    if (!user) return NextResponse.json({ error: "Staff account not found" }, { status: 404 });
    const userChanges: Record<string, unknown> = {};
    if (input.name !== undefined) userChanges.name = input.name;
    if (input.department !== undefined) userChanges.department = input.department;
    if (input.active !== undefined) { userChanges.active = input.active; userChanges.status = input.active ? "active" : "inactive"; }
    if (input.permissions !== undefined) userChanges.permissions = input.permissions;
    if (input.permissionMode !== undefined) userChanges.permissionMode = input.permissionMode;
    if (Object.keys(userChanges).length) await User.findByIdAndUpdate(user._id, { $set: userChanges }, { runValidators: true });

    if (user.role === "doctor") {
      if (input.doctorProfile) await DoctorProfile.findOneAndUpdate({ user: user._id }, { $set: { ...input.doctorProfile, registrationNumber: input.doctorProfile.registrationNumber || undefined, chamber: input.doctorProfile.chamber || undefined, photo: input.doctorProfile.photo || undefined, bio: input.doctorProfile.bio || undefined, active: input.active ?? true } }, { upsert: true, new: true, runValidators: true, strict: false });
      if (input.schedule) await DoctorSchedule.findOneAndUpdate({ doctorUid: user.firebaseUid }, { $set: { ...input.schedule, doctorUid: user.firebaseUid, department: input.department ?? user.department, breakStart: input.schedule.breakStart || undefined, breakEnd: input.schedule.breakEnd || undefined } }, { upsert: true, new: true, runValidators: true });
    } else if (input.nurseProfile || input.department !== undefined || input.active !== undefined) {
      const nurse = input.nurseProfile ?? {};
      await EmployeeProfile.findOneAndUpdate({ user: user._id }, { $set: { ...nurse, department: input.department ?? nurse.department ?? user.department, ward: nurse.ward || undefined, shift: nurse.shift || undefined, photo: nurse.photo || undefined, status: input.active === false ? "inactive" : nurse.status ?? "active" } }, { upsert: true, new: true, runValidators: true, strict: false, setDefaultsOnInsert: true });
    }
    await audit(actor.firebaseUid, `${user.role}.updated`, "User", user._id.toString(), { fields: Object.keys(input) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message ?? "Invalid staff details" : error instanceof Error ? error.message : "Unable to update staff account";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
