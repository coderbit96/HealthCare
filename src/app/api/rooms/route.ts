import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { audit } from "@/lib/audit";
import { Room } from "@/models/Room";
import { Ward } from "@/models/Ward";

const createSchema = z.object({ ward: z.string().length(24), roomNumber: z.string().trim().min(1).max(50), active: z.boolean().default(true) });
const updateSchema = z.object({ id: z.string().length(24), roomNumber: z.string().trim().min(1).max(50).optional(), active: z.boolean().optional() });

export async function GET(request: NextRequest) {
  try { await requirePermission(request, "beds:read"); const ward = request.nextUrl.searchParams.get("ward"); return NextResponse.json(await Room.find(ward ? { ward } : {}).populate("ward", "name type").sort({ roomNumber: 1 }).lean()); }
  catch (error) { const message = error instanceof Error ? error.message : "Unable to load rooms"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 }); }
}

export async function POST(request: NextRequest) {
  try { const user = await requirePermission(request, "beds:write"); const input = createSchema.parse(await request.json()); if (!await Ward.exists({ _id: input.ward })) return NextResponse.json({ error: "Ward not found" }, { status: 404 }); const room = await Room.create(input); await audit(user.firebaseUid, "room.created", "Room", room._id.toString(), { ward: input.ward, roomNumber: input.roomNumber }); return NextResponse.json(room, { status: 201 }); }
  catch (error) { const message = error instanceof z.ZodError ? "Invalid room" : error instanceof Error ? error.message : "Unable to create room"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); }
}

export async function PATCH(request: NextRequest) {
  try { const user = await requirePermission(request, "beds:write"); const { id, ...changes } = updateSchema.parse(await request.json()); const room = await Room.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true }); if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 }); await audit(user.firebaseUid, "room.updated", "Room", id, { fields: Object.keys(changes) }); return NextResponse.json(room); }
  catch (error) { const message = error instanceof z.ZodError ? "Invalid room" : error instanceof Error ? error.message : "Unable to update room"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); }
}
