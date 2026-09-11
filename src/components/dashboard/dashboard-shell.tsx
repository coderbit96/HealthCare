"use client";
import { signOut } from "firebase/auth";
import { ArrowLeft, ChevronRight, LogOut, Menu, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ComponentType, type ReactNode, useState } from "react";
import { auth } from "@/lib/firebase";
import type { AuthenticatedUser } from "@/lib/server-auth";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui";

export function DashboardShell({ user, workspace, icon: Icon, navigation, title, children }: { user: AuthenticatedUser; workspace: string; icon: ComponentType<{ size?: number }>; navigation: string[]; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedSection = searchParams.get("section");
  const activeSection = requestedSection && navigation.includes(requestedSection) ? requestedSection : navigation[0];
  const logout = async () => { await fetch("/api/auth/session", { method: "DELETE" }); if (auth) await signOut(auth); router.replace("/login"); };
  const selectSection = (section: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (section === navigation[0]) params.delete("section");
    else params.set("section", section);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    setOpen(false);
  };

  const nav = (
    <nav className="mt-7 grid gap-1" aria-label={`${workspace} sections`}>
      {navigation.map((item) => (
        <button key={item} type="button" onClick={() => selectSection(item)} aria-current={activeSection === item ? "page" : undefined} className={cn("flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition", activeSection === item ? "bg-brand-soft font-semibold text-brand-strong" : "text-ink-muted hover:bg-surface-sunken hover:text-ink")}><span>{item}</span>{activeSection === item && <ChevronRight size={16} aria-hidden />}</button>
      ))}
    </nav>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-canvas text-ink">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 overflow-y-auto border-r border-line bg-surface p-5 md:block">
          <div className="flex items-center gap-2.5 font-display text-lg font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-brand text-white"><Icon size={19} /></span>Health Care</div>
          <p className="mt-1.5 pl-11 text-[11px] font-semibold uppercase tracking-[.14em] text-brand">{workspace}</p>
          {nav}
          <button onClick={logout} className="mt-7 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-muted transition hover:bg-accent-soft hover:text-critical"><LogOut size={18} />Sign out</button>
        </aside>

        {open && <div className="fixed inset-0 z-40 bg-ink/40 md:hidden" onClick={() => setOpen(false)} aria-hidden />}
        <aside className={cn("fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-line bg-surface p-5 transition-transform md:hidden", open ? "translate-x-0" : "-translate-x-full")} aria-hidden={!open}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-display text-lg font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-brand text-white"><Icon size={19} /></span>Health Care</div>
            <button onClick={() => setOpen(false)} aria-label="Close navigation" className="rounded-lg p-2 hover:bg-surface-sunken"><X size={20} /></button>
          </div>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[.14em] text-brand">{workspace}</p>
          {nav}
          <button onClick={logout} className="mt-7 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-muted transition hover:bg-accent-soft hover:text-critical"><LogOut size={18} />Sign out</button>
        </aside>

        <div className="md:ml-64">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur sm:px-7">
            <button onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open} className="-ml-1 rounded-lg p-2 text-ink-muted hover:bg-surface-sunken md:hidden"><Menu size={20} /></button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-brand">{workspace}</p>
              <h1 className="truncate font-display text-xl font-semibold tracking-tight sm:text-2xl">{activeSection === navigation[0] ? title : activeSection}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs capitalize text-ink-subtle">{user.role.replace("_", " ")}</p></div>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong">{user.name.slice(0, 2).toUpperCase()}</span>
            </div>
          </header>
          <main className="mx-auto max-w-7xl p-5 sm:p-7">
            {activeSection !== navigation[0] && <section className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-brand/15 bg-brand-soft/50 p-5 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-brand">{workspace}</p><h2 className="mt-1 font-display text-xl font-semibold">{activeSection}</h2><p className="mt-1 text-sm leading-6 text-ink-muted">This role-restricted workspace is selected. The information below remains scoped to your authorised account and current hospital duties.</p></div><button type="button" onClick={() => selectSection(navigation[0])} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-brand-strong transition hover:bg-brand-soft"><ArrowLeft size={16} />Overview</button></section>}
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
