import { useNavigate } from "react-router-dom";
import titansLogo from "@/assets/branding/titan-logo.png";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Users, UserCircle, Gavel, ArrowRight, BarChart2, Trophy,
  Play, Shirt, TrendingUp, CheckCircle, XCircle, Clock, Zap, ChevronRight, Crown, Medal,
} from "lucide-react";

import { apiClient } from "@/lib/api";
import { useTournament } from "@/contexts/TournamentContext";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeamPage   { total: number }
interface PlayerPage { total: number }
interface CompletedTournament {
  id: string;
  name: string;
  winner_team_id: string | null;
  winner_team_name: string | null;
  runner_up_team_id: string | null;
  runner_up_team_name: string | null;
  completed_at: string | null;
  created_at: string;
}

interface ChampTeamInfo {
  id: string;
  name: string;
  display_name: string | null;
  logo_url: string | null;
}
interface AuctionState {
  id: string;
  status: string;
  scheduled_at: string | null;
  players_sold: number;
  players_unsold: number;
  total_amount_spent: number;
  name: string;
}

// ── Auction status config ──────────────────────────────────────────────────────

const AUCTION_STATUS: Record<string, { label: string; dot: string; banner: string }> = {
  SCHEDULED: { label: "Scheduled",  dot: "bg-blue-500",    banner: "bg-blue-50 border-blue-200 text-blue-800" },
  ACTIVE:    { label: "Live Now",   dot: "bg-emerald-500", banner: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  PAUSED:    { label: "Paused",     dot: "bg-amber-500",   banner: "bg-amber-50 border-amber-200 text-amber-800" },
  COMPLETED: { label: "Completed",  dot: "bg-slate-400",   banner: "bg-slate-50 border-slate-200 text-slate-700" },
  CANCELLED: { label: "Cancelled",  dot: "bg-red-400",     banner: "bg-red-50 border-red-200 text-red-700" },
};

// ── Animation variants ────────────────────────────────────────────────────────

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

// ── Page ──────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate();
  const { tournamentId, tournament, loading: tLoading } = useTournament();

  const teamsQ = useQuery<TeamPage>({
    queryKey: ["dash-teams", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return { total: 0 };
      const res = await apiClient.get<{ data: TeamPage }>(`/tournaments/${tournamentId}/teams?page_size=1`);
      return res.data.data;
    },
    enabled: !!tournamentId,
    staleTime: 30_000,
  });

  const playersQ = useQuery<PlayerPage>({
    queryKey: ["dash-players", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return { total: 0 };
      const res = await apiClient.get<{ data: PlayerPage }>(`/tournaments/${tournamentId}/players?page_size=1`);
      return res.data.data;
    },
    enabled: !!tournamentId,
    staleTime: 30_000,
  });

  const auctionQ = useQuery<AuctionState | null>({
    queryKey: ["dash-auction", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return null;
      try {
        const res = await apiClient.get<{ data: AuctionState }>(`/tournaments/${tournamentId}/auction`);
        return res.data.data;
      } catch {
        return null;
      }
    },
    enabled: !!tournamentId,
    staleTime: 15_000,
  });

  const championsQ = useQuery<CompletedTournament[]>({
    queryKey: ["dash-champions"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: { items: CompletedTournament[] } }>(
        "/tournaments?status=COMPLETED&page_size=10"
      );
      return (res.data.data.items ?? [])
        .filter((t) => t.winner_team_id || t.winner_team_name)
        .sort((a, b) => new Date(b.completed_at ?? b.created_at).getTime() - new Date(a.completed_at ?? a.created_at).getTime());
    },
    staleTime: 60_000,
  });

  const champions = championsQ.data ?? [];

  // Fetch live team data for each completed tournament so we can show
  // current team names and logos (winner_team_name may be a stale snapshot)
  const champTeamsQ = useQuery<Record<string, Record<string, ChampTeamInfo>>>({
    queryKey: ["champ-teams", champions.map((c) => c.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        champions.map(async (t) => {
          try {
            const { data } = await apiClient.get<{ data: { items: ChampTeamInfo[] } }>(
              `/tournaments/${t.id}/teams?page_size=100`
            );
            return {
              tournamentId: t.id,
              teamMap: Object.fromEntries((data.data.items ?? []).map((team) => [team.id, team])),
            };
          } catch {
            return { tournamentId: t.id, teamMap: {} };
          }
        })
      );
      return Object.fromEntries(results.map((r) => [r.tournamentId, r.teamMap]));
    },
    enabled: champions.length > 0,
    staleTime: 120_000,
  });

  const teamsByTournament = champTeamsQ.data ?? {};

  function resolveTeamName(
    tournamentId: string,
    teamId: string | null | undefined,
    fallback: string | null | undefined,
  ): string {
    if (!teamId && !fallback) return "—";
    const team = teamId ? teamsByTournament[tournamentId]?.[teamId] : undefined;
    if (team) return team.display_name || team.name;
    return fallback ?? "—";
  }

  function resolveTeamLogo(tournamentId: string, teamId: string | null | undefined): string | null {
    if (!teamId) return null;
    return teamsByTournament[tournamentId]?.[teamId]?.logo_url ?? null;
  }

  const auction    = auctionQ.data;
  const auctionCfg = auction ? AUCTION_STATUS[auction.status] : null;
  const isLoading  = tLoading || teamsQ.isLoading;

  // ── Derived progress values ────────────────────────────────────────────────
  const totalPlayers  = playersQ.data?.total ?? 0;
  const soldPlayers   = auction?.players_sold ?? 0;
  const unsoldPlayers = auction?.players_unsold ?? 0;
  const remaining     = Math.max(0, totalPlayers - soldPlayers - unsoldPlayers);
  const soldPct       = totalPlayers > 0 ? (soldPlayers / totalPlayers) * 100 : 0;
  const unsoldPct     = totalPlayers > 0 ? (unsoldPlayers / totalPlayers) * 100 : 0;
  const remainingPct  = totalPlayers > 0 ? (remaining / totalPlayers) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-50"
    >
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 space-y-8">

        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show"
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl"
          style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #1a4480 100%)" }}
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {/* Ambient glow */}
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-blue-500 opacity-10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 left-40 h-56 w-56 rounded-full bg-amber-400 opacity-10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between p-8 lg:p-10 gap-8">
            {/* Left content */}
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shrink-0">
                  <img src={titansLogo} alt="Titans" className="h-7 w-7 object-contain" />
                </div>
                <span className="text-gold-bright font-bold tracking-widest text-xs uppercase">
                  Titan Cricket Tournament
                </span>
              </div>

              <h1 className="font-display font-black text-3xl lg:text-4xl text-white leading-tight mb-2">
                {isLoading ? "Loading…" : tournament ? tournament.name : "Cricket Platform"}
              </h1>

              {tournament && (
                <div className="flex flex-wrap items-center gap-2 mt-3 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium border border-white/10">
                    <Users className="h-3 w-3" />
                    {teamsQ.isLoading ? "…" : (teamsQ.data?.total ?? 0)} Teams
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium border border-white/10">
                    <Shirt className="h-3 w-3" />
                    {playersQ.isLoading ? "…" : (playersQ.data?.total ?? 0)} Players
                  </span>
                  {auction && auctionCfg && (
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                      auction.status === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : auction.status === "SCHEDULED"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : "bg-white/10 text-white/70 border-white/10",
                    )}>
                      {auction.status === "ACTIVE" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                      {auctionCfg.label}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/auction")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                  style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
                >
                  <Gavel className="h-4 w-4" /> Open Auction
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/tournament")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white/80 border border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-200"
                >
                  <Trophy className="h-4 w-4" /> View Details
                </button>
              </div>
            </div>

            {/* Right: Titans logo hero */}
            <div className="hidden lg:flex shrink-0 items-center justify-center relative h-52 w-52">
              {/* Glow rings */}
              <div className="absolute inset-0 rounded-full border border-amber-400/10 animate-pulse" />
              <div className="absolute inset-4 rounded-full border border-amber-400/15" />
              <div className="absolute inset-8 rounded-full bg-amber-400/5 border border-amber-400/20" />
              {/* Ambient blobs */}
              <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-amber-400/15 blur-xl" />
              <div className="absolute -bottom-4 -left-4 h-14 w-14 rounded-full bg-blue-400/10 blur-xl" />
              {/* Logo */}
              <img
                src={titansLogo}
                alt="Titans"
                className="relative h-40 w-40 object-contain"
                style={{ filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.4)) drop-shadow(0 0 24px rgba(245,179,1,0.20))" }}
              />
            </div>
          </div>
        </motion.div>

        {/* ── No Tournament Warning ──────────────────────────────────────── */}
        {!tLoading && !tournamentId && (
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-center gap-4"
          >
            <Trophy className="h-8 w-8 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">No tournament selected</p>
              <p className="text-sm text-amber-700 mt-0.5">Create or select a tournament to get started.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/tournament")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold transition-colors"
            >
              <Trophy className="h-4 w-4" /> Tournament
            </button>
          </motion.div>
        )}

        {/* ── Stat Cards ────────────────────────────────────────────────── */}
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {[
            { label: "Total Teams",   value: isLoading         ? "…" : (teamsQ.data?.total ?? 0),    icon: Users,       gradient: "from-blue-600 to-blue-500",       href: "/teams" },
            { label: "Total Players", value: playersQ.isLoading ? "…" : (playersQ.data?.total ?? 0), icon: Shirt,       gradient: "from-violet-600 to-violet-500",   href: "/players" },
            { label: "Players Sold",  value: soldPlayers,                                             icon: CheckCircle, gradient: "from-emerald-600 to-emerald-500", href: "/auction-results" },
            { label: "Total Spend",   value: auction ? `${auction.total_amount_spent} Pts` : "—",    icon: TrendingUp,  gradient: "from-amber-500 to-orange-500",    href: "/auction" },
          ].map(({ label, value, icon: Icon, gradient, href }, i) => (
            <motion.div
              key={label}
              variants={fadeUp}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              onClick={() => navigate(href)}
              className="group relative bg-white rounded-2xl p-5 border border-slate-100 cursor-pointer shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm", gradient)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-blue-400 transition-colors duration-200 mt-1" />
              </div>
              <p className="text-3xl font-black text-slate-900 leading-none mb-1.5">{value}</p>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Live Auction Alert Banner ──────────────────────────────────── */}
        {auction && auction.status === "ACTIVE" && (
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ delay: 0.18 }}
            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-emerald-300 transition-colors"
            onClick={() => navigate("/auction")}
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
              <div>
                <p className="font-semibold text-sm text-emerald-900">{auction.name} — Live Now</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {auction.players_sold} sold · {auction.players_unsold} unsold · {auction.total_amount_spent} Pts spent
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigate("/auction/live"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shrink-0"
            >
              <Play className="h-3.5 w-3.5" /> Rejoin Live
            </button>
          </motion.div>
        )}

        {/* ── Body: 8/4 grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Left col: Auction Progress + Summary ──────────────────── */}
          <motion.div
            variants={stagger} initial="hidden" animate="show"
            className="lg:col-span-8 space-y-6"
          >
            {/* Auction Progress */}
            {auction ? (
              <motion.div
                variants={fadeUp} transition={{ delay: 0.12 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Auction Progress</h2>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{auction.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/auction-results")}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 transition-colors shrink-0"
                  >
                    Full Results <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Sold */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Sold
                      </span>
                      <span className="text-xs font-bold text-emerald-600">{soldPlayers} / {totalPlayers}</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${soldPct}%` }}
                        transition={{ duration: 0.9, ease: "easeOut", delay: 0.35 }}
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #10B981, #34D399)" }}
                      />
                    </div>
                  </div>

                  {/* Unsold */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <XCircle className="h-3.5 w-3.5 text-red-400" /> Unsold
                      </span>
                      <span className="text-xs font-bold text-red-500">{unsoldPlayers} / {totalPlayers}</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${unsoldPct}%` }}
                        transition={{ duration: 0.9, ease: "easeOut", delay: 0.5 }}
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #F87171, #EF4444)" }}
                      />
                    </div>
                  </div>

                  {/* Remaining */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" /> Remaining
                      </span>
                      <span className="text-xs font-bold text-slate-500">{remaining} / {totalPlayers}</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${remainingPct}%` }}
                        transition={{ duration: 0.9, ease: "easeOut", delay: 0.65 }}
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #94A3B8, #CBD5E1)" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom stats strip */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
                  {[
                    { label: "Total Spend",  value: `${auction.total_amount_spent} Pts`, color: "text-blue-600" },
                    { label: "Sold Players", value: soldPlayers,                          color: "text-emerald-600" },
                    { label: "Teams Active", value: teamsQ.data?.total ?? "—",           color: "text-slate-900" },
                  ].map((s) => (
                    <div key={s.label} className="px-6 py-4 text-center">
                      <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              !auctionQ.isLoading && !!tournamentId && (
                <motion.div
                  variants={fadeUp} transition={{ delay: 0.12 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center"
                >
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Gavel className="h-7 w-7 text-slate-400" />
                  </div>
                  <h3 className="font-bold text-slate-700 mb-1">No Auction Configured</h3>
                  <p className="text-sm text-slate-400 mb-5">Set up your auction to begin player bidding.</p>
                  <button
                    type="button"
                    onClick={() => navigate("/auction")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors"
                  >
                    <Zap className="h-4 w-4" /> Setup Auction
                  </button>
                </motion.div>
              )
            )}

            {/* Auction Summary — only when COMPLETED */}
            {auction?.status === "COMPLETED" && (
              <motion.div
                variants={fadeUp} transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900">Auction Summary</h2>
                  <button
                    type="button"
                    onClick={() => navigate("/auction-results")}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 transition-colors"
                  >
                    Full Results <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  {[
                    { label: "Players Sold",   value: auction.players_sold,               color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-100" },
                    { label: "Players Unsold", value: auction.players_unsold,             color: "text-red-500",     bg: "bg-red-50",      border: "border-red-100"     },
                    { label: "Total Spend",    value: `${auction.total_amount_spent} Pts`, color: "text-blue-600",   bg: "bg-blue-50",     border: "border-blue-100"    },
                    { label: "Teams",          value: teamsQ.data?.total ?? "—",          color: "text-slate-900",   bg: "bg-slate-50",    border: "border-slate-100"   },
                  ].map((s) => (
                    <div key={s.label} className={cn("rounded-xl border px-4 py-4", s.bg, s.border)}>
                      <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                      <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ── Right col: Status Widget + Quick Actions ───────────────── */}
          <motion.div
            variants={stagger} initial="hidden" animate="show"
            className="lg:col-span-4 space-y-6"
          >
            {/* Auction Status Widget */}
            <motion.div
              variants={fadeUp} transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">Auction Status</h2>
              </div>

              {auction && auctionCfg ? (
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "h-2.5 w-2.5 rounded-full shrink-0",
                      auctionCfg.dot,
                      auction.status === "ACTIVE" && "animate-pulse",
                    )} />
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      auction.status === "ACTIVE"    ? "bg-emerald-100 text-emerald-700" :
                      auction.status === "SCHEDULED" ? "bg-blue-100 text-blue-700"       :
                      auction.status === "COMPLETED" ? "bg-slate-100 text-slate-600"     :
                                                       "bg-red-100 text-red-600",
                    )}>
                      {auctionCfg.label}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-800 text-sm mb-3 truncate">{auction.name}</p>

                  {auction.status === "SCHEDULED" && auction.scheduled_at && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                      <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      {new Date(auction.scheduled_at).toLocaleString()}
                    </div>
                  )}

                  {auction.status === "ACTIVE" && (
                    <div className="space-y-2.5">
                      {[
                        { label: "Sold",      val: auction.players_sold,       color: "text-emerald-600" },
                        { label: "Unsold",    val: auction.players_unsold,     color: "text-red-500"     },
                        { label: "Pts Spent", val: auction.total_amount_spent, color: "text-blue-600"    },
                      ].map((r) => (
                        <div key={r.label} className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">{r.label}</span>
                          <span className={cn("font-bold", r.color)}>{r.val}</span>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate("/auction/live"); }}
                        className="mt-1 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                      >
                        <Play className="h-3.5 w-3.5" /> Rejoin Live
                      </button>
                    </div>
                  )}

                  {auction.status === "COMPLETED" && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                      <CheckCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      Auction completed successfully
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 text-center">
                  <Gavel className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 mb-3">No auction configured</p>
                  <button
                    type="button"
                    onClick={() => navigate("/auction")}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    Set up now →
                  </button>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              variants={fadeUp} transition={{ delay: 0.16 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
              </div>
              <div className="p-3 space-y-0.5">
                {[
                  { label: "Manage Teams",    desc: "View & edit team rosters",     icon: Users,       gradient: "from-blue-600 to-blue-500",       href: "/teams"            },
                  { label: "Manage Captains", desc: "Assign team captains",          icon: UserCircle,  gradient: "from-royal-700 to-violet-600",    href: "/captains"         },
                  { label: "Manage Players",  desc: "Player profiles & statistics",  icon: Shirt,       gradient: "from-slate-600 to-slate-500",     href: "/players"          },
                  { label: "Go to Auction",   desc: "Open the auction console",      icon: Gavel,       gradient: "from-amber-500 to-orange-500",    href: "/auction"          },
                  { label: "View Results",    desc: "Final standings & spend",       icon: BarChart2,   gradient: "from-emerald-600 to-emerald-500", href: "/auction-results"  },
                ].map(({ label, desc, icon: Icon, gradient, href }) => (
                  <motion.button
                    key={label}
                    type="button"
                    whileHover={{ x: 2, transition: { duration: 0.1 } }}
                    onClick={() => navigate(href)}
                    className="group flex items-center gap-3 w-full rounded-xl px-3 py-3 hover:bg-slate-50 transition-all duration-150 text-left"
                  >
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0", gradient)}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{label}</p>
                      <p className="text-xs text-slate-400 truncate">{desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-slate-400 transition-colors duration-150 shrink-0" />
                  </motion.button>
                ))}
              </div>
            </motion.div>

          </motion.div>
        </div>

        {/* ── Previous Champions ─────────────────────────────────────── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show"
          transition={{ delay: 0.25 }}
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 leading-none">Previous Champions</h2>
                <p className="text-xs text-slate-400 mt-0.5">Hall of fame · Completed tournaments</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/history")}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 transition-colors"
            >
              Full History <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {championsQ.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : champions.length === 0 ? (
            /* Premium empty state */
            <div
              className="rounded-2xl border border-dashed border-amber-200/60 flex flex-col items-center justify-center py-12 text-center"
              style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fff7e6 100%)" }}
            >
              <div
                className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)", boxShadow: "0 8px 24px rgba(245,158,11,0.25)" }}
              >
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <p className="font-bold text-slate-700 text-base mb-1">No tournament champions yet</p>
              <p className="text-sm text-slate-400 max-w-xs">
                Complete a tournament and record the result to see champions here.
              </p>
            </div>
          ) : (
            /* Champion cards — horizontal scroll on mobile, grid on desktop */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {champions.slice(0, 6).map((t, i) => {
                const isLatest = i === 0;
                const winnerName = resolveTeamName(t.id, t.winner_team_id, t.winner_team_name);
                const runnerUpName = t.runner_up_team_id || t.runner_up_team_name
                  ? resolveTeamName(t.id, t.runner_up_team_id, t.runner_up_team_name)
                  : null;
                const logoUrl = resolveTeamLogo(t.id, t.winner_team_id);
                const year = t.completed_at
                  ? new Date(t.completed_at).getFullYear()
                  : new Date(t.created_at).getFullYear();
                const initials = winnerName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

                return (
                  <motion.div
                    key={t.id}
                    whileHover={{ y: -3, transition: { duration: 0.18 } }}
                    onClick={() => navigate("/history")}
                    className="cursor-pointer rounded-2xl overflow-hidden border transition-all duration-200"
                    style={
                      isLatest
                        ? { borderColor: "rgba(245,179,1,0.35)", boxShadow: "0 4px 20px rgba(245,158,11,0.12)" }
                        : { borderColor: "#e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }
                    }
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = isLatest
                        ? "0 12px 32px rgba(245,158,11,0.20)"
                        : "0 8px 24px rgba(0,0,0,0.10)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = isLatest
                        ? "0 4px 20px rgba(245,158,11,0.12)"
                        : "0 2px 8px rgba(0,0,0,0.05)";
                    }}
                  >
                    {/* Card header */}
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={
                        isLatest
                          ? { background: "linear-gradient(135deg, #b45309 0%, #d97706 60%, #f59e0b 100%)" }
                          : { background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)" }
                      }
                    >
                      <div className="flex items-center gap-2">
                        {isLatest
                          ? <Crown className="h-4 w-4 text-amber-200" />
                          : <Trophy className="h-3.5 w-3.5 text-slate-400" />}
                        <span className={cn(
                          "text-[10px] font-extrabold uppercase tracking-widest",
                          isLatest ? "text-amber-100" : "text-slate-400",
                        )}>
                          {isLatest ? "Defending Champion" : `Season ${year}`}
                        </span>
                      </div>
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        isLatest
                          ? "bg-amber-400/30 text-amber-100 border border-amber-300/40"
                          : "bg-slate-600/50 text-slate-300 border border-slate-500/30",
                      )}>
                        {year}
                      </span>
                    </div>

                    {/* Card body */}
                    <div
                      className="p-4"
                      style={{ background: isLatest ? "linear-gradient(180deg, #fffbeb 0%, #ffffff 100%)" : "white" }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {/* Team logo / initials */}
                        <div
                          className="h-14 w-14 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border-2 border-white"
                          style={{
                            background: logoUrl ? "white" : isLatest
                              ? "linear-gradient(135deg, #92400e, #d97706)"
                              : "linear-gradient(135deg, #1e3a5f, #2d5c8e)",
                            boxShadow: isLatest
                              ? "0 4px 16px rgba(245,158,11,0.20)"
                              : "0 4px 12px rgba(0,0,0,0.10)",
                          }}
                        >
                          {logoUrl ? (
                            <img src={logoUrl} alt={winnerName} className="h-full w-full object-contain p-1" />
                          ) : (
                            <span className={cn(
                              "text-lg font-black select-none",
                              isLatest ? "text-amber-100" : "text-white",
                            )}>
                              {initials}
                            </span>
                          )}
                        </div>

                        {/* Names */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-extrabold leading-tight truncate",
                            isLatest ? "text-amber-900" : "text-slate-900",
                          )}>
                            {winnerName}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Trophy className="h-3 w-3 text-amber-500 shrink-0" />
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Champion</span>
                          </div>
                          {runnerUpName && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              🥈 {runnerUpName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tournament name */}
                      <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100">
                        <Medal className="h-3 w-3 text-slate-300 shrink-0" />
                        <span className="text-[11px] text-slate-500 truncate font-medium">{t.name}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
