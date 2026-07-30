import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "./SectionHeader";

// ── Placeholder match row ──────────────────────────────────────────────────────

interface MatchRowProps {
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  format: string;
  status: "SCHEDULED" | "LIVE" | "COMPLETED";
}

function MatchRow({ homeTeam, awayTeam, date, time, venue, format, status }: MatchRowProps) {
  const isLive = status === "LIVE";

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border",
        "transition-colors duration-fast hover:bg-surface-float",
        isLive ? "border-danger-vivid/30 bg-danger-surface/20" : "border-surface-border bg-surface-raised",
      )}
    >
      {/* Teams */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-body-sm font-semibold text-text-primary">{homeTeam}</span>
          <span className="text-body-xs text-text-tertiary">vs</span>
          <span className="text-body-sm font-semibold text-text-primary">{awayTeam}</span>
          {isLive && <Badge variant="danger" size="sm" dot>LIVE</Badge>}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <div className="flex items-center gap-1 text-data-xs text-text-tertiary">
            <Calendar className="h-3 w-3" />
            {date}
          </div>
          <div className="flex items-center gap-1 text-data-xs text-text-tertiary">
            <Clock className="h-3 w-3" />
            {time}
          </div>
          <div className="flex items-center gap-1 text-data-xs text-text-tertiary">
            <MapPin className="h-3 w-3" />
            {venue}
          </div>
        </div>
      </div>

      {/* Format badge */}
      <Badge variant="sport" size="sm">{format}</Badge>
    </div>
  );
}

// ── Placeholder rows ──────────────────────────────────────────────────────────

const PLACEHOLDER_MATCHES: MatchRowProps[] = [
  { homeTeam: "Team Alpha",   awayTeam: "Team Beta",   date: "Jan 15, 2026", time: "10:00 AM", venue: "Stadium A", format: "T20",  status: "SCHEDULED" },
  { homeTeam: "Team Gamma",   awayTeam: "Team Delta",  date: "Jan 16, 2026", time: "2:00 PM",  venue: "Stadium B", format: "ODI",  status: "SCHEDULED" },
  { homeTeam: "Team Epsilon", awayTeam: "Team Zeta",   date: "Jan 17, 2026", time: "11:00 AM", venue: "Stadium C", format: "T20",  status: "SCHEDULED" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function UpcomingMatches() {
  const hasMatches = false; // No real data — placeholder state

  return (
    <div>
      <SectionHeader title="Upcoming Matches" action={{ label: "View all", to: "/matches" }} />

      {hasMatches ? (
        <div className="space-y-3">
          {PLACEHOLDER_MATCHES.map((m, i) => (
            <MatchRow key={i} {...m} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-surface-border bg-surface-raised">
          <EmptyState
            variant="no-data"
            icon={<Calendar className="h-8 w-8 text-text-tertiary" />}
            title="No Upcoming Matches"
            description="Matches will appear here once fixtures are scheduled for your tournaments."
            action={{ label: "Schedule Fixtures", onClick: () => {} }}
          />
        </div>
      )}
    </div>
  );
}
