/**
 * TournamentPage — Create, view, and manage the active tournament.
 * Route: /tournament
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Trophy,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Loader2,
  GitMerge,
  Users,
  Shirt,
  Crown,
  Medal,
} from "lucide-react";

import { apiClient } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { useTournament } from "@/contexts/TournamentContext";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Tournament {
  id: string;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  venue?: string | null;
  status: string;
  max_teams?: number | null;
  team_budget?: number | null;
  source_tournament_id?: string | null;
  winner_team_id?: string | null;
  winner_team_name?: string | null;
  runner_up_team_id?: string | null;
  runner_up_team_name?: string | null;
  completed_at?: string | null;
  created_at: string;
}

interface TeamOption {
  id: string;
  name: string;
  display_name: string | null;
  logo_url?: string | null;
}

function dn(t: Pick<TeamOption, "name" | "display_name">): string {
  return t.display_name || t.name;
}

interface TournamentForm {
  name: string;
  description: string;
  start_date: string;
  source_tournament_id: string;
}

const EMPTY_FORM: TournamentForm = {
  name: "",
  description: "",
  start_date: "",
  source_tournament_id: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── Create / Edit Modal ────────────────────────────────────────────────────────

function TournamentModal({
  isOpen,
  onClose,
  tournament,
  allTournaments,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament | null;
  allTournaments: Tournament[];
  onSaved: () => void;
}) {
  const isEdit = !!tournament;
  const [form, setForm] = useState<TournamentForm>(
    tournament
      ? {
          name: tournament.name,
          description: tournament.description ?? "",
          start_date: tournament.start_date?.slice(0, 10) ?? "",
          source_tournament_id: tournament.source_tournament_id ?? "",
        }
      : EMPTY_FORM
  );

  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        start_date: form.start_date || undefined,
        source_tournament_id: form.source_tournament_id || null,
      };
      if (isEdit) {
        const { data } = await apiClient.put<{ data: Tournament }>(`/tournaments/${tournament!.id}`, body);
        return data.data;
      } else {
        const { data } = await apiClient.post<{ data: Tournament }>("/tournaments", body);
        return data.data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      onSaved();
      toast.success(isEdit ? "Tournament updated" : "Tournament created");
      onClose();
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message ?? e?.message ?? "Failed to save tournament";
      toast.error(msg);
    },
  });

  const valid = form.name.trim().length >= 2;
  const inp = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900";
  const otherTournaments = allTournaments.filter((t) => t.id !== tournament?.id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Tournament" : "Create Tournament"} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tournament Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Titan Premier League Season 2"
            className={inp}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={2}
            placeholder="Brief description..."
            className={`${inp} resize-none`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
            className={inp}
          />
        </div>

        {/* Season chain */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Continue from previous season
            <span className="ml-1 text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            value={form.source_tournament_id}
            onChange={(e) => setForm((p) => ({ ...p, source_tournament_id: e.target.value }))}
            className={inp}
          >
            <option value="">— No previous season —</option>
            {otherTournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
            ))}
          </select>
          {form.source_tournament_id && (
            <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
              <GitMerge className="h-3 w-3" />
              After creating, click "Initialize Season" on the tournament card to carry forward players and teams.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            variant="primary"
            onClick={() => mut.mutate()}
            loading={mut.isPending}
            disabled={!valid || mut.isPending}
            className="flex-1"
          >
            {isEdit ? "Save Changes" : "Create Tournament"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Initialize Season Result Modal ────────────────────────────────────────────

interface InitResult {
  players_carried_forward: number;
  teams_carried_forward: number;
  source_tournament_name: string;
}

function InitSeasonModal({
  isOpen,
  tournament,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  tournament: Tournament | null;
  onClose: () => void;
  onSuccess: (result: InitResult) => void;
}) {
  const initMut = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ data: InitResult }>(
        `/tournaments/${tournament!.id}/new-season`
      );
      return data.data;
    },
    onSuccess: (result) => {
      onSuccess(result);
      toast.success(`Season initialized — ${result.players_carried_forward} players and ${result.teams_carried_forward} teams carried forward.`);
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message ?? "Failed to initialize season.";
      toast.error(msg);
    },
  });

  if (!tournament) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initialize New Season"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <button
            onClick={() => initMut.mutate()}
            disabled={initMut.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {initMut.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Initializing…</>
            ) : (
              <><GitMerge className="h-4 w-4" /> Initialize Season</>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 space-y-3">
          <p className="text-sm font-semibold text-indigo-900">What this does:</p>
          <ul className="space-y-2 text-sm text-indigo-800">
            <li className="flex items-start gap-2">
              <Shirt className="h-4 w-4 mt-0.5 shrink-0 text-indigo-500" />
              Copies all players from the previous season to <strong>{tournament.name}</strong> with AVAILABLE status
            </li>
            <li className="flex items-start gap-2">
              <Users className="h-4 w-4 mt-0.5 shrink-0 text-indigo-500" />
              Copies all teams with the same captain assignments and a fresh budget
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-indigo-500" />
              Previous season's data, auction results, and history remain untouched
            </li>
          </ul>
        </div>
        <p className="text-sm text-slate-600">
          This action is <strong>safe and non-destructive</strong>. You can add/remove players and change
          captain assignments afterwards. It cannot be run twice on the same tournament.
        </p>
      </div>
    </Modal>
  );
}

// ── Set Winner Modal ──────────────────────────────────────────────────────────

function SetWinnerModal({
  isOpen,
  tournament,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  tournament: Tournament | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [winnerId, setWinnerId] = useState("");
  const [runnerUpId, setRunnerUpId] = useState("");
  const qc = useQueryClient();

  const teamsQ = useQuery<TeamOption[]>({
    queryKey: ["teams-for-winner", tournament?.id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: TeamOption[] } }>(
        `/tournaments/${tournament!.id}/teams?page_size=100`
      );
      return data.data.items;
    },
    enabled: isOpen && !!tournament,
    staleTime: 30_000,
  });

  const teams = teamsQ.data ?? [];

  const saveMut = useMutation({
    mutationFn: async () => {
      const winner = teams.find((t) => t.id === winnerId);
      const runnerUp = runnerUpId ? teams.find((t) => t.id === runnerUpId) : undefined;
      await apiClient.post(`/tournaments/${tournament!.id}/result`, {
        winner_team_id: winnerId,
        winner_team_name: winner ? dn(winner) : undefined,
        runner_up_team_id: runnerUpId || undefined,
        runner_up_team_name: runnerUp ? dn(runnerUp) : undefined,
      });
    },
    onSuccess: () => {
      toast.success("Tournament result saved.");
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      qc.invalidateQueries({ queryKey: ["dash-champions"] });
      qc.invalidateQueries({ queryKey: ["tournaments-completed"] });
      qc.invalidateQueries({ queryKey: ["tournaments-all-history"] });
      onSaved();
      onClose();
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Failed to save result.");
    },
  });

  if (!tournament) return null;

  const inp = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Tournament Result"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <button
            disabled={!winnerId || saveMut.isPending}
            onClick={() => saveMut.mutate()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
            Save Result
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            Recording the result for <strong>{tournament.name}</strong>. This is permanent and visible in History.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Champion Team <span className="text-orange-500">*</span>
          </label>
          <select className={inp} value={winnerId} onChange={(e) => setWinnerId(e.target.value)}>
            <option value="">— Select Champion —</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{dn(t)}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Runner-up Team <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            className={inp}
            value={runnerUpId}
            onChange={(e) => setRunnerUpId(e.target.value)}
            disabled={!winnerId}
          >
            <option value="">— Select Runner-up —</option>
            {teams.filter((t) => t.id !== winnerId).map((t) => (
              <option key={t.id} value={t.id}>{dn(t)}</option>
            ))}
          </select>
        </div>

        {/* Preview */}
        {winnerId && (() => {
          const w = teams.find((t) => t.id === winnerId);
          const r = runnerUpId ? teams.find((t) => t.id === runnerUpId) : undefined;
          return (
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                {w?.logo_url
                  ? <img src={w.logo_url} alt="" className="h-6 w-6 rounded object-contain shrink-0" />
                  : <Crown className="h-4 w-4 text-amber-500" />
                }
                <span className="font-semibold text-slate-900">{w ? dn(w) : ""}</span>
                <span className="text-slate-400 text-xs">Champion</span>
              </div>
              {r && (
                <div className="flex items-center gap-2 text-sm">
                  {r.logo_url
                    ? <img src={r.logo_url} alt="" className="h-6 w-6 rounded object-contain shrink-0" />
                    : <Medal className="h-4 w-4 text-slate-400" />
                  }
                  <span className="font-medium text-slate-700">{dn(r)}</span>
                  <span className="text-slate-400 text-xs">Runner-up</span>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </Modal>
  );
}

// ── Tournament Card ────────────────────────────────────────────────────────────

function TournamentCard({
  t,
  isActive,
  isAdmin = true,
  activating,
  onSetActive,
  onEdit,
  onDelete,
  onInitSeason,
  onSetWinner,
  teamMap = {},
}: {
  t: Tournament;
  isActive: boolean;
  isAdmin?: boolean;
  activating?: boolean;
  onSetActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onInitSeason: () => void;
  onSetWinner: () => void;
  teamMap?: Record<string, TeamOption>;
}) {
  function resolveW(teamId: string | null | undefined, fallback: string | null | undefined): string {
    if (!teamId && !fallback) return "—";
    const team = teamId ? teamMap[teamId] : undefined;
    if (team) return dn(team);
    return fallback ?? "—";
  }
  const hasWinner = !!(t.winner_team_id || t.winner_team_name);
  const winnerLogo = t.winner_team_id ? (teamMap[t.winner_team_id]?.logo_url ?? null) : null;

  const statusMap: Record<string, string> = {
    DRAFT: "DRAFT",
    REGISTRATION: "REGISTRATION",
    ACTIVE: "ACTIVE",
    AUCTION: "AUCTION",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
  };
  const safeStatus = statusMap[t.status] ?? "DRAFT";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-2xl border shadow-sm p-6 transition-all",
        isActive ? "border-navy-900 ring-2 ring-navy-900/10" : "border-slate-200 hover:border-slate-300 hover:shadow-md"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-navy-900 flex items-center justify-center shrink-0">
            <Trophy className="h-6 w-6 text-gold-bright" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight">{t.name}</h3>
            {t.description && (
              <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{t.description}</p>
            )}
          </div>
        </div>
        <StatusBadge status={safeStatus as any} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {(t.start_date || t.end_date) && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{fmtDate(t.start_date)} – {fmtDate(t.end_date)}</span>
          </div>
        )}
        {t.venue && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{t.venue}</span>
          </div>
        )}
        {t.max_teams && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Trophy className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Max {t.max_teams} teams</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="h-4 w-4 text-slate-400 shrink-0" />
          <span>Created {fmtDate(t.created_at)}</span>
        </div>
      </div>

      {/* Winner strip — shown when result is recorded */}
      {hasWinner && (
        <div className="flex items-center gap-3 mb-4 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
          {winnerLogo
            ? <img src={winnerLogo} alt="" className="h-6 w-6 rounded object-contain shrink-0" />
            : <Crown className="h-4 w-4 text-amber-500 shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-800 truncate">
              🏆 {resolveW(t.winner_team_id, t.winner_team_name)}
              {(t.runner_up_team_id || t.runner_up_team_name) && (
                <span className="text-amber-600 font-normal ml-2">· 🥈 {resolveW(t.runner_up_team_id, t.runner_up_team_name)}</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-slate-100 flex-wrap">
        {isActive ? (
          <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
            <CheckCircle className="h-4 w-4" />
            Active Tournament
          </div>
        ) : isAdmin ? (
          <button
            type="button"
            onClick={onSetActive}
            disabled={activating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-navy-900 text-navy-900 text-xs font-semibold hover:bg-navy-900 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
            {activating ? "Activating…" : "Set as Active"}
          </button>
        ) : null}

        {/* Initialize Season button */}
        {isAdmin && t.source_tournament_id && (
          <button
            type="button"
            onClick={onInitSeason}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-400 text-indigo-700 text-xs font-semibold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors"
            title="Carry forward players and teams from previous season"
          >
            <GitMerge className="h-3.5 w-3.5" />
            Initialize Season
          </button>
        )}

        {/* Set Winner button — for COMPLETED tournaments (admin only) */}
        {isAdmin && t.status === "COMPLETED" && (
          <button
            type="button"
            onClick={onSetWinner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-400 text-amber-700 text-xs font-semibold hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-colors"
          >
            <Crown className="h-3.5 w-3.5" />
            {t.winner_team_id || t.winner_team_name ? "Update Result" : "Set Winner"}
          </button>
        )}

        {isAdmin && (
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={onEdit}
              className="h-8 w-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="h-8 w-8 rounded-lg border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center text-slate-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function TournamentPage() {
  const { tournament: activeTournament, refetch: refetchContext } = useTournament();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Tournament | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null);
  const [initTarget, setInitTarget] = useState<Tournament | null>(null);
  const [initResult, setInitResult] = useState<InitResult | null>(null);
  const [winnerTarget, setWinnerTarget] = useState<Tournament | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const qc = useQueryClient();
  const { isAdmin } = usePermissions();

  const tournamentsQ = useQuery<Tournament[]>({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: Tournament[] } }>("/tournaments?page_size=50");
      return data.data.items;
    },
    staleTime: 30_000,
  });

  const completedWithWinner = (tournamentsQ.data ?? []).filter((t) => t.winner_team_id);

  const winnerTeamsQ = useQuery<Record<string, Record<string, TeamOption>>>({
    queryKey: ["winner-teams", completedWithWinner.map((t) => t.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        completedWithWinner.map(async (t) => {
          try {
            const { data } = await apiClient.get<{ data: { items: TeamOption[] } }>(
              `/tournaments/${t.id}/teams?page_size=100`
            );
            return {
              id: t.id,
              teamMap: Object.fromEntries((data.data.items ?? []).map((tm) => [tm.id, tm])),
            };
          } catch {
            return { id: t.id, teamMap: {} };
          }
        })
      );
      return Object.fromEntries(results.map((r) => [r.id, r.teamMap]));
    },
    enabled: completedWithWinner.length > 0,
    staleTime: 120_000,
  });

  const winnerTeamsByTournament = winnerTeamsQ.data ?? {};

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tournaments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Tournament deleted");
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to delete tournament"),
  });

  async function handleSetActive(t: Tournament) {
    if (activatingId) return;
    setActivatingId(t.id);
    try {
      await apiClient.patch(`/tournaments/${t.id}/status`, { status: "ACTIVE" });

      // 1. Refresh the tournament card list (statuses updated in DB)
      await qc.invalidateQueries({ queryKey: ["tournaments"] });

      // 2. Force the TournamentContext to re-fetch from API — it will now
      //    find this tournament as ACTIVE and switch everything to it
      refetchContext();

      // 3. Invalidate all downstream queries so every page reloads with the new tournament
      qc.invalidateQueries({ queryKey: ["teams"] });
      qc.invalidateQueries({ queryKey: ["auction-teams"] });
      qc.invalidateQueries({ queryKey: ["players"] });
      qc.invalidateQueries({ queryKey: ["dash-teams"] });
      qc.invalidateQueries({ queryKey: ["dash-players"] });
      qc.invalidateQueries({ queryKey: ["dash-auction"] });
      qc.invalidateQueries({ queryKey: ["auction"] });
      qc.invalidateQueries({ queryKey: ["auction-results"] });

      toast.success(`"${t.name}" is now the active tournament`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to activate tournament");
    } finally {
      setActivatingId(null);
    }
  }

  const tournaments = tournamentsQ.data ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-8 space-y-6"
    >
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Tournament" }]} />

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tournament</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeTournament ? `Active: ${activeTournament.name}` : "No active tournament"}
          </p>
        </div>
        {isAdmin && (
          <Button variant="gold" onClick={() => setCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
            New Tournament
          </Button>
        )}
      </div>

      {/* Content */}
      {tournamentsQ.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <div className="h-20 w-20 rounded-2xl bg-navy-900 flex items-center justify-center mb-6">
            <Trophy className="h-10 w-10 text-gold-bright" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Tournaments Yet</h3>
          <p className="text-sm text-slate-500 max-w-sm text-center mb-8">
            Create your first tournament to get started with the auction platform.
          </p>
          {isAdmin && (
            <Button variant="gold" onClick={() => setCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Create Tournament
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tournaments.map((t) => (
            <TournamentCard
              key={t.id}
              t={t}
              isActive={activeTournament?.id === t.id}
              isAdmin={isAdmin}
              activating={activatingId === t.id}
              onSetActive={() => handleSetActive(t)}
              onEdit={() => setEditTarget(t)}
              onDelete={() => setDeleteTarget(t)}
              onInitSeason={() => { setInitResult(null); setInitTarget(t); }}
              onSetWinner={() => setWinnerTarget(t)}
              teamMap={winnerTeamsByTournament[t.id] ?? {}}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <TournamentModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        tournament={null}
        allTournaments={tournaments}
        onSaved={() => {}}
      />

      {/* Edit modal */}
      {editTarget && (
        <TournamentModal
          isOpen
          onClose={() => setEditTarget(null)}
          tournament={editTarget}
          allTournaments={tournaments}
          onSaved={() => {}}
        />
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        title="Delete Tournament"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMut.isPending}
        variant="danger"
      />

      {/* Initialize Season modal */}
      <InitSeasonModal
        isOpen={!!initTarget}
        tournament={initTarget}
        onClose={() => setInitTarget(null)}
        onSuccess={(result) => {
          setInitResult(result);
          setInitTarget(null);
          qc.invalidateQueries({ queryKey: ["tournaments"] });
          qc.invalidateQueries({ queryKey: ["players"] });
          qc.invalidateQueries({ queryKey: ["teams"] });
        }}
      />

      {/* Set Winner modal */}
      <SetWinnerModal
        isOpen={!!winnerTarget}
        tournament={winnerTarget}
        onClose={() => setWinnerTarget(null)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["tournaments"] });
        }}
      />

      {/* Initialize Season result summary */}
      {initResult && (
        <div className="fixed bottom-6 right-6 z-50 bg-white rounded-2xl border border-indigo-200 shadow-xl p-5 max-w-sm w-full">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <GitMerge className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm">Season initialized!</p>
              <p className="text-xs text-slate-500 mt-0.5">
                From: <span className="font-medium text-indigo-700">{initResult.source_tournament_name}</span>
              </p>
              <div className="flex gap-4 mt-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-indigo-600">{initResult.players_carried_forward}</p>
                  <p className="text-xs text-slate-500">Players</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-indigo-600">{initResult.teams_carried_forward}</p>
                  <p className="text-xs text-slate-500">Teams</p>
                </div>
              </div>
            </div>
            <button onClick={() => setInitResult(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
              <Trophy className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default TournamentPage;
