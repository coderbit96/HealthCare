"use client";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { type ComponentType, type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const alertTones: Record<string, { className: string; icon: ComponentType<{ size?: number; className?: string }> }> = {
  info: { className: "bg-brand-soft text-brand-strong", icon: Info },
  success: { className: "bg-brand-soft text-positive", icon: CheckCircle2 },
  warning: { className: "bg-amber-50 text-warning", icon: AlertTriangle },
  error: { className: "bg-accent-soft text-critical", icon: XCircle },
};

export function Alert({ tone = "info", title, children }: { tone?: keyof typeof alertTones; title?: string; children: ReactNode }) {
  const { className, icon: Icon } = alertTones[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl px-4 py-3 text-sm", className)}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>{title && <p className="font-semibold">{title}</p>}<div className={cn(title && "mt-0.5")}>{children}</div></div>
    </div>
  );
}

const badgeTones = {
  neutral: "bg-surface-sunken text-ink-muted",
  brand: "bg-brand-soft text-brand-strong",
  positive: "bg-brand-soft text-positive",
  warning: "bg-amber-50 text-warning",
  critical: "bg-accent-soft text-critical",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold capitalize", badgeTones[tone])}>{children}</span>;
}

/** Maps a domain status string onto a badge tone so status colours stay consistent app-wide. */
const STATUS_TONES: Record<string, keyof typeof badgeTones> = {
  active: "positive", admitted: "positive", paid: "positive", published: "positive", completed: "positive", confirmed: "positive", available: "positive", finalized: "positive", verified: "brand",
  pending: "warning", waiting: "warning", partially_paid: "warning", processing: "warning", draft: "warning", requested: "warning", reserved: "warning", cleaning: "warning",
  cancelled: "critical", no_show: "critical", rejected: "critical", occupied: "critical", critical: "critical", expired: "critical", void: "critical", inactive: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONES[status] ?? "neutral"}>{status.replace(/_/g, " ")}</Badge>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-lg bg-surface-sunken", className)} />;
}

export function EmptyState({ icon: Icon, title, message, action }: { icon?: ComponentType<{ size?: number; className?: string }>; title?: string; message: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center px-6 py-12 text-center">
      {Icon && <span className="mb-3 grid size-12 place-items-center rounded-full bg-surface-sunken text-ink-subtle"><Icon size={22} /></span>}
      {title && <p className="font-display text-lg font-semibold text-ink">{title}</p>}
      <p className="mt-1 max-w-sm text-sm text-ink-subtle">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

type Toast = { id: number; tone: keyof typeof alertTones; message: string };
const ToastContext = createContext<(tone: Toast["tone"], message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: Toast["tone"], message: string) => {
    setToasts(current => [...current, { id: Date.now() + Math.random(), tone, message }]);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] grid gap-2" role="region" aria-label="Notifications">
        {toasts.map(toast => <ToastItem key={toast.id} toast={toast} onDone={() => setToasts(current => current.filter(item => item.id !== toast.id))} />)}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => { const timer = setTimeout(onDone, 5000); return () => clearTimeout(timer); }, [onDone]);
  const { className, icon: Icon } = alertTones[toast.tone];
  return (
    <div role={toast.tone === "error" ? "alert" : "status"} className={cn("pointer-events-auto flex w-80 items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-xl", className)}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1">{toast.message}</p>
      <button onClick={onDone} aria-label="Dismiss" className="-mr-1 rounded p-1 opacity-60 transition hover:opacity-100"><X size={15} /></button>
    </div>
  );
}

export function useToast() { return useContext(ToastContext); }
