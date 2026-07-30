import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi";
import { useAuthStore } from "@/store/authStore";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (result) => {
      setAuth(result.user, result.access_token);
      toast.success("Welcome back!", { duration: 2000 });
      navigate("/dashboard");
    },
    onError: () => {
      toast.error("Invalid email or password.");
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (_, vars) => {
      toast.success("Account created! Check your email for a verification code.");
      navigate(`/verify-email?email=${encodeURIComponent(vars.email)}`);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || "Registration failed. Try again.";
      toast.error(msg);
    },
  });
}

export function useVerifyEmail() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: () => {
      toast.success("Email verified! You can now log in.");
      navigate("/login");
    },
    onError: () => {
      toast.error("Invalid or expired code. Request a new one.");
    },
  });
}

export function useForgotPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: (_, email) => {
      toast.success("If the account exists, a reset code has been sent.");
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    },
  });
}

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success("Password reset! Please log in.");
      navigate("/login");
    },
    onError: () => {
      toast.error("Invalid or expired code.");
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth();
      qc.clear();
      navigate("/login");
    },
  });
}

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const user = await authApi.me();
      setUser(user);
      return user;
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
  });
}
