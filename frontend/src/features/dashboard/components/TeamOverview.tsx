import { Link } from "react-router-dom";
import { Users, ArrowRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "./SectionHeader";

// ── Placeholder team card ─────────────────────────────────────────────────────

interface TeamCardProps {
  initials: string;
  name: string;
  players: string;
  wins: string;
  color: "gold" | "sport" | "default";
}

function TeamCard({ initials, name, players, wins, color }: TeamCardProps) {
  const colorMap = {
    gold:    "bg-gold-surface   border-gold-bright/30   text-gold-bright",
    sport:   "bg-sport-surface  border-sport-vivid/30   text-sport-vivid",
    default: "bg-surface-float  border-surface-border   text-text-secondary",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-surface-raised hover:bg-surface-float transition-colors duration-fast group cursor-pointer">
      {/* Avatar */}
      <div className={cn("h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 font-display font-bold text-heading-sm", colorMap[color])}>
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-semibold text-text-primary truncate">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-data-xs text-text-tertiary">{players} players</span>
          <div className="h-2.5 w-px bg-surface-border" />
          <span className="text-data-xs text-text-tertiary">{wins} wins</span>
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight className="h-4 w-4 text-text-disabled opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  );
}

// ── Placeholder data ──────────────────────────────────────────────────────────

const PLACEHOLDER_TEAMS: TeamCardProps[] = [
  { initials: "TA", name: "Team Alpha",   players: "—", wins: "—", color: "gold"    },
  { initials: "TB", name: "Team Beta",    players: "—", wins: "—", color: "sport"   },
  { initials: "TG", name: "Team Gamma",   players: "—", wins: "—", color: "default" },
  { initials: "TD", name: "Team Delta",   players: "—", wins: "—", color: "default" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function TeamOverview() {
  const hasTeams = false;

  return (
    <div>
      <SectionHeader title="Team Overview" action={{ label: "View all", to: "/teams" }} />

      {hasTeams ? (
        <div className="space-y-2">
          {PLACEHOLDER_TEAMS.map((t) => (
            <TeamCard key={t.name} {...t} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-surface-border bg-surface-raised">
          <EmptyState
            variant="no-data"
            icon={<Users className="h-8 w-8 text-text-tertiary" />}
            title="No Teams Yet"
            description="Teams will appear here once they're registered in a tournament."
            action={{ label: "Browse Tournaments", onClick: () => {} }}
          />
        </div>
      )}
    </div>
  );
}
