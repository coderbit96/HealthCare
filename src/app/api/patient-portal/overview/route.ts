import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server-auth";
import { Appointment } from "@/models/Appointment";
import { Invoice } from "@/models/Invoice";
import { MedicalRecord } from "@/models/MedicalRecord";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { LabOrder } from "@/models/LabOrder";
export async function GET(request: NextRequest) { try { const user = await requirePermission(request, "patient-portal:read"); if (!user.patient) return NextResponse.json({ error: "Patient account is not linked to a patient profile" }, { status: 403 }); const patientId = user.patient.toString(); const [records, invoices, transactions, labReports] = await Promise.all([MedicalRecord.find({ patient: patientId }).select("diagnosis status createdAt prescriptions").sort({ createdAt: -1 }).lean(), Invoice.find({ patient: patientId }).sort({ createdAt: -1 }).lean(), PaymentTransaction.find({ patient: patientId }).sort({ createdAt: -1 }).lean(), LabOrder.find({ patient: patientId, reportStatus: "published" }).select("orderNumber tests publishedAt").sort({ publishedAt: -1 }).lean()]); return NextResponse.json({ patientId, records, invoices, transactions, labReports, appointments: await Appointment.find({ email: user.email }).sort({ preferredDate: -1 }).lean() }); } catch (error) { const message = error instanceof Error ? error.message : "Unable to load patient information"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 }); } }
