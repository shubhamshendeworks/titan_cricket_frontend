import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useCurrentUser } from "@/features/auth/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

const ROLE_HIERARCHY: Record<string, number> = {
  SPECTATOR: 0,
  PLAYER: 1,
  CAPTAIN: 2,
  OWNER: 3,
  TOURNAMENT_ADMIN: 4,
  SUPER_ADMIN: 5,
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const location = useLocation();

  // Validates stored token and refreshes user in store
  const { isLoading } = useCurrentUser();

  // No token → go to login
  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Token exists but user not yet loaded (first load, no localStorage cache)
  if (isLoading && !user) {
    return <FullPageSpinner />;
  }

  // Role guard
  if (requiredRole && user) {
    const userLevel = ROLE_HIERARCHY[user.global_role] ?? 0;
    const required = ROLE_HIERARCHY[requiredRole] ?? 0;
    if (userLevel < required) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
