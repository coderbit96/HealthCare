import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { Shift } from "@/models/Shift";

const schema = z.object({ name: z.string().trim().min(2).max(80), startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), department: z.string().trim().max(120).optional(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }).refine((value) => value.endTime > value.startTime, "Shift must end after it starts");

export async function GET(request: NextRequest) {
  try { await requirePermission(request, "employees:read"); return NextResponse.json(await Shift.find().sort({ date: -1, name: 1 }).limit(200).lean()); }
  catch (error) { const message = error instanceof Error ? error.message : "Unable to load shifts"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 }); }
}

export async function POST(request: NextRequest) {
  try { await requirePermission(request, "employees:write"); return NextResponse.json(await Shift.create(schema.parse(await request.json())), { status: 201 }); }
  catch (error) { const message = error instanceof z.ZodError ? error.issues[0]?.message ?? "Invalid shift" : error instanceof Error ? error.message : "Unable to create shift"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); }
}
