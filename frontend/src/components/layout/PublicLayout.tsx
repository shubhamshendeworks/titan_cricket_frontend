import { type ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ApexToaster } from "@/components/ui/Toast";

// ── Public nav links ──────────────────────────────────────────────────────────

const NAV_LINKS = [
  { to: "/",                    label: "Home"        },
  { to: "/public/tournaments",  label: "Tournaments" },
  { to: "/public/players",      label: "Players"     },
  { to: "/public/matches",      label: "Matches"     },
];

// ── PublicHeader ──────────────────────────────────────────────────────────────

function PublicHeader() {
  const location = useLocation();

  return (
    <header className="fixed top-0 inset-x-0 z-header h-header flex items-center px-6 bg-surface-deep/80 backdrop-blur-glass border-b border-surface-border/50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 group mr-8 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-gold-bright flex items-center justify-center shadow-gold">
          <span className="font-display font-bold text-text-inverse text-[16px] leading-none">A</span>
        </div>
        <span className="font-display font-bold text-heading-lg text-text-primary tracking-wide">
          APEX
        </span>
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1 flex-1">
        {NAV_LINKS.map(({ to, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "px-3 py-2 rounded-lg text-body-sm font-medium transition-colors duration-fast",
                isActive
                  ? "text-text-primary bg-surface-raised"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-raised/50",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* CTA buttons */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <Link
          to="/login"
          className="px-4 py-2 rounded-lg text-body-sm font-medium text-text-secondary border border-surface-border hover:text-text-primary hover:bg-surface-raised transition-colors duration-fast"
        >
          Sign in
        </Link>
        <Link
          to="/register"
          className="px-4 py-2 rounded-lg text-body-sm font-medium text-text-inverse bg-gold-bright hover:bg-gold-muted transition-colors duration-fast shadow-sm"
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}

// ── PublicFooter ──────────────────────────────────────────────────────────────

function PublicFooter() {
  return (
    <footer className="border-t border-surface-border bg-surface-deep px-6 py-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md bg-gold-bright flex items-center justify-center">
            <span className="font-display font-bold text-text-inverse text-xs leading-none">A</span>
          </div>
          <span className="text-body-sm font-semibold text-text-secondary">APEX Sports Platform</span>
        </div>
        <p className="text-body-xs text-text-disabled">
          © 2026 APEX. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ── PublicLayout ──────────────────────────────────────────────────────────────

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-void">
      <PublicHeader />
      <main className="flex-1 pt-header">
        {children ?? <Outlet />}
      </main>
      <PublicFooter />
      <ApexToaster />
    </div>
  );
}
