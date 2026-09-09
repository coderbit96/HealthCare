import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { audit } from "@/lib/audit";
import { EmployeeProfile } from "@/models/EmployeeProfile";
import { User } from "@/models/User";

const profileFields = z.object({ staffId: z.string().trim().min(2).max(50), designation: z.string().trim().max(120).optional(), department: z.string().trim().max(120).optional(), employmentType: z.enum(["full_time", "part_time", "contract", "intern"]).optional(), joinedOn: z.coerce.date().optional(), documents: z.array(z.object({ name: z.string().min(1).max(160), url: z.url() })).default([]), salary: z.number().min(0).optional(), overtimeRate: z.number().min(0).optional(), performanceNotes: z.string().max(5_000).optional(), status: z.enum(["active", "on_leave", "inactive"]).default("active") });
const createSchema = profileFields.extend({ user: z.string().length(24) });
const updateSchema = profileFields.partial().extend({ id: z.string().length(24) });

function errorResponse(error: unknown, fallback: string) {
  const message = error instanceof z.ZodError ? "Invalid employee record" : error instanceof Error ? error.message : fallback;
  const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "employees:read");
    return NextResponse.json(await EmployeeProfile.find().populate("user", "name email role active department").sort({ staffId: 1 }).lean());
  } catch (error) { return errorResponse(error, "Unable to load employee records"); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission(request, "employees:write");
    const input = createSchema.parse(await request.json());
    const user = await User.findById(input.user).select("role");
    if (!user || user.role === "patient") return NextResponse.json({ error: "A staff account is required for an employee profile" }, { status: 400 });
    const employee = await EmployeeProfile.create(input);
    await User.findByIdAndUpdate(input.user, { profile: employee._id, department: input.department });
    await audit(actor.firebaseUid, "employee.created", "EmployeeProfile", employee._id.toString(), { user: input.user, staffId: input.staffId });
    return NextResponse.json(employee, { status: 201 });
  } catch (error) { return errorResponse(error, "Unable to create employee record"); }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requirePermission(request, "employees:write");
    const { id, ...changes } = updateSchema.parse(await request.json());
    const employee = await EmployeeProfile.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true });
    if (!employee) return NextResponse.json({ error: "Employee record not found" }, { status: 404 });
    if (changes.department !== undefined) await User.findByIdAndUpdate(employee.user, { department: changes.department });
    await audit(actor.firebaseUid, "employee.updated", "EmployeeProfile", id, { fields: Object.keys(changes) });
    return NextResponse.json(employee);
  } catch (error) { return errorResponse(error, "Unable to update employee record"); }
}
