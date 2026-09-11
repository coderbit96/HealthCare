"use client";
import { Beaker, ClipboardList, FileCheck2, FlaskConical, Package } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AuthenticatedUser } from "@/lib/server-auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button, Card, type Column, ConfirmDialog, DataTable, StatCard, StatusBadge, useToast } from "@/components/ui";

const navigation = ["Dashboard", "Test Orders", "Samples", "Processing", "Results", "Reports", "Test Master", "Inventory"];

type LabOrder = { _id: string; orderNumber: string; sampleStatus: string; processingStatus: string; reportStatus: string; tests: { name: string }[]; patient?: { name: string; uhid: string } | string; createdAt: string };

/** The lab workflow is a fixed progression; this resolves the next legal transition for an order. */
function nextStep(order: LabOrder): { action: string; label: string } | undefined {
  if (order.reportStatus === "published") return undefined;
  if (order.reportStatus === "verified") return { action: "publish", label: "Publish report" };
  if (order.processingStatus === "completed") return { action: "verify", label: "Verify results" };
  if (order.sampleStatus === "pending") return { action: "collect", label: "Collect sample" };
  return { action: "processing", label: "Start processing" };
}

const patientName = (order: LabOrder) => typeof order.patient === "object" ? order.patient?.name ?? "" : "";

export function LabDashboard({ user }: { user: AuthenticatedUser }) {
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? "Dashboard";
  const [orders, setOrders] = useState<LabOrder[]>();
  const [pendingOrder, setPendingOrder] = useState<LabOrder>();
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(() => fetch("/api/lab/orders")
    .then(response => response.ok ? response.json() : Promise.reject(new Error("Unable to load lab orders")))
    .then(value => Array.isArray(value) && setOrders(value))
    .catch(() => { setOrders([]); toast("error", "Could not load lab orders."); }), [toast]);

  useEffect(() => { load(); }, [load]);

  const advance = async () => {
    const order = pendingOrder;
    const step = order && nextStep(order);
    if (!order || !step) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/lab/orders/${order._id}/results`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: step.action }) });
      const body = await response.json();
      if (!response.ok) { toast("error", body.error ?? "Unable to update order"); return; }
      toast("success", `${order.orderNumber}: ${step.label.toLowerCase()} complete.`);
      setPendingOrder(undefined);
      await load();
    } catch { toast("error", "Unable to update order"); }
    finally { setBusy(false); }
  };

  const columns: Column<LabOrder>[] = [
    { key: "orderNumber", header: "Order", sortValue: order => order.orderNumber, render: order => <span className="font-medium">{order.orderNumber}</span> },
    { key: "patient", header: "Patient", sortValue: patientName, render: order => patientName(order) || <span className="text-ink-subtle">—</span> },
    { key: "tests", header: "Tests", secondary: true, render: order => <span className="text-ink-muted">{order.tests.map(test => test.name).join(", ")}</span> },
    { key: "reportStatus", header: "Status", sortValue: order => order.reportStatus, render: order => <StatusBadge status={order.reportStatus} /> },
    { key: "createdAt", header: "Raised", secondary: true, sortValue: order => new Date(order.createdAt).getTime(), render: order => <span className="text-ink-muted">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span> },
  ];
  const visibleOrders = orders?.filter((order) => {
    if (section === "Samples") return order.sampleStatus !== "received";
    if (section === "Processing") return order.processingStatus === "processing";
    if (section === "Results") return order.processingStatus === "completed" && order.reportStatus === "draft";
    if (section === "Reports") return ["verified", "published"].includes(order.reportStatus);
    return true;
  });
  const showOrders = ["Dashboard", "Test Orders", "Samples", "Processing", "Results", "Reports"].includes(section);
  const showInventory = ["Dashboard", "Test Master", "Inventory"].includes(section);

  return (
    <DashboardShell user={user} workspace="Laboratory" icon={Beaker} navigation={navigation} title={`Welcome, ${user.name.split(" ")[0]}`}>
      {section === "Dashboard" && <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={ClipboardList} label="Pending orders" value={orders?.filter(o => o.processingStatus === "requested").length ?? "—"} loading={!orders} />
        <StatCard icon={FlaskConical} label="Processing" value={orders?.filter(o => o.processingStatus === "processing").length ?? "—"} loading={!orders} />
        <StatCard icon={FileCheck2} label="Ready to publish" value={orders?.filter(o => o.reportStatus === "verified").length ?? "—"} tone="accent" loading={!orders} />
      </section>}

      {showOrders && <Card className="mt-6">
        <h2 className="font-display text-lg font-semibold">{section === "Dashboard" || section === "Test Orders" ? "Test orders" : section}</h2>
        <p className="mt-1 text-sm text-ink-muted">Request → sample collection → processing → result entry → verification → published report.</p>
        <div className="mt-5">
          <DataTable
            caption="Laboratory test orders"
            rows={visibleOrders}
            columns={columns}
            getRowId={order => order._id}
            searchPlaceholder="Search by order number or patient…"
            searchKeys={order => `${order.orderNumber} ${patientName(order)} ${order.tests.map(test => test.name).join(" ")}`}
            filters={[{ key: "reportStatus", label: "Status", options: [{ value: "draft", label: "Draft" }, { value: "verified", label: "Verified" }, { value: "published", label: "Published" }] }]}
            emptyMessage="No lab orders have been raised yet."
            rowActions={order => {
              const step = nextStep(order);
              return step
                ? <Button variant="outline" size="sm" onClick={() => setPendingOrder(order)}>{step.label}</Button>
                : <span className="text-xs font-medium text-ink-subtle">Complete</span>;
            }}
          />
        </div>
      </Card>}

      {showInventory && <Card className="mt-6">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><Package size={19} /></span>
        <h2 className="mt-4 font-display text-lg font-semibold">Test master &amp; inventory</h2>
        <p className="mt-2 leading-7 text-ink-muted">Manage test categories, pricing, report history and laboratory inventory from this role-restricted workspace.</p>
      </Card>}

      <ConfirmDialog
        open={Boolean(pendingOrder)}
        onClose={() => setPendingOrder(undefined)}
        onConfirm={advance}
        pending={busy}
        tone="brand"
        title={pendingOrder ? nextStep(pendingOrder)?.label ?? "Advance order" : "Advance order"}
        confirmLabel={pendingOrder ? nextStep(pendingOrder)?.label ?? "Confirm" : "Confirm"}
        message={pendingOrder ? `This will advance ${pendingOrder.orderNumber}${patientName(pendingOrder) ? ` for ${patientName(pendingOrder)}` : ""}. Published reports become visible to the requesting doctor and the patient.` : ""}
      />
    </DashboardShell>
  );
}
