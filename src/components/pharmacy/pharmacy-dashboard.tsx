"use client";
import { AlertTriangle, Package, Pill, ReceiptText, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import type { AuthenticatedUser } from "@/lib/server-auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge, Button, Card, EmptyState, Field, StatCard } from "@/components/ui";

const navigation = ["Dashboard", "Prescriptions", "Dispensing", "Medicines", "Categories", "Brands", "Batches", "Inventory", "Purchases", "Suppliers", "Returns", "Sales", "Billing", "Reports", "Alerts"];

type Medicine = { _id: string; name: string; stock: number; lowStock: boolean; batches: { _id: string; batchNumber: string; quantity: number; expiryDate: string }[] };
type Prescription = { _id: string; status: string; patient?: { name: string; uhid: string } | string; medicines: { name: string }[] };
type Dispense = { _id: string; quantity: number; createdAt: string; patient?: { name: string } | string };

export function PharmacyDashboard({ user }: { user: AuthenticatedUser }) {
  const [medicines, setMedicines] = useState<Medicine[]>();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>();
  const [history, setHistory] = useState<Dispense[]>();
  const [form, setForm] = useState({ patient: "", batch: "", quantity: "1" });
  const [errors, setErrors] = useState<{ patient?: string; batch?: string; quantity?: string }>({});
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/pharmacy/medicines").then(r => r.ok ? r.json() : null).then(value => Array.isArray(value) && setMedicines(value)).catch(() => undefined);
    fetch("/api/prescriptions?status=finalized").then(r => r.ok ? r.json() : null).then(value => Array.isArray(value) && setPrescriptions(value)).catch(() => undefined);
    fetch("/api/pharmacy/dispense").then(r => r.ok ? r.json() : null).then(value => Array.isArray(value) && setHistory(value)).catch(() => undefined);
  };
  useEffect(() => { load(); }, []);

  const todaysDispenses = history?.filter(d => new Date(d.createdAt).toDateString() === new Date().toDateString()).length;
  const lowStockCount = medicines?.filter(m => m.lowStock).length;

  const dispense = async () => {
    setError(undefined); setMessage(undefined);
    const next: typeof errors = {};
    if (!/^[a-f\d]{24}$/i.test(form.patient.trim())) next.patient = "Enter a valid 24-character patient id";
    if (!/^[a-f\d]{24}$/i.test(form.batch.trim())) next.batch = "Enter a valid 24-character batch id";
    if (!(Number(form.quantity) > 0)) next.quantity = "Quantity must be at least 1";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    try {
      const response = await fetch("/api/pharmacy/dispense", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient: form.patient, batch: form.batch, quantity: Number(form.quantity) }) });
      const body = await response.json();
      if (!response.ok) { setError(body.error ?? "Unable to dispense"); return; }
      setMessage("Dispensed successfully.");
      setForm({ patient: "", batch: "", quantity: "1" });
      load();
    } catch { setError("Unable to dispense"); }
    finally { setSaving(false); }
  };

  return (
    <DashboardShell user={user} workspace="Pharmacy" icon={Pill} navigation={navigation} title={`Welcome, ${user.name.split(" ")[0]}`}>
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Pill} label="Pending prescriptions" value={prescriptions?.length ?? "—"} />
        <StatCard icon={Package} label="Low stock alerts" value={lowStockCount ?? "—"} tone={lowStockCount ? "accent" : "brand"} />
        <StatCard icon={ShoppingCart} label="Dispensed today" value={todaysDispenses ?? "—"} />
      </section>

      <div className="mt-6 rounded-panel bg-brand p-6 text-white">
        <h2 className="font-display text-xl font-semibold">Dispense medicine</h2>
        <p className="mt-2 leading-7 text-white/75">Stock is decremented atomically only when enough unexpired inventory exists, so negative stock cannot be created.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3 [&_label]:text-white [&_input]:border-white/20 [&_input]:bg-white/10 [&_input]:text-white [&_input]:placeholder:text-white/50">
          <Field label="Patient id" placeholder="24-character id" value={form.patient} error={errors.patient} onChange={e => setForm({ ...form, patient: e.target.value })} />
          <Field label="Batch id" placeholder="24-character id" value={form.batch} error={errors.batch} onChange={e => setForm({ ...form, batch: e.target.value })} />
          <Field label="Quantity" type="number" min={1} value={form.quantity} error={errors.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
        </div>
        <Button variant="accent" className="mt-4" onClick={dispense} disabled={saving}>{saving ? "Dispensing…" : "Dispense"}</Button>
        {message && <p role="status" className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium">{message}</p>}
        {error && <p role="alert" className="mt-3 rounded-xl bg-accent px-3 py-2 text-sm font-medium">{error}</p>}
        <p className="mt-5 flex items-center gap-2 text-sm text-white/70"><AlertTriangle size={17} />Expiry and low-stock warnings are surfaced from batch data below.</p>
      </div>

      <Card className="mt-6">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><ReceiptText size={19} /></span>
        <h2 className="mt-4 font-display text-lg font-semibold">Medicine stock</h2>
        <div className="mt-4 divide-y divide-line border-t border-line">
          {!medicines ? <EmptyState message="Loading medicines…" /> : medicines.length === 0 ? <EmptyState message="No medicines catalogued." /> : medicines.slice(0, 10).map(medicine => (
            <div key={medicine._id} className="flex items-center justify-between gap-4 py-3">
              <p className="min-w-0 truncate font-medium">{medicine.name}</p>
              <Badge tone={medicine.lowStock ? "critical" : "positive"}>{medicine.stock} in stock</Badge>
            </div>
          ))}
        </div>
      </Card>
    </DashboardShell>
  );
}
