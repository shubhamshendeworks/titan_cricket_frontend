/**
 * PlayerDetailPage — Premium -inspired player profile.
 * Route: /players/:playerId
 */

import { useParams, Link, Navigate } from "react-router-dom";
import { useTournament } from "@/contexts/TournamentContext";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, XCircle, Gavel, Trophy, Shield } from "lucide-react";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Player {
  id: string;
  tournament_id: string;
  name: string;
  photo_url?: string | null;
  role: string;
  batting_style?: string | null;
  bowling_style?: string | null;
  jersey_number?: number | null;
  base_price: number;
  status: string;
  auction_eligible: boolean;
  sold_to_team_id?: string | null;
  sold_to_team_name?: string | null;
  sold_price?: number | null;
}

interface PlayerStat {
  id: string;
  tournament_id?: string | null;
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
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  BATSMAN:       { label: "Batsman",       color: "text-blue-100",    bg: "bg-blue-600",    border: "border-blue-400" },
  BOWLER:        { label: "Bowler",        color: "text-red-100",     bg: "bg-red-600",     border: "border-red-400" },
  ALL_ROUNDER:   { label: "All-Rounder",   color: "text-purple-100",  bg: "bg-purple-600",  border: "border-purple-400" },
  WICKET_KEEPER: { label: "Wicket Keeper", color: "text-emerald-100", bg: "bg-emerald-600", border: "border-emerald-400" },
};

const BATTING_LABEL: Record<string, string> = {
  RIGHT_HAND: "Right Hand Bat",
  LEFT_HAND:  "Left Hand Bat",
};

const BOWLING_LABEL: Record<string, string> = {
  "N/A":              "N/A",
  RIGHT_ARM_FAST:     "Right Arm Fast",
  RIGHT_ARM_MEDIUM:   "Right Arm Medium",
  RIGHT_ARM_SPIN:     "Right Arm Spin",
  LEFT_ARM_FAST:      "Left Arm Fast",
  LEFT_ARM_MEDIUM:    "Left Arm Medium",
  LEFT_ARM_SPIN:      "Left Arm Spin",
};

function fmtPrice(n: number) {
  return `${n} Pts`;
}

function getInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// ── Stat Tile ──────────────────────────────────────────────────────────────────

function StatTile({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-xl p-3 text-center",
      highlight ? "bg-amber-50 border border-amber-200" : "bg-slate-50 border border-slate-100"
    )}>
      <span className={cn("text-xl font-extrabold tabular-nums", highlight ? "text-amber-700" : "text-slate-900")}>
        {value}
      </span>
      <span className="text-xs text-slate-500 mt-0.5 font-medium">{label}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">{children}</p>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function PlayerDetailPage() {
  const { playerId } = useParams<{ playerId: string }>();
  const { tournamentId } = useTournament();

  const playerQ = useQuery<Player>({
    queryKey: ["player", tournamentId, playerId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Player }>(
        `/tournaments/${tournamentId}/players/${playerId}`
      );
      return data.data;
    },
    enabled: !!tournamentId && !!playerId,
  });

  const statsQ = useQuery<PlayerStat[]>({
    queryKey: ["player-stats", playerId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: PlayerStat[] } }>(
        `/tournaments/${tournamentId}/players/${playerId}/stats`
      );
      return data.data.items;
    },
    enabled: !!tournamentId && !!playerId,
  });

  if (!tournamentId) return <Navigate to="/players" replace />;
  if (!playerId) return null;

  const p = playerQ.data;
  const stats = statsQ.data ?? [];
  const role = p ? (ROLE_CONFIG[p.role] ?? ROLE_CONFIG.BATSMAN) : null;

  if (playerQ.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-navy-900/20 border-t-navy-900 animate-spin" />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500 text-lg">Player not found.</p>
        <Link to="/players" className="text-sm text-blue-600 hover:underline">← Back to players</Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-50"
    >
      {/* ── Hero ── */}
      <div className="relative bg-navy-900 overflow-hidden">
        {/* Background photo blur */}
        {p.photo_url && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15 scale-110 blur-sm"
            style={{ backgroundImage: `url(${p.photo_url})` }}
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/80 via-navy-900/60 to-navy-900" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
          {/* Back link */}
          <Link
            to="/players"
            className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Players
          </Link>

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Photo */}
            <div className="relative flex-shrink-0">
              <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl bg-gradient-to-br from-slate-700 to-slate-900">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-5xl font-extrabold text-white/80">{getInitials(p.name)}</span>
                  </div>
                )}
              </div>
              {p.jersey_number != null && (
                <div className="absolute -bottom-3 -right-3 h-9 w-9 rounded-full bg-amber-400 border-2 border-navy-900 flex items-center justify-center shadow-lg">
                  <span className="text-xs font-extrabold text-navy-900">{p.jersey_number}</span>
                </div>
              )}
            </div>

            {/* Name + role */}
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">
                {p.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
                {role && (
                  <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", role.bg, role.color, role.border)}>
                    {role.label}
                  </span>
                )}
                {p.status === "SOLD" ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white border border-amber-400">
                    SOLD
                  </span>
                ) : p.status === "UNSOLD" ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white border border-red-400">
                    UNSOLD
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white border border-emerald-400">
                    AVAILABLE
                  </span>
                )}
                {p.auction_eligible ? (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80 border border-white/20">
                    <CheckCircle className="h-3 w-3" /> Auction Eligible
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/50 border border-white/10">
                    <XCircle className="h-3 w-3" /> Not Eligible
                  </span>
                )}
              </div>

              {/* Playing styles */}
              <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start text-white/60 text-sm">
                {p.batting_style && (
                  <span>{BATTING_LABEL[p.batting_style] ?? p.batting_style}</span>
                )}
                {p.batting_style && p.bowling_style && <span className="opacity-40">·</span>}
                {p.bowling_style && p.bowling_style !== "N/A" && (
                  <span>{BOWLING_LABEL[p.bowling_style] ?? p.bowling_style}</span>
                )}
              </div>
            </div>

            {/* Base price + sold info */}
            <div className="sm:ml-auto text-center sm:text-right space-y-2 flex-shrink-0">
              <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3">
                <p className="text-xs text-white/50 font-medium uppercase tracking-wide">Base Points</p>
                <p className="text-3xl font-extrabold text-amber-400 tabular-nums mt-0.5">
                  {p.base_price}
                </p>
              </div>
              {p.sold_to_team_name && (
                <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl px-5 py-3">
                  <p className="text-xs text-amber-300/70 font-medium uppercase tracking-wide">Sold To</p>
                  <p className="text-base font-bold text-amber-300 mt-0.5">{p.sold_to_team_name}</p>
                  {p.sold_price != null && (
                    <p className="text-xs text-amber-400/80 mt-0.5 font-semibold">{p.sold_price} pts</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {statsQ.isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : stats.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <Shield className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No previous tournament statistics</p>
            <p className="text-xs text-slate-400 mt-1">Stats will appear here once uploaded for a completed season.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map((stat, idx) => (
              <div key={stat.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Section header */}
                <div className="flex items-center justify-between px-6 py-4 bg-navy-900">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-bold text-white">
                      {stat.season
                        ? `${stat.season} — Performance`
                        : idx === 0
                        ? "Most Recent Season"
                        : `Season ${stats.length - idx}`}
                    </span>
                  </div>
                  <span className="text-xs text-white/40">Historical · Read Only</span>
                </div>

                <div className="p-6 space-y-6">
                  {/* Batting */}
                  <div>
                    <SectionLabel>Batting</SectionLabel>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                      <StatTile label="Matches" value={stat.matches} />
                      <StatTile label="Runs" value={stat.runs} highlight />
                      <StatTile label="Highest" value={stat.highest_score} />
                      <StatTile label="Average" value={stat.average.toFixed(1)} />
                      <StatTile label="Strike Rate" value={stat.strike_rate.toFixed(1)} />
                      <StatTile label="50s" value={stat.fifties} />
                      <StatTile label="100s" value={stat.hundreds} highlight />
                      <StatTile label="Sixes" value={stat.sixes ?? 0} />
                      <StatTile label="Fours" value={stat.fours ?? 0} />
                    </div>
                  </div>

                  {/* Bowling */}
                  <div>
                    <SectionLabel>Bowling</SectionLabel>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      <StatTile label="Wickets" value={stat.wickets} highlight />
                      <StatTile label="Economy" value={stat.economy.toFixed(1)} />
                      <StatTile label="Best" value={stat.best_bowling ?? "—"} />
                    </div>
                  </div>

                  {/* Fielding */}
                  <div>
                    <SectionLabel>Fielding</SectionLabel>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      <StatTile label="Catches" value={stat.catches} />
                      <StatTile label="Run Outs" value={stat.run_outs} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Auction card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gavel className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Auction Details</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500">Base Points</p>
              <p className="text-lg font-bold text-amber-600 mt-0.5">{p.base_price}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <p className={cn(
                "text-lg font-bold mt-0.5",
                p.status === "SOLD" ? "text-amber-600" :
                p.status === "UNSOLD" ? "text-red-600" : "text-emerald-600"
              )}>{p.status}</p>
            </div>
            {p.sold_price != null && (
              <div>
                <p className="text-xs text-slate-500">Winning Points</p>
                <p className="text-lg font-bold text-amber-600 mt-0.5">{p.sold_price}</p>
              </div>
            )}
          </div>
          {p.sold_to_team_name && (
            <div className="mt-4 pt-4 border-t border-slate-50">
              <p className="text-xs text-slate-500">Current Team</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{p.sold_to_team_name}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default PlayerDetailPage;
