"use client";

import { motion, useReducedMotion } from "framer-motion";

import { buttonHover, hoverLift } from "@/components/ui/animations";

export function HoverLiftCard({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={hoverLift}
      initial="rest"
      whileHover={reduce ? undefined : "hover"}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
}

export function HoverScaleButton({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div variants={buttonHover} initial="rest" whileHover={reduce ? undefined : "hover"} whileTap={reduce ? undefined : "tap"} className="will-change-transform">
      {children}
    </motion.div>
  );
}

export function HoverIcon({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.span whileHover={reduce ? undefined : { rotate: 8, y: -1 }} transition={{ duration: 0.18 }} className="inline-flex will-change-transform">
      {children}
    </motion.span>
  );
}
