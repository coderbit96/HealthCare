import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server-auth";
import { Appointment } from "@/models/Appointment";
import { Invoice } from "@/models/Invoice";
import { MedicalRecord } from "@/models/MedicalRecord";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { LabOrder } from "@/models/LabOrder";
import { Admission } from "@/models/Admission";
import { Patient } from "@/models/Patient";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "patient-portal:read");
    if (!user.patient) return NextResponse.json({ error: "Patient account is not linked to a patient profile" }, { status: 403 });

    const patientId = user.patient.toString();
    const [profile, records, invoices, transactions, labReports, appointments, admissions] = await Promise.all([
      Patient.findById(patientId).select("patientId uhid name phone dateOfBirth gender address emergencyContact allergies medicalHistory documents active").lean(),
      MedicalRecord.find({ patient: patientId }).select("diagnosis status visitDate prescriptions dischargeSummary createdAt").sort({ visitDate: -1 }).lean(),
      Invoice.find({ patient: patientId }).sort({ createdAt: -1 }).lean(),
      PaymentTransaction.find({ patient: patientId }).sort({ createdAt: -1 }).lean(),
      LabOrder.find({ patient: patientId, reportStatus: "published" }).select("orderNumber tests publishedAt").sort({ publishedAt: -1 }).lean(),
      Appointment.find({ $or: [{ patient: patientId }, { email: user.email }] }).sort({ preferredDate: -1 }).lean(),
      Admission.find({ patient: patientId }).select("admissionNumber reason diagnosis status dischargedAt dischargeSummary createdAt").sort({ createdAt: -1 }).lean(),
    ]);

    return NextResponse.json({ patientId, profile, records, invoices, transactions, labReports, appointments, admissions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load patient information";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
  }
}
