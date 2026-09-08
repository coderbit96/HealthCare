"use client";
import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) { const reduced = useReducedMotion(); return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 20 }} whileInView={reduced ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: .55, delay }}>{children}</motion.div>; }
