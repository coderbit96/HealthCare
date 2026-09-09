"use client";

import { ArrowRight, BookOpen, Building2, CalendarDays, ChevronDown, HeartHandshake, Images, Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Brand } from "./brand";
import { cn } from "@/lib/utils";

const homeLink = { href: "/", label: "Home" };
const primaryLinks = [{ href: "/services", label: "Services" }, { href: "/doctors", label: "Doctors" }, { href: "/departments", label: "Departments" }];
const aboutLinks = [{ href: "/about", label: "About us", description: "Our approach to care", icon: HeartHandshake }, { href: "/facilities", label: "Facilities", description: "Hospital spaces and support", icon: Building2 }, { href: "/gallery", label: "Gallery", description: "Our people and spaces", icon: Images }, { href: "/blogs", label: "Blog", description: "Helpful health reading", icon: BookOpen }];
const quickLinks = [{ href: "/health-packages", label: "Health packages" }, { href: "/contact", label: "Contact us" }];

function desktopLinkClass(active: boolean) {
  return cn("border-b-2 border-transparent py-2 text-sm font-medium text-ink-muted transition hover:border-brand/40 hover:text-brand", active && "border-brand text-brand");
}

function mobileLinkClass(active: boolean) {
  return cn("flex items-center justify-between rounded-md px-3 py-3 text-sm font-medium transition", active ? "bg-brand text-white" : "text-ink hover:bg-brand-soft");
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [mobileQuickLinksOpen, setMobileQuickLinksOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const pathname = usePathname();
  const aboutActive = aboutLinks.some((link) => pathname === link.href);
  const closeMobileNavigation = () => {
    setMobileOpen(false);
    setMobileAboutOpen(false);
    setMobileQuickLinksOpen(false);
  };

  return <header className="sticky top-0 z-40 border-b border-line bg-white">
    <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-5 lg:px-8 2xl:h-20">
      <Brand />
      <nav className="hidden items-center gap-7 2xl:flex" aria-label="Main navigation">
        <Link href={homeLink.href} onClick={() => setAboutOpen(false)} className={desktopLinkClass(pathname === homeLink.href)} aria-current={pathname === homeLink.href ? "page" : undefined}>{homeLink.label}</Link>
        <div className="relative">
          <button type="button" className={cn("inline-flex items-center gap-1 border-b-2 border-transparent py-2 text-sm font-medium text-ink-muted transition hover:border-brand/40 hover:text-brand", (aboutActive || aboutOpen) && "border-brand text-brand")} onClick={() => setAboutOpen(!aboutOpen)} aria-expanded={aboutOpen} aria-haspopup="true" aria-controls="about-navigation">About <ChevronDown size={16} className={cn("transition-transform", aboutOpen && "rotate-180")} /></button>
          {aboutOpen && <div id="about-navigation" className="absolute left-0 top-[calc(100%+0.9rem)] z-50 w-72 rounded-lg border border-line bg-white p-2 shadow-lg" aria-label="About Health Care"><p className="px-3 py-2 text-xs font-semibold uppercase tracking-[.14em] text-brand">About Health Care</p>{aboutLinks.map((link) => { const active = pathname === link.href; const Icon = link.icon; return <Link key={link.href} href={link.href} onClick={() => setAboutOpen(false)} className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 transition hover:bg-brand-soft", active && "bg-brand-soft")} aria-current={active ? "page" : undefined}><Icon size={18} className="shrink-0 text-brand" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-ink">{link.label}</span><span className="block text-xs text-ink-subtle">{link.description}</span></span><ArrowRight size={15} className="text-brand" /></Link>; })}</div>}
        </div>
        {primaryLinks.map((link) => <Link key={link.href} href={link.href} onClick={() => setAboutOpen(false)} className={desktopLinkClass(pathname === link.href)} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}
        {quickLinks.map((link) => <Link key={link.href} href={link.href} onClick={() => setAboutOpen(false)} className={desktopLinkClass(pathname === link.href)} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}
      </nav>
      <div className="hidden shrink-0 items-center gap-6 2xl:flex">
        <a href="tel:+913340002000" className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-ink-muted transition hover:text-brand" aria-label="Call Health Care on +91 33 4000 2000"><Phone size={18} className="text-brand" />+91 33 4000 2000</a>
        <Link href="/appointments" className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong"><CalendarDays size={17} />Book appointment <ArrowRight size={17} /></Link>
      </div>
      <button className="grid size-10 shrink-0 place-items-center rounded-md border border-line text-brand transition hover:bg-brand-soft 2xl:hidden" onClick={() => mobileOpen ? closeMobileNavigation() : setMobileOpen(true)} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="mobile-navigation">{mobileOpen ? <X size={20} /> : <Menu size={21} />}</button>
    </div>
    {mobileOpen && <nav id="mobile-navigation" className="fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto border-t border-line bg-white 2xl:hidden" aria-label="Mobile navigation"><div className="mx-auto min-h-full max-w-lg px-4 py-5 sm:px-5"><div className="grid gap-1"><Link href={homeLink.href} onClick={closeMobileNavigation} className={mobileLinkClass(pathname === homeLink.href)} aria-current={pathname === homeLink.href ? "page" : undefined}>{homeLink.label}<ArrowRight size={17} /></Link>{primaryLinks.map((link) => <Link key={link.href} href={link.href} onClick={closeMobileNavigation} className={mobileLinkClass(pathname === link.href)} aria-current={pathname === link.href ? "page" : undefined}>{link.label}<ArrowRight size={17} /></Link>)}</div><div className="mt-3 border-t border-line pt-3"><button type="button" className="flex w-full items-center justify-between rounded-md px-3 py-3 text-sm font-semibold text-ink hover:bg-brand-soft" onClick={() => setMobileAboutOpen(!mobileAboutOpen)} aria-expanded={mobileAboutOpen} aria-controls="mobile-about-links">About Health Care <ChevronDown size={18} className={cn("text-brand transition-transform", mobileAboutOpen && "rotate-180")} /></button>{mobileAboutOpen && <div id="mobile-about-links" className="grid gap-1 px-1 pb-1">{aboutLinks.map((link) => <Link key={link.href} href={link.href} onClick={closeMobileNavigation} className={mobileLinkClass(pathname === link.href)} aria-current={pathname === link.href ? "page" : undefined}>{link.label}<ArrowRight size={17} /></Link>)}</div>}</div><div className="border-t border-line pt-3"><button type="button" className="flex w-full items-center justify-between rounded-md px-3 py-3 text-sm font-semibold text-ink hover:bg-brand-soft" onClick={() => setMobileQuickLinksOpen(!mobileQuickLinksOpen)} aria-expanded={mobileQuickLinksOpen} aria-controls="mobile-quick-links">Quick links <ChevronDown size={18} className={cn("text-brand transition-transform", mobileQuickLinksOpen && "rotate-180")} /></button>{mobileQuickLinksOpen && <div id="mobile-quick-links" className="grid gap-1 px-1 pb-1">{quickLinks.map((link) => <Link key={link.href} href={link.href} onClick={closeMobileNavigation} className={mobileLinkClass(pathname === link.href)} aria-current={pathname === link.href ? "page" : undefined}>{link.label}<ArrowRight size={17} /></Link>)}</div>}</div><div className="mt-5 border-t border-line pt-5"><Link href="/appointments" onClick={closeMobileNavigation} className="flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-3 text-sm font-semibold text-white"><CalendarDays size={17} />Book appointment</Link><a href="tel:+913340002000" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink-muted"><Phone size={16} className="text-brand" />+91 33 4000 2000</a></div></div></nav>}
  </header>;
}
