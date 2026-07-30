import { apiClient } from "@/lib/api";
import type { AuthUser } from "@/store/authStore";

export interface UserDetail extends AuthUser {
  suspension_reason: string | null;
  login_count: number;
  updated_at: string;
}

export interface UserPage {
  items: UserDetail[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ListUsersParams {
  page?: number;
  page_size?: number;
  role?: string;
  is_active?: boolean;
  search?: string;
}

export const usersApi = {
  list: async (params: ListUsersParams = {}): Promise<UserPage> => {
    const { data } = await apiClient.get<{ data: UserPage }>("/users", { params });
    return data.data;
  },

  create: async (payload: {
    email: string;
    full_name: string;
    password: string;
    global_role: string;
    phone?: string;
  }): Promise<UserDetail> => {
    const { data } = await apiClient.post<{ data: UserDetail }>("/users/create", payload);
    return data.data;
  },

  getById: async (id: string): Promise<UserDetail> => {
    const { data } = await apiClient.get<{ data: UserDetail }>(`/users/${id}`);
    return data.data;
  },

  getMe: async (): Promise<UserDetail> => {
    const { data } = await apiClient.get<{ data: UserDetail }>("/users/me");
    return data.data;
  },

  updateMe: async (payload: {
    full_name?: string;
    phone?: string;
    bio?: string;
    avatar_url?: string;
  }): Promise<UserDetail> => {
    const { data } = await apiClient.put<{ data: UserDetail }>("/users/me", payload);
    return data.data;
  },

  updateRole: async (id: string, global_role: string): Promise<UserDetail> => {
    const { data } = await apiClient.put<{ data: UserDetail }>(`/users/${id}/role`, {
      global_role,
    });
    return data.data;
  },

  suspend: async (id: string, reason: string): Promise<UserDetail> => {
    const { data } = await apiClient.post<{ data: UserDetail }>(`/users/${id}/suspend`, {
      reason,
    });
    return data.data;
  },

  unsuspend: async (id: string): Promise<UserDetail> => {
    const { data } = await apiClient.post<{ data: UserDetail }>(`/users/${id}/unsuspend`);
    return data.data;
  },

  deactivate: async (id: string): Promise<UserDetail> => {
    const { data } = await apiClient.post<{ data: UserDetail }>(`/users/${id}/deactivate`);
    return data.data;
  },

  activate: async (id: string): Promise<UserDetail> => {
    const { data } = await apiClient.post<{ data: UserDetail }>(`/users/${id}/activate`);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
