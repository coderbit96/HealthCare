import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { Counter } from "@/models/Counter";
import { BloodUnit } from "@/models/BloodUnit";
const schema = z.object({ donor: z.string().length(24).optional(), bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]), collectedAt: z.coerce.date(), expiresAt: z.coerce.date(), storage: z.string().optional() });
export async function GET(request: NextRequest) { try { await requirePermission(request, "blood-bank:write"); return NextResponse.json(await BloodUnit.find().lean()); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 }); } }
export async function POST(request: NextRequest) { try { await requirePermission(request, "blood-bank:write"); const input = schema.parse(await request.json()); const counter = await Counter.findOneAndUpdate({ key: "blood_unit" }, { $inc: { value: 1 } }, { upsert: true, new: true }); return NextResponse.json(await BloodUnit.create({ ...input, unitNumber: `BB-${String(counter.value).padStart(7, "0")}` }), { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid blood unit" }, { status: 400 }); } }
