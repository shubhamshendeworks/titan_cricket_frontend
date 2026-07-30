import { Link } from "react-router-dom";
import { Bell, AlertCircle, CheckCircle2, Gavel, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "./SectionHeader";

// ── Notification item ─────────────────────────────────────────────────────────

type NotifType = "info" | "success" | "warning" | "auction";

interface NotifItemProps {
  type: NotifType;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
}

const typeConfig: Record<NotifType, { icon: typeof Info; color: string; badge: string }> = {
  info:    { icon: Info,          color: "text-text-secondary",  badge: "info"    },
  success: { icon: CheckCircle2,  color: "text-sport-vivid",     badge: "success" },
  warning: { icon: AlertCircle,   color: "text-warn-vivid",      badge: "warning" },
  auction: { icon: Gavel,         color: "text-gold-bright",     badge: "gold"    },
};

function NotifItem({ type, title, body, time, unread }: NotifItemProps) {
  const { icon: Icon, color, badge } = typeConfig[type];

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg",
      "transition-colors duration-fast hover:bg-surface-float",
      unread && "bg-surface-float/40",
    )}>
      <div className={cn("h-8 w-8 rounded-lg border border-surface-border flex items-center justify-center shrink-0")}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-body-sm font-medium leading-tight", unread ? "text-text-primary" : "text-text-secondary")}>
            {title}
          </p>
          {unread && <div className="h-2 w-2 rounded-full bg-gold-bright shrink-0 mt-1" />}
        </div>
        <p className="text-data-xs text-text-tertiary mt-0.5 line-clamp-2">{body}</p>
        <p className="text-data-xs text-text-disabled mt-1">{time}</p>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RecentNotifications() {
  const hasNotifications = false;

  return (
    <div>
      <SectionHeader title="Recent Notifications" action={{ label: "View all", to: "/notifications" }} />

      {hasNotifications ? (
        <div className="rounded-xl border border-surface-border bg-surface-raised divide-y divide-surface-border">
          {/* Placeholder items would render here */}
        </div>
      ) : (
        <div className="rounded-xl border border-surface-border bg-surface-raised">
          <EmptyState
            variant="no-data"
            icon={<Bell className="h-8 w-8 text-text-tertiary" />}
            title="No Notifications"
            description="You're all caught up. Notifications will appear here."
          />
        </div>
      )}
    </div>
  );
}
