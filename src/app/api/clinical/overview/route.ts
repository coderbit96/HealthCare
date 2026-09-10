import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server-auth";
import { Admission } from "@/models/Admission";
import { Appointment } from "@/models/Appointment";
import { EmergencyCase } from "@/models/EmergencyCase";
import { LabOrder } from "@/models/LabOrder";
import { Prescription } from "@/models/Prescription";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "clinical:read");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const [consultations, opd, ipdCensus, criticalPatients, pendingConsultations, admissions, discharges, labOrders, prescriptions, workload] = await Promise.all([
      Appointment.countDocuments({ preferredDate: { $gte: today, $lt: tomorrow }, status: { $in: ["in_consultation", "completed"] } }),
      Appointment.aggregate([{ $match: { preferredDate: { $gte: today, $lt: tomorrow } } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Admission.countDocuments({ status: { $in: ["admitted", "transferred"] } }),
      EmergencyCase.countDocuments({ status: "active", triage: "critical" }),
      Appointment.countDocuments({ preferredDate: { $gte: today, $lt: tomorrow }, status: { $in: ["checked_in", "waiting"] } }),
      Admission.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Admission.countDocuments({ status: "discharged", dischargedAt: { $gte: today, $lt: tomorrow } }),
      LabOrder.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Prescription.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Appointment.aggregate([{ $match: { preferredDate: { $gte: today, $lt: tomorrow } } }, { $group: { _id: "$doctor", appointments: { $sum: 1 }, waiting: { $sum: { $cond: [{ $eq: ["$status", "waiting"] }, 1, 0] } } } }, { $sort: { appointments: -1 } }, { $limit: 12 }]),
    ]);
    return NextResponse.json({ consultations, opdLoad: opd, ipdCensus, criticalPatients, pendingConsultations, admissions, discharges, labOrders, prescriptions, doctorWorkload: workload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load clinical overview";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
  }
}
