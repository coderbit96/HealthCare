"use client";

import { ArrowRight, CalendarDays, Menu, Phone, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Brand } from "./brand";
import { cn } from "@/lib/utils";

const links = [{ href: "/about", label: "About" }, { href: "/services", label: "Services" }, { href: "/doctors", label: "Doctors" }, { href: "/departments", label: "Departments" }, { href: "/appointments", label: "Appointments" }];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return <header className="sticky top-0 z-40 border-b border-brand/10 bg-canvas/85 shadow-[0_8px_30px_rgb(15_92_86/0.05)] backdrop-blur-xl">
    <div className="h-1 bg-gradient-to-r from-brand via-brand-bright to-accent" aria-hidden="true" />
    <div className="mx-auto flex h-[4.75rem] max-w-7xl items-center justify-between gap-6 px-5 lg:px-8">
      <div className="transition duration-300 hover:scale-[1.02]">
        <Brand />
      </div>
      <nav className="hidden items-center gap-1 rounded-full border border-line/80 bg-white/70 p-1.5 text-sm font-medium text-ink-muted shadow-sm lg:flex" aria-label="Main">
        {links.map((link) => {
          const active = pathname === link.href;
          return <Link className={cn("group relative rounded-full px-3.5 py-2 transition duration-300 hover:bg-brand-soft hover:text-brand-strong", active && "bg-brand text-white shadow-md shadow-brand/20 hover:bg-brand hover:text-white")} aria-current={active ? "page" : undefined} key={link.href} href={link.href}>
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {active && <span className="size-1.5 rounded-full bg-brand-bright ring-2 ring-white/70" aria-hidden="true" />}
              {link.label}
            </span>
            {!active && <span className="absolute inset-x-4 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-brand-bright transition-transform duration-300 group-hover:scale-x-100" aria-hidden="true" />}
          </Link>;
        })}
      </nav>
      <div className="hidden items-center gap-5 lg:flex">
        <a href="tel:+913340002000" className="group inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-brand" aria-label="Call Health Care on +91 33 4000 2000"><span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand transition duration-300 group-hover:rotate-12 group-hover:bg-brand group-hover:text-white"><Phone size={15} /></span><span>+91 33 4000 2000</span></a>
        <Link href="/appointments" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-bright px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/25"><CalendarDays size={16} /><span>Book appointment</span><ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" /></Link>
      </div>
      <button className="grid size-11 place-items-center rounded-xl border border-line bg-white text-brand shadow-sm transition hover:border-brand/30 hover:bg-brand-soft lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav className="border-t border-brand/10 bg-surface/95 px-5 py-4 shadow-xl backdrop-blur lg:hidden" aria-label="Mobile">
      <div className="mx-auto max-w-7xl">
        <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand"><Sparkles size={14} className="text-accent" /> Explore Health Care</p>
        <div className="grid gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return <Link onClick={() => setOpen(false)} className={cn("flex items-center justify-between rounded-xl px-4 py-3 font-medium text-ink transition", active ? "bg-brand text-white shadow-md shadow-brand/15" : "hover:bg-brand-soft hover:text-brand-strong")} aria-current={active ? "page" : undefined} key={link.href} href={link.href}><span>{link.label}</span><ArrowRight size={17} className={cn("transition-transform", active && "translate-x-1")} /></Link>;
          })}
        </div>
        <a href="tel:+913340002000" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink-muted"><Phone size={15} className="text-brand" />+91 33 4000 2000</a>
        <Link onClick={() => setOpen(false)} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-bright px-4 py-3 font-semibold text-white shadow-lg shadow-brand/20" href="/appointments"><CalendarDays size={17} />Book an appointment<ArrowRight size={17} /></Link>
      </div>
    </nav>}
  </header>;
}
