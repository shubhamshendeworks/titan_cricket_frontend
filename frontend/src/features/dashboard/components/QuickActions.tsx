import { Link } from "react-router-dom";
import { Trophy, Gavel, Calendar, User, FileText, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";

const ACTIONS = [
  {
    label:  "Create Tournament",
    desc:   "Set up a new tournament",
    icon:   Trophy,
    to:     "/tournaments/create",
    accent: "gold",
  },
  {
    label:  "Start Auction",
    desc:   "Launch a live auction session",
    icon:   Gavel,
    to:     "/auction",
    accent: "sport",
  },
  {
    label:  "Schedule Match",
    desc:   "Add a new fixture or match",
    icon:   Calendar,
    to:     "/fixtures",
    accent: "default",
  },
  {
    label:  "Add Player",
    desc:   "Register a new player",
    icon:   User,
    to:     "/players",
    accent: "default",
  },
  {
    label:  "Generate Report",
    desc:   "Export tournament data",
    icon:   FileText,
    to:     "/reports/create",
    accent: "default",
  },
  {
    label:  "Manage Teams",
    desc:   "View and edit team rosters",
    icon:   Users,
    to:     "/teams",
    accent: "default",
  },
] as const;

const accentClasses = {
  gold:    "text-gold-bright bg-gold-surface   border-gold-bright/20   group-hover:border-gold-bright/40   group-hover:bg-gold-surface/80",
  sport:   "text-sport-vivid bg-sport-surface  border-sport-vivid/20   group-hover:border-sport-vivid/40   group-hover:bg-sport-surface/80",
  default: "text-text-secondary bg-surface-float border-surface-border group-hover:border-surface-overlay group-hover:bg-surface-overlay/60",
};

const iconAccent = {
  gold:    "text-gold-bright",
  sport:   "text-sport-vivid",
  default: "text-text-tertiary group-hover:text-text-secondary",
};

export function QuickActions() {
  return (
    <div>
      <SectionHeader title="Quick Actions" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ACTIONS.map(({ label, desc, icon: Icon, to, accent }) => (
          <Link
            key={label}
            to={to}
            className={cn(
              "group flex items-center gap-3 p-4 rounded-xl border",
              "transition-all duration-fast",
              accentClasses[accent],
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                "bg-surface-void/40 border border-surface-border",
                "transition-colors duration-fast",
              )}
            >
              <Icon className={cn("h-5 w-5 transition-colors duration-fast", iconAccent[accent])} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-text-primary leading-tight">{label}</p>
              <p className="text-data-xs text-text-tertiary mt-0.5">{desc}</p>
            </div>

            {/* Arrow */}
            <ArrowRight className="h-4 w-4 text-text-disabled opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
