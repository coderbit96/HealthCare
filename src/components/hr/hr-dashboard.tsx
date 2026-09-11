"use client";
import { Ambulance, BedDouble, ClipboardCheck, Hospital, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AuthenticatedUser } from "@/lib/server-auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge, Card, EmptyState, StatCard } from "@/components/ui";

const navigation = ["Dashboard", "Employees", "Attendance", "Shifts", "Duty Roster", "Leave", "Payroll", "Wards", "Rooms", "Beds", "Emergency Operations", "Ambulance", "Staff Assignment", "Reports"];

type Staff = { _id: string; name: string; role: string; department?: string; active: boolean };
type BedOccupancy = { _id: string; count: number };
type AmbulanceRecord = { _id: string; vehicleNumber: string; status: string; driver?: string };

const BED_STATUSES = ["available", "occupied", "reserved", "cleaning", "maintenance"];

export function HrDashboard({ user }: { user: AuthenticatedUser }) {
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? "Dashboard";
  const [staff, setStaff] = useState<Staff[]>();
  const [occupancy, setOccupancy] = useState<BedOccupancy[]>();
  const [ambulances, setAmbulances] = useState<AmbulanceRecord[]>();
  const [emergencyCount, setEmergencyCount] = useState<number>();

  useEffect(() => {
    fetch("/api/users").then(r => r.ok ? r.json() : null).then(value => Array.isArray(value) && setStaff(value)).catch(() => undefined);
    fetch("/api/analytics/overview?range=today").then(r => r.ok ? r.json() : null).then(value => value && setOccupancy(value.bedOccupancy)).catch(() => undefined);
    fetch("/api/ambulances").then(r => r.ok ? r.json() : null).then(value => Array.isArray(value) && setAmbulances(value)).catch(() => undefined);
    fetch("/api/emergency?status=active").then(r => r.ok ? r.json() : null).then(value => Array.isArray(value) && setEmergencyCount(value.length)).catch(() => undefined);
  }, []);

  const totalBeds = occupancy?.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const occupied = occupancy?.find(item => item._id === "occupied")?.count ?? 0;
  const occupancyPct = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : undefined;
  const showBeds = ["Dashboard", "Wards", "Rooms", "Beds"].includes(section);
  const showFleet = ["Dashboard", "Emergency Operations", "Ambulance"].includes(section);
  const showPeople = ["Dashboard", "Employees", "Attendance", "Shifts", "Duty Roster", "Leave", "Payroll", "Staff Assignment", "Reports"].includes(section);

  return (
    <DashboardShell user={user} workspace="HR & operations" icon={UsersRound} navigation={navigation} title={`Welcome, ${user.name.split(" ")[0]}`}>
      {section === "Dashboard" && <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={UsersRound} label="Active staff" value={staff?.filter(s => s.active).length ?? "—"} />
        <StatCard icon={BedDouble} label="Beds occupied" value={occupancyPct !== undefined ? `${occupancyPct}%` : "—"} />
        <StatCard icon={Ambulance} label="Active emergencies" value={emergencyCount ?? "—"} tone="accent" />
      </section>}

      {(showBeds || showFleet) && <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {showBeds && <Card>
          <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><Hospital size={19} /></span>
          <h2 className="mt-4 font-display text-xl font-semibold">Ward &amp; bed occupancy</h2>
          <p className="mt-2 leading-7 text-ink-muted">Allocation is transaction-safe: an occupied bed cannot receive a second active patient assignment.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {BED_STATUSES.map(status => {
              const count = occupancy?.find(item => item._id === status)?.count ?? 0;
              return <Badge key={status} tone={status === "occupied" ? "brand" : "neutral"}>{status}{occupancy ? ` · ${count}` : ""}</Badge>;
            })}
          </div>
        </Card>}

        {showFleet && <div className="rounded-panel bg-brand p-6 text-white">
          <span className="grid size-10 place-items-center rounded-xl bg-white/15"><Ambulance size={19} /></span>
          <h2 className="mt-4 font-display text-xl font-semibold">Ambulance fleet</h2>
          <div className="mt-5 grid gap-2">
            {!ambulances ? <p className="text-sm text-white/60">Loading…</p> : ambulances.length === 0 ? <p className="text-sm text-white/60">No ambulances registered.</p> : ambulances.map(unit => (
              <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5 text-sm" key={unit._id}>
                <span className="font-medium">{unit.vehicleNumber}</span>
                <span className="capitalize text-white/70">{unit.status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </div>}
      </section>}

      {showPeople && <Card className="mt-6">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><ClipboardCheck size={19} /></span>
        <h2 className="mt-4 font-display text-lg font-semibold">People operations</h2>
        <p className="mt-2 leading-7 text-ink-muted">Employee profiles, attendance, rosters, leave approvals and payroll are managed from this authorised workspace.</p>
        <div className="mt-5 divide-y divide-line border-t border-line">
          {!staff ? <EmptyState message="Loading staff…" /> : staff.length === 0 ? <EmptyState message="No staff records found." /> : staff.slice(0, 10).map(member => (
            <div key={member._id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0"><p className="truncate font-medium">{member.name}</p><p className="truncate text-xs capitalize text-ink-subtle">{member.role.replace("_", " ")}{member.department ? ` · ${member.department}` : ""}</p></div>
              <Badge tone={member.active ? "positive" : "neutral"}>{member.active ? "Active" : "Inactive"}</Badge>
            </div>
          ))}
        </div>
      </Card>}
    </DashboardShell>
  );
}
