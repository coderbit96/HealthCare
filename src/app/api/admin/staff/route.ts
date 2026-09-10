import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { createFirebaseUser, deleteFirebaseUser } from "@/lib/firebase-admin";
import { getRequestUser } from "@/lib/server-auth";
import { DoctorProfile } from "@/models/DoctorProfile";
import { DoctorSchedule } from "@/models/DoctorSchedule";
import { EmployeeProfile } from "@/models/EmployeeProfile";
import { LeaveRequest } from "@/models/LeaveRequest";
import { User } from "@/models/User";
import { PERMISSIONS, type Permission } from "@/lib/roles";

const id = z.string().regex(/^[a-f\d]{24}$/i);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const photo = z.string().max(14_000_000).refine((value) => value === "" || /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value));
const doctorProfileSchema = z.object({ registrationNumber: z.string().trim().max(80).optional().or(z.literal("")), specialties: z.array(z.string().trim().min(1).max(100)).max(20).default([]), qualifications: z.array(z.string().trim().min(1).max(140)).max(20).default([]), experienceYears: z.number().int().min(0).max(80).optional(), consultationFee: z.number().min(0).max(1_000_000).optional(), chamber: z.string().trim().max(120).optional().or(z.literal("")), photo: photo.optional().default(""), bio: z.string().trim().max(5_000).optional().or(z.literal("")) });
const scheduleSchema = z.object({ workingDays: z.array(z.number().int().min(0).max(6)).min(1).max(7), startTime: time, endTime: time, breakStart: time.optional().or(z.literal("")), breakEnd: time.optional().or(z.literal("")), consultationMinutes: z.number().int().min(5).max(120).default(20), dailyLimit: z.number().int().min(1).max(200).default(30) }).refine((value) => value.endTime > value.startTime, "Working hours must end after they start").refine((value) => !value.breakStart || !value.breakEnd || (value.breakStart > value.startTime && value.breakEnd < value.endTime && value.breakEnd > value.breakStart), "Break hours must be within the working hours");
const nurseProfileSchema = z.object({ staffId: z.string().trim().min(2).max(50).optional().or(z.literal("")), designation: z.string().trim().max(120).optional().or(z.literal("")), department: z.string().trim().max(120).optional().or(z.literal("")), ward: id.optional().or(z.literal("")), shift: id.optional().or(z.literal("")), assignedPatients: z.array(id).max(200).default([]), qualifications: z.array(z.string().trim().min(1).max(140)).max(20).default([]), photo: photo.optional().default(""), employmentType: z.enum(["full_time", "part_time", "contract", "intern"]).default("full_time"), joinedOn: z.coerce.date().optional() });
const permissionSchema = z.array(z.string()).max(PERMISSIONS.length).refine((items) => items.every((item) => PERMISSIONS.includes(item as Permission)), "Invalid permission selection");
const baseSchema = { name: z.string().trim().min(2).max(120), email: z.email(), temporaryPassword: z.string().min(6).max(128), department: z.string().trim().min(2).max(120), permissions: permissionSchema.default([]), permissionMode: z.enum(["role_default", "custom"]).default("role_default") };
const createSchema = z.discriminatedUnion("role", [z.object({ role: z.literal("doctor"), ...baseSchema, doctorProfile: doctorProfileSchema, schedule: scheduleSchema }), z.object({ role: z.literal("nurse"), ...baseSchema, nurseProfile: nurseProfileSchema }), z.object({ role: z.literal("receptionist"), ...baseSchema, nurseProfile: nurseProfileSchema }), z.object({ role: z.literal("hr"), ...baseSchema, nurseProfile: nurseProfileSchema }), z.object({ role: z.literal("lab_technician"), ...baseSchema, nurseProfile: nurseProfileSchema }), z.object({ role: z.literal("pharmacist"), ...baseSchema, nurseProfile: nurseProfileSchema })]);

async function requireAdmin(request: NextRequest) { const user = await getRequestUser(request); if (user.role !== "admin") throw new Error("Forbidden"); return user; }
function responseError(error: unknown, fallback: string) { const message = error instanceof z.ZodError ? error.issues[0]?.message ?? "Invalid staff details" : error instanceof Error ? error.message : fallback; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 400 }); }
function generatedStaffId(role: string) { const prefix = { doctor: "DOC", nurse: "NUR", receptionist: "REC", hr: "HR", lab_technician: "LAB", pharmacist: "PHA" }[role] ?? "EMP"; return `${prefix}-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`; }

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const role = z.enum(["doctor", "nurse", "receptionist", "hr", "lab_technician", "pharmacist"]).parse(request.nextUrl.searchParams.get("role"));
    const users = await User.find({ role }).select("name email role active status department permissions permissionMode createdAt firebaseUid").sort({ name: 1 }).lean();
    const userIds = users.map((user) => user._id);
    const [profiles, schedules, leaves] = await Promise.all([
      role === "doctor" ? DoctorProfile.find({ user: { $in: userIds } }).lean() : EmployeeProfile.find({ user: { $in: userIds } }).populate("ward", "name type").populate("shift", "name startTime endTime date").populate("assignedPatients", "name uhid").lean(),
      role === "doctor" ? DoctorSchedule.find({ doctorUid: { $in: users.map((user) => user.firebaseUid) } }).lean() : Promise.resolve([]),
      LeaveRequest.find({ user: { $in: userIds } }).sort({ createdAt: -1 }).limit(250).lean(),
    ]);
    return NextResponse.json(users.map((user) => ({ ...user, profile: profiles.find((profile) => profile.user.toString() === user._id.toString()), schedule: schedules.find((schedule) => schedule.doctorUid === user.firebaseUid), leaves: leaves.filter((leave) => leave.user.toString() === user._id.toString()) })));
  } catch (error) { return responseError(error, "Unable to load staff records"); }
}

export async function POST(request: NextRequest) {
  let createdUid: string | undefined;
  try {
    const actor = await requireAdmin(request);
    const input = createSchema.parse(await request.json());
    const existing = await User.findOne({ email: input.email.toLowerCase() }).lean();
    if (existing) return NextResponse.json({ error: "A hospital account already uses this email address." }, { status: 409 });
    const account = await createFirebaseUser({ email: input.email.toLowerCase(), password: input.temporaryPassword, displayName: input.name });
    createdUid = account.uid;
    const user = await User.create({ firebaseUid: account.uid, name: input.name, email: input.email.toLowerCase(), role: input.role, department: input.department, permissions: input.permissions as Permission[], permissionMode: input.permissionMode, active: true, status: "active" });
    if (input.role === "doctor") {
      await DoctorProfile.create({ user: user._id, ...input.doctorProfile, registrationNumber: input.doctorProfile.registrationNumber || undefined, chamber: input.doctorProfile.chamber || undefined, photo: input.doctorProfile.photo || undefined, bio: input.doctorProfile.bio || undefined, active: true });
      await DoctorSchedule.findOneAndUpdate({ doctorUid: account.uid }, { $set: { ...input.schedule, doctorUid: account.uid, department: input.department, breakStart: input.schedule.breakStart || undefined, breakEnd: input.schedule.breakEnd || undefined } }, { upsert: true, new: true, runValidators: true });
      const profile = await EmployeeProfile.create({ user: user._id, staffId: generatedStaffId(input.role), designation: "Doctor", department: input.department, qualifications: input.doctorProfile.qualifications, photo: input.doctorProfile.photo || undefined, employmentType: "full_time", joinedOn: new Date(), status: "active" });
      await User.findByIdAndUpdate(user._id, { profile: profile._id });
    } else {
      const nurse = input.nurseProfile;
      const profile = await EmployeeProfile.create({ user: user._id, staffId: nurse.staffId || generatedStaffId(input.role), designation: nurse.designation || input.role.replace("_", " "), department: input.department, ward: nurse.ward || undefined, shift: nurse.shift || undefined, assignedPatients: nurse.assignedPatients, qualifications: nurse.qualifications, photo: nurse.photo || undefined, employmentType: nurse.employmentType, joinedOn: nurse.joinedOn ?? new Date(), status: "active" });
      await User.findByIdAndUpdate(user._id, { profile: profile._id });
    }
    await audit(actor.firebaseUid, `${input.role}.created`, "User", user._id.toString(), { email: user.email, department: input.department });
    return NextResponse.json({ id: user._id.toString(), role: user.role, name: user.name }, { status: 201 });
  } catch (error) {
    if (createdUid) await deleteFirebaseUser(createdUid).catch(() => undefined);
    return responseError(error, "Unable to create staff account");
  }
}
