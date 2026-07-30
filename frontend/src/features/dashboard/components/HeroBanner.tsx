import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export function HeroBanner() {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-surface-float via-surface-raised to-surface-raised",
        "border border-surface-border",
        "p-6 md:p-8",
      )}
    >
      {/* Background glow accents */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gold-glow rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none opacity-60" />
      <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-sport-surface rounded-full translate-y-1/2 blur-2xl pointer-events-none opacity-40" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-wrap">
        {/* Left — greeting */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="sport" size="sm" dot>Platform Active</Badge>
            <Badge variant="default" size="sm">Phase 10</Badge>
          </div>

          <h1 className="font-display font-bold text-display-md text-text-primary leading-tight">
            APEX <span className="text-gold-bright">Dashboard</span>
          </h1>

          <p className="mt-2 text-body-md text-text-secondary max-w-md">
            Manage tournaments, run live auctions, score matches, and track statistics — all in one place.
          </p>

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-sport-vivid animate-pulse-glow" />
              <span className="text-body-xs text-text-tertiary">All systems operational</span>
            </div>
            <div className="h-3 w-px bg-surface-border" />
            <span className="text-data-xs font-mono text-text-disabled">
              Dashboard Shell · Sprint 3 ready
            </span>
          </div>
        </div>

        {/* Right — summary stats */}
        <div className="flex gap-3 flex-wrap shrink-0">
          {[
            { label: "Tournaments", value: "—", desc: "total" },
            { label: "Teams",       value: "—", desc: "registered" },
            { label: "Players",     value: "—", desc: "active" },
          ].map(({ label, value, desc }) => (
            <div
              key={label}
              className="text-center px-4 py-3 rounded-xl bg-surface-void/60 border border-surface-border min-w-[80px]"
            >
              <p className="font-mono text-data-lg font-bold text-gold-bright">{value}</p>
              <p className="text-body-xs font-semibold text-text-secondary mt-0.5">{label}</p>
              <p className="text-data-xs text-text-disabled">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
