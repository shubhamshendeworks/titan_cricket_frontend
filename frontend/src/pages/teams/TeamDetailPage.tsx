/**
 * TeamDetailPage — Full team overview.
 * Route: /teams/:teamId
 */

import { useNavigate, useParams, Link, Navigate } from "react-router-dom";
import { useTournament } from "@/contexts/TournamentContext";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Users,
  Wallet,
  ShieldCheck,
  Pencil,
  Gavel,
  Trophy,
  User,
  X,
  Plus,
} from "lucide-react";

import { apiClient } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  tournament_id: string;
  name: string;
  short_name?: string | null;
  logo_url?: string | null;
  captain_id?: string | null;
  captain_name?: string | null;
  budget: number;
  budget_spent: number;
  budget_remaining: number;
  is_active: boolean;
}

interface Player {
  id: string;
  name: string;
  photo_url?: string | null;
  role: string;
  status: string;
  sold_price?: number | null;
  base_price: number;
}

interface CaptainUser {
  id: string;
  full_name: string;
  email: string;
  global_role: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  BATSMAN: "Batsman",
  BOWLER: "Bowler",
  ALL_ROUNDER: "All-Rounder",
  WICKET_KEEPER: "Wicket Keeper",
};

function getInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// ── Change Captain Modal ───────────────────────────────────────────────────────

function ChangeCaptainModal({
  isOpen,
  onClose,
  team,
  tournamentId,
}: {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  tournamentId: string;
}) {
  const qc = useQueryClient();
  const [selectedCaptain, setSelectedCaptain] = useState(team.captain_id ?? "");

  const captainsQ = useQuery<CaptainUser[]>({
    queryKey: ["captains-list"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: CaptainUser[] } }>("/users?role=CAPTAIN&page_size=200");
      return data.data.items;
    },
    enabled: isOpen,
    staleTime: 30_000,
  });

  const teamsQ = useQuery<Team[]>({
    queryKey: ["teams", tournamentId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: Team[] } }>(
        `/tournaments/${tournamentId}/teams?page_size=100`
      );
      return data.data.items;
    },
    enabled: isOpen,
    staleTime: 30_000,
  });

  const assignedCaptainIds = new Set(
    (teamsQ.data ?? [])
      .filter((t) => t.id !== team.id)
      .map((t) => t.captain_id)
      .filter(Boolean)
  );

  const updateMut = useMutation({
    mutationFn: () =>
      apiClient.put(`/tournaments/${tournamentId}/teams/${team.id}`, {
        captain_id: selectedCaptain || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team", tournamentId, team.id] });
      qc.invalidateQueries({ queryKey: ["teams", tournamentId] });
      toast.success("Captain updated");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to update captain"),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Captain" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Captain</label>
          <select
            value={selectedCaptain}
            onChange={(e) => setSelectedCaptain(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          >
            <option value="">— No captain —</option>
            {captainsQ.data?.map((c) => (
              <option key={c.id} value={c.id} disabled={assignedCaptainIds.has(c.id)}>
                {c.full_name} {assignedCaptainIds.has(c.id) ? "(assigned)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50">Cancel</button>
          <button
            type="button"
            disabled={updateMut.isPending}
            onClick={() => updateMut.mutate()}
            className="flex-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {updateMut.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { tournamentId } = useTournament();
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();

  const [changeCaptainOpen, setChangeCaptainOpen] = useState(false);

  if (!tournamentId) return <Navigate to="/teams" replace />;

  const teamQ = useQuery<Team>({
    queryKey: ["team", tournamentId, teamId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Team }>(
        `/tournaments/${tournamentId}/teams/${teamId}`
      );
      return data.data;
    },
    enabled: !!tournamentId && !!teamId,
  });

  const playersQ = useQuery<Player[]>({
    queryKey: ["team-players", tournamentId, teamId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: Player[] } }>(
        `/tournaments/${tournamentId}/players?team_id=${teamId}&page_size=100`
      );
      return data.data.items;
    },
    enabled: !!tournamentId && !!teamId,
  });

  if (!tournamentId || !teamId) return null;

  const team = teamQ.data;
  const players = playersQ.data ?? [];

  const budgetPct = team ? Math.round((team.budget_spent / team.budget) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-8 space-y-6"
    >
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Teams", href: "/teams" },
          { label: team?.name ?? "Team" },
        ]}
      />

      {teamQ.isLoading ? (
        <div className="space-y-4">
          <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-60 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      ) : !team ? (
        <div className="text-center py-20">
          <p className="text-slate-500">Team not found.</p>
          <button
            type="button"
            onClick={() => navigate("/teams")}
            className="mt-4 text-blue-600 hover:underline text-sm"
          >
            Back to teams
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Team header card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-start gap-5">
              {/* Logo / avatar */}
              <div className="shrink-0 h-20 w-20 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">{getInitials(team.name)}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{team.name}</h1>
                    {team.short_name && (
                      <p className="text-sm text-slate-500 font-medium">{team.short_name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full border",
                        team.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {team.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setChangeCaptainOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Change Captain
                      </button>
                      <Link
                        to="/teams"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Link>
                    </div>
                  )}
                </div>

                {/* Captain */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {team.captain_name ?? <span className="text-slate-400 italic">No captain assigned</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Wallet className="h-4.5 w-4.5 text-blue-600 h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-600">Opening Points</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{team.budget} Pts</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-slate-600">Remaining Points</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{team.budget_remaining} Pts</p>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.max(0, 100 - budgetPct)}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-sm font-medium text-slate-600">Players Purchased</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{players.length}</p>
            </div>
          </div>

          {/* Players list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Squad ({players.length})</h2>
              <Link
                to="/players"
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Players
              </Link>
            </div>

            {playersQ.isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : players.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-8 w-8 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No players in this team yet</p>
                <p className="text-xs text-slate-400 mt-1">Players will appear here after the auction</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {players.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50">
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shrink-0">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white">{getInitials(p.name)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/players/${p.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600 transition-colors text-sm truncate block"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-slate-500">{ROLE_LABELS[p.role] ?? p.role}</p>
                    </div>
                    {p.sold_price != null && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        {p.sold_price} Pts
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change captain modal */}
      {team && (
        <ChangeCaptainModal
          isOpen={changeCaptainOpen}
          onClose={() => setChangeCaptainOpen(false)}
          team={team}
          tournamentId={tournamentId}
        />
      )}
    </motion.div>
  );
}

export default TeamDetailPage;
