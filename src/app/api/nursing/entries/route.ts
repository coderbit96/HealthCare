import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { NursingEntry } from "@/models/NursingEntry";
const schema = z.object({ patient: z.string().length(24), visit: z.string().length(24).optional(), admission: z.string().length(24).optional(), type: z.enum(["medication", "note", "observation", "intake_output", "handover", "bedside_status"]), content: z.record(z.string(), z.unknown()) });
export async function POST(request: NextRequest) { try { const user = await requirePermission(request, "nursing-notes:write"); const entry = await NursingEntry.create({ ...schema.parse(await request.json()), creatorUid: user.firebaseUid }); return NextResponse.json(entry, { status: 201 }); } catch (error) { const message = error instanceof z.ZodError ? "Invalid nursing entry" : error instanceof Error ? error.message : "Unable to create nursing entry"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); } }
