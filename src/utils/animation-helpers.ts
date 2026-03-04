export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function motionSafeDuration(duration: number) {
  return prefersReducedMotion() ? 0 : duration;
}

export function getTrendDirection(value: number) {
  if (value > 0) return "up" as const;
  if (value < 0) return "down" as const;
  return "flat" as const;
}

export function getRiskLevel(riskPercent: number) {
  if (riskPercent <= 1) return { label: "Low", color: "emerald" };
  if (riskPercent <= 2) return { label: "Medium", color: "amber" };
  return { label: "High", color: "rose" };
}

export function pulseDelay(index: number) {
  return `${(index % 10) * 80}ms`;
}
