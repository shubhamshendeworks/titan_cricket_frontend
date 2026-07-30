import { useState, useRef, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import titansLogo from "@/assets/branding/titan-logo.png";
import { Bell, Search, Menu, ChevronDown, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/Button";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AppHeaderVariant = "dashboard" | "admin" | "tournament" | "minimal";

export interface AppHeaderProps {
  variant?: AppHeaderVariant;
  logo?: ReactNode;
  centre?: ReactNode;
  right?: ReactNode;
  onMenuToggle?: () => void;
  onSearchOpen?: () => void;
  notificationCount?: number;
  user?: { name: string; avatar?: string | null; role: string };
  onLogout?: () => void;
  className?: string;
  /** @deprecated theme now always light */
  isDark?: boolean;
  /** @deprecated no-op */
  onThemeToggle?: () => void;
}

// ── Titan Logo ────────────────────────────────────────────────────────────────

function TitanLogo() {
  return (
    <Link
      to="/dashboard"
      className="flex items-center gap-2 group shrink-0"
      aria-label="Titan Cricket Tournament"
    >
      <div className="h-8 w-8 rounded-lg flex items-center justify-center shadow-sm overflow-hidden bg-navy-900 group-hover:opacity-90 transition-opacity">
        <img src={titansLogo} alt="Titans" className="h-8 w-8 object-contain" />
      </div>
      <div className="hidden sm:block">
        <span className="font-display font-bold text-heading-lg text-slate-900 tracking-wide leading-none block">
          TITAN
        </span>
        <span className="text-[10px] text-slate-400 tracking-widest uppercase leading-none">
          Cricket Tournament
        </span>
      </div>
    </Link>
  );
}

// ── UserPill with Logout Dropdown ─────────────────────────────────────────────

function UserPill({
  user,
  onLogout,
}: {
  user: { name: string; avatar?: string | null; role: string };
  onLogout?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const roleLabel =
    user.role === "SUPER_ADMIN"
      ? "Admin"
      : user.role === "TOURNAMENT_ADMIN"
      ? "Admin"
      : user.role.charAt(0) + user.role.slice(1).toLowerCase();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-fast"
        aria-label="User menu"
        aria-expanded={open}
      >
        <div className="h-6 w-6 rounded-full bg-navy-900 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-gold-bright">{initials}</span>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-body-xs font-medium text-slate-800 leading-none">{user.name}</p>
          <p className="text-[10px] text-slate-400 mt-px leading-none uppercase tracking-wider">
            {roleLabel}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-slate-400 ml-1 shrink-0 transition-transform duration-fast",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-1.5 w-52 z-dropdown",
            "bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden",
            "animate-scale-in",
          )}
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-navy-900 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-gold-bright">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{roleLabel}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AppHeader ─────────────────────────────────────────────────────────────────

export function AppHeader({
  logo,
  centre,
  right,
  onMenuToggle,
  onSearchOpen,
  notificationCount = 0,
  user,
  onLogout,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-header",
        "h-header flex items-center px-4 gap-3",
        "bg-white border-b border-slate-200 shadow-sm",
        className,
      )}
    >
      {/* Mobile menu toggle */}
      {onMenuToggle && (
        <IconButton
          size="sm"
          label="Toggle sidebar"
          variant="ghost"
          onClick={onMenuToggle}
          className="lg:hidden shrink-0 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </IconButton>
      )}

      {/* Logo */}
      <div className="shrink-0">{logo ?? <TitanLogo />}</div>

      {/* Centre slot */}
      <div className="flex-1 min-w-0 flex items-center justify-center">
        {centre}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        {onSearchOpen && (
          <button
            type="button"
            onClick={onSearchOpen}
            aria-label="Search (Ctrl+K)"
            className="hidden sm:flex items-center gap-2 px-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all duration-fast text-body-xs"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden md:block">Search…</span>
            <kbd className="hidden lg:inline text-[10px] border border-slate-200 rounded px-1 py-px font-mono bg-white text-slate-400 ml-1">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <IconButton
            size="sm"
            label="Notifications"
            variant="ghost"
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <Bell className="h-4 w-4" />
          </IconButton>
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-danger-vivid text-[10px] font-bold text-white pointer-events-none">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </div>

        {right}

        {user && <UserPill user={user} onLogout={onLogout} />}
      </div>
    </header>
  );
}

// ── TournamentContextBar ──────────────────────────────────────────────────────

export interface TournamentContextBarProps {
  name: string;
  status: string;
  format: string;
}

export function TournamentContextBar({ name, status }: TournamentContextBarProps) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-5 w-px bg-slate-200 shrink-0" />
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-heading-sm font-semibold text-slate-800 truncate">{name}</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">{status}</span>
      </div>
    </div>
  );
}
