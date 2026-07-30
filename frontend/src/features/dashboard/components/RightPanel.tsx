import { Calendar, CheckCircle2, Circle, Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

// ── 1. Upcoming Events ────────────────────────────────────────────────────────

function UpcomingEvents() {
  const events: { label: string; date: string; type: string }[] = [
    /* empty — no real data */
  ];

  return (
    <Card variant="default" padding="none">
      <CardHeader className="px-4 pt-4 pb-0">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-text-tertiary" />
          <CardTitle className="text-heading-sm">Upcoming Events</CardTitle>
        </div>
      </CardHeader>

      {events.length === 0 ? (
        <div className="px-4 pb-4 pt-3">
          <p className="text-body-xs text-text-tertiary text-center py-4">
            No upcoming events scheduled.
          </p>
        </div>
      ) : (
        <div className="px-4 pb-4 pt-2 space-y-2">
          {events.map((e) => (
            <div key={e.label} className="flex items-start gap-2">
              <div className="h-8 w-8 rounded-lg bg-surface-float border border-surface-border flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-text-tertiary" />
              </div>
              <div>
                <p className="text-body-xs font-medium text-text-primary">{e.label}</p>
                <p className="text-data-xs text-text-disabled">{e.date}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── 2. System Status ──────────────────────────────────────────────────────────

const SERVICES = [
  { name: "API Server",    status: "operational" },
  { name: "Database",      status: "operational" },
  { name: "Cache Layer",   status: "operational" },
  { name: "Live Auction",  status: "idle"        },
  { name: "WebSockets",    status: "operational" },
  { name: "Email Service", status: "placeholder" },
] as const;

type ServiceStatus = "operational" | "degraded" | "outage" | "idle" | "placeholder";

const statusConfig: Record<ServiceStatus, { color: string; label: string }> = {
  operational: { color: "text-sport-vivid bg-sport-surface border-sport-vivid/30", label: "Operational" },
  degraded:    { color: "text-warn-vivid  bg-warn-surface  border-warn-vivid/30",  label: "Degraded"    },
  outage:      { color: "text-danger-vivid bg-danger-surface border-danger-vivid/30", label: "Outage"    },
  idle:        { color: "text-text-tertiary bg-surface-float border-surface-border", label: "Idle"       },
  placeholder: { color: "text-text-disabled bg-surface-float border-surface-border", label: "Placeholder"},
};

function SystemStatus() {
  const allOperational = SERVICES.every((s) => s.status === "operational" || s.status === "idle");

  return (
    <Card variant="default" padding="none">
      <CardHeader className="px-4 pt-4 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-sport-vivid" />
            <CardTitle className="text-heading-sm">System Status</CardTitle>
          </div>
          <Badge variant={allOperational ? "success" : "warning"} size="sm">
            {allOperational ? "All Systems Go" : "Check Services"}
          </Badge>
        </div>
      </CardHeader>

      <div className="px-4 pb-4 pt-3 space-y-1.5">
        {SERVICES.map(({ name, status }) => {
          const { color, label } = statusConfig[status];
          return (
            <div key={name} className="flex items-center justify-between">
              <span className="text-body-xs text-text-secondary">{name}</span>
              <span className={cn(
                "text-data-xs px-2 py-0.5 rounded-pill border font-medium",
                color,
              )}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── 3. Latest Activity ────────────────────────────────────────────────────────

function LatestActivity() {
  const items: { text: string; time: string }[] = [];

  return (
    <Card variant="default" padding="none">
      <CardHeader className="px-4 pt-4 pb-0">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-text-tertiary" />
          <CardTitle className="text-heading-sm">Latest Activity</CardTitle>
        </div>
      </CardHeader>

      {items.length === 0 ? (
        <div className="px-4 pb-4 pt-3">
          <div className="flex flex-col items-center gap-2 py-4">
            <Clock className="h-6 w-6 text-text-disabled" />
            <p className="text-body-xs text-text-tertiary text-center">
              No recent activity to display.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4 pt-2 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <Circle className="h-1.5 w-1.5 text-text-disabled mt-1.5 shrink-0 fill-current" />
              <div>
                <p className="text-body-xs text-text-secondary">{item.text}</p>
                <p className="text-data-xs text-text-disabled">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Composed RightPanel ───────────────────────────────────────────────────────

export function RightPanel() {
  return (
    <div className="space-y-4">
      <UpcomingEvents />
      <SystemStatus />
      <LatestActivity />
    </div>
  );
}
