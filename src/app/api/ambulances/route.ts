import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { Ambulance } from "@/models/Ambulance";
const schema = z.object({ vehicleNumber: z.string().min(4), driver: z.string().optional(), phone: z.string().optional(), status: z.enum(["available", "on_trip", "returning", "maintenance"]).default("available") });
export async function GET(request: NextRequest) { try { await requirePermission(request, "ambulance:write"); return NextResponse.json(await Ambulance.find().lean()); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 }); } }
export async function POST(request: NextRequest) { try { await requirePermission(request, "ambulance:write"); return NextResponse.json(await Ambulance.create(schema.parse(await request.json())), { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid ambulance" }, { status: 400 }); } }
