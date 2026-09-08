"use client";
import { type ComponentPropsWithoutRef, type ReactNode, createContext, useContext, useId } from "react";
import { cn } from "@/lib/utils";

/** Shares the generated id + error state between FormField and the control inside it. */
const FieldContext = createContext<{ id: string; describedBy?: string; invalid: boolean } | null>(null);

const controlBase = "w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-ink outline-none transition placeholder:text-ink-subtle focus:border-brand-bright disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-critical";

export function FormField({ label, hint, error, required, children }: { label: string; hint?: string; error?: string; required?: boolean; children: ReactNode }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className="grid gap-1.5">
        <label htmlFor={id} className="text-sm font-semibold text-ink">{label}{required && <span className="ml-0.5 text-critical" aria-hidden>*</span>}</label>
        {children}
        {hint && !error && <p id={`${id}-hint`} className="text-xs text-ink-subtle">{hint}</p>}
        {error && <p id={`${id}-error`} className="text-xs font-medium text-critical">{error}</p>}
      </div>
    </FieldContext.Provider>
  );
}

function useControl() {
  const context = useContext(FieldContext);
  return { id: context?.id, "aria-describedby": context?.describedBy, "aria-invalid": context?.invalid || undefined };
}

export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return <input {...useControl()} className={cn(controlBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentPropsWithoutRef<"textarea">) {
  return <textarea {...useControl()} className={cn(controlBase, "min-h-24 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentPropsWithoutRef<"select">) {
  return <select {...useControl()} className={cn(controlBase, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2357534e%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_.85rem_center] bg-no-repeat pr-10", className)} {...props}>{children}</select>;
}

export function DatePicker(props: ComponentPropsWithoutRef<"input">) { return <Input type="date" {...props} />; }
export function TimePicker(props: ComponentPropsWithoutRef<"input">) { return <Input type="time" {...props} />; }

export function Checkbox({ label, className, ...props }: ComponentPropsWithoutRef<"input"> & { label: ReactNode }) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <input id={id} type="checkbox" className={cn("mt-0.5 size-4 shrink-0 rounded border-line text-brand accent-brand", className)} {...props} />
      <label htmlFor={id} className="text-sm text-ink">{label}</label>
    </div>
  );
}

export function RadioGroup({ label, name, options, value, onChange }: { label: string; name: string; options: { value: string; label: string }[]; value?: string; onChange?: (value: string) => void }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-ink">{label}</legend>
      {options.map(option => (
        <label key={option.value} className="flex items-center gap-2.5 text-sm text-ink">
          <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange?.(option.value)} className="size-4 border-line accent-brand" />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
