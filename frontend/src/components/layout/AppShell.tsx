import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { AppFooter } from "./AppFooter";
import { SearchModal } from "@/components/ui/SearchModal";
import { DASHBOARD_NAV } from "@/config/navigation";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/features/auth/hooks/useAuth";
import type { AppRole } from "@/types";

export function AppShell() {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { user } = useAuthStore();
  const logout = useLogout();

  const shellUser = user
    ? { name: user.full_name, avatar: user.avatar_url, role: user.global_role }
    : undefined;

  const userRole = (user?.global_role as AppRole) ?? "SPECTATOR";

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const mainPl = collapsed ? "lg:pl-[56px]" : "lg:pl-[240px]";

  return (
    <div className="min-h-screen bg-surface-void flex flex-col">
      {/* Fixed header */}
      <AppHeader
        variant="dashboard"
        onMenuToggle={() => setMobileOpen(true)}
        onSearchOpen={() => setSearchOpen(true)}
        user={shellUser}
        onLogout={() => logout.mutate(undefined)}
      />

      {/* Fixed sidebar */}
      <AppSidebar
        navGroups={DASHBOARD_NAV}
        userRole={userRole}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <main
        className={cn(
          "pt-[60px] flex-1 flex flex-col",
          "transition-[padding] duration-medium ease-smooth",
          mainPl,
        )}
      >
        <div className="flex-1 p-6">
          <Outlet />
        </div>
        <AppFooter />
      </main>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
