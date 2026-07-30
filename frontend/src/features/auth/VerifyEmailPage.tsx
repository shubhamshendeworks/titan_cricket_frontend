import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { useVerifyEmail } from "./hooks/useAuth";
import { verifyEmailSchema, type VerifyEmailFormData } from "./schemas/authSchemas";
import { authApi } from "./api/authApi";
import toast from "react-hot-toast";

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const verify = useVerifyEmail();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email },
  });

  const handleResend = async () => {
    try {
      await authApi.resendOtp(email);
      toast.success("New verification code sent!");
    } catch {
      toast.error("Could not resend code. Try again.");
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email || "your email"}`}
    >
      <form
        onSubmit={handleSubmit((d) => verify.mutate(d))}
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

        <FormField label="Verification code" htmlFor="otp" error={errors.otp?.message} required>
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

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={verify.isPending}
        >
          Verify email
        </Button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-500">
        Didn't receive it?{" "}
        <button
          onClick={handleResend}
          className="font-medium text-emerald-600 hover:underline"
          type="button"
        >
          Resend code
        </button>
      </div>

      <p className="mt-2 text-center text-sm text-gray-500">
        <Link to="/login" className="text-gray-400 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
