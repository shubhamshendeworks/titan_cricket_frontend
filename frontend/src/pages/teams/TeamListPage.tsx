/**
 * TeamListPage — Full CRUD for tournament teams.
 * Routes:
 *   /teams                    — shows tournament selector
 *   /tournaments/:id/teams    — team list with Create/Edit/Delete/Logo
 */

import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTournament } from "@/contexts/TournamentContext";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Wallet,
  ShieldCheck,
  Clock,
  Trophy,
  X,
  Pencil,
  Trash2,
  ImagePlus,
  ChevronDown,
  Users,
  Star,
} from "lucide-react";

import { apiClient } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  short_name?: string | null;
  display_name?: string | null;
  logo_url?: string | null;
  captain_id?: string | null;
  captain_name?: string | null;
  budget: number;
  budget_spent: number;
  budget_remaining: number;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TeamPage {
  items: Team[];
  total: number;
}

interface TournamentItem {
  id: string;
  name: string;
}

interface CaptainUser {
  id: string;
  full_name: string;
  email: string;
}

interface TeamForm {
  name: string;
  short_name: string;
  budget: number;
  captain_id: string;
}

const EMPTY_FORM: TeamForm = { name: "", short_name: "", budget: 1200, captain_id: "" };

// ── API helpers ────────────────────────────────────────────────────────────────

async function fetchTeams(tournamentId: string): Promise<TeamPage> {
  const { data } = await apiClient.get<{ data: TeamPage }>(
    `/tournaments/${tournamentId}/teams?page_size=100`
  );
  return data.data;
}

async function fetchTournament(id: string): Promise<TournamentItem> {
  const { data } = await apiClient.get<{ data: TournamentItem }>(`/tournaments/${id}`);
  return data.data;
}

async function fetchAllTournaments(): Promise<TournamentItem[]> {
  const { data } = await apiClient.get<{ data: { items: TournamentItem[] } }>(
    "/tournaments?page_size=100"
  );
  return data.data.items;
}

async function fetchCaptains(): Promise<CaptainUser[]> {
  const { data } = await apiClient.get<{ data: { items: CaptainUser[] } }>(
    "/users?role=CAPTAIN&page_size=200"
  );
  return data.data.items;
}

// ── Gradient palette ───────────────────────────────────────────────────────────

const GRADIENT_PALETTE = [
  "from-violet-500 to-purple-700",
  "from-sky-500 to-blue-700",
  "from-emerald-400 to-teal-600",
  "from-orange-400 to-red-600",
  "from-pink-400 to-rose-600",
  "from-amber-400 to-orange-600",
  "from-cyan-400 to-sky-600",
  "from-indigo-400 to-violet-600",
];

function pickGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return GRADIENT_PALETTE[hash % GRADIENT_PALETTE.length];
}

function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function formatBudget(amount: number): string {
  return `${amount} Pts`;
}

// ── Status pill ────────────────────────────────────────────────────────────────

function StatusPill({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <ShieldCheck className="h-3 w-3" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
      <Clock className="h-3 w-3" />
      Inactive
    </span>
  );
}

// ── Tournament selector (when no tournamentId) ─────────────────────────────────

function TournamentSelectorView() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");

  const q = useQuery<TournamentItem[]>({
    queryKey: ["tournaments-list"],
    queryFn: fetchAllTournaments,
    staleTime: 60_000,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 px-8 text-center"
    >
      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-6 shadow-md">
        <Trophy className="h-10 w-10 text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Tournament</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-8">
        Teams are scoped to a tournament. Pick one to view and manage its teams.
      </p>
      <div className="flex gap-3 w-full max-w-sm">
        <div className="relative flex-1">
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">— Select tournament —</option>
            {q.data?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
        <button
          disabled={!selected}
          onClick={() => navigate(`/tournaments/${selected}/teams`)}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
        >
          Go
        </button>
      </div>
    </motion.div>
  );
}

// ── Team Players Modal ─────────────────────────────────────────────────────────

interface TeamPlayer {
  id: string;
  name: string;
  role?: string | null;
  photo_url?: string | null;
  base_price?: number | null;
  sold_price?: number | null;
  batting_style?: string | null;
  bowling_style?: string | null;
  status: string;
}

function TeamPlayersModal({
  team,
  tournamentId,
  onClose,
  isAdmin,
}: {
  team: Team;
  tournamentId: string;
  onClose: () => void;
  isAdmin: boolean;
}) {
  const qc = useQueryClient();
  const gradient = pickGradient(team.name);
  const initials = getInitials(team.name);
  const [confirmRelease, setConfirmRelease] = useState<TeamPlayer | null>(null);

  const { data, isLoading } = useQuery<TeamPlayer[]>({
    queryKey: ["team-players", tournamentId, team.id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: TeamPlayer[] } }>(
        `/tournaments/${tournamentId}/players?team_id=${team.id}&page_size=100`
      );
      return data.data.items;
    },
    staleTime: 0,
  });

  const releaseMut = useMutation({
    mutationFn: async (playerId: string) => {
      await apiClient.post(`/tournaments/${tournamentId}/players/${playerId}/release`);
    },
    onSuccess: () => {
      toast.success("Player released from team.");
      qc.invalidateQueries({ queryKey: ["team-players", tournamentId, team.id] });
      qc.invalidateQueries({ queryKey: ["teams", tournamentId] });
      qc.invalidateQueries({ queryKey: ["players", tournamentId] });
      qc.invalidateQueries({ queryKey: ["auction", tournamentId] });
      setConfirmRelease(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Could not release player."),
  });

  const players = data ?? [];

  const roleColor: Record<string, string> = {
    BATSMAN: "bg-blue-100 text-blue-700",
    BOWLER: "bg-green-100 text-green-700",
    ALL_ROUNDER: "bg-purple-100 text-purple-700",
    WICKET_KEEPER: "bg-amber-100 text-amber-700",
  };

  return (
    <>
      <Modal isOpen onClose={onClose} title="Squad" size="lg">
        {/* Team header */}
        <div className="flex items-center gap-4 mb-6 -mt-2">
          <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-sm", gradient)}>
            {team.logo_url ? (
              <img src={team.logo_url} alt={team.name} className="h-10 w-10 object-contain rounded-xl" />
            ) : (
              <span className="text-lg font-bold text-white select-none">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{team.name}</h2>
            <p className="text-sm text-slate-500">
              {isLoading ? "Loading…" : `${players.length} player${players.length !== 1 ? "s" : ""} in squad`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No players yet</p>
            <p className="text-sm text-slate-400 mt-1">Players will appear here once the auction is complete.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {players.map((p, i) => {
              const roleKey = (p.role ?? "").toUpperCase().replace(" ", "_");
              const roleBadge = roleColor[roleKey] ?? "bg-slate-100 text-slate-600";
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-slate-500">{getInitials(p.name ?? "?")}</span>
                    )}
                  </div>

                  {/* Name + role */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{p.name}</p>
                    {p.role && (
                      <span className={cn("inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium", roleBadge)}>
                        {p.role.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  {p.sold_price != null && (
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-amber-600 font-bold text-sm">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {p.sold_price} Pts
                      </div>
                      {p.base_price != null && p.sold_price !== p.base_price && (
                        <p className="text-xs text-slate-400">Base: {p.base_price}</p>
                      )}
                    </div>
                  )}

                  {/* Remove (admin only) */}
                  {isAdmin && (
                    <button
                      onClick={() => setConfirmRelease(p)}
                      title="Remove from team"
                      className="ml-1 p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Confirm release */}
      <ConfirmModal
        isOpen={!!confirmRelease}
        onClose={() => setConfirmRelease(null)}
        onConfirm={() => confirmRelease && releaseMut.mutate(confirmRelease.id)}
        title={`Remove "${confirmRelease?.name ?? "player"}" from squad?`}
        description="The player will be released back to the available pool. Team points will be restored."
        confirmLabel="Remove Player"
        loading={releaseMut.isPending}
        variant="danger"
      />
    </>
  );
}

// ── TeamCard ───────────────────────────────────────────────────────────────────

interface TeamCardProps {
  team: Team;
  index: number;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onLogoClick: (team: Team) => void;
  onViewPlayers: (team: Team) => void;
  isAdmin?: boolean;
}

function TeamCard({ team, index, onEdit, onDelete, onLogoClick, onViewPlayers, isAdmin = true }: TeamCardProps) {
  const gradient = pickGradient(team.name);
  const initials = getInitials(team.name);
  const budgetUsedPct = team.budget > 0
    ? Math.min(100, Math.round((team.budget_spent / team.budget) * 100))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-2xl hover:border-amber-200/50 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      <div className={cn("relative h-28 w-full bg-gradient-to-br flex-shrink-0", gradient)}>
        {/* Subtle radial shine */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(255,255,255,0.18)_0%,transparent_65%)]" />

        {/* Status badge — top right */}
        <div className="absolute top-3 right-3">
          <StatusPill isActive={team.is_active} />
        </div>
      </div>

      {/* ── Logo medallion (overlaps banner + body) ──────────────────────────── */}
      <div className="relative flex justify-center" style={{ marginTop: -52 }}>
        <div
          className={cn(
            "relative h-28 w-28 rounded-2xl flex items-center justify-center",
            "bg-white shadow-2xl border-4 border-white",
            "overflow-hidden",
            isAdmin && "cursor-pointer transition-transform duration-200 hover:scale-105",
          )}
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)" }}
          onClick={() => isAdmin && onLogoClick(team)}
          title={isAdmin ? "Click to upload logo" : undefined}
        >
          {team.logo_url ? (
            <img
              src={team.logo_url}
              alt={`${team.name} logo`}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <div className={cn("h-full w-full flex items-center justify-center bg-gradient-to-br", gradient)}>
              <span className="text-3xl font-black text-white tracking-wide select-none">{initials}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Card body ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-3 pb-5 flex flex-col flex-1 gap-4">

        {/* Name + short name + captain */}
        <div className="text-center">
          <h3 className="text-xl font-extrabold text-slate-900 leading-tight line-clamp-1 tracking-tight">{team.name}</h3>
          {team.short_name && (
            <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-[0.18em]">{team.short_name}</p>
          )}
          {team.captain_name && (
            <p className="text-xs text-slate-500 mt-1.5 flex items-center justify-center gap-1">
              <span className="font-bold text-slate-700">C:</span>
              <span className="truncate max-w-[160px]">{team.captain_name}</span>
            </p>
          )}
        </div>

        {/* Budget stats */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-800 leading-none truncate">{formatBudget(team.budget)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Total Pts</p>
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-bold text-emerald-700 leading-none truncate">{formatBudget(team.budget_remaining)}</p>
              <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">Remaining</p>
            </div>
          </div>
        </div>

        {/* Budget progress bar */}
        {team.budget > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Points used</span>
              <span className="text-[11px] font-bold text-slate-600">{budgetUsedPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  budgetUsedPct > 85 ? "bg-gradient-to-r from-red-400 to-red-500" :
                  budgetUsedPct > 60 ? "bg-gradient-to-r from-amber-400 to-orange-400" :
                  "bg-gradient-to-r from-emerald-400 to-emerald-500",
                )}
                style={{ width: `${budgetUsedPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-auto pt-2 flex gap-2 border-t border-slate-100">
          <button
            onClick={() => onViewPlayers(team)}
            title="View squad"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 text-xs font-semibold py-2 transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            Players
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => onLogoClick(team)}
                title="Upload logo"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold py-2 transition-colors"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Logo
              </button>
              <button
                onClick={() => onEdit(team)}
                title="Edit team"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 text-xs font-semibold py-2 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={() => onDelete(team)}
                title="Delete team"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 text-red-500 text-xs font-semibold py-2 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function TeamCardSkeleton({ i }: { i: number }) {
  return (
    <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-1.5 bg-slate-200" />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="h-20 w-20 rounded-2xl bg-slate-200" />
          <div className="h-5 w-16 rounded-full bg-slate-200" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
          <div className="h-3 w-1/3 rounded bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="h-14 rounded-xl bg-slate-100" />
          <div className="h-14 rounded-xl bg-slate-100" />
        </div>
        <div className="h-2 rounded-full bg-slate-100" />
        <div className="h-9 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

// ── Team form modal body ───────────────────────────────────────────────────────

interface TeamFormBodyProps {
  form: TeamForm;
  onChange: (form: TeamForm) => void;
  captains: CaptainUser[];
  assignedCaptainIds: string[];
  currentCaptainId?: string;
}

function TeamFormBody({ form, onChange, captains, assignedCaptainIds, currentCaptainId }: TeamFormBodyProps) {
  const field = (key: keyof TeamForm, val: string | number) =>
    onChange({ ...form, [key]: val });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Team Name *</label>
        <input
          type="text"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="e.g. Mumbai Challengers"
          value={form.name}
          onChange={(e) => field("name", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Short Name</label>
        <input
          type="text"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="e.g. MC (optional)"
          maxLength={10}
          value={form.short_name}
          onChange={(e) => field("short_name", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Points Budget</label>
        <input
          type="number"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="1200"
          min={0}
          value={form.budget}
          onChange={(e) => field("budget", parseInt(e.target.value, 10) || 0)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Captain</label>
        <select
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.captain_id}
          onChange={(e) => field("captain_id", e.target.value)}
        >
          <option value="">— No captain assigned —</option>
          {captains.map((c) => {
            const alreadyAssigned = assignedCaptainIds.includes(c.id) && c.id !== currentCaptainId;
            return (
              <option key={c.id} value={c.id} disabled={alreadyAssigned}>
                {c.full_name} ({c.email}){alreadyAssigned ? " — assigned" : ""}
              </option>
            );
          })}
        </select>
        {captains.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">
            No captains found. Create users with the CAPTAIN role first.
          </p>
        )}
      </div>
    </div>
  );
}

// ── No-tournament fallback ─────────────────────────────────────────────────────

function NoTournamentView() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 px-8 text-center"
    >
      <div className="h-20 w-20 rounded-2xl bg-navy-900 flex items-center justify-center mb-6 shadow-md">
        <Trophy className="h-10 w-10 text-gold-bright" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Tournament</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-8">
        Create or select a tournament to manage teams.
      </p>
      <button
        type="button"
        onClick={() => navigate("/tournament")}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold transition-colors"
      >
        <Trophy className="h-4 w-4 text-gold-bright" />
        Go to Tournament
      </button>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function TeamListPage() {
  const { tournamentId, loading } = useTournament();
  if (loading) return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    </div>
  );
  if (!tournamentId) return <NoTournamentView />;
  return <TeamListInner tournamentId={tournamentId} />;
}

function TeamListInner({ tournamentId }: { tournamentId: string }) {
  const qc = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { isAdmin } = usePermissions();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<TeamForm>(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<Team | null>(null);
  const [editForm, setEditForm] = useState<TeamForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [logoTeamId, setLogoTeamId] = useState<string | null>(null);
  const [viewPlayersTeam, setViewPlayersTeam] = useState<Team | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const teamsQuery = useQuery<TeamPage>({
    queryKey: ["teams", tournamentId],
    queryFn: () => fetchTeams(tournamentId),
    staleTime: 0,
  });

  const tournamentQuery = useQuery<TournamentItem>({
    queryKey: ["tournament", tournamentId],
    queryFn: () => fetchTournament(tournamentId),
    staleTime: 60_000,
  });

  const captainsQuery = useQuery<CaptainUser[]>({
    queryKey: ["captains"],
    queryFn: fetchCaptains,
    staleTime: 60_000,
  });

  const teams = teamsQuery.data?.items ?? [];
  const total = teamsQuery.data?.total ?? 0;
  const captains = captainsQuery.data ?? [];

  const assignedCaptainIds = useMemo(
    () => teams.filter((t) => t.captain_id).map((t) => t.captain_id!),
    [teams]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.short_name ?? "").toLowerCase().includes(q),
    );
  }, [teams, search]);

  const invalidateTeams = () =>
    qc.invalidateQueries({ queryKey: ["teams", tournamentId] });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createTeam = useMutation({
    mutationFn: async (form: TeamForm) => {
      await apiClient.post(`/tournaments/${tournamentId}/teams`, {
        name: form.name.trim(),
        short_name: form.short_name.trim() || null,
        captain_id: form.captain_id || null,
        budget: form.budget,
      });
    },
    onSuccess: () => {
      toast.success("Team created.");
      invalidateTeams();
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
    },
    onError: (err: Error) => toast.error(err.message || "Could not create team."),
  });

  const updateTeam = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: TeamForm }) => {
      await apiClient.put(`/tournaments/${tournamentId}/teams/${id}`, {
        name: form.name.trim(),
        short_name: form.short_name.trim() || null,
        captain_id: form.captain_id || null,
        budget: form.budget,
      });
    },
    onSuccess: () => {
      toast.success("Team updated.");
      invalidateTeams();
      setEditTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || "Could not update team."),
  });

  const deleteTeam = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/tournaments/${tournamentId}/teams/${id}`);
    },
    onSuccess: () => {
      toast.success("Team deleted.");
      invalidateTeams();
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || "Could not delete team."),
  });

  const uploadLogo = useMutation({
    mutationFn: async ({ teamId, file }: { teamId: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      await apiClient.post(`/tournaments/${tournamentId}/teams/${teamId}/logo`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("Logo uploaded.");
      invalidateTeams();
      setLogoTeamId(null);
    },
    onError: () => toast.error("Logo upload failed."),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleEditOpen(team: Team) {
    setEditTarget(team);
    setEditForm({
      name: team.name,
      short_name: team.short_name ?? "",
      budget: team.budget,
      captain_id: team.captain_id ?? "",
    });
  }

  function handleLogoClick(team: Team) {
    setLogoTeamId(team.id);
    logoInputRef.current?.click();
  }

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && logoTeamId) {
      uploadLogo.mutate({ teamId: logoTeamId, file });
    }
    e.target.value = "";
  }

  // ── Breadcrumb ───────────────────────────────────────────────────────────────
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Teams" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 space-y-8"
    >
      {/* Hidden logo file input */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoFileChange}
      />

      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teams</h1>
          {total > 0 && !teamsQuery.isLoading && (
            <p className="text-sm text-slate-500 mt-1">
              {total} team{total !== 1 ? "s" : ""}
              {tournamentQuery.data ? ` in ${tournamentQuery.data.name}` : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 w-full sm:w-56 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={() => { setCreateForm(EMPTY_FORM); setCreateOpen(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Team
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {(teamsQuery.isLoading || (teamsQuery.isFetching && !teams.length)) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <TeamCardSkeleton key={i} i={i} />)}
        </div>
      ) : teamsQuery.isError ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Failed to load teams</h3>
          <p className="text-sm text-slate-500 mb-6">Something went wrong. Please try again.</p>
          <button
            onClick={() => teamsQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2"
          >
            Retry
          </button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 px-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center"
            >
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-6 shadow-md">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {search ? "No teams match your search" : "No teams yet"}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mb-8">
                {search ? "Try a different name or clear your search." : "Add the first team to get started."}
              </p>
              {!search && isAdmin && (
                <button
                  onClick={() => { setCreateForm(EMPTY_FORM); setCreateOpen(true); }}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Team
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {filtered.map((team, index) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  index={index}
                  onEdit={handleEditOpen}
                  onDelete={(t) => setDeleteTarget(t)}
                  onLogoClick={handleLogoClick}
                  onViewPlayers={(t) => setViewPlayersTeam(t)}
                  isAdmin={isAdmin}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── Create Team Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Team"
        description={`Add a new team to ${tournamentQuery.data?.name ?? "this tournament"}.`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <button
              disabled={!createForm.name.trim() || createTeam.isPending}
              onClick={() => createTeam.mutate(createForm)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              {createTeam.isPending ? "Creating…" : "Create Team"}
            </button>
          </>
        }
      >
        <TeamFormBody
          form={createForm}
          onChange={setCreateForm}
          captains={captains}
          assignedCaptainIds={assignedCaptainIds}
        />
      </Modal>

      {/* ── Edit Team Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit — ${editTarget?.name ?? "Team"}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <button
              disabled={!editForm.name.trim() || updateTeam.isPending}
              onClick={() => updateTeam.mutate({ id: editTarget!.id, form: editForm })}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              {updateTeam.isPending ? "Saving…" : "Save Changes"}
            </button>
          </>
        }
      >
        <TeamFormBody
          form={editForm}
          onChange={setEditForm}
          captains={captains}
          assignedCaptainIds={assignedCaptainIds}
          currentCaptainId={editTarget?.captain_id ?? undefined}
        />
      </Modal>

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTeam.mutate(deleteTarget!.id)}
        title={`Delete "${deleteTarget?.name ?? "team"}"?`}
        description="This will permanently remove the team and cannot be undone."
        confirmLabel="Delete Team"
        loading={deleteTeam.isPending}
        variant="danger"
      />

      {/* ── Team Players Modal ───────────────────────────────────────────────── */}
      {viewPlayersTeam && (
        <TeamPlayersModal
          team={viewPlayersTeam}
          tournamentId={tournamentId}
          onClose={() => setViewPlayersTeam(null)}
          isAdmin={isAdmin}
        />
      )}
    </motion.div>
  );
}

export default TeamListPage;
