import { LazyMotion, domAnimation } from "motion/react";
import type { ReactNode } from "react";

/** Lightweight Motion bundle — only DOM animation features loaded */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
