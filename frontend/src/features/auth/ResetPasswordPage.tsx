import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input, PasswordInput } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { useResetPassword } from "./hooks/useAuth";
import { resetPasswordSchema, type ResetPasswordFormData } from "./schemas/authSchemas";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const reset = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email },
  });

  return (
    <AuthLayout title="Reset password" subtitle="Enter the code from your email">
      <form
        onSubmit={handleSubmit((d) =>
          reset.mutate({
            email: d.email,
            otp: d.otp,
            new_password: d.new_password,
          })
        )}
        className="space-y-4"
      >
        <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            error={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <FormField label="Reset code" htmlFor="otp" error={errors.otp?.message} required>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            placeholder="123456"
            maxLength={6}
            error={!!errors.otp}
            {...register("otp")}
          />
        </FormField>

        <FormField
          label="New password"
          htmlFor="new_password"
          error={errors.new_password?.message}
          required
        >
          <PasswordInput
            id="new_password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={!!errors.new_password}
            {...register("new_password")}
          />
        </FormField>

        <FormField
          label="Confirm password"
          htmlFor="confirm_password"
          error={errors.confirm_password?.message}
          required
        >
          <PasswordInput
            id="confirm_password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={!!errors.confirm_password}
            {...register("confirm_password")}
          />
        </FormField>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={reset.isPending}
        >
          Reset password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link to="/login" className="font-medium text-emerald-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
