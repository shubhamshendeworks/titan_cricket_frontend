import { useState } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { ADMIN_NAV } from "@/config/navigation";
import type { AppRole } from "@/types";

export interface AdminLayoutProps {
  userRole?: AppRole;
  user?: { name: string; avatar?: string | null; role: string };
}

export function AdminLayout({ userRole = "SUPER_ADMIN", user }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);

  const sidebarWidth = collapsed ? "lg:pl-sidebar-collapsed" : "lg:pl-[260px]";

  return (
    <div className="min-h-screen bg-surface-void">
      <AppHeader
        variant="admin"
        onMenuToggle={() => setMobileOpen(true)}
        user={user}
      />

      <AppSidebar
        navGroups={ADMIN_NAV}
        userRole={userRole}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        className="lg:w-[260px]"
      />

      <main
        className={cn(
          "pt-header min-h-screen transition-all duration-medium ease-smooth",
          sidebarWidth,
        )}
      >
        {/* Admin breadcrumb bar */}
        <div className="px-6 py-3 border-b border-surface-border bg-surface-deep/60">
          <p className="text-heading-sm text-text-tertiary uppercase tracking-wider">
            Administration
          </p>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
