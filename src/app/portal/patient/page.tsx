import { redirect } from "next/navigation";
import { PatientPortalWorkspace } from "@/components/patient/patient-portal-workspace";
import { getServerSessionUser } from "@/lib/server-auth";

export const metadata = { title: "My health | Health Care .Pvt .Ltd" };

export default async function PatientPortal() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "patient") redirect("/portal/dashboard");

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Health Care .Pvt .Ltd</p>
            <h1 className="font-display text-2xl font-semibold">My health</h1>
          </div>
          <div className="rounded-full bg-brand-soft px-3 py-2 text-sm font-semibold text-brand-strong">{user.name}</div>
        </div>
      </header>
      <PatientPortalWorkspace name={user.name} />
    </main>
  );
}
