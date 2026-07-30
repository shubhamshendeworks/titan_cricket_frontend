import { Activity, User, Trophy, Gavel, Swords, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "./SectionHeader";

// ── Activity item ─────────────────────────────────────────────────────────────

type ActivityType = "user" | "tournament" | "auction" | "match" | "report";

interface ActivityItemProps {
  type: ActivityType;
  actor: string;
  action: string;
  target: string;
  time: string;
  isLast?: boolean;
}

const activityConfig: Record<ActivityType, { icon: typeof Activity; bg: string; text: string }> = {
  user:       { icon: User,      bg: "bg-surface-float",   text: "text-text-secondary" },
  tournament: { icon: Trophy,    bg: "bg-gold-surface",    text: "text-gold-bright"    },
  auction:    { icon: Gavel,     bg: "bg-gold-surface",    text: "text-gold-bright"    },
  match:      { icon: Swords,    bg: "bg-sport-surface",   text: "text-sport-vivid"    },
  report:     { icon: FileText,  bg: "bg-surface-float",   text: "text-text-secondary" },
};

function ActivityItem({ type, actor, action, target, time, isLast }: ActivityItemProps) {
  const { icon: Icon, bg, text } = activityConfig[type];

  return (
    <div className="flex gap-3">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center shrink-0">
        <div className={cn("h-8 w-8 rounded-lg border border-surface-border flex items-center justify-center", bg)}>
          <Icon className={cn("h-4 w-4", text)} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-surface-border mt-2 mb-1" />}
      </div>

      {/* Content */}
      <div className={cn("pb-4 flex-1 min-w-0", isLast && "pb-0")}>
        <p className="text-body-sm text-text-primary">
          <span className="font-medium">{actor}</span>
          {" "}
          <span className="text-text-secondary">{action}</span>
          {" "}
          <span className="font-medium text-text-primary">{target}</span>
        </p>
        <p className="text-data-xs text-text-disabled mt-0.5">{time}</p>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RecentActivity() {
  const hasActivity = false;

  return (
    <div>
      <SectionHeader title="Recent Activity" />

      {hasActivity ? (
        <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
          {/* Placeholder activity items would render here */}
        </div>
      ) : (
        <div className="rounded-xl border border-surface-border bg-surface-raised">
          <EmptyState
            variant="no-data"
            icon={<Activity className="h-8 w-8 text-text-tertiary" />}
            title="No Recent Activity"
            description="Platform actions and events will appear in this activity feed."
          />
        </div>
      )}
    </div>
  );
}
