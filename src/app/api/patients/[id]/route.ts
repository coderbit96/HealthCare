import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { connectToDatabase } from "@/lib/mongodb";
import { requirePermission } from "@/lib/server-auth";
import { Admission } from "@/models/Admission";
import { Appointment } from "@/models/Appointment";
import { InsurancePolicy } from "@/models/InsurancePolicy";
import { Invoice } from "@/models/Invoice";
import { LabOrder } from "@/models/LabOrder";
import { MedicalRecord } from "@/models/MedicalRecord";
import { Patient } from "@/models/Patient";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { Prescription } from "@/models/Prescription";
import { User } from "@/models/User";
import { Visit } from "@/models/Visit";
import { patientSchema } from "@/app/api/patients/route";

const idSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid patient id");
const updateSchema = patientSchema.partial().extend({ active: z.boolean().optional() });

async function patientId(context: RouteContext<"/api/patients/[id]">) {
  return idSchema.parse((await context.params).id);
}

export async function GET(request: NextRequest, context: RouteContext<"/api/patients/[id]">) {
  try {
    await requirePermission(request, "patients:read");
    await connectToDatabase();
    const id = await patientId(context);
    const patient = await Patient.findById(id).lean();
    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    const appointmentFilter = patient.email ? { $or: [{ patient: id }, { email: patient.email }] } : { patient: id };
    const [appointments, visits, admissions, prescriptions, clinicalRecords, labReports, invoices, payments, insurance] = await Promise.all([
      Appointment.find(appointmentFilter).sort({ preferredDate: -1 }).limit(100).lean(),
      Visit.find({ patient: id }).sort({ createdAt: -1 }).limit(100).lean(),
      Admission.find({ patient: id }).populate("ward", "name type").populate("room", "roomNumber").populate("bed", "bedNumber status").sort({ createdAt: -1 }).limit(100).lean(),
      Prescription.find({ patient: id }).sort({ createdAt: -1 }).limit(100).lean(),
      MedicalRecord.find({ patient: id }).sort({ visitDate: -1, createdAt: -1 }).limit(100).lean(),
      LabOrder.find({ patient: id }).sort({ createdAt: -1 }).limit(100).lean(),
      Invoice.find({ patient: id }).sort({ createdAt: -1 }).limit(100).lean(),
      PaymentTransaction.find({ patient: id }).sort({ createdAt: -1 }).limit(100).lean(),
      InsurancePolicy.find({ patient: id }).populate("provider", "name").sort({ createdAt: -1 }).limit(100).lean(),
    ]);
    return NextResponse.json({ patient, appointments, visits, admissions, prescriptions, clinicalRecords, labReports, invoices, payments, insurance });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid patient id" : error instanceof Error ? error.message : "Unable to load patient profile";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : message === "Invalid patient id" ? 400 : 401 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext<"/api/patients/[id]">) {
  try {
    const actor = await requirePermission(request, "patients:write");
    await connectToDatabase();
    const id = await patientId(context);
    const input = updateSchema.parse(await request.json());
    const update = {
      ...input,
      email: input.email || undefined,
      address: input.address || undefined,
      medicalHistory: input.medicalHistory || undefined,
    };
    const patient = await Patient.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true, strict: false }).lean();
    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    if (input.active !== undefined) {
      await User.updateMany({ patient: id, role: "patient" }, { $set: { active: input.active, status: input.active ? "active" : "inactive" } });
    }
    await audit(actor.firebaseUid, "patient.updated", "Patient", id, { fields: Object.keys(input) });
    return NextResponse.json(patient);
  } catch (error) {
    const message = error instanceof z.ZodError ? "Please check the patient details" : error instanceof Error ? error.message : "Unable to update patient";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
