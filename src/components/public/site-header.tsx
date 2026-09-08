"use client";

import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Brand } from "./brand";
import { cn } from "@/lib/utils";

const links = [{ href: "/about", label: "About" }, { href: "/services", label: "Services" }, { href: "/doctors", label: "Doctors" }, { href: "/departments", label: "Departments" }, { href: "/appointments", label: "Appointments" }];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur">
    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 lg:px-8">
      <Brand />
      <nav className="hidden items-center gap-8 text-sm font-medium text-ink-muted lg:flex" aria-label="Main">
        {links.map((link) => {
          const active = pathname === link.href;
          return <Link className={cn("transition hover:text-brand", active && "font-semibold text-brand")} aria-current={active ? "page" : undefined} key={link.href} href={link.href}>{link.label}</Link>;
        })}
      </nav>
      <div className="hidden items-center gap-5 lg:flex">
        <a href="tel:+913340002000" className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-brand"><Phone size={16} />+91 33 4000 2000</a>
        <Link href="/portal/login" className="text-sm font-medium text-ink-muted transition hover:text-brand">Staff portal</Link>
        <Link href="/appointments" className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong">Book appointment</Link>
      </div>
      <button className="rounded-lg p-2 text-ink-muted hover:bg-surface-sunken lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav className="border-t border-line bg-surface px-5 py-4 lg:hidden" aria-label="Mobile">
      {links.map((link) => <Link onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 font-medium text-ink transition hover:bg-brand-soft hover:text-brand-strong" key={link.href} href={link.href}>{link.label}</Link>)}
      <Link onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 font-medium text-ink-muted" href="/portal/login">Staff portal</Link>
      <Link onClick={() => setOpen(false)} className="mt-2 block rounded-xl bg-brand px-3 py-3 text-center font-semibold text-white" href="/appointments">Book appointment</Link>
    </nav>}
  </header>;
}
