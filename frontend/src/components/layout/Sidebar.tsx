import { NavLink, useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Users,
  Trophy,
  LogOut,
  User,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/features/auth/hooks/useAuth";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/profile", icon: User, label: "My Profile" },
  { to: "/users", icon: Users, label: "Users", minRole: "TOURNAMENT_ADMIN" },
  { to: "/roles", icon: Shield, label: "Roles", minRole: "SUPER_ADMIN" },
  { to: "/tournaments", icon: Trophy, label: "Tournaments" },
];

const ROLE_LEVELS: Record<string, number> = {
  SPECTATOR: 0,
  PLAYER: 1,
  CAPTAIN: 2,
  OWNER: 3,
  TOURNAMENT_ADMIN: 4,
  SUPER_ADMIN: 5,
};

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const userLevel = ROLE_LEVELS[user?.global_role ?? "SPECTATOR"] ?? 0;

  const visible = navItems.filter(({ minRole }) => {
    if (!minRole) return true;
    return userLevel >= (ROLE_LEVELS[minRole] ?? 99);
  });

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-4">
        <span className="text-xl">🏏</span>
        <span className="font-bold text-gray-900">Cricket Platform</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visible.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-gray-200 p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.full_name ?? "—"}
          </p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {user?.global_role}
          </span>
        </div>
        <button
          onClick={() => logout.mutate()}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
