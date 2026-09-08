import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { Department } from "@/models/Department";
const schema = z.object({ name: z.string().min(2), description: z.string().max(2000).optional(), image: z.url().optional(), icon: z.string().optional(), doctors: z.array(z.string()).default([]), nurses: z.array(z.string()).default([]), departmentHeadUid: z.string().optional(), rooms: z.array(z.string().length(24)).default([]), services: z.array(z.string()).default([]), active: z.boolean().default(true) });
export async function GET() { return NextResponse.json(await Department.find().sort({ name: 1 }).lean()); }
export async function POST(request: NextRequest) { try { await requirePermission(request, "settings:write"); return NextResponse.json(await Department.create(schema.parse(await request.json())), { status: 201 }); } catch (error) { const message = error instanceof z.ZodError ? "Invalid department" : error instanceof Error ? error.message : "Unable to create department"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); } }
