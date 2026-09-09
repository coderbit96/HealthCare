import { HeartPulse } from "lucide-react";
import Link from "next/link";

export function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap" aria-label="Health Care .Pvt .Ltd home">
    <span className="grid size-10 place-items-center rounded-xl bg-brand text-white"><HeartPulse size={21} /></span>
    <span className={`font-display text-lg font-semibold tracking-tight ${light ? "text-white" : "text-ink"}`}>Health Care <span className={light ? "text-white/70" : "text-brand"}>.Pvt .Ltd</span></span>
  </Link>;
}
