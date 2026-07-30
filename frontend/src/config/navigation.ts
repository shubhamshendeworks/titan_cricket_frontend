import type { NavGroup } from "@/types";
import {
  LayoutDashboard,
  Trophy,
  Users,
  UserCircle,
  Shirt,
  Gavel,
  BarChart2,
  CalendarDays,
  Settings,
  History,
} from "lucide-react";

export const DASHBOARD_NAV: NavGroup[] = [
  {
    label: "PLATFORM",
    items: [
      { to: "/dashboard",       label: "Dashboard",       icon: LayoutDashboard },
      { to: "/tournament",      label: "Tournament",      icon: Trophy,      minRole: "TOURNAMENT_ADMIN" },
      { to: "/captains",        label: "Captains",        icon: UserCircle,  minRole: "TOURNAMENT_ADMIN" },
      { to: "/teams",           label: "Teams",           icon: Users },
      { to: "/players",         label: "Players",         icon: Shirt },
      { to: "/auction",         label: "Auction",         icon: Gavel },
      { to: "/auction-results", label: "Auction Results", icon: BarChart2 },
      { to: "/fixtures",        label: "Fixtures",        icon: CalendarDays },
      { to: "/history",         label: "History",         icon: History },
      { to: "/settings",        label: "Settings",        icon: Settings,    minRole: "TOURNAMENT_ADMIN" },
    ],
  },
];

export const APP_NAV = DASHBOARD_NAV;
export const ADMIN_NAV = DASHBOARD_NAV;
