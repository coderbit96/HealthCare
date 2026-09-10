import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/server-auth";
import { Bed } from "@/models/Bed";
import { BedAssignment } from "@/models/BedAssignment";

const createSchema = z.object({ ward: z.string().length(24), room: z.string().length(24).optional(), bedNumber: z.string().trim().min(1).max(50), status: z.enum(["available", "reserved", "occupied", "cleaning", "maintenance"]).default("available") });
const updateSchema = z.object({ id: z.string().length(24), status: z.enum(["available", "reserved", "cleaning", "maintenance"]).optional(), bedNumber: z.string().trim().min(1).max(50).optional(), room: z.string().length(24).nullable().optional() }).refine((value) => value.status || value.bedNumber || value.room !== undefined, "No changes supplied");

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "beds:read"); const status = request.nextUrl.searchParams.get("status"); const ward = request.nextUrl.searchParams.get("ward");
    const filter: Record<string, unknown> = {}; if (status) filter.status = status; if (ward) filter.ward = ward;
    const [beds, assignments] = await Promise.all([Bed.find(filter).populate("ward", "name type").populate("room", "roomNumber").sort({ bedNumber: 1 }).lean(), BedAssignment.find({ active: true }).populate("patient", "name uhid").lean()]);
    const assignmentByBed = new Map(assignments.map((assignment) => [assignment.bed.toString(), assignment]));
    return NextResponse.json(beds.map((bed) => ({ ...bed, assignment: assignmentByBed.get(bed._id.toString()) ?? null })));
  } catch (error) { const message = error instanceof Error ? error.message : "Unable to load beds"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 }); }
}
export async function POST(request: NextRequest) {
  try { const user = await requirePermission(request, "beds:write"); const bed = await Bed.create(createSchema.parse(await request.json())); await audit(user.firebaseUid, "bed.created", "Bed", bed._id.toString(), { bedNumber: bed.bedNumber, ward: bed.ward.toString() }); return NextResponse.json(bed, { status: 201 }); }
  catch (error) { const duplicate = typeof error === "object" && error && "code" in error && (error as { code?: number }).code === 11000; const message = error instanceof z.ZodError ? "Invalid bed" : error instanceof Error ? error.message : "Unable to create bed"; return NextResponse.json({ error: duplicate ? "A bed with this number already exists in that room" : message }, { status: duplicate ? 409 : message === "Forbidden" ? 403 : 400 }); }
}
export async function PATCH(request: NextRequest) {
  try { const user = await requirePermission(request, "beds:write"); const { id, ...changes } = updateSchema.parse(await request.json()); const activeAssignment = await BedAssignment.exists({ bed: id, active: true }); if (activeAssignment && changes.status) return NextResponse.json({ error: "Release the active bed assignment before changing this bed status" }, { status: 409 }); const bed = await Bed.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true }); if (!bed) return NextResponse.json({ error: "Bed not found" }, { status: 404 }); await audit(user.firebaseUid, "bed.updated", "Bed", id, { fields: Object.keys(changes) }); return NextResponse.json(bed); }
  catch (error) { const message = error instanceof z.ZodError ? "Invalid bed update" : error instanceof Error ? error.message : "Unable to update bed"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); }
}
