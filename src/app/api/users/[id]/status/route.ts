import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { User } from "@/models/User";
import { audit } from "@/lib/audit";
const schema = z.object({ active: z.boolean() });
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { const actor = await requirePermission(request, "users:write"); const { active } = schema.parse(await request.json()); const { id } = await params; const user = await User.findByIdAndUpdate(id, { active, status: active ? "active" : "inactive" }, { new: true }).select("name email role active").lean(); if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 }); if (user._id.toString() === actor.id && !active) return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 }); await audit(actor.firebaseUid, active ? "user.activated" : "user.deactivated", "User", id, { active }); return NextResponse.json(user); }
  catch (error) { const message = error instanceof Error ? error.message : "Unable to update user"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); }
}
