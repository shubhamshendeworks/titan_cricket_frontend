import { Link } from "react-router-dom";
import { Gavel, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "./SectionHeader";

export function LiveAuctionWidget() {
  return (
    <div>
      <SectionHeader title="Live Auction" action={{ label: "All Auctions", to: "/auction" }} />

      {/* No active auction state */}
      <div className="rounded-xl border border-surface-border bg-surface-raised overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface-deep border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-text-tertiary" />
            <span className="text-body-xs font-semibold text-text-secondary">Auction Room</span>
          </div>
          <Badge variant="neutral" size="sm">No Active Session</Badge>
        </div>

        {/* Main content */}
        <div className="p-6 text-center">
          <div className="h-14 w-14 mx-auto mb-4 rounded-2xl bg-gold-surface border border-gold-bright/20 flex items-center justify-center">
            <Gavel className="h-7 w-7 text-gold-bright" />
          </div>
          <p className="text-heading-md font-semibold text-text-primary mb-1">No Auction Running</p>
          <p className="text-body-sm text-text-tertiary max-w-xs mx-auto">
            Start a new auction session or join an upcoming one from your tournaments.
          </p>

          {/* Upcoming placeholder */}
          <div className="mt-6 rounded-lg bg-surface-float border border-surface-border p-3 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-text-tertiary" />
              <span className="text-body-xs text-text-tertiary">Next Scheduled</span>
            </div>
            <p className="text-body-sm font-medium text-text-secondary">No upcoming auctions</p>
            <p className="text-data-xs text-text-disabled mt-0.5">Schedule an auction from any tournament</p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              to="/tournaments"
              className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-body-sm font-semibold bg-gold-bright text-navy-900 border border-gold-bright hover:bg-gold-muted hover:border-gold-muted shadow-sm hover:shadow-gold transition-all duration-fast"
            >
              Go to Tournaments
            </Link>
            <Link
              to="/auction"
              className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-body-sm bg-transparent text-text-secondary border border-transparent hover:bg-surface-raised hover:text-text-primary transition-all duration-fast"
            >
              View History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
