"use client";

import { FileText, FolderOpen, Pencil, Plus, RefreshCw, Search, ShieldCheck, Upload, UserRound, X } from "lucide-react";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";

type PatientListItem = { _id: string; name: string; uhid: string; patientId: string; phone: string; email?: string; dateOfBirth?: string; gender?: string; active?: boolean; createdAt?: string };
type PatientDocument = { name: string; type: string; data: string; uploadedAt?: string };
type PatientForm = { name: string; phone: string; email: string; dateOfBirth: string; gender: string; address: string; emergencyName: string; emergencyPhone: string; emergencyRelation: string; allergies: string; medicalHistory: string; documents: PatientDocument[]; active: boolean };
type PatientProfile = { patient: PatientListItem & { address?: string; emergencyContact?: { name?: string; phone?: string; relation?: string }; allergies?: string[]; medicalHistory?: string; documents?: PatientDocument[] }; appointments: JsonRecord[]; visits: JsonRecord[]; admissions: JsonRecord[]; prescriptions: JsonRecord[]; clinicalRecords: JsonRecord[]; labReports: JsonRecord[]; invoices: JsonRecord[]; payments: JsonRecord[]; insurance: JsonRecord[] };
type JsonRecord = Record<string, unknown>;

const blankForm: PatientForm = { name: "", phone: "", email: "", dateOfBirth: "", gender: "", address: "", emergencyName: "", emergencyPhone: "", emergencyRelation: "", allergies: "", medicalHistory: "", documents: [], active: true };
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

function dateInput(value?: string) { return value ? new Date(value).toISOString().slice(0, 10) : ""; }
function text(value: unknown) { return typeof value === "string" || typeof value === "number" ? String(value) : "—"; }
function recordTitle(record: JsonRecord) { return text(record.reference ?? record.admissionNumber ?? record.orderNumber ?? record.invoiceNumber ?? record.policyNumber ?? record.diagnosis ?? record.type ?? record._id); }
function recordDetails(record: JsonRecord) { return Object.entries(record).filter(([key, value]) => !["_id", "__v", "patient", "reference", "admissionNumber", "orderNumber", "invoiceNumber", "policyNumber", "diagnosis", "type"].includes(key) && value !== undefined && value !== null && value !== "").slice(0, 3).map(([key, value]) => `${key.replace(/([a-z])([A-Z])/g, "$1 $2")}: ${Array.isArray(value) ? `${value.length} item${value.length === 1 ? "" : "s"}` : text(value)}`).join(" · "); }

function profileForm(patient: PatientProfile["patient"]): PatientForm {
  return {
    name: patient.name ?? "", phone: patient.phone ?? "", email: patient.email ?? "", dateOfBirth: dateInput(patient.dateOfBirth), gender: patient.gender ?? "", address: patient.address ?? "",
    emergencyName: patient.emergencyContact?.name ?? "", emergencyPhone: patient.emergencyContact?.phone ?? "", emergencyRelation: patient.emergencyContact?.relation ?? "",
    allergies: (patient.allergies ?? []).join(", "), medicalHistory: patient.medicalHistory ?? "", documents: patient.documents ?? [], active: patient.active !== false,
  };
}

function toPayload(form: PatientForm) {
  return { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), dateOfBirth: form.dateOfBirth || undefined, gender: form.gender || undefined, address: form.address.trim(), emergencyContact: { name: form.emergencyName.trim(), phone: form.emergencyPhone.trim(), relation: form.emergencyRelation.trim() }, allergies: form.allergies.split(",").map((item) => item.trim()).filter(Boolean), medicalHistory: form.medicalHistory.trim(), documents: form.documents, active: form.active };
}

export function PatientMasterWorkspace({ onBack }: { onBack: () => void }) {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [profile, setProfile] = useState<PatientProfile>();
  const [form, setForm] = useState<PatientForm>(blankForm);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  const loadPatients = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patients?q=${encodeURIComponent(search.trim())}`);
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Unable to load patients.");
      setPatients(Array.isArray(payload) ? payload as PatientListItem[] : []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load patients."); }
    finally { setLoading(false); }
  }, []);

  const openPatient = async (id: string) => {
    setError(undefined); setMessage(undefined); setShowForm(false);
    try {
      const response = await fetch(`/api/patients/${id}`);
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Unable to load patient profile.");
      const next = payload as PatientProfile;
      setProfile(next); setForm(profileForm(next.patient)); setIsNew(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load patient profile."); }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void loadPatients(""); }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadPatients]);

  const startNew = () => { setProfile(undefined); setForm(blankForm); setIsNew(true); setShowForm(true); setMessage(undefined); setError(undefined); };
  const startEdit = () => { if (profile) { setForm(profileForm(profile.patient)); setIsNew(false); setShowForm(true); setMessage(undefined); setError(undefined); } };

  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(undefined); setMessage(undefined);
    try {
      const endpoint = isNew ? "/api/patients" : `/api/patients/${profile?.patient._id}`;
      const response = await fetch(endpoint, { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toPayload(form)) });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Unable to save patient.");
      const saved = payload as PatientListItem;
      setShowForm(false);
      await loadPatients(""); await openPatient(saved._id);
      setMessage(isNew ? `Patient registered with permanent UHID ${saved.uhid}.` : "Patient profile updated.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save patient."); }
    finally { setSaving(false); }
  };

  const setActive = async () => {
    if (!profile) return;
    const active = !profile.patient.active;
    setSaving(true); setError(undefined);
    try {
      const response = await fetch(`/api/patients/${profile.patient._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Unable to update account status.");
      await loadPatients(""); await openPatient(profile.patient._id);
      setMessage(active ? "Patient account activated." : "Patient account deactivated.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update account status."); }
    finally { setSaving(false); }
  };

  const addDocument = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Upload a PDF, PNG, JPEG, or WebP document."); return; }
    if (file.size > MAX_DOCUMENT_BYTES) { setError("Each document must be 5 MB or smaller."); return; }
    const reader = new FileReader();
    reader.onload = () => { const data = reader.result; if (typeof data === "string") setForm((current) => ({ ...current, documents: [...current.documents, { name: file.name, type: file.type, data }] })); };
    reader.onerror = () => setError("The selected document could not be read."); reader.readAsDataURL(file);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-brand">People & staff</p><h2 className="mt-2 font-display text-3xl font-semibold">Patients</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">One master profile per patient. The hospital-generated UHID remains the same across every visit, admission and bill.</p></div><button type="button" onClick={startNew} className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"><Plus size={17} />Add patient</button></div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row"><label className="relative block flex-1"><span className="sr-only">Search patients</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void loadPatients(query)} placeholder="Search by UHID, name, phone or email" className="w-full rounded-xl border border-line bg-surface px-10 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15" /></label><button type="button" onClick={() => void loadPatients(query)} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-md border border-line px-4 py-2.5 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft disabled:opacity-60"><RefreshCw size={16} className={loading ? "animate-spin" : undefined} />Search</button></div>
        <div className="mt-5 grid max-h-80 gap-2 overflow-y-auto pr-1">
          {loading ? <p className="rounded-xl bg-surface-sunken p-4 text-sm text-ink-muted">Loading patient directory…</p> : patients.length === 0 ? <p className="rounded-xl bg-surface-sunken p-4 text-sm text-ink-muted">No patient records found.</p> : patients.map((patient) => <button type="button" key={patient._id} onClick={() => void openPatient(patient._id)} className={`flex items-center justify-between gap-4 rounded-xl border p-4 text-left transition hover:border-brand/30 hover:bg-brand-soft/40 ${profile?.patient._id === patient._id ? "border-brand/40 bg-brand-soft" : "border-line"}`}><span><span className="block font-semibold">{patient.name}</span><span className="mt-1 block text-xs text-ink-subtle">{patient.uhid} · {patient.phone}</span></span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${patient.active === false ? "bg-critical/10 text-critical" : "bg-positive/10 text-positive"}`}>{patient.active === false ? "Inactive" : "Active"}</span></button>)}
        </div>
      </div>

      {(error || message) && <p className={`rounded-xl p-4 text-sm ${error ? "bg-critical/10 text-critical" : "bg-positive/10 text-positive"}`} role={error ? "alert" : "status"}>{error ?? message}</p>}

      {showForm && <PatientFormPanel form={form} setForm={setForm} isNew={isNew} saving={saving} onClose={() => setShowForm(false)} onSubmit={save} onDocument={addDocument} />}

      {profile && !showForm && <PatientProfilePanel profile={profile} saving={saving} onEdit={startEdit} onSetActive={() => void setActive()} />}

      {!profile && !showForm && <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center shadow-sm"><UserRound className="mx-auto text-brand" size={28} /><h3 className="mt-4 font-semibold">Select a patient profile</h3><p className="mt-2 text-sm text-ink-muted">Search the directory or add a new patient to view their complete hospital history.</p></div>}

      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2.5 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft">Back to dashboard</button>
    </section>
  );
}

function PatientFormPanel({ form, setForm, isNew, saving, onClose, onSubmit, onDocument }: { form: PatientForm; setForm: (form: PatientForm | ((current: PatientForm) => PatientForm)) => void; isNew: boolean; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void; onDocument: (event: ChangeEvent<HTMLInputElement>) => void }) {
  const field = "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";
  const update = (key: keyof PatientForm, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  return <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-brand">{isNew ? "New patient registration" : "Patient profile"}</p><h3 className="mt-2 font-display text-2xl font-semibold">{isNew ? "Add patient" : "Edit patient information"}</h3><p className="mt-2 text-sm text-ink-muted">{isNew ? "A permanent UHID is generated once after registration." : "The UHID cannot be changed."}</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-ink-subtle transition hover:bg-surface-sunken"><X size={20} /></button></div><div className="mt-7 grid gap-5 md:grid-cols-2"><Field label="Full name" value={form.name} onChange={(value) => update("name", value)} required className={field} /><Field label="Phone" value={form.phone} onChange={(value) => update("phone", value)} required className={field} /><Field label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} className={field} /><Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={(value) => update("dateOfBirth", value)} className={field} /><label className="text-sm font-semibold">Gender<select value={form.gender} onChange={(event) => update("gender", event.target.value)} className={field}><option value="">Not specified</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></label><Field label="Address" value={form.address} onChange={(value) => update("address", value)} className={field} /></div><div className="mt-7 border-t border-line pt-6"><h4 className="font-semibold">Emergency contact</h4><div className="mt-4 grid gap-5 md:grid-cols-3"><Field label="Contact name" value={form.emergencyName} onChange={(value) => update("emergencyName", value)} className={field} /><Field label="Contact phone" value={form.emergencyPhone} onChange={(value) => update("emergencyPhone", value)} className={field} /><Field label="Relation" value={form.emergencyRelation} onChange={(value) => update("emergencyRelation", value)} className={field} /></div></div><div className="mt-7 grid gap-5 md:grid-cols-2"><label className="text-sm font-semibold">Allergies (separate with commas)<input value={form.allergies} onChange={(event) => update("allergies", event.target.value)} className={field} placeholder="e.g. Penicillin, peanuts" /></label><label className="text-sm font-semibold">Medical history<textarea value={form.medicalHistory} onChange={(event) => update("medicalHistory", event.target.value)} className={`${field} min-h-24`} placeholder="Conditions, procedures or relevant history" /></label></div><div className="mt-7 border-t border-line pt-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold">Patient documents</h4><p className="mt-1 text-sm text-ink-muted">PDF or image documents can be attached to this master profile.</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft"><Upload size={16} />Add document<input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="sr-only" onChange={onDocument} /></label></div>{form.documents.length > 0 && <ul className="mt-4 grid gap-2">{form.documents.map((document, index) => <li key={`${document.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-surface-sunken px-3 py-2 text-sm"><span className="truncate"><FileText className="mr-2 inline text-brand" size={15} />{document.name}</span><button type="button" onClick={() => setForm((current) => ({ ...current, documents: current.documents.filter((_, itemIndex) => itemIndex !== index) }))} className="font-semibold text-critical hover:underline">Remove</button></li>)}</ul>}</div><div className="mt-7 flex flex-wrap gap-3"><button disabled={saving} className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-60">{saving ? "Saving…" : isNew ? "Register patient" : "Save patient profile"}</button><button type="button" onClick={onClose} className="rounded-md border border-line px-4 py-2.5 text-sm font-semibold text-ink-muted transition hover:bg-surface-sunken">Cancel</button></div></form>;
}

function Field({ label, value, onChange, className, required = false, type = "text" }: { label: string; value: string; onChange: (value: string) => void; className: string; required?: boolean; type?: string }) { return <label className="text-sm font-semibold">{label}<input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className={className} /></label>; }

function PatientProfilePanel({ profile, saving, onEdit, onSetActive }: { profile: PatientProfile; saving: boolean; onEdit: () => void; onSetActive: () => void }) {
  const { patient } = profile;
  const histories: { title: string; items: JsonRecord[] }[] = [{ title: "Appointments", items: profile.appointments }, { title: "OPD visits", items: profile.visits.filter((visit) => visit.type === "opd") }, { title: "IPD admissions", items: profile.admissions }, { title: "Prescriptions", items: profile.prescriptions }, { title: "Clinical records", items: profile.clinicalRecords }, { title: "Lab reports", items: profile.labReports }, { title: "Bills & invoices", items: profile.invoices }, { title: "Payments", items: profile.payments }, { title: "Insurance", items: profile.insurance }];
  return <div className="space-y-6"><section className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div className="flex gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-soft font-display text-xl font-semibold text-brand-strong">{patient.name.slice(0, 2).toUpperCase()}</span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-2xl font-semibold">{patient.name}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${patient.active === false ? "bg-critical/10 text-critical" : "bg-positive/10 text-positive"}`}>{patient.active === false ? "Inactive account" : "Active account"}</span></div><p className="mt-1 font-mono text-sm font-semibold text-brand">{patient.uhid}</p><p className="mt-2 text-sm text-ink-muted">{patient.phone}{patient.email ? ` · ${patient.email}` : ""}</p></div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft"><Pencil size={16} />Edit profile</button><button type="button" disabled={saving} onClick={onSetActive} className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink-muted transition hover:bg-surface-sunken disabled:opacity-60"><ShieldCheck size={16} />{patient.active === false ? "Activate" : "Deactivate"}</button></div></div><div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-4"><Info label="Date of birth" value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "Not recorded"} /><Info label="Gender" value={patient.gender?.replaceAll("_", " ") ?? "Not recorded"} /><Info label="Emergency contact" value={patient.emergencyContact?.name ? `${patient.emergencyContact.name} · ${patient.emergencyContact.phone || ""}` : "Not recorded"} /><Info label="Allergies" value={patient.allergies?.length ? patient.allergies.join(", ") : "None recorded"} /></div>{patient.medicalHistory && <div className="mt-5 rounded-xl bg-surface-sunken p-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-ink-subtle">Medical history</p><p className="mt-2 text-sm leading-6 text-ink-muted">{patient.medicalHistory}</p></div>}</section><section className="rounded-2xl border border-line bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><FolderOpen size={18} className="text-brand" /><div><h3 className="font-semibold">Patient documents</h3><p className="mt-1 text-sm text-ink-subtle">Documents stored on this patient master profile.</p></div></div>{(patient.documents ?? []).length === 0 ? <p className="mt-4 text-sm text-ink-muted">No documents uploaded.</p> : <ul className="mt-4 grid gap-2 sm:grid-cols-2">{patient.documents?.map((document, index) => <li key={`${document.name}-${index}`}><a href={document.data} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-line px-3 py-3 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft"><FileText size={16} />{document.name}</a></li>)}</ul>}</section><section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">{histories.map((history) => <HistoryPanel key={history.title} {...history} />)}</section></div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold uppercase tracking-[.1em] text-ink-subtle">{label}</p><p className="mt-1 text-sm font-medium capitalize text-ink">{value}</p></div>; }
function HistoryPanel({ title, items }: { title: string; items: JsonRecord[] }) { return <article className="rounded-2xl border border-line bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{title}</h3><span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-strong">{items.length}</span></div>{items.length === 0 ? <p className="mt-4 text-sm text-ink-muted">No records yet.</p> : <ul className="mt-4 max-h-48 divide-y divide-line overflow-y-auto">{items.slice(0, 20).map((item, index) => <li key={`${recordTitle(item)}-${index}`} className="py-3 first:pt-0"><p className="text-sm font-semibold">{recordTitle(item)}</p><p className="mt-1 text-xs leading-5 text-ink-muted">{recordDetails(item) || "Record available"}</p></li>)}</ul>}</article>; }
