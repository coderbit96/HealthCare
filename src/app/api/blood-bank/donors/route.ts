import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/server-auth";
import { BloodDonor } from "@/models/BloodDonor";
const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const schema = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().trim().max(30).optional(), bloodGroup: z.enum(groups), eligible: z.boolean().default(true) });
export async function GET(request: NextRequest) { try { await requirePermission(request, "blood-bank:write"); return NextResponse.json(await BloodDonor.find().sort({ createdAt: -1 }).limit(200).lean()); } catch (error) { const message = error instanceof Error ? error.message : "Unable to load donors"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 }); } }
export async function POST(request: NextRequest) { try { const user = await requirePermission(request, "blood-bank:write"); const donor = await BloodDonor.create(schema.parse(await request.json())); await audit(user.firebaseUid, "blood.donor_registered", "BloodDonor", donor._id.toString()); return NextResponse.json(donor, { status: 201 }); } catch (error) { const message = error instanceof z.ZodError ? "Invalid donor" : error instanceof Error ? error.message : "Unable to register donor"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); } }
