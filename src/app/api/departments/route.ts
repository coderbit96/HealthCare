import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getRequestUser, requirePermission } from "@/lib/server-auth";
import { Department } from "@/models/Department";

const departmentSchema = z.object({
  name: z.string().trim().min(2).max(120), description: z.string().trim().max(2_000).optional(), image: z.url().optional(), icon: z.string().max(80).optional(),
  doctors: z.array(z.string()).max(100).default([]), nurses: z.array(z.string()).max(200).default([]), departmentHeadUid: z.string().optional(), rooms: z.array(z.string().length(24)).max(100).default([]),
  services: z.array(z.string().trim().min(1).max(160)).max(100).default([]), consultationInfo: z.string().trim().max(2_000).optional(), active: z.boolean().default(true), published: z.boolean().default(false),
});
const updateSchema = departmentSchema.partial().extend({ id: z.string().length(24) });

export async function GET(request: NextRequest) {
  const publicOnly = request.nextUrl.searchParams.get("public") === "true";
  try {
    if (!publicOnly) await getRequestUser(request);
    return NextResponse.json(await Department.find(publicOnly ? { active: true, published: true } : {}).sort({ name: 1 }).lean());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load departments";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, "settings:write");
    const department = await Department.create(departmentSchema.parse(await request.json()));
    await audit(user.firebaseUid, "department.created", "Department", department._id.toString(), { name: department.name, published: department.published });
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid department" : error instanceof Error ? error.message : "Unable to create department";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requirePermission(request, "settings:write");
    const { id, ...changes } = updateSchema.parse(await request.json());
    const department = await Department.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true });
    if (!department) return NextResponse.json({ error: "Department not found" }, { status: 404 });
    await audit(user.firebaseUid, "department.updated", "Department", id, { fields: Object.keys(changes) });
    return NextResponse.json(department);
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid department update" : error instanceof Error ? error.message : "Unable to update department";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
