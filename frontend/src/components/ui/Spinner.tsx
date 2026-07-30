import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SpinnerSize    = "xs" | "sm" | "md" | "lg" | "xl";
export type SpinnerVariant = "default" | "gold" | "sport" | "danger";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?:    SpinnerSize;
  variant?: SpinnerVariant;
}

// ── Maps ──────────────────────────────────────────────────────────────────────

const sizeClasses: Record<SpinnerSize, string> = {
  xs: "h-3 w-3 border",
  sm: "h-4 w-4 border",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-2",
  xl: "h-16 w-16 border-[3px]",
};

const colorClasses: Record<SpinnerVariant, string> = {
  default: "border-surface-border   border-t-text-secondary",
  gold:    "border-gold-surface     border-t-gold-bright",
  sport:   "border-sport-surface    border-t-sport-vivid",
  danger:  "border-danger-surface   border-t-danger-vivid",
};

// ── Spinner ───────────────────────────────────────────────────────────────────

export function Spinner({
  size = "md",
  variant = "gold",
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full animate-spin shrink-0",
        sizeClasses[size],
        colorClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

// ── FullPageSpinner ───────────────────────────────────────────────────────────

export function FullPageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center bg-surface-void/80 backdrop-blur-glass">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" variant="gold" />
        <p className="text-body-sm text-text-secondary animate-pulse">{label}</p>
      </div>
    </div>
  );
}

// ── ContentSpinner ────────────────────────────────────────────────────────────

export function ContentSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Spinner size="lg" variant="gold" />
      {label && <p className="text-body-sm text-text-secondary">{label}</p>}
    </div>
  );
}
