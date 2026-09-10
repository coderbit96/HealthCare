import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/server-auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Admission } from "@/models/Admission";
import { Appointment } from "@/models/Appointment";
import { Attendance } from "@/models/Attendance";
import { Bed } from "@/models/Bed";
import { EmergencyCase } from "@/models/EmergencyCase";
import { Invoice } from "@/models/Invoice";
import { LabOrder } from "@/models/LabOrder";
import { LeaveRequest } from "@/models/LeaveRequest";
import { Medicine } from "@/models/Medicine";
import { Patient } from "@/models/Patient";
import { PharmacySale } from "@/models/PharmacySale";
import { Visit } from "@/models/Visit";

type Point = { label: string; value: number };

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function daySeries(days: number) {
  const today = startOfDay();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));
    return { key: dateKey(date), label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date) };
  });
}

function monthSeries(months: number) {
  const today = startOfDay();
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (months - index - 1), 1);
    return { key: date.toISOString().slice(0, 7), label: new Intl.DateTimeFormat("en", { month: "short" }).format(date) };
  });
}

function fillSeries(series: { key: string; label: string }[], rows: { _id: string; value: number }[]): Point[] {
  const values = new Map(rows.map((row) => [row._id, row.value]));
  return series.map(({ key, label }) => ({ label, value: values.get(key) ?? 0 }));
}

async function requireAdministrator(request: NextRequest) {
  const user = await getRequestUser(request);
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdministrator(request);
    await connectToDatabase();

    const today = startOfDay();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const todayKey = dateKey(today);
    const onDutyMatch = { date: todayKey, status: { $in: ["present", "late"] }, checkIn: { $exists: true }, checkOut: { $exists: false } };

    const [
      totalActivePatients,
      newPatientsToday,
      todayAppointments,
      waitingPatients,
      onDutyStaff,
      currentAdmissions,
      availableBeds,
      emergencyCases,
      todayRevenue,
      outstandingPayments,
      pendingLabReports,
      lowStockMedicines,
      pendingLeaveRequests,
      criticalEmergencyCases,
      availableIcuBeds,
      registrationRows,
      appointmentRows,
      revenueRows,
      departmentRows,
      bedRows,
      visitRows,
      labRows,
      pharmacyRows,
      emergencyRows,
    ] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Appointment.countDocuments({ preferredDate: { $gte: today, $lt: tomorrow }, status: { $nin: ["cancelled", "no_show"] } }),
      Appointment.countDocuments({ status: "waiting" }),
      Attendance.aggregate<{ _id: string; count: number }>([
        { $match: onDutyMatch },
        { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "account" } },
        { $unwind: "$account" },
        { $match: { "account.active": true, "account.status": "active", "account.role": { $in: ["doctor", "nurse"] } } },
        { $group: { _id: "$account.role", count: { $sum: 1 } } },
      ]),
      Admission.countDocuments({ status: "admitted" }),
      Bed.countDocuments({ status: "available" }),
      EmergencyCase.countDocuments({ status: "active" }),
      Invoice.aggregate<{ total: number }>([
        { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: "$paid" } } },
      ]),
      Invoice.aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: "$due" } } }]),
      LabOrder.countDocuments({ reportStatus: { $in: ["draft"] } }),
      Medicine.aggregate<{ count: number }>([
        { $match: { active: true, reorderLevel: { $gt: 0 } } },
        { $lookup: { from: "medicinebatches", localField: "_id", foreignField: "medicine", as: "batches" } },
        { $addFields: { stockQuantity: { $sum: "$batches.quantity" } } },
        { $match: { $expr: { $lte: ["$stockQuantity", "$reorderLevel"] } } },
        { $count: "count" },
      ]),
      LeaveRequest.countDocuments({ status: "pending" }),
      EmergencyCase.countDocuments({ status: "active", triage: "critical" }),
      Bed.aggregate<{ count: number }>([
        { $match: { status: "available" } },
        { $lookup: { from: "wards", localField: "ward", foreignField: "_id", as: "wardInfo" } },
        { $unwind: "$wardInfo" },
        { $match: { "wardInfo.type": "icu" } },
        { $count: "count" },
      ]),
      Patient.aggregate<{ _id: string; value: number }>([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, value: { $sum: 1 } } },
      ]),
      Appointment.aggregate<{ _id: string; value: number }>([
        { $match: { preferredDate: { $gte: sevenDaysAgo, $lt: tomorrow }, status: { $nin: ["cancelled", "no_show"] } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$preferredDate" } }, value: { $sum: 1 } } },
      ]),
      Invoice.aggregate<{ _id: string; value: number }>([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, value: { $sum: "$paid" } } },
      ]),
      Appointment.aggregate<{ _id: string; value: number }>([
        { $match: { preferredDate: { $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) }, status: { $nin: ["cancelled", "no_show"] } } },
        { $group: { _id: "$department", value: { $sum: 1 } } },
        { $sort: { value: -1 } },
        { $limit: 6 },
      ]),
      Bed.aggregate<{ _id: string; value: number }>([{ $group: { _id: "$status", value: { $sum: 1 } } }]),
      Visit.aggregate<{ _id: string; value: number }>([
        { $match: { createdAt: { $gte: sevenDaysAgo }, type: { $in: ["opd", "ipd"] } } },
        { $group: { _id: "$type", value: { $sum: 1 } } },
      ]),
      LabOrder.aggregate<{ _id: string; value: number }>([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $unwind: "$tests" },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, value: { $sum: 1 } } },
      ]),
      PharmacySale.aggregate<{ _id: string; value: number }>([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, value: { $sum: "$total" } } },
      ]),
      EmergencyCase.aggregate<{ _id: string; value: number }>([
        { $match: { arrivalAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$arrivalAt" } }, value: { $sum: 1 } } },
      ]),
    ]);

    const doctorsOnDuty = onDutyStaff.find((item) => item._id === "doctor")?.count ?? 0;
    const nursesOnDuty = onDutyStaff.find((item) => item._id === "nurse")?.count ?? 0;
    const occupancyRows = bedRows.map((item) => ({ label: item._id, value: item.value }));
    const departmentPatients = departmentRows.map((item) => ({ label: item._id || "Unassigned", value: item.value }));
    const opdIpd = ["opd", "ipd"].map((type) => ({ label: type.toUpperCase(), value: visitRows.find((item) => item._id === type)?.value ?? 0 }));

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      kpis: {
        totalActivePatients,
        newPatientsToday,
        todayAppointments,
        waitingPatients,
        doctorsOnDuty,
        nursesOnDuty,
        currentAdmissions,
        availableBeds,
        emergencyCases,
        todayRevenue: todayRevenue[0]?.total ?? 0,
        outstandingPayments: outstandingPayments[0]?.total ?? 0,
        pendingLabReports,
        lowStockMedicines: lowStockMedicines[0]?.count ?? 0,
      },
      alerts: [
        { label: `${availableIcuBeds[0]?.count ?? 0} ICU beds available`, tone: "info", module: "Ward & Bed overview" },
        { label: `${pendingLabReports} lab reports awaiting verification`, tone: "warning", module: "Laboratory" },
        { label: `${lowStockMedicines[0]?.count ?? 0} medicines below reorder level`, tone: "warning", module: "Pharmacy" },
        { label: `${pendingLeaveRequests} staff leave requests pending`, tone: "info", module: "Leave" },
        { label: `${criticalEmergencyCases} emergency cases critical`, tone: "critical", module: "Emergency overview" },
        { label: `${String.fromCharCode(0x20b9)}${(outstandingPayments[0]?.total ?? 0).toLocaleString("en-IN")} outstanding payments`, tone: "warning", module: "Billing" },
      ],
      charts: {
        registrations: fillSeries(monthSeries(6), registrationRows),
        appointments: fillSeries(daySeries(7), appointmentRows),
        revenue: fillSeries(monthSeries(6), revenueRows),
        departmentPatients,
        bedOccupancy: occupancyRows,
        opdIpd,
        labVolume: fillSeries(daySeries(7), labRows),
        pharmacySales: fillSeries(daySeries(7), pharmacyRows),
        emergencyCases: fillSeries(daySeries(7), emergencyRows),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the administrator dashboard";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 503 });
  }
}
