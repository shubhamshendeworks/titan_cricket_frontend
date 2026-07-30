import { type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { ApexToaster } from "@/components/ui/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PresentationLayoutProps {
  title?: string;
  subtitle?: string;
  /** Purse summary bar (team logos + remaining amounts) */
  purseBar?: ReactNode;
  children?: ReactNode;
}

// ── PresentationHeader ────────────────────────────────────────────────────────

function PresentationHeader({
  title,
  subtitle,
}: Pick<PresentationLayoutProps, "title" | "subtitle">) {
  return (
    <header
      className="fixed top-0 inset-x-0 z-header flex flex-col items-center justify-center bg-surface-void border-b border-surface-border"
      style={{ height: "var(--header-presentation-height)" }}
    >
      <p className="font-display font-bold text-display-md text-text-primary tracking-wider">
        {title ?? "APEX Live Auction"}
      </p>
      {subtitle && (
        <p className="text-body-md text-text-secondary mt-1">{subtitle}</p>
      )}
    </header>
  );
}

// ── PurseBar ──────────────────────────────────────────────────────────────────

function PurseBarWrapper({ purseBar }: { purseBar: ReactNode }) {
  return (
    <div
      className="fixed inset-x-0 z-sticky bg-surface-deep border-b border-surface-border overflow-x-auto"
      style={{
        top:    "var(--header-presentation-height)",
        height: "var(--purse-bar-height)",
      }}
    >
      {purseBar}
    </div>
  );
}

// ── PresentationLayout ────────────────────────────────────────────────────────
// Full-screen mode designed for stadium display / projector.
// No sidebar, no nav — just the main auction card filling the viewport.

export function PresentationLayout({
  title,
  subtitle,
  purseBar,
  children,
}: PresentationLayoutProps) {
  const topOffset = `calc(var(--header-presentation-height) + var(--purse-bar-height))`;

  return (
    <div className="min-h-screen bg-surface-void">
      <PresentationHeader title={title} subtitle={subtitle} />

      {purseBar && <PurseBarWrapper purseBar={purseBar} />}

      <main
        className="flex items-center justify-center"
        style={{ paddingTop: topOffset, minHeight: "100vh" }}
      >
        {children ?? <Outlet />}
      </main>

      <ApexToaster />
    </div>
  );
}
