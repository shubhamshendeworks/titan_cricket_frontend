import { useAuthStore } from "@/store/authStore";
import { ROLE_LEVELS } from "@/types";
import type { AppRole } from "@/types";

export function usePermissions() {
  const { user } = useAuthStore();
  const role = (user?.global_role as AppRole) ?? "SPECTATOR";
  const level = ROLE_LEVELS[role] ?? 0;
  const isAdmin = level >= ROLE_LEVELS["TOURNAMENT_ADMIN"];
  const isCaptain = role === "CAPTAIN";
  return { isAdmin, isCaptain, role, level };
}
