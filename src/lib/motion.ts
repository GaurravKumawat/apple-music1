import type { Transition, Variants } from "motion/react";

/** iOS-style deceleration curve (matches UIKit default) */
export const appleEase = [0.32, 0.72, 0, 1] as const;

/** Snappy spring — buttons, tabs, micro-interactions */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 38,
  mass: 0.65,
};

/** Primary spring — player expand/collapse, sheets */
export const springPlayer: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 42,
  mass: 0.85,
};

/** Gentle spring — list items, cards */
export const springGentle: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 32,
  mass: 0.9,
};

/** Smooth tween for opacity-only fades */
export const fadeTween: Transition = {
  duration: 0.35,
  ease: appleEase,
};

export const tapScale = { scale: 0.92 };
export const tapScaleSoft = { scale: 0.97 };

/** Staggered list entrance */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.06 },
  },
};

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springGentle,
  },
};

export const fadeScaleItem: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springGentle,
  },
};

/** Tab content crossfade + subtle slide */
export const pageVariants: Variants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir * 18,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { ...fadeTween, duration: 0.28 },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -14,
    transition: { duration: 0.2, ease: appleEase },
  }),
};

/** GPU-friendly layout transition for shared elements */
export const layoutTransition: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 44,
  mass: 0.75,
};

export function useReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
