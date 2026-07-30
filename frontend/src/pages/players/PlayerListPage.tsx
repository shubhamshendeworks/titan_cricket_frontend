/**
 * PlayerListPage — Full CRUD player management.
 * Routes:
 *   /players                          — shows tournament selector
 *   /tournaments/:id/players          — player list with Create/Edit/Delete/Photo/Stats
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTournament } from "@/contexts/TournamentContext";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  X,
  Filter,
  User,
  Coins,
  ShieldCheck,
  Gavel,
  Trophy,
  Pencil,
  Trash2,
  CameraIcon,
  BarChart2,
  ChevronDown,
  Eye,
  UserPlus,
} from "lucide-react";

import { apiClient } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

export type PlayerRole = "BATSMAN" | "BOWLER" | "ALL_ROUNDER" | "WICKET_KEEPER";
export type BattingStyle = "RIGHT_HAND" | "LEFT_HAND";
export type BowlingStyle =
  | "RIGHT_ARM_FAST" | "RIGHT_ARM_MEDIUM" | "RIGHT_ARM_SPIN"
  | "LEFT_ARM_FAST" | "LEFT_ARM_MEDIUM" | "LEFT_ARM_SPIN"
  | "N/A";
export type PlayerStatus = "AVAILABLE" | "SOLD" | "UNSOLD" | "RETAINED" | "RTM_ELIGIBLE" | "SUSPENDED";

export interface Player {
  id: string;
  tournament_id: string;
  name: string;
  photo_url?: string | null;
  role: PlayerRole;
  batting_style?: BattingStyle | null;
  bowling_style?: BowlingStyle | null;
  status: PlayerStatus;
  base_price: number;
  sold_price?: number | null;
  sold_to_team_name?: string | null;
  sold_to_team_id?: string | null;
  jersey_number?: number | null;
  auction_eligible: boolean;
}

interface PlayerPage {
  items: Player[];
  total: number;
}

interface TournamentItem {
  id: string;
  name: string;
}

interface PlayerStat {
  id: string;
  season?: string | null;
  matches: number;
  runs: number;
  highest_score: number;
  average: number;
  strike_rate: number;
  sixes: number;
  fours: number;
  fifties: number;
  hundreds: number;
  wickets: number;
  economy: number;
  best_bowling?: string | null;
  catches: number;
  run_outs: number;
  created_at: string;
}

interface PlayerForm {
  name: string;
  role: string;
  batting_style: string;
  bowling_style: string;
  jersey_number: string;
  base_price: string;
  auction_eligible: boolean;
}

interface StatsForm {
  season: string;
  matches: string;
  runs: string;
  highest_score: string;
  average: string;
  strike_rate: string;
  fifties: string;
  hundreds: string;
  wickets: string;
  economy: string;
  best_bowling: string;
  catches: string;
  run_outs: string;
}

const EMPTY_PLAYER_FORM: PlayerForm = {
  name: "",
  role: "BATSMAN",
  batting_style: "RIGHT_HAND",
  bowling_style: "N/A",
  jersey_number: "",
  base_price: "50",
  auction_eligible: true,
};

const EMPTY_STATS_FORM: StatsForm = {
  season: "",
  matches: "0",
  runs: "0",
  highest_score: "0",
  average: "0",
  strike_rate: "0",
  fifties: "0",
  hundreds: "0",
  wickets: "0",
  economy: "0",
  best_bowling: "",
  catches: "0",
  run_outs: "0",
};

// ── API helpers ────────────────────────────────────────────────────────────────

async function fetchPlayers(tournamentId: string, auctionEligibleOnly = false): Promise<PlayerPage> {
  const params = new URLSearchParams({ page_size: "200" });
  if (auctionEligibleOnly) params.set("auction_eligible", "true");
  const { data } = await apiClient.get<{ data: PlayerPage }>(
    `/tournaments/${tournamentId}/players?${params.toString()}`
  );
  return data.data;
}

async function fetchAllTournaments(): Promise<TournamentItem[]> {
  const { data } = await apiClient.get<{ data: { items: TournamentItem[] } }>(
    "/tournaments?page_size=100"
  );
  return data.data.items;
}

// ── Formatters ─────────────────────────────────────────────────────────────────

function formatPoints(pts: number): string {
  return `${pts} pts`;
}

// ── Gradient helpers ───────────────────────────────────────────────────────────

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

// ── Role config ────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<PlayerRole, { label: string; color: string; bg: string }> = {
  BATSMAN:       { label: "Batsman",       color: "text-blue-700",    bg: "bg-blue-50 border-blue-200" },
  BOWLER:        { label: "Bowler",        color: "text-red-700",     bg: "bg-red-50 border-red-200" },
  ALL_ROUNDER:   { label: "All-Rounder",   color: "text-purple-700",  bg: "bg-purple-50 border-purple-200" },
  WICKET_KEEPER: { label: "Wicket Keeper", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
};

function RolePill({ role }: { role: PlayerRole }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.BATSMAN;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border", cfg.bg, cfg.color)}>
      {cfg.label}
    </span>
  );
}

const STATUS_PILL: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  AVAILABLE: { label: "Available", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <ShieldCheck className="h-3 w-3" /> },
  SOLD:      { label: "Sold",      cls: "bg-amber-50 text-amber-700 border-amber-200",       icon: <Gavel className="h-3 w-3" /> },
  UNSOLD:    { label: "Unsold",    cls: "bg-red-50 text-red-700 border-red-200",             icon: <X className="h-3 w-3" /> },
  RETAINED:  { label: "Retained",  cls: "bg-violet-50 text-violet-700 border-violet-200",    icon: <Trophy className="h-3 w-3" /> },
};

function StatusPill({ status }: { status: PlayerStatus }) {
  const cfg = STATUS_PILL[status] ?? STATUS_PILL.AVAILABLE;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border", cfg.cls)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

const BATTING_LABEL: Record<BattingStyle, string> = {
  RIGHT_HAND: "Right Hand",
  LEFT_HAND:  "Left Hand",
};

const ALL_ROLES: PlayerRole[] = ["BATSMAN", "BOWLER", "ALL_ROUNDER", "WICKET_KEEPER"];
const ALL_STATUSES: PlayerStatus[] = ["AVAILABLE", "SOLD", "UNSOLD"];
const ALL_BATTING: BattingStyle[] = ["RIGHT_HAND", "LEFT_HAND"];
const ALL_BOWLING: BowlingStyle[] = ["N/A", "RIGHT_ARM_FAST", "RIGHT_ARM_MEDIUM", "RIGHT_ARM_SPIN", "LEFT_ARM_FAST", "LEFT_ARM_MEDIUM", "LEFT_ARM_SPIN"];

// ── Tournament selector ────────────────────────────────────────────────────────

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
      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center mb-6 shadow-md">
        <User className="h-10 w-10 text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Tournament</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-8">
        Players are scoped to a tournament. Pick one to view and manage its player pool.
      </p>
      <div className="flex gap-3 w-full max-w-sm">
        <div className="relative flex-1">
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">— Select tournament —</option>
            {q.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
        <button
          disabled={!selected}
          onClick={() => navigate(`/tournaments/${selected}/players`)}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
        >
          Go
        </button>
      </div>
    </motion.div>
  );
}

// ── Player form body ───────────────────────────────────────────────────────────

function PlayerFormBody({ form, onChange }: { form: PlayerForm; onChange: (f: PlayerForm) => void }) {
  const f = (key: keyof PlayerForm, val: string | boolean) => onChange({ ...form, [key]: val });
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1">Player Name *</label>
        <input type="text" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="e.g. Rohit Sharma" value={form.name} onChange={(e) => f("name", e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={form.role} onChange={(e) => f("role", e.target.value)}>
          {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Base Points</label>
        <input type="number" min={1} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={form.base_price} onChange={(e) => f("base_price", e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Batting Style</label>
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={form.batting_style} onChange={(e) => f("batting_style", e.target.value)}>
          {ALL_BATTING.map((b) => <option key={b} value={b}>{BATTING_LABEL[b]}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Bowling Style</label>
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={form.bowling_style} onChange={(e) => f("bowling_style", e.target.value)}>
          {ALL_BOWLING.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Jersey No.</label>
        <input type="number" min={1} max={999} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="e.g. 18" value={form.jersey_number} onChange={(e) => f("jersey_number", e.target.value)} />
      </div>

      <div className="col-span-2 flex items-center gap-3">
        <input
          type="checkbox"
          id="auction_eligible"
          checked={form.auction_eligible}
          onChange={(e) => f("auction_eligible", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
        />
        <label htmlFor="auction_eligible" className="text-sm font-medium text-slate-700">
          Eligible for auction
        </label>
      </div>
    </div>
  );
}

// ── Stats modal ────────────────────────────────────────────────────────────────

function StatsModal({
  player,
  tournamentId,
  onClose,
}: {
  player: Player | null;
  tournamentId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [addForm, setAddForm] = useState<StatsForm>(EMPTY_STATS_FORM);
  const [adding, setAdding] = useState(false);

  const statsQuery = useQuery<PlayerStat[]>({
    queryKey: ["player-stats", player?.id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: { items: PlayerStat[] } }>(
        `/tournaments/${tournamentId}/players/${player!.id}/stats`
      );
      return res.data.data.items;
    },
    enabled: !!player,
    staleTime: 0,
  });

  const createStat = useMutation({
    mutationFn: async (form: StatsForm) => {
      await apiClient.post(
        `/tournaments/${tournamentId}/players/${player!.id}/stats`,
        {
          season: form.season.trim() || null,
          matches: parseInt(form.matches, 10) || 0,
          runs: parseInt(form.runs, 10) || 0,
          highest_score: parseInt(form.highest_score, 10) || 0,
          average: parseFloat(form.average) || 0,
          strike_rate: parseFloat(form.strike_rate) || 0,
          fifties: parseInt(form.fifties, 10) || 0,
          hundreds: parseInt(form.hundreds, 10) || 0,
          wickets: parseInt(form.wickets, 10) || 0,
          economy: parseFloat(form.economy) || 0,
          best_bowling: form.best_bowling.trim() || null,
          catches: parseInt(form.catches, 10) || 0,
          run_outs: parseInt(form.run_outs, 10) || 0,
        }
      );
    },
    onSuccess: () => {
      toast.success("Statistics added.");
      qc.invalidateQueries({ queryKey: ["player-stats", player?.id] });
      setAddForm(EMPTY_STATS_FORM);
      setAdding(false);
    },
    onError: () => toast.error("Could not add statistics."),
  });

  const deleteStat = useMutation({
    mutationFn: async (statId: string) => {
      await apiClient.delete(
        `/tournaments/${tournamentId}/players/${player!.id}/stats/${statId}`
      );
    },
    onSuccess: () => {
      toast.success("Statistics deleted.");
      qc.invalidateQueries({ queryKey: ["player-stats", player?.id] });
    },
    onError: () => toast.error("Could not delete statistics."),
  });

  const sf = (key: keyof StatsForm, val: string) => setAddForm((f) => ({ ...f, [key]: val }));

  return (
    <Modal
      isOpen={!!player}
      onClose={onClose}
      title={`Statistics — ${player?.name ?? ""}`}
      size="lg"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-6">
        {/* Existing stats */}
        {statsQuery.isLoading ? (
          <div className="py-6 text-center text-sm text-slate-500">Loading statistics…</div>
        ) : (statsQuery.data ?? []).length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500">No previous statistics recorded.</div>
        ) : (
          <div className="space-y-3">
            {statsQuery.data?.map((stat) => (
              <div key={stat.id} className="rounded-xl border border-slate-100 p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{stat.season ?? "Unknown season"}</p>
                  <div className="mt-1 grid grid-cols-4 gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>Matches: <strong>{stat.matches}</strong></span>
                    <span>Runs: <strong>{stat.runs}</strong></span>
                    <span>HS: <strong>{stat.highest_score}</strong></span>
                    <span>Avg: <strong>{stat.average}</strong></span>
                    <span>SR: <strong>{stat.strike_rate}</strong></span>
                    <span>6s: <strong>{stat.sixes ?? 0}</strong></span>
                    <span>4s: <strong>{stat.fours ?? 0}</strong></span>
                    <span>50s: <strong>{stat.fifties ?? 0}</strong></span>
                    <span>100s: <strong>{stat.hundreds ?? 0}</strong></span>
                    <span>Wkts: <strong>{stat.wickets}</strong></span>
                    <span>Eco: <strong>{stat.economy}</strong></span>
                    {stat.best_bowling && <span>BB: <strong>{stat.best_bowling}</strong></span>}
                    <span>Catches: <strong>{stat.catches ?? 0}</strong></span>
                    <span>RO: <strong>{stat.run_outs ?? 0}</strong></span>
                  </div>
                </div>
                <button
                  onClick={() => { if (confirm("Delete this stat record?")) deleteStat.mutate(stat.id); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add stats */}
        {adding ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700">Add Tournament Statistics</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Season</label>
                <input type="text" className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="e.g.  2024" value={addForm.season} onChange={(e) => sf("season", e.target.value)} />
              </div>
              {(["matches", "runs", "highest_score", "fifties", "hundreds", "wickets", "catches", "run_outs"] as const).map((key) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1 capitalize">{key.replace(/_/g, " ")}</label>
                  <input type="number" min={0} className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={addForm[key]} onChange={(e) => sf(key, e.target.value)} />
                </div>
              ))}
              {(["average", "strike_rate", "economy"] as const).map((key) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1 capitalize">{key.replace("_", " ")}</label>
                  <input type="number" min={0} step={0.01} className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={addForm[key]} onChange={(e) => sf(key, e.target.value)} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Best Bowling</label>
                <input type="text" className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="e.g. 5/23" value={addForm.best_bowling} onChange={(e) => sf("best_bowling", e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAdding(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={createStat.isPending}
                onClick={() => createStat.mutate(addForm)}
                className="flex-1 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 py-2 text-sm font-semibold text-white transition-colors"
              >
                {createStat.isPending ? "Saving…" : "Save Stats"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full rounded-xl border border-dashed border-slate-200 hover:border-orange-300 hover:bg-orange-50 py-3 text-sm font-medium text-slate-500 hover:text-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Tournament Statistics
          </button>
        )}
      </div>
    </Modal>
  );
}

// ── Assign to Team Modal ───────────────────────────────────────────────────────

interface AssignableTeam {
  id: string;
  name: string;
  budget_remaining: number;
  budget_spent: number;
  budget: number;
}

function AssignToTeamModal({
  player,
  tournamentId,
  onClose,
  onSuccess,
}: {
  player: Player;
  tournamentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [teamId, setTeamId] = useState("");
  const [price, setPrice] = useState(String(player.base_price));

  const teamsQ = useQuery<AssignableTeam[]>({
    queryKey: ["assign-teams", tournamentId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: AssignableTeam[] } }>(
        `/tournaments/${tournamentId}/teams?page_size=100`
      );
      return data.data.items;
    },
    staleTime: 30_000,
  });

  const teams = teamsQ.data ?? [];
  const selectedTeam = teams.find((t) => t.id === teamId);
  const priceNum = parseInt(price, 10) || 0;
  const budgetOk = !selectedTeam || priceNum <= selectedTeam.budget_remaining;

  const assignMut = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/tournaments/${tournamentId}/players/${player.id}/assign`, {
        team_id: teamId,
        price: priceNum,
      });
    },
    onSuccess: () => {
      toast.success(`${player.name} assigned to ${selectedTeam?.name ?? "team"}.`);
      onSuccess();
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Could not assign player."),
  });

  const inp = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40";

  return (
    <Modal isOpen onClose={onClose} title={`Assign ${player.name} to Team`} size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Team</label>
          {teamsQ.isLoading ? (
            <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
          ) : (
            <select className={inp} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">— Choose a team —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.budget_remaining} pts remaining)
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Assign Price (pts)
          </label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inp}
            placeholder={String(player.base_price)}
          />
          <p className="text-xs text-slate-400 mt-1">Base price: {player.base_price} pts</p>
          {selectedTeam && !budgetOk && (
            <p className="text-xs text-red-500 mt-1">
              Exceeds team budget ({selectedTeam.budget_remaining} pts remaining)
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            disabled={!teamId || !budgetOk || assignMut.isPending}
            onClick={() => assignMut.mutate()}
            className="flex-1 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {assignMut.isPending ? "Assigning…" : "Assign Player"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Player card ────────────────────────────────────────────────────────────────

interface PlayerCardProps {
  player: Player;
  index: number;
  isAdmin?: boolean;
  onEdit: (p: Player) => void;
  onDelete: (p: Player) => void;
  onPhoto: (p: Player) => void;
  onStats: (p: Player) => void;
  onAssign: (p: Player) => void;
}

function PlayerCard({ player, index, isAdmin = true, onEdit, onDelete, onPhoto, onStats, onAssign }: PlayerCardProps) {
  const gradient = pickGradient(player.name);
  const initials = getInitials(player.name);
  const isSold = player.status === "SOLD" || player.status === "RETAINED";

  const statQ = useQuery<PlayerStat | null>({
    queryKey: ["player-card-stat", player.id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tournaments/${player.tournament_id}/players/${player.id}/stats`);
      const items = data?.data?.items ?? data?.data ?? [];
      return Array.isArray(items) && items.length > 0 ? items[0] : null;
    },
    staleTime: 120_000,
  });
  const cardStat = statQ.data ?? null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.3), ease: "easeOut" }}
      className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-2xl hover:border-amber-200/50 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      <div className={cn("relative h-24 w-full bg-gradient-to-br flex-shrink-0", gradient)}>
        {/* Radial shine */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(255,255,255,0.22)_0%,transparent_65%)]" />

        {/* SOLD / RETAINED ribbon */}
        {isSold && player.sold_to_team_name && (
          <div className={cn(
            "absolute top-2.5 -right-7 rotate-45 z-10 px-8 py-0.5 text-[9px] font-black tracking-widest text-white shadow-sm",
            player.status === "RETAINED" ? "bg-violet-600" : "bg-amber-500",
          )}>
            {player.status === "RETAINED" ? "RETAINED" : "SOLD"}
          </div>
        )}

        {/* Jersey number top-left */}
        {player.jersey_number != null && (
          <div className="absolute top-2.5 left-3 h-6 w-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <span className="text-[10px] font-black text-white leading-none">{player.jersey_number}</span>
          </div>
        )}
      </div>

      {/* ── Photo medallion (overlaps banner + body) ─────────────────────────── */}
      <div className="relative flex justify-center" style={{ marginTop: -52 }}>
        <div
          className={cn(
            "relative h-28 w-28 rounded-full flex items-center justify-center",
            "bg-gradient-to-br border-4 border-white overflow-hidden",
            isAdmin && "cursor-pointer transition-transform duration-200 hover:scale-105",
            gradient,
          )}
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.12)" }}
          onClick={() => isAdmin && onPhoto(player)}
          title={isAdmin ? "Click to upload photo" : undefined}
        >
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="text-3xl font-black text-white select-none tracking-wide">{initials}</span>
          )}
        </div>
      </div>

      {/* ── Card body ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1 gap-3">

        {/* Name */}
        <div className="text-center">
          <h3 className="text-lg font-extrabold text-slate-900 leading-snug line-clamp-1 tracking-tight">{player.name}</h3>
        </div>

        {/* Role + Status */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <RolePill role={player.role} />
          <StatusPill status={player.status} />
        </div>

        {/* Base / sold price */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-1">
            <Coins className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] text-slate-500 font-medium">Base:</span>
            <span className="text-sm font-extrabold text-amber-600">{formatPoints(player.base_price)}</span>
          </div>
          {isSold && player.sold_price && (
            <>
              <span className="text-slate-200 font-light">|</span>
              <div className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                <span className="text-sm font-extrabold text-violet-600">{formatPoints(player.sold_price)}</span>
              </div>
            </>
          )}
        </div>

        {/* Sold to team */}
        {isSold && player.sold_to_team_name && (
          <div className={cn(
            "flex items-center gap-1.5 rounded-xl px-3 py-2 justify-center",
            player.status === "RETAINED" ? "bg-violet-50 border border-violet-100" : "bg-amber-50 border border-amber-100",
          )}>
            <Trophy className={cn("h-3.5 w-3.5 shrink-0", player.status === "RETAINED" ? "text-violet-500" : "text-amber-500")} />
            <span className={cn("text-xs font-semibold truncate", player.status === "RETAINED" ? "text-violet-700" : "text-amber-700")}>
              {player.sold_to_team_name}
            </span>
          </div>
        )}

        {/* Stats board */}
        {cardStat ? (
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 grid grid-cols-3 gap-x-3 gap-y-2.5">
            {[
              { label: "M",    value: String(cardStat.matches) },
              { label: "RUNS", value: String(cardStat.runs) },
              { label: "SR",   value: cardStat.strike_rate > 0 ? cardStat.strike_rate.toFixed(1) : "—" },
              { label: "HS",   value: String(cardStat.highest_score) },
              { label: "WKTS", value: String(cardStat.wickets) },
              { label: "ECO",  value: cardStat.economy > 0 ? cardStat.economy.toFixed(1) : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-sm font-extrabold text-slate-800 leading-none">{value}</p>
              </div>
            ))}
          </div>
        ) : statQ.isLoading ? (
          <div className="h-[72px] rounded-xl bg-slate-100 animate-pulse" />
        ) : (
          <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 py-3 flex items-center justify-center">
            <p className="text-[10px] text-slate-400 italic">No previous statistics</p>
          </div>
        )}

        {/* Action row */}
        <div className="mt-auto pt-2 flex gap-1.5 border-t border-slate-100">
          <Link
            to={`/players/${player.id}`}
            title="View profile"
            className="flex-1 flex items-center justify-center rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 py-2 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
          {isAdmin && (
            <button onClick={() => onPhoto(player)} title="Upload photo" className="flex-1 flex items-center justify-center rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 py-2 transition-colors">
              <CameraIcon className="h-3.5 w-3.5" />
            </button>
          )}
          {isAdmin && (
            <button onClick={() => onEdit(player)} title="Edit player" className="flex-1 flex items-center justify-center rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 py-2 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {isAdmin && player.status !== "SOLD" && (
            <button onClick={() => onAssign(player)} title="Assign to team" className="flex-1 flex items-center justify-center rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-orange-500 py-2 transition-colors">
              <UserPlus className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => onStats(player)} title="Statistics" className="flex-1 flex items-center justify-center rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-purple-600 py-2 transition-colors">
            <BarChart2 className="h-3.5 w-3.5" />
          </button>
          {isAdmin && (
            <button onClick={() => onDelete(player)} title="Delete player" className="flex-1 flex items-center justify-center rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 text-red-500 py-2 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function PlayerCardSkeleton({ i }: { i: number }) {
  return (
    <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-24 bg-slate-200" />
      <div className="flex justify-center" style={{ marginTop: -52 }}>
        <div className="h-28 w-28 rounded-full bg-slate-300 border-4 border-white" />
      </div>
      <div className="px-4 pt-3 pb-4 space-y-3 flex flex-col items-center">
        <div className="h-5 w-2/3 rounded bg-slate-200" />
        <div className="flex gap-1.5">
          <div className="h-5 w-16 rounded-full bg-slate-100" />
          <div className="h-5 w-16 rounded-full bg-slate-100" />
        </div>
        <div className="h-4 w-1/2 rounded bg-slate-100" />
        <div className="w-full h-[72px] rounded-xl bg-slate-100" />
        <div className="w-full h-9 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

// ── PillFilter ─────────────────────────────────────────────────────────────────

interface PillFilterProps<T extends string> {
  label: string;
  options: T[];
  value: T | "";
  onChange: (val: T | "") => void;
  formatLabel?: (val: T) => string;
}

function PillFilter<T extends string>({ label, options, value, onChange, formatLabel }: PillFilterProps<T>) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide pr-1 shrink-0">{label}:</span>
      <button type="button" onClick={() => onChange("")} className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-colors", value === "" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}>All</button>
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(value === opt ? "" : opt)} className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-colors", value === opt ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-700")}>
          {formatLabel ? formatLabel(opt) : opt}
        </button>
      ))}
    </div>
  );
}

// ── Page (uses active tournament context) ─────────────────────────────────────

export function PlayerListPage() {
  const { tournamentId, loading } = useTournament();
  if (loading) return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    </div>
  );
  if (!tournamentId) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-slate-500 text-sm">No active tournament — configure one in Settings.</p>
    </div>
  );
  return <PlayerListInner tournamentId={tournamentId} />;
}

export function PlayerListInner({ tournamentId }: { tournamentId: string }) {
  const qc = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const { isAdmin, isCaptain } = usePermissions();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<PlayerRole | "">("");
  const [statusFilter, setStatusFilter] = useState<PlayerStatus | "">("");
  const [battingFilter, setBattingFilter] = useState<BattingStyle | "">("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Close popover when clicking outside
  useEffect(() => {
    if (!filtersOpen) return;
    const handler = (e: MouseEvent) => {
      if (!filterContainerRef.current?.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filtersOpen]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PlayerForm>(EMPTY_PLAYER_FORM);
  const [editTarget, setEditTarget] = useState<Player | null>(null);
  const [editForm, setEditForm] = useState<PlayerForm>(EMPTY_PLAYER_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [statsPlayer, setStatsPlayer] = useState<Player | null>(null);
  const [photoPlayerId, setPhotoPlayerId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<Player | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────
  // Captains see only auction-eligible players; admins see all
  const playersQuery = useQuery<PlayerPage>({
    queryKey: ["players", tournamentId, isCaptain ? "eligible" : "all"],
    queryFn: () => fetchPlayers(tournamentId, isCaptain),
    staleTime: 30_000,
  });

  const players = playersQuery.data?.items ?? [];
  const rawTotal = playersQuery.data?.total ?? 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (roleFilter && p.role !== roleFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (battingFilter && p.batting_style !== battingFilter) return false;
      return true;
    });
  }, [players, search, roleFilter, statusFilter, battingFilter]);

  const total = filtered.length;
  const hasFilters = !!(search || roleFilter || statusFilter || battingFilter);

  const clearFilters = useCallback(() => {
    setSearch(""); setRoleFilter(""); setStatusFilter(""); setBattingFilter("");
  }, []);

  const invalidatePlayers = () => {
    qc.invalidateQueries({ queryKey: ["players", tournamentId] });
    qc.invalidateQueries({ queryKey: ["auction", tournamentId] });
  };

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const createPlayer = useMutation({
    mutationFn: async (form: PlayerForm) => {
      await apiClient.post(`/tournaments/${tournamentId}/players`, {
        name: form.name.trim(),
        role: form.role,
        batting_style: form.batting_style || null,
        bowling_style: form.bowling_style || null,
        jersey_number: parseInt(form.jersey_number, 10) || null,
        base_price: parseInt(form.base_price, 10) || 50,
        auction_eligible: form.auction_eligible,
      });
    },
    onSuccess: () => {
      toast.success("Player added.");
      invalidatePlayers();
      setCreateOpen(false);
      setCreateForm(EMPTY_PLAYER_FORM);
    },
    onError: (err: Error) => toast.error(err.message || "Could not create player."),
  });

  const updatePlayer = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: PlayerForm }) => {
      await apiClient.put(`/tournaments/${tournamentId}/players/${id}`, {
        name: form.name.trim(),
        role: form.role,
        batting_style: form.batting_style || null,
        bowling_style: form.bowling_style || null,
        jersey_number: parseInt(form.jersey_number, 10) || null,
        base_price: parseInt(form.base_price, 10) || 50,
        auction_eligible: form.auction_eligible,
      });
    },
    onSuccess: () => {
      toast.success("Player updated.");
      invalidatePlayers();
      setEditTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || "Could not update player."),
  });

  const deletePlayer = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/tournaments/${tournamentId}/players/${id}`);
    },
    onSuccess: () => {
      toast.success("Player deleted.");
      invalidatePlayers();
      setDeleteTarget(null);
    },
    onError: () => toast.error("Could not delete player."),
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({ playerId, file }: { playerId: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      await apiClient.post(`/tournaments/${tournamentId}/players/${playerId}/photo`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("Photo uploaded.");
      invalidatePlayers();
      setPhotoPlayerId(null);
    },
    onError: () => toast.error("Photo upload failed."),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────────
  function handleEditOpen(p: Player) {
    setEditTarget(p);
    setEditForm({
      name: p.name,
      role: p.role,
      batting_style: p.batting_style ?? "RIGHT_HAND",
      bowling_style: p.bowling_style ?? "N/A",
      jersey_number: p.jersey_number?.toString() ?? "",
      base_price: p.base_price.toString(),
      auction_eligible: p.auction_eligible,
    });
  }

  function handlePhotoClick(p: Player) {
    setPhotoPlayerId(p.id);
    photoInputRef.current?.click();
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && photoPlayerId) uploadPhoto.mutate({ playerId: photoPlayerId, file });
    e.target.value = "";
  }

  // ── Breadcrumb ────────────────────────────────────────────────────────────────
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Players" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 space-y-6"
    >
      {/* Hidden photo file input */}
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Players</h1>
          {!playersQuery.isLoading && (
            <p className="text-sm text-slate-500 mt-0.5">
              {total} player{total !== 1 ? "s" : ""}{hasFilters ? " matching filters" : ` in pool (${rawTotal} total)`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search players..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-colors"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter toggle — floating popover */}
          <div ref={filterContainerRef} className="relative">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors shadow-sm",
                filtersOpen ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-slate-200 text-slate-600",
              )}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-orange-500 ml-0.5" />}
            </button>

            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white rounded-2xl border border-slate-100 shadow-xl px-5 py-4 space-y-3"
                  style={{ minWidth: "340px", maxWidth: "min(480px, calc(100vw - 32px))" }}
                >
                  <PillFilter<PlayerRole>
                    label="Role"
                    options={ALL_ROLES}
                    value={roleFilter}
                    onChange={(v) => { setRoleFilter(v); }}
                    formatLabel={(r) => ROLE_CONFIG[r]?.label ?? r}
                  />
                  <PillFilter<PlayerStatus>
                    label="Status"
                    options={ALL_STATUSES}
                    value={statusFilter}
                    onChange={(v) => { setStatusFilter(v); }}
                    formatLabel={(s) => STATUS_PILL[s]?.label ?? s}
                  />
                  <PillFilter<BattingStyle>
                    label="Batting"
                    options={ALL_BATTING}
                    value={battingFilter}
                    onChange={(v) => { setBattingFilter(v); }}
                    formatLabel={(b) => BATTING_LABEL[b]}
                  />
                  {hasFilters && (
                    <div className="pt-1 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => { clearFilters(); setFiltersOpen(false); }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear all filters
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add player */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => { setCreateForm(EMPTY_PLAYER_FORM); setCreateOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Player
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {playersQuery.isError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Failed to load players</h3>
          <p className="text-sm text-slate-500 mb-6">Something went wrong. Please try again.</p>
          <button type="button" onClick={() => playersQuery.refetch()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2 transition-colors">
            Retry
          </button>
        </div>
      ) : playersQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => <PlayerCardSkeleton key={i} i={i} />)}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <div key="empty" className="col-span-full flex flex-col items-center justify-center py-24 px-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-6 shadow-md">
                <User className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {hasFilters ? "No players match your filters" : "No players in the pool yet"}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mb-8">
                {hasFilters ? "Try adjusting your search or clearing the active filters." : "Add players to the pool so they can be auctioned."}
              </p>
              {hasFilters ? (
                <button type="button" onClick={clearFilters} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-white transition-all">
                  <X className="h-4 w-4" />Clear Filters
                </button>
              ) : isAdmin ? (
                <button type="button" onClick={() => { setCreateForm(EMPTY_PLAYER_FORM); setCreateOpen(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-sm transition-colors">
                  <Plus className="h-4 w-4" />Add Player
                </button>
              ) : null}
            </div>
          ) : (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((player, idx) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  index={idx}
                  isAdmin={isAdmin}
                  onEdit={handleEditOpen}
                  onDelete={(p) => setDeleteTarget(p)}
                  onPhoto={handlePhotoClick}
                  onStats={(p) => setStatsPlayer(p)}
                  onAssign={(p) => setAssignTarget(p)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── Create Player Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Player"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <button
              disabled={!createForm.name.trim() || createPlayer.isPending}
              onClick={() => createPlayer.mutate(createForm)}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              {createPlayer.isPending ? "Adding…" : "Add Player"}
            </button>
          </>
        }
      >
        <PlayerFormBody form={createForm} onChange={setCreateForm} />
      </Modal>

      {/* ── Edit Player Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit — ${editTarget?.name ?? "Player"}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <button
              disabled={!editForm.name.trim() || updatePlayer.isPending}
              onClick={() => updatePlayer.mutate({ id: editTarget!.id, form: editForm })}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              {updatePlayer.isPending ? "Saving…" : "Save Changes"}
            </button>
          </>
        }
      >
        <PlayerFormBody form={editForm} onChange={setEditForm} />
      </Modal>

      {/* ── Delete Confirm ─────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deletePlayer.mutate(deleteTarget!.id)}
        title={`Delete "${deleteTarget?.name ?? "player"}"?`}
        description="This will permanently remove the player and all their statistics."
        confirmLabel="Delete Player"
        loading={deletePlayer.isPending}
        variant="danger"
      />

      {/* ── Stats Modal ────────────────────────────────────────────────────────── */}
      <StatsModal
        player={statsPlayer}
        tournamentId={tournamentId}
        onClose={() => setStatsPlayer(null)}
      />

      {/* ── Assign to Team Modal ───────────────────────────────────────────────── */}
      {assignTarget && (
        <AssignToTeamModal
          player={assignTarget}
          tournamentId={tournamentId}
          onClose={() => setAssignTarget(null)}
          onSuccess={invalidatePlayers}
        />
      )}
    </motion.div>
  );
}

export default PlayerListPage;
