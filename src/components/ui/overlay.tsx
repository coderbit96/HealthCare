"use client";
import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/** Native <dialog> gives us focus trapping, Escape-to-close and inert background for free. */
function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => { event.preventDefault(); onClose(); };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);
  return ref;
}

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: { open: boolean; onClose: () => void; title: string; description?: string; children?: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" }) {
  const ref = useDialog(open, onClose);
  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" }[size];
  return (
    <dialog ref={ref} onClick={event => event.target === ref.current && onClose()} className={cn("w-[calc(100vw-2rem)] rounded-panel border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/40 backdrop:backdrop-blur-sm", width)}>
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>
        <button onClick={onClose} aria-label="Close dialog" className="-mr-2 rounded-lg p-2 text-ink-muted transition hover:bg-surface-sunken hover:text-ink"><X size={18} /></button>
      </div>
      {children && <div className="px-6 py-5">{children}</div>}
      {footer && <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
    </dialog>
  );
}

export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children?: ReactNode; footer?: ReactNode }) {
  const ref = useDialog(open, onClose);
  return (
    <dialog ref={ref} onClick={event => event.target === ref.current && onClose()} className="ml-auto mr-0 h-dvh max-h-none w-[min(28rem,100vw)] max-w-none border-l border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/40">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close panel" className="-mr-2 rounded-lg p-2 text-ink-muted transition hover:bg-surface-sunken hover:text-ink"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </dialog>
  );
}

/** §44: confirmation before destructive actions. `tone` drives the confirm button styling. */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", tone = "critical", pending }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; tone?: "critical" | "brand"; pending?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
        <Button variant={tone === "critical" ? "danger" : "primary"} onClick={onConfirm} disabled={pending}>{pending ? "Working…" : confirmLabel}</Button>
      </>}>
      <p className="text-sm leading-6 text-ink-muted">{message}</p>
    </Modal>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">{label}</span>
    </span>
  );
}

export function Dropdown({ trigger, children, align = "right" }: { trigger: ReactNode; children: ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handle = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("mousedown", handle); document.removeEventListener("keydown", handleKey); };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" className="inline-flex">{trigger}</button>
      {open && <div role="menu" onClick={() => setOpen(false)} className={cn("absolute top-full z-50 mt-1.5 min-w-44 rounded-xl border border-line bg-surface p-1.5 shadow-xl", align === "right" ? "right-0" : "left-0")}>{children}</div>}
    </div>
  );
}

export function DropdownItem({ onClick, tone = "default", children }: { onClick?: () => void; tone?: "default" | "critical"; children: ReactNode }) {
  return <button role="menuitem" onClick={onClick} className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition", tone === "critical" ? "text-critical hover:bg-accent-soft" : "text-ink hover:bg-surface-sunken")}>{children}</button>;
}
