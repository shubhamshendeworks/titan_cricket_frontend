/**
 * CaptainsPage — Manage captain & player user accounts.
 * Route: /captains
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Trash2,
  UserCircle,
  Power,
  PowerOff,
  Pencil,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Phone,
} from "lucide-react";

import { apiClient } from "@/lib/api";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { usersApi } from "@/features/users/api/usersApi";
import type { UserDetail } from "@/features/users/api/usersApi";
import { useTournament } from "@/contexts/TournamentContext";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  captain_id: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  CAPTAIN: "Captain",
  PLAYER: "Player",
};

function RolePill({ role }: { role: string }) {
  const cls =
    role === "SUPER_ADMIN"
      ? "bg-violet-50 text-violet-700 border-violet-200"
      : role === "CAPTAIN"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-sky-50 text-sky-700 border-sky-200";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border", cls)}>
      <Shield className="h-2.5 w-2.5" />
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
        active
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-500 border-slate-200",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-slate-400")} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ── Captain Card Skeleton ──────────────────────────────────────────────────────

function CaptainCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="h-24 bg-slate-200 animate-pulse" />
      <div className="flex flex-col items-center -mt-12 px-4 pb-4">
        <div className="h-[88px] w-[88px] rounded-full bg-slate-300 border-4 border-white animate-pulse" />
        <div className="mt-3 h-5 w-32 bg-slate-200 rounded-lg animate-pulse" />
        <div className="mt-2 h-3.5 w-24 bg-slate-100 rounded-lg animate-pulse" />
        <div className="mt-4 flex gap-2">
          <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-6 w-14 bg-slate-100 rounded-full animate-pulse" />
        </div>
        <div className="mt-4 w-full h-10 bg-slate-50 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

// ── Captain Card ───────────────────────────────────────────────────────────────

function CaptainCard({
  user,
  index,
  team,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  user: UserDetail;
  index: number;
  team: Team | null;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const initials = (user.full_name || user.email)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const teamInitials = (team?.short_name || team?.name || "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col transition-all duration-300 hover:border-amber-200/60"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 12px 32px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)";
      }}
    >
      {/* Hero banner */}
      <div
        className="h-24 w-full relative overflow-hidden shrink-0"
        style={{ background: "linear-gradient(135deg, #0f1f3d 0%, #1a3460 60%, #1e3f72 100%)" }}
      >
        {/* Radial shine */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 70% 40%, rgba(245,179,1,0.10) 0%, transparent 65%)",
          }}
        />
        {/* Status indicator top-right */}
        <div className="absolute top-3 right-3">
          <StatusBadge active={user.is_active} />
        </div>
      </div>

      {/* Photo medallion */}
      <div className="flex flex-col items-center px-4 pb-0" style={{ marginTop: -44 }}>
        <div
          className="h-[88px] w-[88px] rounded-full border-4 border-white overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-105"
          style={{
            boxShadow: "0 8px 24px rgba(0,0,0,0.16), 0 0 0 2px rgba(245,179,1,0.20)",
            background: user.avatar_url
              ? "white"
              : "linear-gradient(135deg, #1e3a5f 0%, #2d5c8e 100%)",
          }}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-xl font-black text-white tracking-wide select-none">
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* Name + role badges */}
        <div className="mt-3 text-center">
          <h3 className="text-base font-extrabold text-slate-900 leading-tight">
            {user.full_name || "—"}
          </h3>
          <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
            <RolePill role={user.global_role} />
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="px-4 pt-4 pb-2 flex-1 space-y-2">
        {/* Email */}
        <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>

        {/* Phone */}
        {user.phone && (
          <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{user.phone}</span>
          </div>
        )}

        {/* Team */}
        {team ? (
          <div
            className="flex items-center gap-2.5 mt-3 rounded-xl px-3 py-2.5"
            style={{ background: "linear-gradient(to right, #f8fafc, #f1f5f9)" }}
          >
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 bg-white"
              style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}
            >
              {team.logo_url ? (
                <img src={team.logo_url} alt={team.name} className="h-full w-full object-contain p-0.5" />
              ) : (
                <span className="text-xs font-black text-navy-900 select-none">{teamInitials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.10em] leading-none mb-0.5">
                Team
              </p>
              <p className="text-xs font-bold text-slate-700 truncate">{team.name}</p>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 mt-3"
            style={{ background: "#f8fafc" }}
          >
            <div className="h-9 w-9 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-400 italic">No team assigned</p>
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-between gap-1 px-3 py-2.5 border-t border-slate-100 mt-2 bg-slate-50/60">
        <button
          onClick={onEdit}
          title="Edit user"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <button
          onClick={onToggleActive}
          title={user.is_active ? "Deactivate" : "Activate"}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
            user.is_active
              ? "text-slate-500 hover:text-orange-600 hover:bg-orange-50"
              : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50",
          )}
        >
          {user.is_active ? (
            <>
              <PowerOff className="h-3.5 w-3.5" />
              Deactivate
            </>
          ) : (
            <>
              <Power className="h-3.5 w-3.5" />
              Activate
            </>
          )}
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <button
          onClick={onDelete}
          title="Delete user"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </motion.div>
  );
}

// ── Form types ─────────────────────────────────────────────────────────────────

interface UserForm {
  email: string;
  full_name: string;
  password: string;
  global_role: string;
  phone: string;
}

const EMPTY_FORM: UserForm = {
  email: "",
  full_name: "",
  password: "",
  global_role: "CAPTAIN",
  phone: "",
};

// ── Create Modal ───────────────────────────────────────────────────────────────

function CreateUserModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [showPwd, setShowPwd] = useState(false);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: (newUser) => {
      qc.setQueriesData<{ items: UserDetail[]; total: number }>(
        { queryKey: ["captains"] },
        (old) => {
          const base = old ?? { items: [], total: 0 };
          if (base.items.some((u) => u.id === newUser.id)) return base;
          return { ...base, items: [...base.items, newUser], total: base.total + 1 };
        }
      );
      qc.refetchQueries({ queryKey: ["captains"] });
      setForm(EMPTY_FORM);
      onClose();
      toast.success("User created successfully");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to create user"),
  });

  const valid = form.email.includes("@") && form.full_name.trim().length >= 1 && form.password.length >= 6;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Captain / Player" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="e.g. Rohit Sharma"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="captain@example.com"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                value={form.global_role}
                onChange={(e) => setForm((f) => ({ ...f, global_role: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
              >
                <option value="CAPTAIN">Captain</option>
                <option value="PLAYER">Player</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone (optional)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            variant="primary"
            onClick={() => mut.mutate()}
            disabled={!valid || mut.isPending}
            loading={mut.isPending}
            className="flex-1"
          >
            Create User
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────

function EditUserModal({
  user,
  onClose,
}: {
  user: UserDetail;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    full_name: user.full_name,
    phone: user.phone ?? "",
    global_role: user.global_role,
  });
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () =>
      apiClient.put(`/users/${user.id}/role`, { global_role: form.global_role }).then(() =>
        apiClient.put(`/users/${user.id}`, { full_name: form.full_name, phone: form.phone || undefined })
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["captains"] });
      onClose();
      toast.success("User updated");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to update user"),
  });

  return (
    <Modal isOpen onClose={onClose} title="Edit User" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+91 98765 43210"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
          <select
            value={form.global_role}
            onChange={(e) => setForm((f) => ({ ...f, global_role: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
          >
            <option value="CAPTAIN">Captain</option>
            <option value="PLAYER">Player</option>
          </select>
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            variant="primary"
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            loading={mut.isPending}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function CaptainsPage() {
  const qc = useQueryClient();
  const { tournamentId } = useTournament();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDetail | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────

  const usersQ = useQuery({
    queryKey: ["captains"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: UserDetail[]; total: number } }>("/users", {
        params: { role: "CAPTAIN", page_size: "200" },
      });
      return data.data;
    },
  });

  const teamsQ = useQuery<Team[]>({
    queryKey: ["teams-list", tournamentId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tournaments/${tournamentId}/teams?page_size=100`);
      return data.data.items;
    },
    enabled: !!tournamentId,
    staleTime: 60_000,
  });

  // Build captain_id → Team lookup
  const captainToTeam = useMemo(
    () =>
      Object.fromEntries(
        (teamsQ.data ?? [])
          .filter((t) => t.captain_id)
          .map((t) => [t.captain_id as string, t]),
      ),
    [teamsQ.data],
  );

  const users = (usersQ.data?.items ?? []).filter((u) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return u.full_name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["captains"] });

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const deleteMut = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { invalidate(); setDeleteTarget(null); toast.success("User deleted"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to delete user"),
  });

  const activateMut = useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: () => { invalidate(); toast.success("Activated"); },
    onError: () => toast.error("Failed to activate"),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => { invalidate(); toast.success("Deactivated"); },
    onError: () => toast.error("Failed to deactivate"),
  });

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 space-y-6"
    >
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Captains" }]} />

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Captains</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {usersQ.isLoading ? "Loading…" : `${users.length} captain${users.length !== 1 ? "s" : ""} · manage login accounts`}
          </p>
        </div>
        <Button variant="gold" onClick={() => setCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Create User
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 bg-white shadow-sm"
        />
      </div>

      {/* Content */}
      {usersQ.isError ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-red-200 bg-red-50">
          <p className="text-red-600 font-medium">Failed to load users</p>
          <p className="text-sm text-red-400 mt-1">
            {(usersQ.error as any)?.response?.data?.detail ?? "Check the backend is running"}
          </p>
          <Button variant="secondary" onClick={() => usersQ.refetch()} className="mt-4">Retry</Button>
        </div>
      ) : usersQ.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CaptainCardSkeleton key={i} />)}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-navy-900 to-blue-900 flex items-center justify-center mb-5 shadow-md">
            <UserCircle className="h-10 w-10 text-white/70" />
          </div>
          <p className="text-slate-700 font-bold text-lg">No captains found</p>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            {search ? "Try adjusting your search." : "Create captain accounts for team bidding."}
          </p>
          {!search && (
            <Button variant="gold" onClick={() => setCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Create Captain
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {users.map((u, i) => (
              <CaptainCard
                key={u.id}
                user={u}
                index={i}
                team={captainToTeam[u.id] ?? null}
                onEdit={() => setEditTarget(u)}
                onToggleActive={() =>
                  u.is_active ? deactivateMut.mutate(u.id) : activateMut.mutate(u.id)
                }
                onDelete={() => setDeleteTarget(u)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <CreateUserModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      {editTarget && <EditUserModal user={editTarget} onClose={() => setEditTarget(null)} />}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        title="Delete User"
        description={`Delete "${deleteTarget?.full_name || deleteTarget?.email}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMut.isPending}
        variant="danger"
      />
    </motion.div>
  );
}

export default CaptainsPage;
