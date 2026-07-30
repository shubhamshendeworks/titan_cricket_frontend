import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CardVariant =
  | "default"
  | "elevated"
  | "bordered"
  | "glass"
  | "gold-accent"
  | "sport-accent";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  clickable?: boolean;
}

// ── Variant maps ──────────────────────────────────────────────────────────────

const variantClasses: Record<CardVariant, string> = {
  default:       "bg-white border border-slate-200 shadow-sm",
  elevated:      "bg-white border border-slate-200 shadow-md",
  bordered:      "bg-white border-2 border-slate-300 shadow-sm",
  glass:         "glass shadow-glass",
  "gold-accent": "bg-white border border-yellow-200 shadow-sm",
  "sport-accent":"bg-white border border-emerald-200 shadow-sm",
};

const paddingClasses = {
  none: "",
  sm:   "p-3",
  md:   "p-6",
  lg:   "p-8",
};

// ── Components ────────────────────────────────────────────────────────────────

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", clickable, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl",
        variantClasses[variant],
        paddingClasses[padding],
        clickable && "cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-fast",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

Card.displayName = "Card";

export function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props}>{children}</div>;
}

export function CardTitle({ children, className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("font-sans font-semibold text-heading-lg text-slate-900", className)} {...props}>
      {children}
    </h2>
  );
}

export function CardDescription({ children, className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-body-sm text-slate-500 mt-1", className)} {...props}>
      {children}
    </p>
  );
}

export function CardFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-6 pt-4 border-t border-slate-100 flex items-center", className)} {...props}>
      {children}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { direction: "up" | "down" | "neutral"; percent: number };
  color?: "default" | "gold" | "sport" | "danger" | "warn";
  className?: string;
}

const statCardColor = {
  default: "text-slate-900",
  gold:    "text-yellow-600",
  sport:   "text-emerald-600",
  danger:  "text-red-600",
  warn:    "text-amber-600",
};

export function StatCard({ label, value, icon, trend, color = "default", className }: StatCardProps) {
  return (
    <Card variant="default" padding="md" className={cn("min-w-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-body-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
          <p className={cn("mt-2 font-display text-display-md font-bold", statCardColor[color])}>
            {value}
          </p>
          {trend && (
            <p className={cn(
              "mt-1 text-body-xs flex items-center gap-1",
              trend.direction === "up"      && "text-emerald-600",
              trend.direction === "down"    && "text-red-600",
              trend.direction === "neutral" && "text-slate-400",
            )}>
              {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "—"}
              {trend.percent}%
            </p>
          )}
        </div>
        {icon && <div className="shrink-0 text-slate-400">{icon}</div>}
      </div>
    </Card>
  );
}
