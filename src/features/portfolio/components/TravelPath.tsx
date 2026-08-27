"use client";

import { motion, useReducedMotion } from "framer-motion";

export function TravelPath() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="travel-path">
      <svg viewBox="0 0 520 180">
        <motion.path
          animate={{ pathLength: 1, opacity: 1 }}
          data-testid="travel-path-motion"
          d="M12 148 C96 62 158 164 239 92 S383 16 508 54"
          fill="none"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0.35 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <circle cx="12" cy="148" r="5" />
        <circle cx="239" cy="92" r="5" />
        <circle cx="508" cy="54" r="5" />
      </svg>
    </div>
  );
}
