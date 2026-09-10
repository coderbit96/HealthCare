import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/server-auth";
import { Counter } from "@/models/Counter";
import { EmergencyCase } from "@/models/EmergencyCase";
import { assignAvailableBed } from "@/lib/bed-operations";

const createSchema = z.object({ patient: z.string().length(24), triage: z.enum(["critical", "very_urgent", "urgent", "stable"]), arrivalAt: z.coerce.date().optional(), bed: z.string().length(24).optional(), assignedStaff: z.array(z.string().length(24)).default([]), ambulance: z.string().max(100).optional() });
const updateSchema = z.object({ id: z.string().length(24), triage: z.enum(["critical", "very_urgent", "urgent", "stable"]).optional(), status: z.enum(["active", "admitted", "discharged"]).optional(), assignedStaff: z.array(z.string().length(24)).optional(), ambulance: z.string().max(100).optional() }).refine((value) => value.triage || value.status || value.assignedStaff || value.ambulance !== undefined, "No changes supplied");

export async function GET(request: NextRequest) {
  try { await requirePermission(request, "emergency:write"); const status = request.nextUrl.searchParams.get("status"); const triage = request.nextUrl.searchParams.get("triage"); const filter: Record<string, unknown> = {}; if (status) filter.status = status; if (triage) filter.triage = triage; return NextResponse.json(await EmergencyCase.find(filter).populate("patient", "name uhid").populate("bed", "bedNumber status").populate("assignedStaff", "name role department").sort({ arrivalAt: -1 }).limit(100).lean()); }
  catch (error) { const message = error instanceof Error ? error.message : "Unable to load emergency cases"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 }); }
}
export async function POST(request: NextRequest) {
  try { const user = await requirePermission(request, "emergency:write"); const input = createSchema.parse(await request.json()); const value = await Counter.findOneAndUpdate({ key: `emergency:${new Date().getFullYear()}` }, { $inc: { value: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true }); if (input.bed) await assignAvailableBed({ bedId: input.bed, patientId: input.patient, assignedBy: user.firebaseUid }); const emergency = await EmergencyCase.create({ ...input, caseNumber: `ER-${new Date().getFullYear()}-${String(value.value).padStart(6, "0")}`, arrivalAt: input.arrivalAt ?? new Date() }); await audit(user.firebaseUid, "emergency.created", "EmergencyCase", emergency._id.toString(), { triage: input.triage, bed: input.bed }); return NextResponse.json(emergency, { status: 201 }); }
  catch (error) { const message = error instanceof z.ZodError ? "Invalid emergency case" : error instanceof Error ? error.message : "Unable to create emergency case"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 409 }); }
}
export async function PATCH(request: NextRequest) {
  try { const user = await requirePermission(request, "emergency:write"); const { id, ...changes } = updateSchema.parse(await request.json()); const emergency = await EmergencyCase.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true }); if (!emergency) return NextResponse.json({ error: "Emergency case not found" }, { status: 404 }); await audit(user.firebaseUid, "emergency.updated", "EmergencyCase", id, { fields: Object.keys(changes) }); return NextResponse.json(emergency); }
  catch (error) { const message = error instanceof z.ZodError ? "Invalid emergency update" : error instanceof Error ? error.message : "Unable to update emergency case"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); }
}
