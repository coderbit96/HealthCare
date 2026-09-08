import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { InsuranceProvider } from "@/models/InsuranceProvider";
import { InsurancePolicy } from "@/models/InsurancePolicy";
const providerSchema = z.object({ name: z.string().min(2), contactEmail: z.email().optional(), contactPhone: z.string().optional() });
const policySchema = z.object({ patient: z.string().length(24), provider: z.string().length(24), policyNumber: z.string().min(3), validFrom: z.coerce.date().optional(), validUntil: z.coerce.date().optional(), coverage: z.number().min(0).optional() });
export async function GET(request: NextRequest) { try { await requirePermission(request, "billing:read"); return NextResponse.json({ providers: await InsuranceProvider.find().lean(), policies: await InsurancePolicy.find().lean() }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 }); } }
export async function POST(request: NextRequest) { try { await requirePermission(request, "billing:write"); const body = await request.json(); if (body.kind === "policy") return NextResponse.json(await InsurancePolicy.create(policySchema.parse(body)), { status: 201 }); return NextResponse.json(await InsuranceProvider.create(providerSchema.parse(body)), { status: 201 }); } catch (error) { const message = error instanceof z.ZodError ? "Invalid insurance data" : error instanceof Error ? error.message : "Unable to save insurance data"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); } }
