import { apiClient } from "@/lib/api";
import type { AuthUser } from "@/store/authStore";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginResult {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export const authApi = {
  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post<{ data: LoginResult }>(
      "/auth/login",
      payload
    );
    return data.data;
  },

  register: async (payload: RegisterPayload) => {
    const { data } = await apiClient.post<{ message: string; data: { email: string } }>(
      "/auth/register",
      payload
    );
    return data;
  },

  verifyEmail: async (payload: { email: string; otp: string }) => {
    const { data } = await apiClient.post("/auth/verify-email", payload);
    return data;
  },

  resendOtp: async (email: string) => {
    const { data } = await apiClient.post("/auth/resend-otp", { email });
    return data;
  },

  refresh: async (): Promise<{ access_token: string }> => {
    const { data } = await apiClient.post<{ data: { access_token: string } }>(
      "/auth/refresh"
    );
    return data.data;
  },

  logout: async () => {
    const { data } = await apiClient.post("/auth/logout");
    return data;
  },

  logoutAll: async () => {
    const { data } = await apiClient.post("/auth/logout-all");
    return data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await apiClient.post("/auth/forgot-password", { email });
    return data;
  },

  resetPassword: async (payload: {
    email: string;
    otp: string;
    new_password: string;
  }) => {
    const { data } = await apiClient.post("/auth/reset-password", payload);
    return data;
  },

  changePassword: async (payload: {
    current_password: string;
    new_password: string;
  }) => {
    const { data } = await apiClient.post("/auth/change-password", payload);
    return data;
  },

  me: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get<{ data: AuthUser }>("/auth/me");
    return data.data;
  },
};
