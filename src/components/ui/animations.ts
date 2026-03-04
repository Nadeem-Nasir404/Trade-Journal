import type { Variants } from "framer-motion";

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: "easeOut" } },
};

export const tabSlideFade: Variants = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.16 } },
};

export const pageFadeThrough: Variants = {
  hidden: { opacity: 0, scale: 0.995 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, scale: 1.003, transition: { duration: 0.16 } },
};

export const toastSlideIn: Variants = {
  hidden: { opacity: 0, y: -14, x: 24 },
  visible: { opacity: 1, y: 0, x: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -12, x: 24, transition: { duration: 0.16 } },
};

export const hoverLift: Variants = {
  rest: { y: 0, scale: 1 },
  hover: { y: -2, scale: 1.005, transition: { duration: 0.18 } },
};

export const buttonHover: Variants = {
  rest: { scale: 1, filter: "brightness(1)" },
  hover: { scale: 1.02, filter: "brightness(1.05)", transition: { duration: 0.16 } },
  tap: { scale: 0.98, transition: { duration: 0.08 } },
};

export const errorShake: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -8, 8, -5, 5, -2, 2, 0],
    transition: { duration: 0.45 },
  },
};
