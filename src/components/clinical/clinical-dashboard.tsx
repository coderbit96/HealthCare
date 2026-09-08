"use client";
import { Activity, CalendarDays, HeartPulse, Hospital, Stethoscope, UsersRound } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import type { AuthenticatedUser } from "@/lib/server-auth";
import { hasPermission, type Permission } from "@/lib/roles";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge, Button, Card, EmptyState, Field, StatCard } from "@/components/ui";
import { cn } from "@/lib/utils";

const navigation = ["Dashboard", "Today’s Patients", "Appointments", "Patient Queue", "Patient Records", "OPD", "IPD", "Vitals", "Clinical Notes", "Prescriptions", "Lab Requests", "Lab Reports", "Admissions", "Medication", "Nursing Notes", "Discharge", "Follow-ups", "Notifications"];

type Appointment = { _id: string; patientName: string; status: string; startAt?: string; department: string };
type Summary = { todayAppointments: number; pendingAppointments: number; patients: number };
type ActionKey = "vitals" | "nursing" | "clinical" | "prescription" | "lab";

const ACTIONS: { key: ActionKey; label: string; permission: Permission }[] = [
  { key: "vitals", label: "Record vitals & observations", permission: "vitals:write" },
  { key: "nursing", label: "Add nursing note / handover", permission: "nursing-notes:write" },
  { key: "clinical", label: "Add symptoms, diagnosis & plan", permission: "clinical:write" },
  { key: "prescription", label: "Create prescription", permission: "prescriptions:write" },
  { key: "lab", label: "Request laboratory tests", permission: "lab-requests:write" },
];

export function ClinicalDashboard({ user }: { user: AuthenticatedUser }) {
  const doctor = user.role === "doctor";
  const can = (permission: Permission) => hasPermission(user.role, permission, user.permissions);
  const [summary, setSummary] = useState<Summary>();
  const [queue, setQueue] = useState<Appointment[]>();
  const [active, setActive] = useState<ActionKey>();
  const [patientId, setPatientId] = useState("");
  const [patientError, setPatientError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/portal/summary").then(r => r.ok ? r.json() : null).then(value => value && setSummary(value)).catch(() => undefined);
    fetch(`/api/appointments${doctor ? `?doctorUid=${user.firebaseUid}` : ""}`).then(r => r.ok ? r.json() : null).then(value => Array.isArray(value) && setQueue(value)).catch(() => undefined);
  }, [doctor, user.firebaseUid]);

  const openAction = (key: ActionKey) => { setActive(active === key ? undefined : key); setFields({}); setMessage(undefined); setError(undefined); setPatientError(undefined); };

  const submit = async () => {
    if (!active) return;
    setError(undefined); setMessage(undefined);
    if (!/^[a-f\d]{24}$/i.test(patientId.trim())) { setPatientError("Enter a valid 24-character patient id"); return; }
    setPatientError(undefined);
    setSaving(true);
    try {
      let response: Response;
      if (active === "vitals") response = await post("/api/clinical/vitals", { patient: patientId, temperature: num(fields.temperature), systolic: num(fields.systolic), diastolic: num(fields.diastolic), pulse: num(fields.pulse), spo2: num(fields.spo2), observation: fields.observation });
      else if (active === "nursing") response = await post("/api/nursing/entries", { patient: patientId, type: "handover", content: { note: fields.note ?? "" } });
      else if (active === "clinical") response = await post("/api/clinical/records", { patient: patientId, diagnosis: fields.diagnosis ?? "", symptoms: list(fields.symptoms), treatmentPlan: fields.treatmentPlan, notes: fields.notes });
      else if (active === "prescription") response = await post("/api/prescriptions", { patient: patientId, diagnosis: fields.diagnosis, medicines: [{ name: fields.medicine ?? "", dosage: fields.dosage ?? "", frequency: fields.frequency ?? "", duration: fields.duration ?? "" }] });
      else response = await post("/api/lab/orders", { patient: patientId, tests: [{ name: fields.test ?? "", category: fields.category || "general" }] });
      const body = await response.json();
      if (!response.ok) { setError(body.error ?? "Unable to save"); return; }
      setMessage("Saved successfully.");
      setFields({});
    } catch { setError("Unable to save"); }
    finally { setSaving(false); }
  };

  return (
    <DashboardShell user={user} workspace={`${doctor ? "Doctor" : "Nurse"} workspace`} icon={HeartPulse} navigation={navigation} title="Today’s clinical care">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={UsersRound} label="Registered patients" value={summary?.patients ?? "—"} />
        <StatCard icon={CalendarDays} label={doctor ? "My appointments" : "Appointments"} value={queue?.length ?? "—"} />
        <StatCard icon={Hospital} label="Awaiting confirmation" value={summary?.pendingAppointments ?? "—"} tone="accent" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="font-display text-lg font-semibold">Patient queue</h2><p className="mt-0.5 text-sm text-ink-muted">{doctor ? "Your scheduled appointments" : "Today’s appointments"}</p></div>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Activity size={19} /></span>
          </div>
          <div className="mt-5 divide-y divide-line border-t border-line">
            {!queue ? <EmptyState message="Loading queue…" /> : queue.length === 0 ? <EmptyState message="No patients in queue." /> : queue.slice(0, 10).map(item => (
              <div className="flex items-center justify-between gap-4 py-3.5" key={item._id}>
                <div className="min-w-0"><p className="truncate font-medium">{item.patientName}</p><p className="truncate text-xs text-ink-subtle">{item.department}</p></div>
                <Badge tone={item.status === "completed" ? "positive" : "neutral"}>{item.status.replace("_", " ")}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <div className="rounded-panel bg-brand p-6 text-white">
          <span className="grid size-10 place-items-center rounded-xl bg-white/15"><Stethoscope size={19} /></span>
          <h2 className="mt-4 font-display text-xl font-semibold">Clinical actions</h2>
          <div className="mt-5 grid gap-2">
            {ACTIONS.filter(action => can(action.permission)).map(action => (
              <button key={action.key} onClick={() => openAction(action.key)} aria-expanded={active === action.key} className={cn("rounded-xl px-4 py-3 text-left text-sm font-semibold transition", active === action.key ? "bg-accent text-white" : "bg-white/10 hover:bg-white/20")}>{action.label}</button>
            ))}
          </div>
          {active && (
            <div className="mt-5 grid gap-3 rounded-xl bg-white/10 p-4 [&_label]:text-white [&_input]:border-white/20 [&_input]:bg-white/10 [&_input]:text-white [&_input]:placeholder:text-white/50">
              <Field label="Patient id" placeholder="24-character id" value={patientId} error={patientError} onChange={e => setPatientId(e.target.value)} />
              <ActionFields action={active} fields={fields} setFields={setFields} />
              <Button variant="accent" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              {message && <p role="status" className="text-sm font-medium">{message}</p>}
              {error && <p role="alert" className="rounded-lg bg-accent px-3 py-2 text-sm font-medium">{error}</p>}
            </div>
          )}
          {!doctor && <p className="mt-5 text-xs leading-6 text-white/60">Nursing actions cover bedside care, observations, medication administration and handover. Diagnoses, prescriptions and discharge remain doctor-only.</p>}
        </div>
      </section>
    </DashboardShell>
  );
}

function post(url: string, body: unknown) { return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
function num(value?: string) { const parsed = Number(value); return value && !Number.isNaN(parsed) ? parsed : undefined; }
function list(value?: string) { return value ? value.split(",").map(item => item.trim()).filter(Boolean) : []; }

function ActionFields({ action, fields, setFields }: { action: ActionKey; fields: Record<string, string>; setFields: (fields: Record<string, string>) => void }) {
  const set = (key: string) => (e: ChangeEvent<HTMLInputElement>) => setFields({ ...fields, [key]: e.target.value });
  const field = (key: string, label: string, type = "text") => <Field key={key} label={label} type={type} value={fields[key] ?? ""} onChange={set(key)} />;
  if (action === "vitals") return <>{field("temperature", "Temperature (°C)", "number")}{field("systolic", "Systolic BP", "number")}{field("diastolic", "Diastolic BP", "number")}{field("pulse", "Pulse", "number")}{field("spo2", "SpO₂ (%)", "number")}{field("observation", "Observation")}</>;
  if (action === "nursing") return field("note", "Handover note");
  if (action === "clinical") return <>{field("diagnosis", "Diagnosis")}{field("symptoms", "Symptoms (comma separated)")}{field("treatmentPlan", "Treatment plan")}{field("notes", "Notes")}</>;
  if (action === "prescription") return <>{field("diagnosis", "Diagnosis")}{field("medicine", "Medicine name")}{field("dosage", "Dosage")}{field("frequency", "Frequency")}{field("duration", "Duration")}</>;
  return <>{field("test", "Test name")}{field("category", "Category")}</>;
}
