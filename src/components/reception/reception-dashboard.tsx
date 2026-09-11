"use client";
import { CalendarDays, CreditCard, ReceiptText, Search, UserPlus, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AuthenticatedUser } from "@/lib/server-auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge, Button, Card, EmptyState, Field, StatCard } from "@/components/ui";

const navigation = ["Dashboard", "Patients", "New Registration", "Appointments", "Walk-In", "Queue", "Admissions", "Billing", "Invoices", "Payments", "Outstanding", "Refunds", "Insurance", "Reports"];

type Patient = { _id: string; name: string; uhid: string; phone: string; email?: string };
type Invoice = { _id: string; invoiceNumber: string; category: string; total: number; paid: number; due: number; status: string; patient?: { name: string; uhid: string } | string; createdAt: string };
type Analytics = { appointments: number; revenue: number; outstanding: number; admissions: number };

export function ReceptionDashboard({ user }: { user: AuthenticatedUser }) {
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? "Dashboard";
  const [analytics, setAnalytics] = useState<Analytics>();
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>();
  const [searching, setSearching] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>();
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: "", phone: "", email: "" });
  const [registerErrors, setRegisterErrors] = useState<{ name?: string; phone?: string }>({});
  const [registerMessage, setRegisterMessage] = useState<string>();
  const [registerError, setRegisterError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const showPatientSearch = ["Dashboard", "Patients", "Walk-In", "Queue", "Admissions"].includes(section);
  const showRegistration = ["Dashboard", "New Registration"].includes(section);
  const showBilling = ["Dashboard", "Billing", "Invoices", "Payments", "Outstanding", "Refunds", "Insurance", "Reports"].includes(section);

  useEffect(() => {
    fetch("/api/analytics/overview?range=today").then(r => r.ok ? r.json() : null).then(value => value && setAnalytics(value)).catch(() => undefined);
    fetch("/api/invoices").then(r => r.ok ? r.json() : null).then(value => Array.isArray(value) && setInvoices(value)).catch(() => undefined);
  }, []);

  const search = async () => {
    setSearching(true);
    try { const response = await fetch(`/api/patients?q=${encodeURIComponent(query)}`); if (response.ok) setPatients(await response.json()); }
    finally { setSearching(false); }
  };

  const registerPatient = async () => {
    setRegisterMessage(undefined); setRegisterError(undefined);
    const errors: { name?: string; phone?: string } = {};
    if (registerForm.name.trim().length < 2) errors.name = "Enter the patient’s full name";
    if (!/^[+\d][\d\s-]{7,}$/.test(registerForm.phone.trim())) errors.phone = "Enter a valid phone number";
    setRegisterErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const response = await fetch("/api/patients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(registerForm) });
      const body = await response.json();
      if (!response.ok) { setRegisterError(body.error ?? "Unable to register patient"); return; }
      setRegisterMessage(`Registered ${body.name} — UHID ${body.uhid}`);
      setRegisterForm({ name: "", phone: "", email: "" });
    } catch { setRegisterError("Unable to register patient"); }
    finally { setSaving(false); }
  };

  return (
    <DashboardShell user={user} workspace="Reception operations" icon={UsersRound} navigation={navigation} title={`Welcome, ${user.name.split(" ")[0]}`}>
      {section === "Dashboard" && <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarDays} label="Today’s bookings" value={analytics?.appointments ?? "—"} />
        <StatCard icon={UsersRound} label="Admissions today" value={analytics?.admissions ?? "—"} />
        <StatCard icon={CreditCard} label="Collections" value={analytics ? `₹${analytics.revenue.toLocaleString("en-IN")}` : "—"} tone="accent" />
      </section>}

      {(showPatientSearch || showRegistration) && <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {showPatientSearch && <Card>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Search size={19} /></span>
            <div><h2 className="font-display text-lg font-semibold">Find a patient</h2><p className="text-sm text-ink-muted">Search by UHID, name, or phone.</p></div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1"><Field label="Patient search" placeholder="HSP-2026-000128, name or phone" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} /></div>
            <Button className="self-end" onClick={search} disabled={searching}>{searching ? "Searching…" : "Search"}</Button>
          </div>
          {patients && <div className="mt-4 divide-y divide-line border-t border-line">
            {patients.length === 0 ? <EmptyState message="No patients matched that search." /> : patients.map(patient => (
              <div key={patient._id} className="flex items-center justify-between py-3">
                <div><p className="font-medium">{patient.name}</p><p className="text-xs text-ink-subtle">{patient.uhid} · {patient.phone}</p></div>
              </div>
            ))}
          </div>}
        </Card>}

        {showRegistration && <div className="rounded-panel bg-brand p-6 text-white">
          <span className="grid size-10 place-items-center rounded-xl bg-white/15"><UserPlus size={19} /></span>
          <h2 className="mt-4 font-display text-xl font-semibold">New patient registration</h2>
          <p className="mt-2 leading-7 text-white/75">Creates a collision-safe UHID in the format HSP-YYYY-000001.</p>
          {!showRegister && section !== "New Registration" ? <Button variant="accent" className="mt-5" onClick={() => setShowRegister(true)}>Register patient</Button> : (
            <div className="mt-5 grid gap-3 [&_label]:text-white [&_input]:border-white/20 [&_input]:bg-white/10 [&_input]:text-white [&_input]:placeholder:text-white/50">
              <Field label="Full name" placeholder="Patient name" value={registerForm.name} error={registerErrors.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} />
              <Field label="Phone" placeholder="+91 …" value={registerForm.phone} error={registerErrors.phone} onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })} />
              <Field label="Email (optional)" type="email" placeholder="patient@example.com" value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} />
              <Button variant="accent" onClick={registerPatient} disabled={saving}>{saving ? "Saving…" : "Save patient"}</Button>
              {registerMessage && <p role="status" className="rounded-xl bg-white/15 px-3 py-2 text-sm font-medium">{registerMessage}</p>}
              {registerError && <p role="alert" className="rounded-xl bg-accent px-3 py-2 text-sm font-medium">{registerError}</p>}
            </div>
          )}
        </div>}
      </section>}

      {showBilling && <Card className="mt-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><ReceiptText size={19} /></span>
          <div><h2 className="font-display text-lg font-semibold">Billing &amp; collections</h2><p className="text-sm text-ink-muted">Invoices reconcile from transaction records; totals are never overwritten.</p></div>
        </div>
        <div className="mt-5 divide-y divide-line border-t border-line">
          {!invoices ? <EmptyState message="Loading invoices…" /> : invoices.length === 0 ? <EmptyState message="No invoices yet." /> : invoices.slice(0, 8).map(invoice => (
            <div key={invoice._id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0"><p className="truncate font-medium">{invoice.invoiceNumber}</p><p className="truncate text-xs text-ink-subtle">{typeof invoice.patient === "object" ? invoice.patient?.name : ""} · {invoice.category}</p></div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-display text-lg font-semibold">₹{invoice.total.toLocaleString("en-IN")}</span>
                <Badge tone={invoice.status === "paid" ? "positive" : "warning"}>{invoice.status.replace("_", " ")}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>}
    </DashboardShell>
  );
}
