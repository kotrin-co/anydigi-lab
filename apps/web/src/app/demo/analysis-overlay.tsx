"use client";

import { motion } from "motion/react";
import { SkipForward } from "lucide-react";
import { AnalysisAnimation } from "./analysis-animation";

export function AnalysisOverlay({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.96, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 8 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-3xl rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              分析中…
            </div>
            <div className="text-xs text-muted-foreground">
              裏側で動いている仕組みをご覧ください
            </div>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent/40 hover:text-foreground"
          >
            <SkipForward className="h-3.5 w-3.5" />
            スキップ
          </button>
        </div>
        <AnalysisAnimation autoPlay onComplete={onComplete} />
      </motion.div>
    </motion.div>
  );
}
