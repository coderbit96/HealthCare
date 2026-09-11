"use client";

import { Bell, CalendarDays, ChevronRight, CircleAlert, CreditCard, FileHeart, FileText, HeartPulse, LoaderCircle, ReceiptText, Stethoscope, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PortalData = {
  profile?: { name?: string; patientId?: string; uhid?: string; phone?: string; dateOfBirth?: string; gender?: string; address?: string; allergies?: string[]; medicalHistory?: string; emergencyContact?: { name?: string; phone?: string; relation?: string } };
  appointments: Array<{ _id: string; reference?: string; department?: string; doctor?: string; preferredDate?: string; startAt?: string; status?: string; rescheduleRequired?: boolean }>;
  records: Array<{ _id: string; diagnosis?: string; status?: string; visitDate?: string; prescriptions?: Array<{ medicine?: string; dosage?: string; duration?: string }>; dischargeSummary?: string }>;
  labReports: Array<{ _id: string; orderNumber?: string; publishedAt?: string; tests?: Array<{ name?: string; value?: string; unit?: string }> }>;
  invoices: Array<{ _id: string; invoiceNumber?: string; total?: number; paid?: number; due?: number; status?: string; createdAt?: string }>;
  transactions: Array<{ _id: string; amount?: number; method?: string; type?: string; createdAt?: string }>;
  admissions: Array<{ _id: string; admissionNumber?: string; reason?: string; diagnosis?: string; status?: string; dischargedAt?: string; dischargeSummary?: string; createdAt?: string }>;
};

const navigation = [
  { id: "dashboard", label: "Dashboard", description: "Your health at a glance" },
  { id: "profile", label: "Profile", description: "Personal and emergency details" },
  { id: "uhid", label: "UHID", description: "Your permanent hospital ID" },
  { id: "find-doctor", label: "Find Doctor", description: "Browse specialists" },
  { id: "doctor-profile", label: "Doctor Profile", description: "View doctor information" },
  { id: "book-appointment", label: "Book Appointment", description: "Request a visit" },
  { id: "available-slots", label: "Available Slots", description: "Choose a convenient time" },
  { id: "reschedule", label: "Reschedule", description: "Review appointments needing attention" },
  { id: "cancel", label: "Cancel", description: "View appointments to cancel" },
  { id: "appointment-history", label: "Appointment History", description: "Your past and upcoming visits" },
  { id: "prescriptions", label: "Prescriptions", description: "Medicines from your consultations" },
  { id: "medical-records", label: "Medical Records", description: "Your clinical records" },
  { id: "lab-reports", label: "Lab Reports", description: "Published test results" },
  { id: "admission-history", label: "Admission History", description: "Hospital stays" },
  { id: "discharge-summaries", label: "Discharge Summaries", description: "Completed admissions" },
  { id: "bills", label: "Bills", description: "Invoices and balances" },
  { id: "online-payments", label: "Online Payments", description: "Payment details" },
  { id: "payment-history", label: "Payment History", description: "Recorded transactions" },
  { id: "download-invoice", label: "Download Invoice", description: "Download an invoice copy" },
  { id: "notifications", label: "Notifications", description: "Appointment updates" },
  { id: "health-packages", label: "Health Packages", description: "Preventive care plans" },
] as const;

type SectionId = (typeof navigation)[number]["id"];
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const date = (value?: string) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "Not available";
const titleFor = (id: SectionId) => navigation.find((item) => item.id === id)!;

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line bg-canvas p-6 text-sm leading-6 text-ink-muted">{children}</div>;
}

export function PatientPortalWorkspace({ name }: { name: string }) {
  const [active, setActive] = useState<SectionId>("dashboard");
  const [data, setData] = useState<PortalData>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/patient-portal/overview")
      .then(async (response) => {
        const body = await response.json() as PortalData & { error?: string };
        if (!response.ok) throw new Error(body.error || "Unable to load your portal information.");
        return body;
      })
      .then((body) => { if (!cancelled) setData(body); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load your portal information."); });
    return () => { cancelled = true; };
  }, []);

  const activeItem = titleFor(active);
  const upcomingAppointments = useMemo(() => (data?.appointments ?? []).filter((item) => !["cancelled", "completed", "no_show"].includes(item.status ?? "")), [data]);
  const content = () => {
    if (error) return <EmptyState><span className="flex items-center gap-2 text-critical"><CircleAlert size={18} />{error}</span></EmptyState>;
    if (!data) return <div className="flex min-h-52 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-medium text-ink-muted shadow-sm"><LoaderCircle className="animate-spin text-brand" size={19} />Loading your secure health information…</div>;
    const profile = data.profile;
    const appointments = active === "reschedule" ? data.appointments.filter((item) => item.rescheduleRequired) : active === "cancel" ? upcomingAppointments : data.appointments;

    if (active === "dashboard") return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[
      [CalendarDays, "Appointments", `${upcomingAppointments.length} upcoming visit${upcomingAppointments.length === 1 ? "" : "s"}`, "appointment-history"],
      [FileHeart, "Clinical records", `${data.records.length} record${data.records.length === 1 ? "" : "s"}`, "medical-records"],
      [CreditCard, "Bills & payments", `${money.format(data.invoices.reduce((sum, invoice) => sum + (invoice.due ?? 0), 0))} due`, "bills"],
      [Stethoscope, "Find a doctor", "Browse hospital specialists", "find-doctor"],
      [UserRound, "My profile", profile?.uhid || "View UHID and details", "profile"],
      [Bell, "Notifications", `${data.labReports.length} published lab report${data.labReports.length === 1 ? "" : "s"}`, "notifications"],
    ].map(([Icon, heading, text, target]) => { const CardIcon = Icon as typeof CalendarDays; return <button type="button" key={heading as string} onClick={() => setActive(target as SectionId)} className="rounded-2xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-bright/20"><CardIcon className="text-brand" /><h3 className="mt-5 font-semibold">{heading as string}</h3><p className="mt-2 text-sm leading-6 text-ink-muted">{text as string}</p></button>; })}</div>;

    if (active === "profile" || active === "uhid") return <div className="space-y-4"><div className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wider text-ink-subtle">UHID</p><p className="mt-1 font-display text-2xl text-ink">{profile?.uhid || "Not assigned yet"}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-ink-subtle">Patient ID</p><p className="mt-1 font-semibold text-ink">{profile?.patientId || "Not available"}</p></div>{active === "profile" && <><div><p className="text-xs font-bold uppercase tracking-wider text-ink-subtle">Phone</p><p className="mt-1 font-semibold text-ink">{profile?.phone || "Not recorded"}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-ink-subtle">Date of birth</p><p className="mt-1 font-semibold text-ink">{date(profile?.dateOfBirth)}</p></div><div className="sm:col-span-2"><p className="text-xs font-bold uppercase tracking-wider text-ink-subtle">Emergency contact</p><p className="mt-1 font-semibold text-ink">{profile?.emergencyContact?.name ? `${profile.emergencyContact.name}${profile.emergencyContact.relation ? ` · ${profile.emergencyContact.relation}` : ""}${profile.emergencyContact.phone ? ` · ${profile.emergencyContact.phone}` : ""}` : "Not recorded"}</p></div></>}</div>{active === "profile" && <EmptyState>To correct demographic or emergency-contact information, please ask the reception team. Your clinical profile remains protected from unauthorised changes.</EmptyState>}</div>;

    if (["find-doctor", "doctor-profile", "book-appointment", "available-slots", "health-packages"].includes(active)) {
      const details: Record<string, { title: string; text: string; href: string; action: string }> = {
        "find-doctor": { title: "Find the right specialist", text: "Browse our doctors by speciality and care area.", href: "/doctors", action: "Browse doctors" },
        "doctor-profile": { title: "Doctor profiles", text: "View qualifications, departments and consultation information.", href: "/doctors", action: "View doctor profiles" },
        "book-appointment": { title: "Book an appointment", text: "Choose a department and request a time with a specialist.", href: "/appointments", action: "Book appointment" },
        "available-slots": { title: "Check available slots", text: "Select a doctor to see the currently available appointment times.", href: "/appointments", action: "View available slots" },
        "health-packages": { title: "Health packages", text: "Explore preventive care and wellness plans.", href: "/health-packages", action: "Explore packages" },
      };
      const item = details[active];
      return <div className="rounded-2xl bg-white p-6 shadow-sm"><HeartPulse className="text-brand" /><h3 className="mt-4 font-display text-2xl text-ink">{item.title}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-ink-muted">{item.text}</p><Link className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-strong" href={item.href}>{item.action}<ChevronRight size={17} /></Link></div>;
    }

    if (["reschedule", "cancel", "appointment-history"].includes(active)) return <div className="space-y-3">{appointments.length ? appointments.map((item) => <div key={item._id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-ink">{item.department || "Hospital appointment"}</p><p className="mt-1 text-sm text-ink-muted">{item.doctor || "Doctor to be confirmed"} · {date(item.startAt || item.preferredDate)}</p></div><span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold capitalize text-brand-strong">{(item.status || "pending").replaceAll("_", " ")}</span></div>{active === "reschedule" && <p className="mt-3 text-sm text-amber-800">This appointment requires rescheduling. Please contact reception to confirm a new slot.</p>}{active === "cancel" && <p className="mt-3 text-sm text-ink-muted">To cancel this visit, contact reception with reference {item.reference || "your appointment details"}.</p>}</div>) : <EmptyState>{active === "reschedule" ? "No appointments currently require rescheduling." : active === "cancel" ? "You have no upcoming appointments to cancel." : "No appointment history is available yet."}</EmptyState>}</div>;

    if (["prescriptions", "medical-records"].includes(active)) return <div className="space-y-3">{data.records.length ? data.records.map((record) => <div key={record._id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-ink">{record.diagnosis || "Clinical consultation"}</p><p className="mt-1 text-sm text-ink-muted">{date(record.visitDate)}</p></div><span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold capitalize text-brand-strong">{record.status || "draft"}</span></div>{active === "prescriptions" && <div className="mt-4 space-y-2">{record.prescriptions?.length ? record.prescriptions.map((prescription, index) => <p className="text-sm text-ink-muted" key={`${prescription.medicine}-${index}`}>{prescription.medicine || "Medicine"} · {prescription.dosage || "Dosage as advised"} · {prescription.duration || "Duration as advised"}</p>) : <p className="text-sm text-ink-muted">No prescription is recorded for this visit.</p>}</div>}</div>) : <EmptyState>No clinical records are available yet.</EmptyState>}</div>;

    if (active === "lab-reports") return <div className="space-y-3">{data.labReports.length ? data.labReports.map((report) => <div key={report._id} className="rounded-2xl bg-white p-5 shadow-sm"><p className="font-semibold text-ink">Lab report {report.orderNumber || ""}</p><p className="mt-1 text-sm text-ink-muted">Published {date(report.publishedAt)}</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{report.tests?.map((test, index) => <p className="rounded-lg bg-canvas px-3 py-2 text-sm text-ink-muted" key={`${test.name}-${index}`}>{test.name || "Test"}: <strong className="text-ink">{test.value || "Result available"} {test.unit || ""}</strong></p>)}</div></div>) : <EmptyState>Published lab reports will appear here once verified by the laboratory.</EmptyState>}</div>;

    if (["admission-history", "discharge-summaries"].includes(active)) { const admissions = active === "discharge-summaries" ? data.admissions.filter((item) => item.status === "discharged") : data.admissions; return <div className="space-y-3">{admissions.length ? admissions.map((item) => <div className="rounded-2xl bg-white p-5 shadow-sm" key={item._id}><p className="font-semibold text-ink">{item.admissionNumber || "Hospital admission"}</p><p className="mt-1 text-sm text-ink-muted">{item.diagnosis || item.reason || "Admission details"} · {date(item.createdAt)}</p>{active === "discharge-summaries" && <p className="mt-4 rounded-xl bg-canvas p-3 text-sm leading-6 text-ink-muted">{item.dischargeSummary || "A discharge summary has not been published for this admission."}</p>}</div>) : <EmptyState>{active === "discharge-summaries" ? "No discharge summaries are available." : "No admission history is available."}</EmptyState>}</div>; }

    if (["bills", "online-payments", "payment-history", "download-invoice"].includes(active)) return <div className="space-y-3">{active === "payment-history" ? (data.transactions.length ? data.transactions.map((payment) => <div className="rounded-2xl bg-white p-5 shadow-sm" key={payment._id}><p className="font-semibold text-ink">{money.format(payment.amount || 0)} · {(payment.type || "payment").replaceAll("_", " ")}</p><p className="mt-1 text-sm capitalize text-ink-muted">{payment.method || "Method not recorded"} · {date(payment.createdAt)}</p></div>) : <EmptyState>No payment transactions are recorded yet.</EmptyState>) : (data.invoices.length ? data.invoices.map((invoice) => <div className="rounded-2xl bg-white p-5 shadow-sm" key={invoice._id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-ink">{invoice.invoiceNumber || "Hospital invoice"}</p><p className="mt-1 text-sm text-ink-muted">Total {money.format(invoice.total || 0)} · Paid {money.format(invoice.paid || 0)} · Due {money.format(invoice.due || 0)}</p></div><span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold capitalize text-brand-strong">{(invoice.status || "open").replaceAll("_", " ")}</span></div>{active === "download-invoice" && <button type="button" onClick={() => { const copy = `Health Care .Pvt .Ltd\nInvoice: ${invoice.invoiceNumber || "Hospital invoice"}\nTotal: ${money.format(invoice.total || 0)}\nPaid: ${money.format(invoice.paid || 0)}\nDue: ${money.format(invoice.due || 0)}`; const url = URL.createObjectURL(new Blob([copy], { type: "text/plain" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${invoice.invoiceNumber || "invoice"}.txt`; anchor.click(); URL.revokeObjectURL(url); }} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold text-brand transition hover:bg-brand-soft"><FileText size={16} />Download invoice copy</button>}{active === "online-payments" && invoice.due ? <p className="mt-4 text-sm text-ink-muted">For secure online payment, please contact the billing desk with this invoice number.</p> : null}</div>) : <EmptyState>No invoices are available yet.</EmptyState>)}</div>;

    return <div className="space-y-3">{[...upcomingAppointments.map((item) => `Appointment ${item.reference || "update"}: ${(item.status || "pending").replaceAll("_", " ")}`), ...data.labReports.map((item) => `Lab report ${item.orderNumber || "update"} has been published`)].length ? [...upcomingAppointments.map((item) => `Appointment ${item.reference || "update"}: ${(item.status || "pending").replaceAll("_", " ")}`), ...data.labReports.map((item) => `Lab report ${item.orderNumber || "update"} has been published`)].map((note) => <div className="rounded-2xl bg-white p-5 text-sm text-ink-muted shadow-sm" key={note}>{note}</div>) : <EmptyState>You have no new care notifications.</EmptyState>}</div>;
  };

  return <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[240px_1fr]">
    <aside className="h-fit rounded-2xl bg-white p-3 shadow-sm lg:sticky lg:top-5"><nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1" aria-label="Patient portal navigation">{navigation.map((item) => <button type="button" key={item.id} onClick={() => setActive(item.id)} aria-current={active === item.id ? "page" : undefined} className={`rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${active === item.id ? "bg-brand-soft text-brand-strong" : "text-ink-muted hover:bg-canvas hover:text-ink"}`}>{item.label}</button>)}</nav></aside>
    <section aria-live="polite"><div className="rounded-3xl bg-brand-strong p-7 text-white"><p className="text-sm font-semibold text-brand-bright">Your private patient portal</p><h2 className="mt-2 font-display text-3xl font-semibold">{active === "dashboard" ? `Hello, ${name.split(" ")[0]}` : activeItem.label}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/70">{active === "dashboard" ? "Your appointments, medical records, prescriptions, bills and documents are available here. This portal loads only records linked to your verified account." : activeItem.description}</p></div><div className="mt-6">{content()}</div><div className="mt-6 flex items-center gap-3 rounded-2xl bg-brand-soft p-5 text-sm text-brand-strong"><ReceiptText className="shrink-0" /><p>Your health information is linked to your signed-in account and cannot be changed by selecting a different patient ID.</p></div></section>
  </div>;
}
