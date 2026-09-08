import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { Appointment } from "@/models/Appointment";
import { AuditLog } from "@/models/AuditLog";
const schema = z.object({ status: z.enum(["checked_in", "waiting", "in_consultation", "completed", "cancelled", "no_show"]) });
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const user = await requirePermission(request, "appointments:write"); const { status } = schema.parse(await request.json()); const { id } = await params; const before = await Appointment.findById(id).lean(); if (!before) return NextResponse.json({ error: "Appointment not found" }, { status: 404 }); const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true }); await AuditLog.create({ actorUid: user.firebaseUid, action: `opd.${status}`, entityType: "Appointment", entityId: id, before, after: appointment?.toObject() }); return NextResponse.json(appointment); } catch (error) { const message = error instanceof z.ZodError ? "Invalid OPD status" : error instanceof Error ? error.message : "Unable to update OPD"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); } }
