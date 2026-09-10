import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/server-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { BloodStock } from "@/models/BloodStock";
import { BloodUnit } from "@/models/BloodUnit";
const schema = z.object({ unit: z.string().length(24), patient: z.string().length(24) });
export async function POST(request: NextRequest) { try { const user = await requirePermission(request, "blood-bank:write"); const input = schema.parse(await request.json()); const db = await connectToDatabase(); const session = await db.startSession(); let unit; try { await session.withTransaction(async () => { unit = await BloodUnit.findOneAndUpdate({ _id: input.unit, status: "available", expiresAt: { $gt: new Date() } }, { $set: { status: "issued", issue: { patient: input.patient, issuedAt: new Date(), issuedBy: user.firebaseUid } } }, { new: true, session }); if (!unit) throw new Error("Blood unit is unavailable or expired"); const stock = await BloodStock.findOneAndUpdate({ bloodGroup: unit.bloodGroup, availableUnits: { $gt: 0 } }, { $inc: { availableUnits: -1 }, $set: { updatedBy: user.firebaseUid } }, { new: true, session }); if (!stock) throw new Error("Blood stock is inconsistent; issue was not completed"); }); } finally { await session.endSession(); } await audit(user.firebaseUid, "blood.issued", "BloodUnit", input.unit, { patient: input.patient }); return NextResponse.json(unit); } catch (error) { const message = error instanceof z.ZodError ? "Invalid blood issue" : error instanceof Error ? error.message : "Unable to issue blood"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 409 }); } }
