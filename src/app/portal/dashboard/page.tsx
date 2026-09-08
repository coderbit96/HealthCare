import { redirect } from "next/navigation";
import { PortalDashboard } from "@/components/portal/portal-dashboard";
import { ClinicalDashboard } from "@/components/clinical/clinical-dashboard";
import { ReceptionDashboard } from "@/components/reception/reception-dashboard";
import { HrDashboard } from "@/components/hr/hr-dashboard";
import { LabDashboard } from "@/components/lab/lab-dashboard";
import { PharmacyDashboard } from "@/components/pharmacy/pharmacy-dashboard";
import { getServerSessionUser } from "@/lib/server-auth";
import { hasPermission } from "@/lib/roles";
export const metadata = { title: "Operations portal | Health Care .Pvt .Ltd" };
export default async function Dashboard() { const user = await getServerSessionUser(); if (!user) redirect("/portal/login"); if (user.role === "patient") redirect("/portal/patient"); if (!hasPermission(user.role, "dashboard:read", user.permissions)) redirect("/portal/access-denied"); if (user.role === "doctor" || user.role === "nurse") return <ClinicalDashboard user={user} />; if (user.role === "receptionist") return <ReceptionDashboard user={user} />; if (user.role === "hr") return <HrDashboard user={user} />; if (user.role === "lab_technician") return <LabDashboard user={user} />; if (user.role === "pharmacist") return <PharmacyDashboard user={user} />; return <PortalDashboard user={user} />; }
