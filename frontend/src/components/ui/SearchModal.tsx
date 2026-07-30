import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, X, ArrowRight, LayoutDashboard, Users, UserCircle, Gavel, BarChart2, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { label: "Dashboard",       to: "/dashboard",       icon: LayoutDashboard },
  { label: "Teams",           to: "/teams",           icon: Users           },
  { label: "Players",         to: "/players",         icon: UserCircle      },
  { label: "Live Auction",    to: "/auction",         icon: Gavel           },
  { label: "Auction Results", to: "/auction-results", icon: BarChart2       },
  { label: "Settings",        to: "/settings",        icon: Settings        },
];

export interface SearchModalProps {
  onClose: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex flex-col items-center pt-12 px-4 pb-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
      aria-label="Search"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl animate-scale-in">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search teams, players, auction…"
              className="flex-1 bg-transparent text-body-md text-slate-900 placeholder:text-slate-400 outline-none"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <kbd className="hidden sm:inline-flex text-data-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 font-mono bg-slate-50">
                ESC
              </kbd>
              <button
                onClick={onClose}
                aria-label="Close search"
                className="text-slate-400 hover:text-slate-600 transition-colors rounded p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Empty state */}
          <div className="py-8 text-center">
            <p className="text-body-sm text-slate-500">Start typing to search the platform…</p>
          </div>

          {/* Quick links */}
          <div className="px-4 py-3 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-2">
              Quick Navigation
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
              {QUICK_LINKS.map(({ label, to, icon: Icon }) => (
                <Link
                  key={label}
                  to={to}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg",
                    "text-body-sm text-slate-600",
                    "hover:bg-slate-50 hover:text-slate-900",
                    "transition-colors duration-fast group",
                  )}
                >
                  <Icon className="h-4 w-4 text-slate-400 group-hover:text-navy-900 transition-colors shrink-0" />
                  <span className="flex-1">{label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-3 bg-slate-50">
            <span className="text-data-xs text-slate-400">Press</span>
            <kbd className="text-data-xs text-slate-500 border border-slate-200 rounded px-1.5 py-0.5 font-mono bg-white">↵ Enter</kbd>
            <span className="text-data-xs text-slate-400">to select</span>
            <span className="text-data-xs text-slate-400 ml-auto">
              <kbd className="font-mono">⌘K</kbd> to open
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
