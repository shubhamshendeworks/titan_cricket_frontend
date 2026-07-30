import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { useForgotPassword } from "./hooks/useAuth";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "./schemas/authSchemas";

export function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we'll send a reset code"
    >
      <form
        onSubmit={handleSubmit((d) => forgot.mutate(d.email))}
        className="space-y-4"
      >
        <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={forgot.isPending}
        >
          Send reset code
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Remembered it?{" "}
        <Link to="/login" className="font-medium text-emerald-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
