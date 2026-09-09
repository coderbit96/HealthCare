"use client";

import { signOut } from "firebase/auth";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UsersRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { auth } from "@/lib/firebase";
import type { AuthenticatedUser } from "@/lib/server-auth";

const visitData = [
  { day: "Mon", visits: 38 },
  { day: "Tue", visits: 51 },
  { day: "Wed", visits: 45 },
  { day: "Thu", visits: 62 },
  { day: "Fri", visits: 57 },
  { day: "Sat", visits: 35 },
  { day: "Sun", visits: 28 },
];

const staffModules = [
  { icon: Activity, label: "Overview" },
  { icon: CalendarDays, label: "Appointments" },
  { icon: UsersRound, label: "Patients" },
  { icon: ClipboardList, label: "Clinical records" },
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

export function PortalDashboard({ user }: { user: AuthenticatedUser }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState("Dashboard");
  const [expandedGroups, setExpandedGroups] = useState<string[]>(user.role === "admin" ? [] : ["Workspace"]);
  const [stats, setStats] = useState<{
    todayAppointments: number;
    pendingAppointments: number;
    patients: number;
  }>();

  const navigationGroups = user.role === "admin"
    ? adminGroups
    : [{ label: "Workspace", items: staffModules.map((module) => module.label) }];

  const cards = [
    { label: "Today's appointments", value: stats?.todayAppointments ?? "—", icon: CalendarDays },
    { label: "Registered patients", value: stats?.patients ?? "—", icon: UsersRound },
    { label: "Awaiting confirmation", value: stats?.pendingAppointments ?? "—", icon: ClipboardList },
    { label: "Clinical occupancy", value: "76%", icon: Activity },
  ];

  useEffect(() => {
    fetch("/api/portal/summary")
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => value && setStats(value))
      .catch(() => undefined);
  }, []);

  const selectModule = (label: string, group?: string) => {
    if (group) {
      setExpandedGroups((current) => (current.includes(group) ? current : [...current, group]));
    }
    setActiveModule(label);
    setMenuOpen(false);
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((current) => (
      current.includes(label) ? current.filter((group) => group !== label) : [...current, label]
    ));
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
        const isExpanded = expandedGroups.includes(group.label);
        const groupId = `${location}-${group.label.replaceAll(/[^a-z0-9]/gi, "-").toLowerCase()}`;

        return (
          <div className="pt-2" key={group.label}>
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
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
    <div className="min-h-screen bg-canvas text-ink">
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
            <button
              type="button"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
              className="mt-auto grid size-10 place-items-center rounded-xl text-ink-subtle transition hover:bg-critical/10 hover:text-critical"
            >
              <LogOut size={20} />
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
            <button onClick={logout} className="mt-7 flex items-center gap-3 px-3 py-2 text-sm font-semibold text-ink-subtle transition hover:text-critical">
              <LogOut size={19} />
              Sign out
            </button>
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
        <button onClick={logout} className="mt-7 flex items-center gap-3 px-3 py-2 text-sm font-semibold text-ink-subtle transition hover:text-critical">
          <LogOut size={19} />
          Sign out
        </button>
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
            <div className="grid size-10 place-items-center rounded-full bg-brand-soft font-semibold text-brand-strong">{user.name.slice(0, 2).toUpperCase()}</div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          {activeModule === "Dashboard" ? (
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
          ) : (
            <section className="max-w-3xl rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-brand">Selected workspace</p>
              <h2 className="mt-3 font-display text-3xl font-semibold">{activeModule}</h2>
              <p className="mt-4 max-w-2xl leading-7 text-ink-muted">{moduleDescription(activeModule)}</p>
              <div className="mt-8 rounded-xl bg-surface-sunken p-5">
                <p className="font-semibold">{activeModule} workspace is open</p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">Choose another section from the sidebar at any time. The active page is clearly highlighted for easier navigation.</p>
              </div>
              <button type="button" onClick={() => selectModule("Dashboard")} className="mt-7 inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong">
                <ArrowLeft size={17} />
                Back to dashboard
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
