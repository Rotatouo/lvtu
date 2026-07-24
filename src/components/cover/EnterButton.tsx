"use client";

import { motion, AnimatePresence } from "framer-motion";

interface EnterButtonProps {
  entering: boolean;
  onEnter: () => void;
}

export default function EnterButton({ entering, onEnter }: EnterButtonProps) {
  return (
    <AnimatePresence>
      {!entering && (
        <motion.button
          onClick={onEnter}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: "relative",
            zIndex: 20,
            padding: "16px 48px",
            fontSize: "18px",
            fontWeight: 600,
            letterSpacing: "2px",
            color: "rgba(255,255,255,0.95)",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "16px",
            cursor: "pointer",
            boxShadow:
              "0 0 20px rgba(100,180,255,0.15), inset 0 0 10px rgba(255,255,255,0.03)",
            transition: "box-shadow 0.3s ease",
          }}
        >
          进入旅途
        </motion.button>
      )}
    </AnimatePresence>
  );
}
