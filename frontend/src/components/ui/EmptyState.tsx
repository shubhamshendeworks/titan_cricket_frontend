import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

// ── Types ─────────────────────────────────────────────────────────────────────

export type EmptyStateVariant = "no-data" | "no-results" | "no-permission" | "error";

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// ── Default content per variant ───────────────────────────────────────────────

const defaults: Record<EmptyStateVariant, { icon: string; title: string; description: string }> = {
  "no-data": {
    icon:        "📭",
    title:       "Nothing here yet",
    description: "Get started by creating your first entry.",
  },
  "no-results": {
    icon:        "🔍",
    title:       "No results found",
    description: "Try adjusting your search or filters.",
  },
  "no-permission": {
    icon:        "🔒",
    title:       "Access restricted",
    description: "You don't have permission to view this content.",
  },
  "error": {
    icon:        "⚠",
    title:       "Something went wrong",
    description: "An error occurred. Please try again.",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function EmptyState({
  variant = "no-data",
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const def = defaults[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-8 text-center",
        className,
      )}
    >
      <div className="text-4xl mb-4 select-none" aria-hidden="true">
        {icon ?? def.icon}
      </div>
      <h3 className="text-heading-lg font-semibold text-text-secondary mb-2">
        {title ?? def.title}
      </h3>
      <p className="text-body-sm text-text-tertiary max-w-sm mb-6">
        {description ?? def.description}
      </p>
      {action && (
        <Button variant="gold" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
