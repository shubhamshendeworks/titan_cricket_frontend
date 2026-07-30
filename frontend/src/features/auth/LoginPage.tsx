import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useLogin } from "./hooks/useAuth";
import { loginSchema, type LoginFormData } from "./schemas/authSchemas";
import { useAuthStore } from "@/store/authStore";

export function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const login = useLogin();
  const [showPw, setShowPw] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Cricket Tournament Platform"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <a href="/register" className="al-link">Create one</a>
        </>
      }
    >
      <form onSubmit={handleSubmit((d) => login.mutate(d))} noValidate>

        {/* Email */}
        <div className="al-field">
          <label htmlFor="email" className="al-label">
            Email <span style={{ color: "rgba(245,179,1,0.7)" }}>*</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={`al-input${errors.email ? " al-input-error" : ""}`}
            {...register("email")}
          />
          {errors.email && <p className="al-err">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="al-field">
          <label htmlFor="password" className="al-label">
            Password <span style={{ color: "rgba(245,179,1,0.7)" }}>*</span>
          </label>
          <div className="al-input-wrap">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`al-input${errors.password ? " al-input-error" : ""}`}
              {...register("password")}
            />
            <button
              type="button"
              className="al-eye"
              tabIndex={-1}
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="al-err">{errors.password.message}</p>}
        </div>

        {/* Forgot password */}
        <div className="flex justify-end mb-6" style={{ marginTop: -8 }}>
          <Link to="/forgot-password" className="al-forgot">
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={login.isPending}
          className="al-btn"
        >
          {login.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Signing in…
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
