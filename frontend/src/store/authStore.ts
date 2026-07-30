/**
 * Global auth state — Zustand store.
 *
 * Access token is persisted in localStorage so sessions survive page refresh.
 * Logout clears localStorage and resets all state.
 */

import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  global_role: string;
  is_verified: boolean;
  is_active: boolean;
  is_suspended: boolean;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  last_login_at: string | null;
  created_at: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: AuthUser, accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  setAccessToken: (token: string) => void;
}

const LS_TOKEN_KEY = "titan_access_token";
const LS_USER_KEY  = "titan_user";

// Restore from localStorage (survives page refresh)
const storedToken = localStorage.getItem(LS_TOKEN_KEY);
const storedUser = (() => {
  try {
    const s = localStorage.getItem(LS_USER_KEY);
    return s ? (JSON.parse(s) as AuthUser) : null;
  } catch { return null; }
})();

export const useAuthStore = create<AuthState>((set) => ({
  user:            storedUser,
  accessToken:     storedToken,
  isAuthenticated: !!storedToken,

  setAuth: (user, accessToken) => {
    localStorage.setItem(LS_TOKEN_KEY, accessToken);
    localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
    set({ user, accessToken, isAuthenticated: true });
  },

  setUser: (user) => {
    localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
    set({ user });
  },

  clearAuth: () => {
    localStorage.removeItem(LS_TOKEN_KEY);
    localStorage.removeItem(LS_USER_KEY);
    localStorage.removeItem("apex_active_tournament");
    sessionStorage.clear();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  updateUser: (partial) =>
    set((state) =>
      state.user ? { user: { ...state.user, ...partial } } : {}
    ),

  setAccessToken: (token) => {
    localStorage.setItem(LS_TOKEN_KEY, token);
    set({ accessToken: token, isAuthenticated: true });
  },
}));
