import { Trophy, Users, User, Swords, BarChart3, Gavel } from "lucide-react";
import { StatCard } from "@/components/ui/Card";
import { SectionHeader } from "./SectionHeader";

const STATS = [
  { label: "Total Tournaments", value: "—", color: "gold"    as const, icon: <Trophy    className="h-5 w-5" /> },
  { label: "Registered Teams",  value: "—", color: "sport"   as const, icon: <Users     className="h-5 w-5" /> },
  { label: "Active Players",    value: "—", color: "default" as const, icon: <User      className="h-5 w-5" /> },
  { label: "Matches Played",    value: "—", color: "default" as const, icon: <Swords    className="h-5 w-5" /> },
  { label: "Live Auctions",     value: "—", color: "danger"  as const, icon: <Gavel     className="h-5 w-5" /> },
  { label: "Statistics Points", value: "—", color: "default" as const, icon: <BarChart3 className="h-5 w-5" /> },
];

export function StatisticsCards() {
  return (
    <div>
      <SectionHeader title="Statistics Overview" />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATS.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            color={s.color}
            icon={s.icon}
          />
        ))}
      </div>
    </div>
  );
}
