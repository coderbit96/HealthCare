import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server-auth";
import { Admission } from "@/models/Admission";
import { Appointment } from "@/models/Appointment";
import { Attendance } from "@/models/Attendance";
import { Invoice } from "@/models/Invoice";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { Patient } from "@/models/Patient";

const resources = { patients: Patient, appointments: Appointment, admissions: Admission, invoices: Invoice, payments: PaymentTransaction, attendance: Attendance } as const;
function csv(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
export async function GET(request: NextRequest) { try { await requirePermission(request, "reports:read"); const type = request.nextUrl.searchParams.get("type") as keyof typeof resources | null; if (!type || !resources[type]) return NextResponse.json({ error: "Choose patients, appointments, admissions, invoices, payments or attendance" }, { status: 400 }); const from = request.nextUrl.searchParams.get("from"); const to = request.nextUrl.searchParams.get("to"); const filter: Record<string, unknown> = {}; if (from || to) filter.createdAt = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(`${to}T23:59:59.999`) } : {}) }; const records = await resources[type].find(filter).sort({ createdAt: -1 }).limit(10_000).lean(); if (request.nextUrl.searchParams.get("format") !== "csv") return NextResponse.json({ type, count: records.length, records }); const keys = Array.from(new Set(records.flatMap((record) => Object.keys(record).filter((key) => !["_id", "__v"].includes(key))))); const rows = [keys.join(","), ...records.map((record) => keys.map((key) => csv(record[key as keyof typeof record] instanceof Date ? record[key as keyof typeof record]?.toISOString() : typeof record[key as keyof typeof record] === "object" ? JSON.stringify(record[key as keyof typeof record]) : record[key as keyof typeof record])).join(","))]; return new NextResponse(rows.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=${type}-report.csv` } }); } catch (error) { const message = error instanceof Error ? error.message : "Unable to create report"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 }); } }
