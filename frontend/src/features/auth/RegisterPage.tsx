import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input, PasswordInput } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { useRegister } from "./hooks/useAuth";
import { registerSchema, type RegisterFormData } from "./schemas/authSchemas";

export function RegisterPage() {
  const register = useRegister();
  const {
    register: reg,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join the Cricket Tournament Platform"
    >
      <form onSubmit={handleSubmit((d) => register.mutate(d))} className="space-y-4">
        <FormField
          label="Full name"
          htmlFor="full_name"
          error={errors.full_name?.message}
          required
        >
          <Input
            id="full_name"
            placeholder="Your name"
            autoComplete="name"
            error={!!errors.full_name}
            {...reg("full_name")}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={!!errors.email}
            {...reg("email")}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={!!errors.password}
            {...reg("password")}
          />
        </FormField>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={register.isPending}
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-emerald-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
