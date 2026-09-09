import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { audit } from "@/lib/audit";
import { Ward } from "@/models/Ward";

const createSchema = z.object({ name: z.string().trim().min(2).max(120), type: z.enum(["general", "private", "semi_private", "icu", "nicu", "ccu", "emergency"]), active: z.boolean().default(true) });
const updateSchema = createSchema.partial().extend({ id: z.string().length(24) });

export async function GET(request: NextRequest) {
  try { await requirePermission(request, "beds:read"); return NextResponse.json(await Ward.find().sort({ name: 1 }).lean()); }
  catch (error) { const message = error instanceof Error ? error.message : "Unable to load wards"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 }); }
}

export async function POST(request: NextRequest) {
  try { const user = await requirePermission(request, "beds:write"); const ward = await Ward.create(createSchema.parse(await request.json())); await audit(user.firebaseUid, "ward.created", "Ward", ward._id.toString(), { name: ward.name }); return NextResponse.json(ward, { status: 201 }); }
  catch (error) { const message = error instanceof z.ZodError ? "Invalid ward" : error instanceof Error ? error.message : "Unable to create ward"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); }
}

export async function PATCH(request: NextRequest) {
  try { const user = await requirePermission(request, "beds:write"); const { id, ...changes } = updateSchema.parse(await request.json()); const ward = await Ward.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true }); if (!ward) return NextResponse.json({ error: "Ward not found" }, { status: 404 }); await audit(user.firebaseUid, "ward.updated", "Ward", id, { fields: Object.keys(changes) }); return NextResponse.json(ward); }
  catch (error) { const message = error instanceof z.ZodError ? "Invalid ward" : error instanceof Error ? error.message : "Unable to update ward"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); }
}
