"use client";
import { type ComponentType, type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./feedback";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-panel border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(28,25,23,.04),0_12px_32px_-16px_rgba(28,25,23,.12)]", className)}>{children}</div>;
}

export function StatCard({ icon: Icon, label, value, hint, tone = "brand", loading }: { icon: ComponentType<{ size?: number; className?: string }>; label: string; value: ReactNode; hint?: string; tone?: "brand" | "accent"; loading?: boolean }) {
  return (
    <Card className="p-5">
      <span className={cn("inline-grid size-10 place-items-center rounded-xl", tone === "accent" ? "bg-accent-soft text-accent" : "bg-brand-soft text-brand")}><Icon size={20} /></span>
      {loading ? <Skeleton className="mt-4 h-9 w-20" /> : <p className="mt-4 font-display text-3xl font-semibold tracking-tight">{value}</p>}
      <p className="mt-0.5 text-sm text-ink-muted">{label}</p>
      {hint && <p className="mt-1 text-xs text-ink-subtle">{hint}</p>}
    </Card>
  );
}

export function ChartCard({ title, description, action, loading, children }: { title: string; description?: string; action?: ReactNode; loading?: boolean; children: ReactNode }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="font-display text-lg font-semibold">{title}</h2>{description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}</div>
        {action}
      </div>
      <div className="mt-6">{loading ? <Skeleton className="h-56 w-full" /> : children}</div>
    </Card>
  );
}

export function SectionHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[.18em] text-brand">{eyebrow}</p>}
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">{title}</h2>
      {children && <p className="mt-4 text-lg leading-8 text-ink-muted">{children}</p>}
    </div>
  );
}

export function Tabs({ tabs, initial }: { tabs: { id: string; label: string; content: ReactNode }[]; initial?: string }) {
  const [activeId, setActiveId] = useState(initial ?? tabs[0]?.id);
  const active = tabs.find(tab => tab.id === activeId) ?? tabs[0];
  return (
    <div>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(tab => (
          <button key={tab.id} role="tab" id={`tab-${tab.id}`} aria-selected={tab.id === activeId} aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveId(tab.id)}
            className={cn("whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition", tab.id === activeId ? "border-brand text-brand" : "border-transparent text-ink-muted hover:text-ink")}>
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${active?.id}`} aria-labelledby={`tab-${active?.id}`} className="pt-5">{active?.content}</div>
    </div>
  );
}
