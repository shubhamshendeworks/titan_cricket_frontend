import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Search, UserCheck, UserX, ShieldCheck, Trash2, Plus, PowerOff, Power, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  Th,
  Td,
} from "@/components/ui/Table";
import { usersApi, type UserDetail } from "./api/usersApi";

const ALL_ROLES = ["SPECTATOR", "PLAYER", "CAPTAIN", "OWNER", "TOURNAMENT_ADMIN", "SUPER_ADMIN"];
const CREATE_ROLES = ["CAPTAIN", "PLAYER"];

interface CreateForm {
  email: string;
  full_name: string;
  password: string;
  global_role: string;
  phone: string;
}

const EMPTY_CREATE: CreateForm = {
  email: "",
  full_name: "",
  password: "",
  global_role: "CAPTAIN",
  phone: "",
};

export function UserManagementPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);

  const [suspendTarget, setSuspendTarget] = useState<UserDetail | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [roleTarget, setRoleTarget] = useState<UserDetail | null>(null);
  const [newRole, setNewRole] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["users", { page, search, role: roleFilter }],
    queryFn: () =>
      usersApi.list({
        page,
        page_size: 20,
        search: search || undefined,
        role: roleFilter || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const createUser = useMutation({
    mutationFn: (form: CreateForm) =>
      usersApi.create({
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        password: form.password,
        global_role: form.global_role,
        phone: form.phone.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("User created — they can log in immediately.");
      qc.invalidateQueries({ queryKey: ["users"] });
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE);
    },
    onError: (err: Error) => toast.error(err.message || "Could not create user."),
  });

  const suspend = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      usersApi.suspend(id, reason),
    onSuccess: () => {
      toast.success("User suspended.");
      qc.invalidateQueries({ queryKey: ["users"] });
      setSuspendTarget(null);
      setSuspendReason("");
    },
    onError: () => toast.error("Could not suspend user."),
  });

  const unsuspend = useMutation({
    mutationFn: (id: string) => usersApi.unsuspend(id),
    onSuccess: () => {
      toast.success("User unsuspended.");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Could not unsuspend user."),
  });

  const activate = useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: () => {
      toast.success("Account activated.");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Could not activate user."),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      toast.success("Account deactivated.");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Could not deactivate user."),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersApi.updateRole(id, role),
    onSuccess: () => {
      toast.success("Role updated.");
      qc.invalidateQueries({ queryKey: ["users"] });
      setRoleTarget(null);
    },
    onError: () => toast.error("Could not update role."),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      toast.success("User deleted.");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Could not delete user."),
  });

  const createValid =
    createForm.email.includes("@") &&
    createForm.full_name.trim().length >= 1 &&
    createForm.password.length >= 6;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} registered users</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-gray-500 mb-4">No users found.</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            Create first user
          </button>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Last login</Th>
              <Th>Actions</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.items.map((user) => (
              <TableRow key={user.id}>
                <Td>
                  <div>
                    <p className="font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                  </div>
                </Td>
                <Td>
                  <Badge variant="info">{user.global_role}</Badge>
                </Td>
                <Td>
                  {user.is_suspended ? (
                    <Badge variant="danger">Suspended</Badge>
                  ) : user.is_active ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="neutral">Inactive</Badge>
                  )}
                </Td>
                <Td>
                  {user.last_login_at
                    ? new Date(user.last_login_at).toLocaleDateString()
                    : "—"}
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <button
                      title="Change role"
                      onClick={() => { setRoleTarget(user); setNewRole(user.global_role); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </button>

                    {user.is_suspended ? (
                      <button
                        title="Unsuspend"
                        onClick={() => unsuspend.mutate(user.id)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        title="Suspend"
                        onClick={() => setSuspendTarget(user)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {user.is_active ? (
                      <button
                        title="Deactivate account"
                        onClick={() => {
                          if (confirm(`Deactivate ${user.full_name}?`)) deactivate.mutate(user.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors"
                      >
                        <PowerOff className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        title="Activate account"
                        onClick={() => activate.mutate(user.id)}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      title="Delete permanently"
                      onClick={() => {
                        if (confirm(`Delete ${user.full_name}? This cannot be undone.`)) {
                          deleteUser.mutate(user.id);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="flex items-center text-sm text-gray-500">
            Page {page} of {data.total_pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page === data.total_pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* ── Create User Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setCreateForm(EMPTY_CREATE); }}
        title="Create User Account"
        description="Admin-created accounts are immediately verified and can log in."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); setCreateForm(EMPTY_CREATE); }}>
              Cancel
            </Button>
            <button
              disabled={!createValid || createUser.isPending}
              onClick={() => createUser.mutate(createForm)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              {createUser.isPending ? "Creating…" : "Create User"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={createForm.global_role}
              onChange={(e) => setCreateForm((f) => ({ ...f, global_role: e.target.value }))}
            >
              {CREATE_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Rohit Sharma"
              value={createForm.full_name}
              onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="captain@example.com"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Minimum 6 characters"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPwd((s) => !s)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+91 98765 43210"
              value={createForm.phone}
              onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
            Share these credentials with the user so they can log in immediately.
          </p>
        </div>
      </Modal>

      {/* ── Suspend Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!suspendTarget}
        onClose={() => { setSuspendTarget(null); setSuspendReason(""); }}
        title={`Suspend ${suspendTarget?.full_name ?? "user"}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSuspendTarget(null)}>Cancel</Button>
            <button
              disabled={suspendReason.trim().length < 5 || suspend.isPending}
              onClick={() => suspend.mutate({ id: suspendTarget!.id, reason: suspendReason })}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              {suspend.isPending ? "Suspending…" : "Suspend user"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Provide a reason (minimum 5 characters):</p>
          <textarea
            rows={3}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. Repeated violation of community guidelines"
          />
        </div>
      </Modal>

      {/* ── Role Modal ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        title={`Update role — ${roleTarget?.full_name ?? "user"}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRoleTarget(null)}>Cancel</Button>
            <button
              disabled={updateRole.isPending}
              onClick={() => updateRole.mutate({ id: roleTarget!.id, role: newRole })}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              {updateRole.isPending ? "Saving…" : "Update role"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Current role: <span className="font-semibold">{roleTarget?.global_role}</span>
          </p>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
}
