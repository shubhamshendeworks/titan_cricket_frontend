import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// ── Badge ─────────────────────────────────────────────────────────────────────

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "gold"
  | "sport"
  | "neutral"
  | "outline";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100  text-slate-600  border border-slate-200",
  neutral: "bg-slate-100  text-slate-500  border border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50   text-amber-700  border border-amber-200",
  danger:  "bg-red-50     text-red-600    border border-red-200",
  info:    "bg-blue-50    text-blue-700   border border-blue-200",
  gold:    "bg-yellow-50  text-yellow-700 border border-yellow-300",
  sport:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  outline: "bg-transparent text-slate-600  border border-slate-300",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-1.5 py-px  text-data-xs",
  md: "px-2   py-0.5 text-body-xs",
  lg: "px-2.5 py-1   text-body-sm",
};

const dotColorClasses: Partial<Record<BadgeVariant, string>> = {
  success: "bg-emerald-500",
  sport:   "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
  gold:    "bg-yellow-500",
};

export function Badge({
  variant = "default",
  size = "md",
  dot,
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill font-sans font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            dotColorClasses[variant] ?? "bg-text-tertiary",
          )}
        />
      )}
      {children}
    </span>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

export type EntityStatus =
  | "ACTIVE"       | "INACTIVE"      | "PENDING"    | "SUSPENDED"  | "DEACTIVATED"
  | "LIVE"         | "UPCOMING"      | "COMPLETED"  | "CANCELLED"  | "POSTPONED"
  | "SOLD"         | "UNSOLD"        | "AVAILABLE"  | "RTM_ELIGIBLE" | "RETAINED"
  | "DRAFT"        | "REGISTRATION"  | "AUCTION"    | "IN_PROGRESS"  | "ABANDONED"
  | "SCHEDULED"    | "PAUSED";

const statusConfig: Record<EntityStatus, { variant: BadgeVariant; label?: string; dot?: boolean }> = {
  ACTIVE:       { variant: "success" },
  INACTIVE:     { variant: "neutral" },
  PENDING:      { variant: "warning" },
  SUSPENDED:    { variant: "danger" },
  DEACTIVATED:  { variant: "neutral" },
  LIVE:         { variant: "danger",  label: "LIVE",    dot: true },
  UPCOMING:     { variant: "info" },
  SCHEDULED:    { variant: "info" },
  COMPLETED:    { variant: "neutral" },
  CANCELLED:    { variant: "danger" },
  POSTPONED:    { variant: "warning" },
  ABANDONED:    { variant: "neutral" },
  SOLD:         { variant: "gold" },
  UNSOLD:       { variant: "danger" },
  AVAILABLE:    { variant: "success" },
  RTM_ELIGIBLE: { variant: "sport" },
  RETAINED:     { variant: "gold" },
  DRAFT:        { variant: "neutral" },
  REGISTRATION: { variant: "info" },
  AUCTION:      { variant: "gold",   dot: true },
  IN_PROGRESS:  { variant: "success", dot: true },
  PAUSED:       { variant: "warning" },
};

export interface StatusBadgeProps extends Omit<BadgeProps, "variant" | "dot"> {
  status: EntityStatus;
}

export function StatusBadge({ status, size = "md", ...props }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { variant: "default" as BadgeVariant };
  return (
    <Badge variant={config.variant} size={size} dot={config.dot} {...props}>
      {config.label ?? status.replace(/_/g, " ")}
    </Badge>
  );
}

// ── RoleBadge ─────────────────────────────────────────────────────────────────

export type AppRole =
  | "SUPER_ADMIN"
  | "TOURNAMENT_ADMIN"
  | "OWNER"
  | "CAPTAIN"
  | "PLAYER"
  | "SPECTATOR";

const roleConfig: Record<AppRole, { variant: BadgeVariant; label: string }> = {
  SUPER_ADMIN:      { variant: "danger",  label: "Super Admin" },
  TOURNAMENT_ADMIN: { variant: "gold",    label: "Tournament Admin" },
  OWNER:            { variant: "sport",   label: "Owner" },
  CAPTAIN:          { variant: "info",    label: "Captain" },
  PLAYER:           { variant: "default", label: "Player" },
  SPECTATOR:        { variant: "neutral", label: "Spectator" },
};

export interface RoleBadgeProps extends Omit<BadgeProps, "variant"> {
  role: AppRole;
}

export function RoleBadge({ role, size = "md", ...props }: RoleBadgeProps) {
  const config = roleConfig[role] ?? { variant: "default" as BadgeVariant, label: role };
  return (
    <Badge variant={config.variant} size={size} {...props}>
      {config.label}
    </Badge>
  );
}
