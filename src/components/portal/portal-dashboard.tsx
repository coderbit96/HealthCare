"use client";

import { signOut } from "firebase/auth";
import {
  Activity,
  ArrowLeft,
  BadgeAlert,
  BedDouble,
  CalendarDays,
  CircleDollarSign,
  CircleUserRound,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ClipboardPlus,
  FileBarChart,
  FlaskConical,
  HeartPulse,
  LogOut,
  Menu,
  Moon,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Siren,
  Stethoscope,
  Sun,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { auth } from "@/lib/firebase";
import { hasPermission, ROLE_LABELS, ROLES } from "@/lib/roles";
import type { AuthenticatedUser } from "@/lib/server-auth";
import { PatientMasterWorkspace } from "@/components/portal/patient-master-workspace";
import { StaffManagementWorkspace } from "@/components/portal/staff-management-workspace";
import { LeaveManagementWorkspace, PayrollManagementWorkspace } from "@/components/portal/leave-payroll-workspace";

const visitData = [
  { day: "Mon", visits: 38 },
  { day: "Tue", visits: 51 },
  { day: "Wed", visits: 45 },
  { day: "Thu", visits: 62 },
  { day: "Fri", visits: 57 },
  { day: "Sat", visits: 35 },
  { day: "Sun", visits: 28 },
];

type ChartPoint = { label: string; value: number };

type AdminOverview = {
  generatedAt: string;
  kpis: {
    totalActivePatients: number;
    newPatientsToday: number;
    todayAppointments: number;
    waitingPatients: number;
    doctorsOnDuty: number;
    nursesOnDuty: number;
    currentAdmissions: number;
    availableBeds: number;
    emergencyCases: number;
    todayRevenue: number;
    outstandingPayments: number;
    pendingLabReports: number;
    lowStockMedicines: number;
  };
  alerts: { label: string; tone: "info" | "warning" | "critical"; module: string }[];
  charts: {
    registrations: ChartPoint[];
    appointments: ChartPoint[];
    revenue: ChartPoint[];
    departmentPatients: ChartPoint[];
    bedOccupancy: ChartPoint[];
    opdIpd: ChartPoint[];
    labVolume: ChartPoint[];
    pharmacySales: ChartPoint[];
    emergencyCases: ChartPoint[];
  };
};

const numberFormat = new Intl.NumberFormat("en-IN");
const moneyFormat = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const staffModules = [
  { icon: Activity, label: "Overview" },
  { icon: CalendarDays, label: "Appointments" },
  { icon: UsersRound, label: "Patients" },
  { icon: ClipboardList, label: "Clinical records" },
  { icon: CalendarDays, label: "Leave" },
];

const adminGroups = [
  {
    label: "People & staff",
    items: [
      "Patients",
      "Doctors",
      "Nurses",
      "Receptionists",
      "HR Staff",
      "Lab Technicians",
      "Pharmacists",
      "Employees",
      "Attendance",
      "Leave",
      "Payroll",
    ],
  },
  {
    label: "Clinical operations",
    items: [
      "Departments",
      "Appointments",
      "OPD",
      "IPD",
      "Clinical overview",
      "Ward & Bed overview",
      "Emergency overview",
      "Ambulance",
      "Blood Bank",
      "Operation Theatre",
    ],
  },
  {
    label: "Services & finance",
    items: ["Laboratory", "Pharmacy", "Billing", "Payments", "Insurance", "Inventory"],
  },
  {
    label: "Administration",
    items: [
      "Reports",
      "Analytics",
      "Notifications",
      "Website CMS",
      "Users",
      "Roles & Permissions",
      "Audit Logs",
      "Hospital Settings",
      "System Settings",
    ],
  },
];

function moduleDescription(module: string) {
  const descriptions: Record<string, string> = {
    Patients: "Review patient information and coordinate care activity.",
    Doctors: "Manage doctor profiles, schedules and clinical access.",
    Nurses: "Manage nursing teams and assigned care areas.",
    Appointments: "Review appointments, availability and daily patient flow.",
    Departments: "Organise hospital departments and their services.",
    Laboratory: "Monitor laboratory requests, results and reporting activity.",
    Pharmacy: "Review medicine inventory and dispensing activity.",
    Billing: "Review invoices, payments and outstanding balances.",
    Payments: "Track received payments and payment status.",
    Insurance: "Review insurance providers and claim activity.",
    Employees: "Manage employee records and access.",
    Reports: "Review operational reports across hospital services.",
    Analytics: "Monitor trends and key hospital performance indicators.",
    Notifications: "Review important operational notifications.",
    "Hospital Settings": "Manage hospital-level configuration and service settings.",
    "System Settings": "Manage system-wide configuration settings.",
  };

  return descriptions[module] ?? `Open ${module.toLowerCase()} tools and review related hospital operations.`;
}

type JsonRecord = Record<string, unknown>;

type ModuleResource = {
  endpoint?: string;
  description: string;
  filter?: (record: JsonRecord) => boolean;
  staticItems?: JsonRecord[];
};

const moduleResources: Record<string, ModuleResource> = {
  Patients: { endpoint: "/api/patients", description: "Searchable patient records and UHIDs." },
  Doctors: { endpoint: "/api/users", description: "Active doctor accounts and access status.", filter: (record) => record.role === "doctor" },
  Nurses: { endpoint: "/api/users", description: "Active nursing team accounts.", filter: (record) => record.role === "nurse" },
  Receptionists: { endpoint: "/api/users", description: "Reception and front-desk accounts.", filter: (record) => record.role === "receptionist" },
  "HR Staff": { endpoint: "/api/users", description: "Human resources team accounts.", filter: (record) => record.role === "hr" },
  "Lab Technicians": { endpoint: "/api/users", description: "Laboratory technician accounts.", filter: (record) => record.role === "lab_technician" },
  Pharmacists: { endpoint: "/api/users", description: "Pharmacy team accounts.", filter: (record) => record.role === "pharmacist" },
  Employees: { endpoint: "/api/employees", description: "Employee profiles, departments and employment status." },
  Attendance: { endpoint: "/api/attendance", description: "Staff attendance records." },
  Leave: { endpoint: "/api/leaves", description: "Staff leave requests and decisions." },
  Payroll: { endpoint: "/api/payroll", description: "Payroll records by staff member and pay period." },
  Departments: { endpoint: "/api/departments", description: "Hospital departments and available services." },
  Appointments: { endpoint: "/api/appointments", description: "Scheduled and requested appointments." },
  OPD: { endpoint: "/api/appointments", description: "Outpatient appointment queue and statuses." },
  IPD: { endpoint: "/api/admissions", description: "Active and recent inpatient admissions." },
  "Clinical overview": { endpoint: "/api/clinical/overview", description: "Read-only administrator monitoring for consultations, admissions, diagnostics and doctor workload." },
  "Ward & Bed overview": { endpoint: "/api/beds", description: "Bed availability, occupancy and active assignments." },
  "Emergency overview": { endpoint: "/api/emergency?status=active", description: "Active emergency cases requiring attention." },
  Ambulance: { endpoint: "/api/ambulances", description: "Ambulance fleet status." },
  "Blood Bank": { endpoint: "/api/blood-bank/units", description: "Available blood-unit records." },
  "Operation Theatre": { endpoint: "/api/ot/surgeries", description: "Scheduled operation theatre procedures." },
  Laboratory: { endpoint: "/api/lab/orders", description: "Laboratory orders, sample progress and reporting status." },
  Pharmacy: { endpoint: "/api/pharmacy/medicines", description: "Medicine catalogue, stock and reorder status." },
  Billing: { endpoint: "/api/invoices", description: "Invoices, balances and billing status." },
  Payments: { endpoint: "/api/payments", description: "Payment transaction history." },
  Insurance: { endpoint: "/api/insurance/providers", description: "Insurance providers and policies." },
  Inventory: { endpoint: "/api/inventory/items", description: "Hospital inventory and reorder levels." },
  Reports: { endpoint: "/api/analytics/overview?range=30d", description: "Operational reporting for the last 30 days." },
  Analytics: { endpoint: "/api/analytics/overview?range=7d", description: "Seven-day hospital performance summary." },
  Notifications: { endpoint: "/api/notifications", description: "Notifications for the current administrator." },
  "Website CMS": { endpoint: "/api/cms/content", description: "Published and draft website content." },
  Users: { endpoint: "/api/users", description: "Authorised portal user accounts." },
  "Roles & Permissions": {
    description: "Role access is enforced on the server for every protected action.",
    staticItems: ROLES.filter((role) => role !== "patient").map((role) => ({ role: ROLE_LABELS[role], access: role === "admin" ? "Full administrative access" : "Role-based clinical access" })),
  },
  "Audit Logs": { endpoint: "/api/audit-logs", description: "Immutable operational audit trail." },
  "Hospital Settings": { endpoint: "/api/settings?scope=hospital", description: "Hospital-level configuration records." },
  "System Settings": { endpoint: "/api/settings?scope=system", description: "System configuration records." },
};

export function PortalDashboard({ user }: { user: AuthenticatedUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(user.profileImage);
  const [darkTheme, setDarkTheme] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(user.role === "admin" ? [] : ["Workspace"]);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [stats, setStats] = useState<{
    todayAppointments: number;
    pendingAppointments: number;
    patients: number;
  }>();
  const [adminOverview, setAdminOverview] = useState<AdminOverview>();
  const [dashboardLoading, setDashboardLoading] = useState(user.role === "admin");
  const [dashboardError, setDashboardError] = useState<string>();
  const [dashboardRefresh, setDashboardRefresh] = useState(0);

  const navigationGroups = user.role === "admin"
    ? adminGroups
    : [{ label: "Workspace", items: staffModules.map((module) => module.label) }];
  const selectableModules = new Set(["Dashboard", ...navigationGroups.flatMap((group) => group.items)]);
  const requestedModule = searchParams.get("module") ?? "Dashboard";
  const activeModule = selectableModules.has(requestedModule) ? requestedModule : "Dashboard";

  /* Legacy staff dashboard cards retained for context while administrator cards use live operational data.
  const cards = [
    { label: "Today's appointments", value: stats?.todayAppointments ?? "—", icon: CalendarDays },
    { label: "Registered patients", value: stats?.patients ?? "—", icon: UsersRound },
    { label: "Awaiting confirmation", value: stats?.pendingAppointments ?? "—", icon: ClipboardList },
    { label: "Clinical occupancy", value: "76%", icon: Activity },
  ];
  */

  const cards = user.role === "admin" && adminOverview
    ? [
        { label: "Total active patients", value: numberFormat.format(adminOverview.kpis.totalActivePatients), icon: UsersRound },
        { label: "New patients today", value: numberFormat.format(adminOverview.kpis.newPatientsToday), icon: UserPlus },
        { label: "Today's appointments", value: numberFormat.format(adminOverview.kpis.todayAppointments), icon: CalendarDays },
        { label: "Waiting patients", value: numberFormat.format(adminOverview.kpis.waitingPatients), icon: ClipboardList },
        { label: "Doctors on duty", value: numberFormat.format(adminOverview.kpis.doctorsOnDuty), icon: Stethoscope },
        { label: "Nurses on duty", value: numberFormat.format(adminOverview.kpis.nursesOnDuty), icon: HeartPulse },
        { label: "Current admissions", value: numberFormat.format(adminOverview.kpis.currentAdmissions), icon: BedDouble },
        { label: "Available beds", value: numberFormat.format(adminOverview.kpis.availableBeds), icon: BedDouble },
        { label: "Emergency cases", value: numberFormat.format(adminOverview.kpis.emergencyCases), icon: Siren },
        { label: "Today's revenue", value: moneyFormat.format(adminOverview.kpis.todayRevenue), icon: CircleDollarSign },
        { label: "Outstanding payments", value: moneyFormat.format(adminOverview.kpis.outstandingPayments), icon: BadgeAlert },
        { label: "Pending lab reports", value: numberFormat.format(adminOverview.kpis.pendingLabReports), icon: FlaskConical },
        { label: "Low-stock medicines", value: numberFormat.format(adminOverview.kpis.lowStockMedicines), icon: PackageSearch },
      ]
    : [
        { label: "Today's appointments", value: stats?.todayAppointments ?? "—", icon: CalendarDays },
        { label: "Registered patients", value: stats?.patients ?? "—", icon: UsersRound },
        { label: "Awaiting confirmation", value: stats?.pendingAppointments ?? "—", icon: ClipboardList },
        { label: "Clinical occupancy", value: "—", icon: Activity },
      ];

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setDashboardError(undefined);
      if (user.role === "admin") setDashboardLoading(true);

      try {
        const endpoint = user.role === "admin" ? "/api/admin/dashboard/overview" : "/api/portal/summary";
        const response = await fetch(endpoint);
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Unable to load dashboard data.");
        if (cancelled) return;
        if (user.role === "admin") setAdminOverview(payload as AdminOverview);
        else setStats(payload as { todayAppointments: number; pendingAppointments: number; patients: number });
      } catch (error) {
        if (!cancelled) setDashboardError(error instanceof Error ? error.message : "Unable to load dashboard data.");
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    };

    void loadDashboard();
    const interval = user.role === "admin" ? window.setInterval(loadDashboard, 60_000) : undefined;
    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, [dashboardRefresh, user.role]);

  useEffect(() => {
    let cancelled = false;
    const loadProfileImage = async () => {
      try {
        const response = await fetch("/api/admin/profile");
        if (!response.ok) return;
        const profile: unknown = await response.json();
        if (!cancelled && typeof profile === "object" && profile && "profileImage" in profile && typeof profile.profileImage === "string") {
          setProfileImage(profile.profileImage || undefined);
        }
      } catch {
        // The server-rendered user data remains a safe fallback if the profile refresh fails.
      }
    };

    void loadProfileImage();
    return () => { cancelled = true; };
  }, []);

  const selectModule = (label: string, group?: string) => {
    if (group) {
      setExpandedGroups((current) => (current.includes(group) ? current : [...current, group]));
      setCollapsedGroups((current) => current.filter((item) => item !== group));
    }
    router.push(label === "Dashboard" ? "/portal/dashboard" : `/portal/dashboard?module=${encodeURIComponent(label)}`);
    setMenuOpen(false);
  };

  const toggleGroup = (label: string, currentlyExpanded: boolean) => {
    if (currentlyExpanded) {
      setCollapsedGroups((current) => (current.includes(label) ? current : [...current, label]));
      return;
    }

    setCollapsedGroups((current) => current.filter((group) => group !== label));
    setExpandedGroups((current) => (current.includes(label) ? current : [...current, label]));
  };

  const logout = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    if (auth) await signOut(auth);
    router.replace("/login");
  };

  const navigation = (location: "desktop" | "mobile") => (
    <nav className="mt-7 grid gap-1" aria-label={`${user.role} sections`}>
      <button
        type="button"
        onClick={() => selectModule("Dashboard")}
        aria-current={activeModule === "Dashboard" ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
          activeModule === "Dashboard"
            ? "bg-brand-soft font-semibold text-brand-strong"
            : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
        }`}
      >
        <Activity size={18} />
        Dashboard
      </button>

      {navigationGroups.map((group) => {
        const isExpanded = !collapsedGroups.includes(group.label) && (expandedGroups.includes(group.label) || group.items.includes(activeModule));
        const groupId = `${location}-${group.label.replaceAll(/[^a-z0-9]/gi, "-").toLowerCase()}`;

        return (
          <div className="pt-2" key={group.label}>
            <button
              type="button"
              onClick={() => toggleGroup(group.label, isExpanded)}
              aria-expanded={isExpanded}
              aria-controls={groupId}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold uppercase tracking-[.12em] text-ink-subtle transition hover:bg-surface-sunken hover:text-brand-strong"
            >
              {group.label}
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isExpanded && (
              <div className="mt-1 grid gap-1 border-l border-line pl-2" id={groupId}>
                {group.items.map((label) => {
                  const Icon = label === "Appointments" ? CalendarDays : ClipboardList;
                  const isActive = activeModule === label;

                  return (
                    <button
                      type="button"
                      key={label}
                      onClick={() => selectModule(label, group.label)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                        isActive
                          ? "bg-brand-soft font-semibold text-brand-strong"
                          : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className={`min-h-screen bg-canvas text-ink ${darkTheme ? "portal-dark" : ""}`}>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden overflow-y-auto border-r border-line bg-white p-5 transition-[width] duration-300 md:block ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarCollapsed ? (
          <div className="flex h-full flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              aria-label="Expand navigation panel"
              title="Expand navigation panel"
              className="grid size-10 place-items-center rounded-xl bg-brand text-white shadow-sm transition hover:bg-brand-strong"
            >
              <PanelLeftOpen size={20} />
            </button>
            <button
              type="button"
              onClick={() => selectModule("Dashboard")}
              aria-label="Open dashboard"
              title="Dashboard"
              className={`grid size-10 place-items-center rounded-xl transition ${
                activeModule === "Dashboard" ? "bg-brand-soft text-brand-strong" : "text-ink-muted hover:bg-surface-sunken"
              }`}
            >
              <Activity size={20} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 font-display text-lg font-semibold">
                  <span className="grid size-9 place-items-center rounded-xl bg-brand text-white"><Activity size={20} /></span>
                  Health Care
                </div>
                <p className="mt-1 pl-11 text-xs font-semibold text-brand">{user.role.replace("_", " ").toUpperCase()} PORTAL</p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                aria-label="Collapse navigation panel"
                title="Collapse navigation panel"
                className="rounded-lg p-2 text-ink-subtle transition hover:bg-surface-sunken hover:text-brand-strong"
              >
                <PanelLeftClose size={19} />
              </button>
            </div>
            {navigation("desktop")}
          </>
        )}
      </aside>

      {menuOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-ink/40 md:hidden" onClick={() => setMenuOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-line bg-white p-5 transition-transform md:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="grid size-9 place-items-center rounded-xl bg-brand text-white"><Activity size={20} /></span>
            Health Care
          </div>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation" className="rounded-lg p-2 hover:bg-surface-sunken">
            <X size={20} />
          </button>
        </div>
        <p className="mt-1 text-xs font-semibold text-brand">{user.role.replace("_", " ").toUpperCase()} PORTAL</p>
        {navigation("mobile")}
      </aside>

      <main className={`transition-[margin] duration-300 ${sidebarCollapsed ? "md:ml-20" : "md:ml-64"}`}>
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-line bg-white/95 px-5 backdrop-blur sm:px-8">
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation" aria-expanded={menuOpen} className="rounded-lg p-2 hover:bg-surface-sunken md:hidden">
            <Menu size={21} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-brand">Hospital operations</p>
            <h1 className="truncate font-display text-xl font-semibold">{activeModule === "Dashboard" ? `Good morning, ${user.name.split(" ")[0]}` : activeModule}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs capitalize text-ink-subtle">{user.role.replace("_", " ")}</p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-surface-sunken"
              >
                <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-brand-soft font-semibold text-brand-strong">{profileImage ? <Image src={profileImage} alt="" width={36} height={36} unoptimized className="size-full object-cover" /> : user.name.slice(0, 2).toUpperCase()}</span>
                <span className="hidden text-sm font-semibold sm:inline">Profile</span>
                <ChevronDown size={16} className={`hidden text-ink-subtle transition sm:block ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-line bg-white p-2 shadow-xl" role="menu" aria-label="Profile options">
                  <div className="border-b border-line px-3 py-2.5">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-ink-subtle">{user.email}</p>
                  </div>
                  <button type="button" role="menuitem" onClick={() => { router.push("/portal/profile"); setProfileOpen(false); }} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-surface-sunken">
                    <CircleUserRound size={17} />
                    My profile
                  </button>
                  <button type="button" role="menuitem" onClick={() => { router.push("/portal/change-password"); setProfileOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-surface-sunken">
                    <UserRound size={17} />
                    Change password
                  </button>
                  <button type="button" role="menuitemcheckbox" aria-checked={darkTheme} onClick={() => setDarkTheme((enabled) => !enabled)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-surface-sunken">
                    <span className="flex items-center gap-3">{darkTheme ? <Sun size={17} /> : <Moon size={17} />} Dark theme</span>
                    <span className={`relative h-5 w-9 rounded-full transition ${darkTheme ? "bg-brand" : "bg-line"}`} aria-hidden="true"><span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition ${darkTheme ? "left-4" : "left-0.5"}`} /></span>
                  </button>
                  <div className="my-1 border-t border-line" />
                  <button type="button" role="menuitem" onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-critical transition hover:bg-critical/10">
                    <LogOut size={17} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          {activeModule === "Dashboard" ? (
            <>
              {user.role === "admin" ? (
                <AdminOperationsDashboard
                  cards={cards}
                  overview={adminOverview}
                  loading={dashboardLoading}
                  error={dashboardError}
                  onRefresh={() => setDashboardRefresh((current) => current + 1)}
                  onSelectModule={selectModule}
                />
              ) : (
                <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                  <article className="rounded-2xl border border-line bg-white p-5 shadow-sm" key={card.label}>
                    <div className="flex justify-between">
                      <p className="text-sm font-semibold text-ink-subtle">{card.label}</p>
                      <span className="rounded-lg bg-brand-soft p-2 text-brand"><card.icon size={18} /></span>
                    </div>
                    <p className="mt-5 text-3xl font-semibold">{card.value}</p>
                    <p className="mt-2 text-xs font-semibold text-brand">{stats ? "Live hospital system data" : "Awaiting database connection"}</p>
                  </article>
                ))}
              </section>

              <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.9fr]">
                <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                  <h2 className="font-semibold">Patient visits</h2>
                  <p className="mt-1 text-sm text-ink-subtle">Last seven days</p>
                  <div className="mt-7 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={visitData}>
                        <defs>
                          <linearGradient id="visits" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#0d9488" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area dataKey="visits" stroke="#0d9488" strokeWidth={3} fill="url(#visits)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </article>
                <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                  <h2 className="font-semibold">Secure operations</h2>
                  <p className="mt-3 text-sm leading-6 text-ink-muted">Your account, role and permission set were verified on the server before this workspace was displayed.</p>
                  <div className="mt-6 rounded-xl bg-brand p-4 text-white">
                    <p className="text-sm font-semibold">Role: {user.role.replace("_", " ")}</p>
                    <p className="mt-1 text-xs text-brand-bright">Active hospital account verified.</p>
                  </div>
                </article>
              </section>
                </>
              )}
            </>
          ) : activeModule === "Patients" ? (
            <PatientMasterWorkspace onBack={() => selectModule("Dashboard")} />
          ) : activeModule === "Doctors" ? (
            <StaffManagementWorkspace role="doctor" onBack={() => selectModule("Dashboard")} />
          ) : activeModule === "Nurses" ? (
            <StaffManagementWorkspace role="nurse" onBack={() => selectModule("Dashboard")} />
          ) : activeModule === "Receptionists" ? (
            <StaffManagementWorkspace role="receptionist" onBack={() => selectModule("Dashboard")} />
          ) : activeModule === "HR Staff" ? (
            <StaffManagementWorkspace role="hr" onBack={() => selectModule("Dashboard")} />
          ) : activeModule === "Lab Technicians" ? (
            <StaffManagementWorkspace role="lab_technician" onBack={() => selectModule("Dashboard")} />
          ) : activeModule === "Pharmacists" ? (
            <StaffManagementWorkspace role="pharmacist" onBack={() => selectModule("Dashboard")} />
          ) : activeModule === "Leave" ? (
            <LeaveManagementWorkspace onBack={() => selectModule("Dashboard")} canReview={hasPermission(user.role, "leave:approve", user.permissions, user.permissionMode)} />
          ) : activeModule === "Payroll" ? (
            <PayrollManagementWorkspace onBack={() => selectModule("Dashboard")} />
          ) : (
            <ModuleWorkspace key={activeModule} module={activeModule} onBack={() => selectModule("Dashboard")} />
          )}
        </div>
      </main>
    </div>
  );
}

type DashboardCard = { label: string; value: string | number; icon: LucideIcon };

function AdminOperationsDashboard({
  cards,
  overview,
  loading,
  error,
  onRefresh,
  onSelectModule,
}: {
  cards: DashboardCard[];
  overview?: AdminOverview;
  loading: boolean;
  error?: string;
  onRefresh: () => void;
  onSelectModule: (module: string) => void;
}) {
  const quickActions: { label: string; module: string; icon: LucideIcon }[] = [
    { label: "Register patient", module: "Patients", icon: UserPlus },
    { label: "Add employee", module: "Employees", icon: UsersRound },
    { label: "Book appointment", module: "Appointments", icon: CalendarDays },
    { label: "Admit patient", module: "IPD", icon: BedDouble },
    { label: "Create bill", module: "Billing", icon: ClipboardPlus },
    { label: "View emergency", module: "Emergency overview", icon: Siren },
    { label: "Assign bed", module: "Ward & Bed overview", icon: BedDouble },
    { label: "View reports", module: "Reports", icon: FileBarChart },
  ];

  if (!overview && loading) {
    return <section className="grid min-h-72 place-items-center rounded-2xl border border-line bg-white p-8 text-center shadow-sm"><div><RefreshCw className="mx-auto animate-spin text-brand" size={28} /><p className="mt-4 text-sm font-semibold text-ink-muted">Loading live hospital operations…</p></div></section>;
  }

  if (!overview) {
    return (
      <section className="rounded-2xl border border-critical/25 bg-critical/5 p-6 shadow-sm" role="alert">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="font-semibold text-critical">Dashboard data is unavailable</h2><p className="mt-1 text-sm text-ink-muted">{error ?? "The live operational overview could not be loaded."}</p></div>
          <button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"><RefreshCw size={16} />Try again</button>
        </div>
      </section>
    );
  }

  const alertStyle = { info: "border-brand/15 bg-brand-soft text-brand-strong", warning: "border-amber-200 bg-amber-50 text-amber-900", critical: "border-critical/20 bg-critical/5 text-critical" };

  return (
    <>
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Live operational overview</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Hospital command centre</h2>
          <p className="mt-1 text-sm text-ink-muted">Auto-refreshes every minute. Last updated {new Date(overview.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-md border border-line px-4 py-2.5 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"><RefreshCw size={16} className={loading ? "animate-spin" : undefined} />Refresh now</button>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article className="rounded-2xl border border-line bg-white p-5 shadow-sm" key={card.label}>
            <div className="flex justify-between gap-3"><p className="text-sm font-semibold leading-5 text-ink-subtle">{card.label}</p><span className="rounded-lg bg-brand-soft p-2 text-brand"><card.icon size={18} /></span></div>
            <p className="mt-5 text-2xl font-semibold tracking-tight">{card.value}</p>
            <p className="mt-2 text-xs font-medium text-brand">Live hospital data</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2"><BadgeAlert size={19} className="text-brand" /><div><h2 className="font-semibold">Priority alerts</h2><p className="mt-1 text-sm text-ink-subtle">Items needing operational attention</p></div></div>
          <div className="mt-5 grid gap-3">
            {overview.alerts.map((alert) => (
              <button type="button" key={alert.label} onClick={() => onSelectModule(alert.module)} className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition hover:brightness-95 ${alertStyle[alert.tone]}`}>
                <span>{alert.label}</span><ChevronRight size={17} aria-hidden="true" />
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Quick actions</h2><p className="mt-1 text-sm text-ink-subtle">Jump straight to a hospital workflow</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {quickActions.map((action) => <button type="button" key={action.label} onClick={() => onSelectModule(action.module)} className="flex items-center gap-3 rounded-xl border border-line px-3 py-3 text-left text-sm font-semibold transition hover:border-brand/30 hover:bg-brand-soft hover:text-brand-strong"><action.icon size={17} className="text-brand" />{action.label}</button>)}
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <DashboardMetricChart title="Patient registrations" description="Last six months" data={overview.charts.registrations} kind="area" />
        <DashboardMetricChart title="Appointment trends" description="Last seven days" data={overview.charts.appointments} kind="line" />
        <DashboardMetricChart title="Revenue trends" description="Paid invoices, last six months" data={overview.charts.revenue} kind="bar" currency />
        <DashboardMetricChart title="Department-wise patients" description="Appointments in the last 30 days" data={overview.charts.departmentPatients} kind="bar" />
        <DashboardMetricChart title="Bed occupancy" description="Current bed status" data={overview.charts.bedOccupancy} kind="bar" />
        <DashboardMetricChart title="OPD vs IPD patients" description="Visits recorded in the last seven days" data={overview.charts.opdIpd} kind="bar" />
        <DashboardMetricChart title="Lab test volume" description="Tests requested in the last seven days" data={overview.charts.labVolume} kind="line" />
        <DashboardMetricChart title="Pharmacy sales" description="Sales in the last seven days" data={overview.charts.pharmacySales} kind="area" currency />
        <DashboardMetricChart title="Emergency cases" description="Arrivals in the last seven days" data={overview.charts.emergencyCases} kind="bar" />
      </section>
    </>
  );
}

function DashboardMetricChart({ title, description, data, kind, currency = false }: { title: string; description: string; data: ChartPoint[]; kind: "area" | "bar" | "line"; currency?: boolean }) {
  const gradientId = title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
  const tooltip = <Tooltip formatter={(value) => currency ? moneyFormat.format(Number(value ?? 0)) : numberFormat.format(Number(value ?? 0))} contentStyle={{ borderRadius: 12, borderColor: "#e7e0d7" }} />;
  const axes = <><CartesianGrid vertical={false} stroke="#eee8e0" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} width={36} tick={{ fontSize: 11 }} /></>;

  return (
    <article className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-ink-subtle">{description}</p>
      <div className="mt-5 h-52">
        <ResponsiveContainer width="100%" height="100%">
          {kind === "area" ? <AreaChart data={data}><defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0d9488" stopOpacity={0.34} /><stop offset="100%" stopColor="#0d9488" stopOpacity={0} /></linearGradient></defs>{axes}{tooltip}<Area type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2.5} fill={`url(#${gradientId})`} /></AreaChart> : kind === "line" ? <LineChart data={data}>{axes}{tooltip}<Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart> : <BarChart data={data}>{axes}{tooltip}<Bar dataKey="value" fill="#0f766e" radius={[5, 5, 0, 0]} /></BarChart>}
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function ModuleWorkspace({ module, onBack }: { module: string; onBack: () => void }) {
  const resource = moduleResources[module] ?? { description: moduleDescription(module) };
  const endpoint = resource.endpoint;
  const [records, setRecords] = useState<JsonRecord[]>([]);
  const [loading, setLoading] = useState(Boolean(endpoint));
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadWorkspace = async () => {
      setLoading(true);
      setError(undefined);

      try {
        const payload: unknown = endpoint ? await fetchWorkspace(endpoint) : resource.staticItems ?? [];
        if (cancelled) return;
        const items = normalizeRecords(payload);
        setRecords(resource.filter ? items.filter(resource.filter) : items);
      } catch (requestError) {
        if (!cancelled) {
          setRecords([]);
          setError(requestError instanceof Error ? requestError.message : "Unable to load this workspace.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadWorkspace();

    return () => { cancelled = true; };
  }, [endpoint, module, refreshIndex, resource.filter, resource.staticItems]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return records;
    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(normalizedQuery));
  }, [query, records]);

  return (
    <section className="max-w-5xl rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-brand">Connected workspace</p>
          <h2 className="mt-3 font-display text-3xl font-semibold">{module}</h2>
          <p className="mt-3 max-w-2xl leading-7 text-ink-muted">{resource.description}</p>
        </div>
        {endpoint && (
          <button
            type="button"
            onClick={() => setRefreshIndex((current) => current + 1)}
            disabled={loading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-line px-4 py-2.5 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : undefined} />
            Refresh
          </button>
        )}
      </div>

      {endpoint && (
        <label className="relative mt-7 block max-w-md">
          <span className="sr-only">Search {module.toLowerCase()}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${module.toLowerCase()}…`}
            className="w-full rounded-xl border border-line bg-surface px-10 py-2.5 text-sm outline-none transition placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </label>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-line">
        {loading ? (
          <div className="grid min-h-40 place-items-center bg-surface-sunken px-5 text-sm font-medium text-ink-muted">Loading live hospital data…</div>
        ) : error ? (
          <div className="bg-critical/5 p-5 text-sm text-critical" role="alert">
            <p className="font-semibold">This workspace could not be loaded.</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-surface-sunken p-5 text-sm text-ink-muted">
            {query ? "No matching records found." : "No records are available yet."}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {filteredRecords.slice(0, 50).map((record, index) => (
              <li className="bg-white px-5 py-4" key={recordKey(record, index)}>
                <p className="font-semibold text-ink">{recordTitle(record, index)}</p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">{recordDetails(record)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && !error && records.length > 50 && <p className="mt-3 text-xs text-ink-subtle">Showing the first 50 records. Use search to narrow the list.</p>}

      <button type="button" onClick={onBack} className="mt-7 inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong">
        <ArrowLeft size={17} />
        Back to dashboard
      </button>
    </section>
  );
}

async function fetchWorkspace(endpoint: string): Promise<unknown> {
  const response = await fetch(endpoint);
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Unable to load this workspace.";
    throw new Error(message);
  }
  return payload;
}

function normalizeRecords(payload: unknown): JsonRecord[] {
  if (Array.isArray(payload)) return payload.filter(isJsonRecord);
  if (!isJsonRecord(payload)) return [];
  const nestedRecords = Object.values(payload)
    .filter(Array.isArray)
    .flat()
    .filter(isJsonRecord);
  if (nestedRecords.length > 0) return nestedRecords;
  return [payload];
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordKey(record: JsonRecord, index: number) {
  const key = record._id ?? record.id ?? record.key ?? record.name ?? record.email ?? index;
  return String(key);
}

function recordTitle(record: JsonRecord, index: number) {
  const value = record.name ?? record.patientName ?? record.orderNumber ?? record.invoiceNumber ?? record.admissionNumber ?? record.caseNumber ?? record.unitNumber ?? record.vehicleNumber ?? record.roomNumber ?? record.bedNumber ?? record.role ?? record.key ?? `Record ${index + 1}`;
  return displayValue(value);
}

function recordDetails(record: JsonRecord) {
  const details = Object.entries(record)
    .filter(([key, value]) => !["_id", "id", "__v", "name", "patientName", "orderNumber", "invoiceNumber", "admissionNumber", "caseNumber", "unitNumber", "vehicleNumber", "roomNumber", "bedNumber"].includes(key) && value !== undefined && value !== null && value !== "")
    .slice(0, 4)
    .map(([key, value]) => `${humanizeKey(key)}: ${displayValue(value)}`);

  return details.length > 0 ? details.join(" · ") : "No additional details available.";
}

function humanizeKey(key: string) {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
}

function displayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toLocaleString();
  if (Array.isArray(value)) return value.length === 0 ? "None" : `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (isJsonRecord(value)) {
    const label = value.name ?? value.uhid ?? value.email ?? value._id;
    return label ? String(label) : "Linked record";
  }
  return "Available";
}
