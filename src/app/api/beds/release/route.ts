import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { audit } from "@/lib/audit";
import { releaseAssignedBed } from "@/lib/bed-operations";
const schema = z.object({ bedId: z.string().length(24), reason: z.string().max(300).optional() });
export async function POST(request: NextRequest) { try { const user = await requirePermission(request, "beds:write"); const input = schema.parse(await request.json()); const released = await releaseAssignedBed({ ...input, releasedBy: user.firebaseUid }); await audit(user.firebaseUid, "bed.released", "BedAssignment", String(released?._id ?? input.bedId), { bed: input.bedId, reason: input.reason }); return NextResponse.json(released); } catch (error) { const message = error instanceof z.ZodError ? "Invalid release request" : error instanceof Error ? error.message : "Unable to release bed"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 409 }); } }
