import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-brand text-white hover:bg-brand-strong",
  accent: "bg-accent text-white hover:brightness-95",
  danger: "bg-critical text-white hover:brightness-90",
  outline: "border border-line bg-surface text-ink hover:bg-surface-sunken",
  ghost: "text-ink-muted hover:bg-surface-sunken hover:text-ink",
  onDark: "bg-white/10 text-white hover:bg-white/20",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function Button({ variant = "primary", size = "md", className, ...props }: ComponentPropsWithoutRef<"button"> & { variant?: keyof typeof variants; size?: keyof typeof sizes }) {
  return <button className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60", variants[variant], sizes[size], className)} {...props} />;
}

export function IconButton({ label, className, ...props }: ComponentPropsWithoutRef<"button"> & { label: string }) {
  return <button aria-label={label} title={label} className={cn("inline-grid size-9 place-items-center rounded-lg text-ink-muted transition hover:bg-surface-sunken hover:text-ink disabled:opacity-50", className)} {...props} />;
}
