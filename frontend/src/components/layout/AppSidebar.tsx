import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import titansLogo from "@/assets/branding/titan-logo.png";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavGroup, NavItem, AppRole } from "@/types";
import { ROLE_LEVELS } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppSidebarProps {
  navGroups: NavGroup[];
  userRole?: AppRole;
  collapsed?: boolean;
  onCollapsedChange?: (c: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  logo?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

// ── NavItem ───────────────────────────────────────────────────────────────────

function SidebarNavItem({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const location = useLocation();
  const isActive =
    location.pathname === item.to ||
    (item.to !== "/" && location.pathname.startsWith(item.to + "/"));

  return (
    <li>
      <Link
        to={item.to}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg text-body-sm font-medium",
          "transition-all duration-fast group relative",
          collapsed ? "h-10 w-10 justify-center px-0" : "px-3 py-2",
          isActive
            ? "bg-gold-surface text-gold-bright border-l-2 border-gold-bright pl-[10px]"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-float border-l-2 border-transparent",
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {item.icon && (
          <item.icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isActive ? "text-gold-bright" : "text-text-tertiary group-hover:text-text-secondary",
            )}
          />
        )}

        {!collapsed && (
          <span className="flex-1 truncate">{item.label}</span>
        )}

        {!collapsed && item.badge !== undefined && (
          <span
            className={cn(
              "text-data-xs px-1.5 py-px rounded-pill font-mono shrink-0",
              isActive
                ? "bg-gold-bright/20 text-gold-bright"
                : "bg-surface-float text-text-tertiary",
            )}
          >
            {item.badge}
          </span>
        )}

        {collapsed && (
          <div
            className={cn(
              "absolute left-full ml-2 px-2.5 py-1.5 rounded-md z-tooltip",
              "bg-navy-800 border border-white/10 shadow-lg",
              "text-body-xs text-white whitespace-nowrap",
              "pointer-events-none opacity-0 group-hover:opacity-100",
              "transition-opacity duration-fast",
            )}
          >
            {item.label}
          </div>
        )}
      </Link>
    </li>
  );
}

// ── NavGroup ──────────────────────────────────────────────────────────────────

function SidebarNavGroup({
  group,
  userRole,
  collapsed,
}: {
  group: NavGroup;
  userRole?: AppRole;
  collapsed: boolean;
}) {
  const userLevel = userRole ? ROLE_LEVELS[userRole] : 0;

  const visibleItems = group.items.filter((item) => {
    if (!item.minRole) return true;
    return userLevel >= ROLE_LEVELS[item.minRole];
  });

  if (visibleItems.length === 0) return null;
  if (group.minRole && userLevel < ROLE_LEVELS[group.minRole]) return null;

  return (
    <div className="mb-4">
      {!collapsed && (
        <p className="px-3 mb-1 text-[10px] font-bold text-text-disabled uppercase tracking-[0.12em]">
          {group.label}
        </p>
      )}
      {collapsed && <div className="my-2 h-px bg-surface-border mx-2" />}
      <ul className="space-y-0.5">
        {visibleItems.map((item) => (
          <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </ul>
    </div>
  );
}

// ── DesktopSidebar ────────────────────────────────────────────────────────────

function DesktopSidebar({
  navGroups,
  userRole,
  collapsed,
  onCollapsedChange,
  logo,
  footer,
  className,
}: Omit<AppSidebarProps, "mobileOpen" | "onMobileClose">) {
  const isCollapsed = collapsed ?? false;

  return (
    <aside
      className={cn(
        "titan-navy",
        "hidden lg:flex flex-col fixed inset-y-0 left-0 z-sidebar",
        "border-r border-surface-border",
        "transition-all duration-medium ease-smooth",
        isCollapsed ? "w-sidebar-collapsed" : "w-sidebar",
        className,
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          "flex items-center border-b border-surface-border shrink-0",
          isCollapsed ? "justify-center px-0 py-3" : "px-4 py-4 gap-3",
        )}
      >
        {logo ?? (
          <Link
            to="/dashboard"
            className="flex items-center gap-3 group"
            aria-label="Titan Cricket Tournament"
          >
            <div className="h-[60px] w-[60px] rounded-2xl flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-lg ring-2 ring-amber-400/30 group-hover:ring-amber-400/60 group-hover:shadow-amber-200/40 transition-all duration-200">
              <img src={titansLogo} alt="Titans" className="h-[58px] w-[58px] object-contain" />
            </div>
            {!isCollapsed && (
              <div>
                <span className="font-display font-black text-lg text-text-primary tracking-widest leading-none block">
                  TITAN
                </span>
                <span className="text-[10px] text-text-tertiary tracking-[0.18em] uppercase leading-none mt-0.5 block">
                  Cricket Tournament
                </span>
              </div>
            )}
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2"
        aria-label="Main navigation"
      >
        {navGroups.map((group) => (
          <SidebarNavGroup
            key={group.label}
            group={group}
            userRole={userRole}
            collapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* Footer slot */}
      {footer && (
        <div className={cn(
          "shrink-0 border-t border-surface-border",
          isCollapsed ? "p-2" : "p-4",
        )}>
          {footer}
        </div>
      )}

      {/* Collapse toggle */}
      {onCollapsedChange && (
        <button
          onClick={() => onCollapsedChange(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute -right-3 top-[72px] h-6 w-6 rounded-full z-10",
            "bg-white border border-slate-200 shadow-md",
            "flex items-center justify-center text-slate-500",
            "hover:text-slate-700 hover:bg-slate-50 transition-colors",
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </aside>
  );
}

// ── MobileSidebar ─────────────────────────────────────────────────────────────

function MobileSidebar({
  navGroups,
  userRole,
  mobileOpen,
  onMobileClose,
  logo,
  footer,
}: AppSidebarProps) {
  if (!mobileOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-overlay bg-navy-900/60 backdrop-blur-sm lg:hidden animate-fade-in"
        onClick={onMobileClose}
      />
      <aside
        className={cn(
          "titan-navy",
          "fixed inset-y-0 left-0 z-sidebar w-[280px]",
          "border-r border-surface-border",
          "flex flex-col lg:hidden animate-slide-in-left",
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border shrink-0">
          {logo ?? (
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="h-[60px] w-[60px] rounded-2xl flex items-center justify-center overflow-hidden bg-white shadow-lg ring-2 ring-amber-400/30">
                <img src={titansLogo} alt="Titans" className="h-[58px] w-[58px] object-contain" />
              </div>
              <div>
                <span className="font-display font-black text-lg text-text-primary tracking-widest leading-none block">TITAN</span>
                <span className="text-[10px] text-text-tertiary tracking-[0.18em] uppercase mt-0.5 block">Cricket Tournament</span>
              </div>
            </Link>
          )}
          <button
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="text-text-tertiary hover:text-text-primary transition-colors rounded-lg p-1 hover:bg-surface-float"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2" onClick={onMobileClose}>
          {navGroups.map((group) => (
            <SidebarNavGroup
              key={group.label}
              group={group}
              userRole={userRole}
              collapsed={false}
            />
          ))}
        </nav>

        {footer && (
          <div className="shrink-0 border-t border-surface-border p-4">{footer}</div>
        )}
      </aside>
    </>
  );
}

// ── Composed export ───────────────────────────────────────────────────────────

export function AppSidebar(props: AppSidebarProps) {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar  {...props} />
    </>
  );
}
