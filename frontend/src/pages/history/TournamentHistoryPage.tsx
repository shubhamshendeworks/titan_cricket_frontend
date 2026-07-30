/**
 * TournamentHistoryPage — Complete history of all tournaments with champion showcase.
 * Route: /history
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Trophy,
  Medal,
  Calendar,
  Users,
  Shirt,
  Gavel,
  ChevronDown,
  ChevronUp,
  Crown,
  Shield,
  CalendarDays,
} from "lucide-react";

import { apiClient } from "@/lib/api";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Tournament {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  completed_at: string | null;
  winner_team_id: string | null;
  winner_team_name: string | null;
  runner_up_team_id: string | null;
  runner_up_team_name: string | null;
  max_teams: number | null;
  created_at: string;
}

interface TournamentDetail extends Tournament {
  total_players?: number;
  total_matches?: number;
}

interface TTeam {
  id: string;
  name: string;
  display_name: string | null;
  logo_url: string | null;
}

type TeamsByTournament = Record<string, Record<string, TTeam>>;

function resolveName(
  tbtMap: TeamsByTournament,
  tournamentId: string,
  teamId: string | null,
  fallback: string | null,
): string {
  if (!teamId && !fallback) return "—";
  const team = teamId ? tbtMap[tournamentId]?.[teamId] : undefined;
  if (team) return team.display_name || team.name;
  return fallback ?? "—";
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getYear(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).getFullYear().toString();
}

// ── Champion Card ──────────────────────────────────────────────────────────────

function ChampionCard({ t, rank, tbt }: { t: Tournament; rank: number; tbt: TeamsByTournament }) {
  const isChampion = rank === 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.08, ease: "easeOut" }}
      className={cn(
        "relative rounded-2xl overflow-hidden border",
        isChampion
          ? "border-amber-300 shadow-lg shadow-amber-100"
          : "border-slate-200 shadow-sm",
      )}
    >
      {/* Header gradient */}
      <div
        className={cn(
          "px-5 pt-5 pb-10",
          isChampion
            ? "bg-gradient-to-br from-amber-500 to-orange-600"
            : "bg-gradient-to-br from-slate-700 to-slate-900",
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {isChampion ? (
              <Crown className="h-5 w-5 text-amber-200" />
            ) : (
              <Trophy className="h-4 w-4 text-slate-400" />
            )}
            <span className={cn(
              "text-xs font-bold uppercase tracking-wider",
              isChampion ? "text-amber-100" : "text-slate-400",
            )}>
              {getYear(t.completed_at ?? t.created_at)} Season
            </span>
          </div>
          <span className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full",
            t.status === "COMPLETED"
              ? (isChampion ? "bg-amber-400/30 text-amber-100 border border-amber-300/40" : "bg-slate-600 text-slate-300")
              : "bg-blue-500/30 text-blue-200 border border-blue-400/30",
          )}>
            {t.status}
          </span>
        </div>
        <h3 className={cn(
          "font-extrabold text-lg leading-tight",
          isChampion ? "text-white" : "text-white",
        )}>
          {t.name}
        </h3>
      </div>

      {/* Winner info */}
      <div className="bg-white px-5 pt-4 pb-5 -mt-6 relative z-10 mx-3 rounded-xl border border-slate-100 shadow-sm">
        {t.winner_team_name ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Champion</p>
                <p className="text-sm font-extrabold text-slate-900 leading-tight">
                  {resolveName(tbt, t.id, t.winner_team_id, t.winner_team_name)}
                </p>
              </div>
            </div>
            {(t.runner_up_team_id || t.runner_up_team_name) && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Medal className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Runner-up</p>
                  <p className="text-sm font-bold text-slate-600 leading-tight">
                    {resolveName(tbt, t.id, t.runner_up_team_id, t.runner_up_team_name)}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 py-1">
            <Shield className="h-4 w-4 text-slate-300" />
            <p className="text-xs text-slate-400 italic">No winner recorded</p>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="px-5 py-3 flex items-center gap-4 text-xs text-slate-500">
        {t.completed_at && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {fmt(t.completed_at)}
          </span>
        )}
        {t.max_teams && (
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            {t.max_teams} teams
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── History Row ────────────────────────────────────────────────────────────────

function HistoryRow({ t, index, tbt }: { t: Tournament; index: number; tbt: TeamsByTournament }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        {/* Year badge */}
        <div className="h-10 w-10 rounded-xl bg-navy-900 flex items-center justify-center shrink-0">
          <span className="text-xs font-extrabold text-gold-bright leading-none">
            {getYear(t.completed_at ?? t.created_at)}
          </span>
        </div>

        {/* Tournament name */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm truncate">{t.name}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {(t.winner_team_id || t.winner_team_name)
              ? `🏆 ${resolveName(tbt, t.id, t.winner_team_id, t.winner_team_name)}${(t.runner_up_team_id || t.runner_up_team_name) ? ` · 🥈 ${resolveName(tbt, t.id, t.runner_up_team_id, t.runner_up_team_name)}` : ""}`
              : "No result recorded"}
          </p>
        </div>

        {/* Status + expand */}
        <div className="flex items-center gap-3 shrink-0">
          <span className={cn(
            "hidden sm:block text-[10px] font-bold px-2 py-0.5 rounded-full border",
            t.status === "COMPLETED"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-blue-50 text-blue-700 border-blue-200",
          )}>
            {t.status}
          </span>
          {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Champion</p>
                <p className="text-sm font-bold text-slate-900">
                  {resolveName(tbt, t.id, t.winner_team_id, t.winner_team_name)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Runner-up</p>
                <p className="text-sm font-bold text-slate-900">
                  {resolveName(tbt, t.id, t.runner_up_team_id, t.runner_up_team_name)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Completed</p>
                <p className="text-sm font-bold text-slate-900">{fmt(t.completed_at)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Max Teams</p>
                <p className="text-sm font-bold text-slate-900">{t.max_teams ?? "—"}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function TournamentHistoryPage() {
  const completedQ = useQuery<Tournament[]>({
    queryKey: ["tournaments-completed"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: Tournament[] } }>(
        "/tournaments?status=COMPLETED&page_size=100"
      );
      return (data.data.items ?? []).sort(
        (a, b) => new Date(b.completed_at ?? b.created_at).getTime() - new Date(a.completed_at ?? a.created_at).getTime()
      );
    },
    staleTime: 60_000,
  });

  const allQ = useQuery<Tournament[]>({
    queryKey: ["tournaments-all-history"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: Tournament[] } }>(
        "/tournaments?page_size=100"
      );
      return (data.data.items ?? []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    staleTime: 60_000,
  });

  const completed = completedQ.data ?? [];
  const allTournaments = allQ.data ?? [];
  const withWinners = completed.filter((t) => t.winner_team_id || t.winner_team_name);
  const withoutWinners = completed.filter((t) => !t.winner_team_id && !t.winner_team_name);
  const active = allTournaments.filter((t) => t.status !== "COMPLETED");

  // Fetch live teams for all completed tournaments so winner names are always current
  const historyTeamsQ = useQuery<TeamsByTournament>({
    queryKey: ["history-teams", completed.map((t) => t.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        completed.map(async (t) => {
          try {
            const { data } = await apiClient.get<{ data: { items: TTeam[] } }>(
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
    enabled: completed.length > 0,
    staleTime: 120_000,
  });

  const tbt: TeamsByTournament = historyTeamsQ.data ?? {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 space-y-8"
    >
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "History" }]} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tournament History</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {completed.length} completed season{completed.length !== 1 ? "s" : ""} on record
        </p>
      </div>

      {/* Champions Showcase */}
      {completedQ.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : withWinners.length > 0 ? (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-bold text-slate-800">Champions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {withWinners.map((t, i) => (
              <ChampionCard key={t.id} t={t} rank={i + 1} tbt={tbt} />
            ))}
          </div>
        </section>
      ) : completed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <CalendarDays className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No completed tournaments yet</p>
          <p className="text-xs text-slate-400 mt-1">Mark a tournament as COMPLETED to see it here.</p>
          <Link to="/tournament" className="mt-4 text-sm text-blue-600 hover:underline">
            Go to Tournaments →
          </Link>
        </div>
      ) : null}

      {/* Completed without winners */}
      {withoutWinners.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-slate-400" />
            <h2 className="text-base font-bold text-slate-800">Completed — No Result Recorded</h2>
          </div>
          <div className="space-y-2">
            {withoutWinners.map((t, i) => (
              <HistoryRow key={t.id} t={t} index={i} tbt={tbt} />
            ))}
          </div>
        </section>
      )}

      {/* All seasons timeline */}
      {allTournaments.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Gavel className="h-4 w-4 text-slate-400" />
            <h2 className="text-base font-bold text-slate-800">All Seasons</h2>
          </div>
          <div className="space-y-2">
            {allTournaments.map((t, i) => (
              <HistoryRow key={t.id} t={t} index={i} tbt={tbt} />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

export default TournamentHistoryPage;
