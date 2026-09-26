"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, WarningOctagon, X } from "@phosphor-icons/react";

export type Alert = { tone: "bad" | "good"; title: string; text: ReactNode } | null;

/** A centred alert that can't be missed. Esc, the backdrop or the button closes it. */
export function AlertModal({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!alert) return;
    button.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [alert, onClose]);

  const color = alert?.tone === "good" ? "var(--fan)" : "var(--bad)";
  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="alert-title"
            className="notch relative w-full max-w-md overflow-hidden border bg-panel p-6"
            style={{ borderColor: color }}
            initial={{ y: 24, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
            <div className="flex items-start gap-4">
              {alert.tone === "good" ? (
                <CheckCircle size={32} weight="fill" color={color} className="shrink-0" />
              ) : (
                <WarningOctagon size={32} weight="fill" color={color} className="shrink-0" />
              )}
              <div className="min-w-0">
                <h2 id="alert-title" className="font-display text-2xl uppercase tracking-wide">{alert.title}</h2>
                <div className="mt-2 text-ink-2 leading-relaxed">{alert.text}</div>
              </div>
            </div>
            <button ref={button} className="btn btn-ghost mt-6 w-full" onClick={onClose}>
              <X size={16} /> Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
