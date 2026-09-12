import { ReactNode } from "react";

/** Renders public content immediately without shipping an animation runtime. */
export function Reveal({ children, className }: { children: ReactNode; delay?: number; className?: string }) {
  return <div className={className}>{children}</div>;
}
