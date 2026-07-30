import { type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ApexToaster } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuctionLayoutProps {
  /** Auction session name */
  sessionName?: string;
  /** Live / Paused / Upcoming */
  status?: "ACTIVE" | "PAUSED" | "SCHEDULED";
  /** Current bid amount text, e.g. "₹8.50 Cr" */
  currentBid?: string;
  /** Current bidder team name */
  currentBidder?: string;
  /** Countdown timer text, e.g. "0:12" */
  timer?: string;
  /** Right panel content (team purse sidebar) */
  rightPanel?: ReactNode;
  children?: ReactNode;
}

// ── AuctionHeader ─────────────────────────────────────────────────────────────

function AuctionHeader({
  sessionName,
  status = "SCHEDULED",
}: Pick<AuctionLayoutProps, "sessionName" | "status">) {
  const statusVariant = status === "ACTIVE" ? "danger" : status === "PAUSED" ? "warning" : "info";

  return (
    <header className="fixed top-0 inset-x-0 z-header flex items-center justify-between px-4 bg-surface-void border-b border-surface-border"
      style={{ height: "var(--header-auction-height)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-md bg-gold-bright flex items-center justify-center">
          <span className="font-display font-bold text-text-inverse text-sm leading-none">A</span>
        </div>
        <div className="h-4 w-px bg-surface-border" />
        <span className="text-body-sm font-semibold text-text-primary">
          {sessionName ?? "Auction Session"}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3">
        <Badge variant={statusVariant} size="sm" dot={status === "ACTIVE"}>
          {status}
        </Badge>
        <span className="text-heading-sm text-text-tertiary uppercase tracking-wider hidden sm:block">
          LIVE AUCTION
        </span>
      </div>

      {/* Empty right */}
      <div className="w-32" />
    </header>
  );
}

// ── BidBar ────────────────────────────────────────────────────────────────────

function BidBar({
  currentBid,
  currentBidder,
  timer,
}: Pick<AuctionLayoutProps, "currentBid" | "currentBidder" | "timer">) {
  return (
    <div
      className="fixed inset-x-0 z-sticky flex items-center justify-between px-4 bg-surface-deep border-b border-surface-border"
      style={{
        top:    "var(--header-auction-height)",
        height: "var(--bid-bar-height)",
      }}
    >
      {/* Current bid */}
      <div className="text-center">
        <p className="text-heading-sm text-text-tertiary uppercase tracking-wider mb-1">Current Bid</p>
        <p className="font-mono text-data-hero font-bold text-gold-bright leading-none">
          {currentBid ?? "—"}
        </p>
      </div>

      {/* Timer */}
      <div className="text-center">
        <p className="text-heading-sm text-text-tertiary uppercase tracking-wider mb-1">Time</p>
        <p className={cn(
          "font-mono text-data-hero font-bold leading-none",
          timer && parseInt(timer) <= 5 ? "text-danger-vivid animate-pulse-glow" : "text-text-primary",
        )}>
          {timer ?? "—"}
        </p>
      </div>

      {/* Leading bidder */}
      <div className="text-center">
        <p className="text-heading-sm text-text-tertiary uppercase tracking-wider mb-1">Leading</p>
        <p className="text-body-lg font-semibold text-sport-vivid">
          {currentBidder ?? "—"}
        </p>
      </div>
    </div>
  );
}

// ── AuctionLayout ─────────────────────────────────────────────────────────────

export function AuctionLayout({
  sessionName,
  status,
  currentBid,
  currentBidder,
  timer,
  rightPanel,
  children,
}: AuctionLayoutProps) {
  const topOffset = `calc(var(--header-auction-height) + var(--bid-bar-height))`;

  return (
    <div className="min-h-screen bg-surface-void">
      <AuctionHeader sessionName={sessionName} status={status} />
      <BidBar currentBid={currentBid} currentBidder={currentBidder} timer={timer} />

      {/* Main area + right panel */}
      <div
        className="flex"
        style={{ paddingTop: topOffset, minHeight: "100vh" }}
      >
        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children ?? <Outlet />}
        </main>

        {/* Right panel (team purses) */}
        {rightPanel && (
          <aside className="hidden xl:block w-72 border-l border-surface-border bg-surface-deep overflow-y-auto shrink-0">
            {rightPanel}
          </aside>
        )}
      </div>

      <ApexToaster />
    </div>
  );
}
