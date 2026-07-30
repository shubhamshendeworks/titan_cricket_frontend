import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, PasswordInput } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { usersApi } from "./api/usersApi";
import { useAuthStore } from "@/store/authStore";
import { changePasswordSchema, type ChangePasswordFormData } from "@/features/auth/schemas/authSchemas";
import { authApi } from "@/features/auth/api/authApi";

const profileSchema = z.object({
  full_name: z.string().min(1).max(120),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function UserProfilePage() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["users", "me"],
    queryFn: usersApi.getMe,
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          full_name: profile.full_name,
          phone: profile.phone ?? "",
          bio: profile.bio ?? "",
        }
      : undefined,
  });

  const updateProfile = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (updated) => {
      updateUser({ full_name: updated.full_name });
      qc.invalidateQueries({ queryKey: ["users", "me"] });
      toast.success("Profile updated!");
    },
    onError: () => toast.error("Update failed."),
  });

  const pwForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const changePassword = useMutation({
    mutationFn: (d: ChangePasswordFormData) =>
      authApi.changePassword({
        current_password: d.current_password,
        new_password: d.new_password,
      }),
    onSuccess: () => {
      toast.success("Password changed. Please log in again.");
      pwForm.reset();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to change password."),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500">Manage your account information</p>
      </div>

      {/* Identity card */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-600 w-24">Email</span>
            <span className="text-gray-900">{profile?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-600 w-24">Role</span>
            <Badge variant="success">{profile?.global_role}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-600 w-24">Status</span>
            {profile?.is_suspended ? (
              <Badge variant="danger">Suspended</Badge>
            ) : profile?.is_active ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="neutral">Inactive</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <form
          onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))}
          className="space-y-4"
        >
          <FormField
            label="Full name"
            htmlFor="full_name"
            error={profileForm.formState.errors.full_name?.message}
            required
          >
            <Input
              id="full_name"
              error={!!profileForm.formState.errors.full_name}
              {...profileForm.register("full_name")}
            />
          </FormField>

          <FormField label="Phone" htmlFor="phone">
            <Input id="phone" type="tel" {...profileForm.register("phone")} />
          </FormField>

          <FormField label="Bio" htmlFor="bio">
            <textarea
              id="bio"
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              maxLength={500}
              {...profileForm.register("bio")}
            />
          </FormField>

          <div className="flex justify-end">
            <Button type="submit" loading={updateProfile.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <form
          onSubmit={pwForm.handleSubmit((d) => changePassword.mutate(d))}
          className="space-y-4"
        >
          <FormField
            label="Current password"
            htmlFor="current_password"
            error={pwForm.formState.errors.current_password?.message}
            required
          >
            <PasswordInput
              id="current_password"
              error={!!pwForm.formState.errors.current_password}
              {...pwForm.register("current_password")}
            />
          </FormField>

          <FormField
            label="New password"
            htmlFor="new_password"
            error={pwForm.formState.errors.new_password?.message}
            required
          >
            <PasswordInput
              id="new_password"
              error={!!pwForm.formState.errors.new_password}
              {...pwForm.register("new_password")}
            />
          </FormField>

          <FormField
            label="Confirm new password"
            htmlFor="confirm_password"
            error={pwForm.formState.errors.confirm_password?.message}
            required
          >
            <PasswordInput
              id="confirm_password"
              error={!!pwForm.formState.errors.confirm_password}
              {...pwForm.register("confirm_password")}
            />
          </FormField>

          <div className="flex justify-end">
            <Button type="submit" variant="secondary" loading={changePassword.isPending}>
              Change password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
