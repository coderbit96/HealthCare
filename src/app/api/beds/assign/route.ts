import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { audit } from "@/lib/audit";
import { assignAvailableBed } from "@/lib/bed-operations";
const schema = z.object({ bedId: z.string().length(24), patientId: z.string().length(24) });
export async function POST(request: NextRequest) { try { const user = await requirePermission(request, "beds:write"); const input = schema.parse(await request.json()); const assignment = await assignAvailableBed({ ...input, assignedBy: user.firebaseUid }); await audit(user.firebaseUid, "bed.assigned", "BedAssignment", String(assignment?._id ?? input.bedId), { bed: input.bedId, patient: input.patientId }); return NextResponse.json(assignment, { status: 201 }); } catch (error) { const message = error instanceof z.ZodError ? "Invalid bed assignment" : error instanceof Error ? error.message : "Unable to assign bed"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 409 }); } }
