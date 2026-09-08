"use client";
import { type ComponentPropsWithoutRef } from "react";
import { FormField, Input } from "./form";

/** Convenience wrapper: a labelled text input in one element. Use FormField + a control directly for Select/Textarea/etc. */
export function Field({ label, hint, error, required, ...props }: ComponentPropsWithoutRef<"input"> & { label: string; hint?: string; error?: string; required?: boolean }) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      <Input {...props} />
    </FormField>
  );
}
