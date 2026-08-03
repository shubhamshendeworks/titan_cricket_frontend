/**
 * LiveAuctionPage — Premium live auction screen with - player presentation.
 * Route: /tournaments/:id/auction/live
 *
 * Layout:
 *   Left (teams panel) | Center (player presentation) | Right (bidding controls)
 *   Bottom: Admin control bar
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import titansLogo from "@/assets/branding/titan-logo.png";
import { useTournament } from "@/contexts/TournamentContext";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Gavel,
  Wifi,
  WifiOff,
  Play,
  Pause,
  SkipForward,
  CheckCircle,
  XCircle,
  Square,
  ChevronLeft,
  Users,
  RotateCcw,
  Trophy,
} from "lucide-react";

import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  useAuctionSocket,
  type AuctionPlayer,
  type TeamPurse,
  type AuctionPlayerStats,
} from "@/hooks/useAuctionSocket";
import { cn } from "@/lib/utils";
import { PlayerRevealOverlay } from "@/components/auction/PlayerRevealOverlay";

// ── Formatting ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function fmt(n: number) {
  return `${n} pts`;
}

const ROLE_GRADIENT: Record<string, string> = {
  BATSMAN:       "from-blue-600 to-blue-800",
  BOWLER:        "from-emerald-600 to-emerald-800",
  ALL_ROUNDER:   "from-purple-600 to-purple-800",
  WICKET_KEEPER: "from-amber-600 to-amber-800",
};

const ROLE_ACCENT: Record<string, string> = {
  BATSMAN:       "text-blue-300 bg-blue-900/40",
  BOWLER:        "text-emerald-300 bg-emerald-900/40",
  ALL_ROUNDER:   "text-purple-300 bg-purple-900/40",
  WICKET_KEEPER: "text-amber-300 bg-amber-900/40",
};

// ── Stat row (animates in) ────────────────────────────────────────────────────

interface StatDef { label: string; value: string | number }

function buildStats(s: AuctionPlayerStats): StatDef[] {
  const rows: StatDef[] = [];
  if (s.matches      > 0)  rows.push({ label: "Matches",      value: s.matches });
  if (s.runs         > 0)  rows.push({ label: "Runs",         value: s.runs });
  if (s.highest_score > 0) rows.push({ label: "Best Score",   value: s.highest_score });
  if (s.average      > 0)  rows.push({ label: "Average",      value: s.average.toFixed(1) });
  if (s.strike_rate  > 0)  rows.push({ label: "Strike Rate",  value: s.strike_rate.toFixed(1) });
  if (s.fifties      > 0)  rows.push({ label: "50s",          value: s.fifties });
  if (s.hundreds     > 0)  rows.push({ label: "100s",         value: s.hundreds });
  if (s.wickets      > 0)  rows.push({ label: "Wickets",      value: s.wickets });
  if (s.economy      > 0)  rows.push({ label: "Economy",      value: s.economy.toFixed(2) });
  if (s.best_bowling)      rows.push({ label: "Best Bowling", value: s.best_bowling });
  if (s.catches      > 0)  rows.push({ label: "Catches",      value: s.catches });
  if (s.run_outs     > 0)  rows.push({ label: "Run Outs",     value: s.run_outs });
  return rows;
}

const statRowVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.05 * i + 0.3, duration: 0.35, ease: "easeOut" as const },
  }),
};

// ── Timer ring ────────────────────────────────────────────────────────────────

function TimerRing({ seconds, max = 60 }: { seconds: number; max?: number }) {
  const pct = seconds / max;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const color = seconds > 20 ? "#22c55e" : seconds > 10 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r}
          fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${circ * pct} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.3s" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-xl font-bold tabular-nums" style={{ color }}>{seconds}</p>
      </div>
    </div>
  );
}

// ── Player Presentation Card ──────────────────────────────────────────────────

function PlayerPresentationCard({
  player,
  currentBid,
  currentBidderName,
  timerSeconds,
}: {
  player: AuctionPlayer;
  currentBid: number;
  currentBidderName: string | null;
  timerSeconds: number;
}) {
  const stats = player.stats ? buildStats(player.stats) : [];
  const gradient = ROLE_GRADIENT[player.role] ?? "from-slate-600 to-slate-800";
  const accentCls = ROLE_ACCENT[player.role] ?? "text-slate-300 bg-slate-800/40";

  return (
    <motion.div
      key={player.id}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Main card */}
      <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10">

        {/* ── Header: gradient + photo ─────────────────────────────────────── */}
        <div className={`relative bg-gradient-to-br ${gradient} px-6 pt-8 pb-20`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 11px)" }} />

          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute -inset-2 rounded-full bg-white/20 blur-md" />
              <div className="relative h-36 w-36 rounded-full border-4 border-white/30 shadow-2xl overflow-hidden bg-slate-800">
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={player.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-5xl font-bold text-white/80">{getInitials(player.name)}</span>
                  </div>
                )}
              </div>
              {/* Jersey number bubble */}
              {player.jersey_number && (
                <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-900">#{player.jersey_number}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Name plate (overlapping gradient) ───────────────────────────── */}
        <div className="relative -mt-14 bg-slate-900 mx-4 rounded-2xl shadow-xl border border-white/10 px-6 py-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-2xl font-bold text-white tracking-wide"
          >
            {player.name}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 mt-2 flex-wrap"
          >
            <span className={cn("px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide", accentCls)}>
              {player.role.replace("_", " ")}
            </span>
            {player.batting_style && (
              <span className="text-xs text-slate-500">{player.batting_style.replace("_", " ")}</span>
            )}
          </motion.div>
        </div>

        {/* ── Stats panel ─────────────────────────────────────────────────── */}
        <div className="bg-slate-900 px-6 pt-4 pb-2">
          {stats.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-0">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={statRowVariants}
                  className="flex items-center justify-between py-1.5 border-b border-white/5"
                >
                  <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">{s.label}</span>
                  <span className="text-sm font-bold text-white tabular-nums">{s.value}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-2">No previous statistics</p>
          )}
        </div>

        {/* ── Bidding panel ────────────────────────────────────────────────── */}
        <div className="bg-slate-800/80 px-6 py-4 flex items-center justify-between gap-4">
          {/* Base price */}
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Base Price</p>
            <p className="text-lg font-bold text-amber-400">{fmt(player.base_price)}</p>
          </div>

          {/* Current bid (center, prominent) */}
          <div className="flex-1 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Current Bid</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentBid}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="text-3xl font-bold text-white"
              >
                {currentBid > 0 ? (
                  <span className="text-emerald-400">{fmt(currentBid)}</span>
                ) : (
                  <span className="text-slate-500 text-2xl">—</span>
                )}
              </motion.p>
            </AnimatePresence>
            {currentBidderName && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-slate-300 mt-0.5"
              >
                {currentBidderName}
              </motion.p>
            )}
          </div>

          {/* Timer */}
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Timer</p>
            <TimerRing seconds={timerSeconds} max={60} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Teams side panel ──────────────────────────────────────────────────────────

function TeamsPanel({ teams }: { teams: TeamPurse[] }) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <Users className="h-4 w-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Teams</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {teams.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">Loading…</p>
        ) : (
          teams
            .slice()
            .sort((a, b) => b.purse_remaining - a.purse_remaining)
            .map((t, idx) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-slate-800/60 rounded-xl p-3 border border-white/5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0 bg-slate-700 flex items-center justify-center">
                    {t.logo_url ? (
                      <img src={t.logo_url} alt={t.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-white">{t.short_name.slice(0, 2)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.players_count} players</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Purse</span>
                    <span className="font-bold text-emerald-400">{fmt(t.purse_remaining)}</span>
                  </div>
                </div>
              </motion.div>
            ))
        )}
      </div>
    </div>
  );
}

// ── Toast notifications ───────────────────────────────────────────────────────

const TOAST_CLS: Record<string, string> = {
  sold:  "border-emerald-500 bg-emerald-950",
  unsold: "border-slate-500 bg-slate-900",
  bid:   "border-blue-500 bg-blue-950",
  info:  "border-slate-600 bg-slate-900",
  error: "border-red-500 bg-red-950",
};

function ToastStack({
  toasts,
  dismiss,
}: {
  toasts: { id: string; type: string; message: string }[];
  dismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none max-w-xs w-full">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 48, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 48, scale: 0.94 }}
            transition={{ duration: 0.25 }}
            onClick={() => dismiss(t.id)}
            className={cn(
              "flex items-start gap-3 px-4 py-3 rounded-xl border text-white text-sm font-medium pointer-events-auto cursor-pointer shadow-xl backdrop-blur-sm",
              TOAST_CLS[t.type] ?? "border-slate-600 bg-slate-900",
            )}
          >
            <span>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function LiveAuctionPage() {
  const { tournamentId } = useTournament();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isAdmin = ["SUPER_ADMIN", "TOURNAMENT_ADMIN"].includes(
    user?.global_role ?? "",
  );

  const { state, connected, toasts, dismissToast, sendMessage } = useAuctionSocket(
    tournamentId ?? "",
  );

  const auctionQ = useQuery({
    queryKey: ["auction-info", tournamentId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { name: string; status: string; team_purse: number; min_bid_increment: number; scheduled_at: string | null } }>(
        `/tournaments/${tournamentId}/auction`,
      );
      return data.data;
    },
    enabled: !!tournamentId,
    staleTime: 30_000,
  });

  const {
    status, currentPlayer, currentBid, currentBidderName,
    timerSeconds, queueRemaining, teams, bidsCount,
    playersSold, playersUnsold,
  } = state;

  // ── Cinematic reveal: trigger on new currentPlayer ─────────────────────────
  const [revealPlayer, setRevealPlayer] = useState<AuctionPlayer | null>(null);
  const prevPlayerIdRef = useRef<string | null>(null);

  useEffect(() => {
    const newId = currentPlayer?.id ?? null;
    if (newId && newId !== prevPlayerIdRef.current) {
      setRevealPlayer(currentPlayer);
    }
    prevPlayerIdRef.current = newId;
  }, [currentPlayer]);

  // Pre-auction readiness data (REST, only queried in SCHEDULED state)
  const teamsReadinessQ = useQuery({
    queryKey: ["teams-readiness", tournamentId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: { id: string; name: string; captain_id: string | null; is_active: boolean }[]; total: number } }>(
        `/tournaments/${tournamentId}/teams?page_size=100`
      );
      return data.data;
    },
    enabled: !!tournamentId && status === "SCHEDULED",
    staleTime: 15_000,
  });

  const playersReadinessQ = useQuery({
    queryKey: ["players-readiness", tournamentId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { total: number } }>(
        `/tournaments/${tournamentId}/players?status=AVAILABLE&auction_eligible=true&page_size=1`
      );
      return data.data;
    },
    enabled: !!tournamentId && status === "SCHEDULED",
    staleTime: 15_000,
  });

  const readinessTeams = teamsReadinessQ.data?.items ?? [];
  const activeTeams = readinessTeams.filter((t) => t.is_active);
  const teamsWithCaptain = activeTeams.filter((t) => !!t.captain_id);
  const eligiblePlayerCount = playersReadinessQ.data?.total ?? 0;
  const auctionPurse = auctionQ.data ? (auctionQ.data as any).team_purse ?? 0 : 0;

  const readinessChecks = [
    { ok: activeTeams.length >= 1, label: `Teams: ${activeTeams.length} active team${activeTeams.length !== 1 ? "s" : ""} (need ≥1)` },
    { ok: teamsWithCaptain.length === activeTeams.length && activeTeams.length > 0, label: `Captains: ${teamsWithCaptain.length}/${activeTeams.length} teams have captain assigned` },
    { ok: eligiblePlayerCount > 0, label: `Players: ${eligiblePlayerCount} eligible player${eligiblePlayerCount !== 1 ? "s" : ""} available (need ≥1)` },
    { ok: auctionPurse > 0, label: `Team Points: ${auctionPurse > 0 ? `${auctionPurse} pts configured` : "Not configured (will use team defaults)"}` },
  ];
  const allReady = readinessChecks[0].ok && readinessChecks[1].ok && readinessChecks[2].ok;

  const hasPlayer  = !!currentPlayer;
  const canStart   = isAdmin && status === "SCHEDULED";
  const canPause   = isAdmin && status === "ACTIVE";
  const canResume  = isAdmin && status === "PAUSED";
  const canControl = isAdmin && (status === "ACTIVE" || status === "PAUSED");
  const canSold    = canControl && hasPlayer && !!currentBidderName && currentBid > 0;

  const STATUS_PILL: Record<string, string> = {
    SCHEDULED: "border-slate-600 text-slate-300",
    ACTIVE:    "border-emerald-500 text-emerald-300",
    PAUSED:    "border-amber-500 text-amber-300",
    COMPLETED: "border-blue-500 text-blue-300",
  };

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-900/90 border-b border-white/10 backdrop-blur-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/auction")}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <img src={titansLogo} alt="Titans" className="h-7 w-7 object-contain opacity-90" />
          <Gavel className="h-5 w-5 text-amber-400" />
          <span className="font-semibold text-white text-sm">
            {auctionQ.data?.name ?? "Live Auction"}
          </span>
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
            STATUS_PILL[status] ?? "border-slate-600 text-slate-300",
          )}>
            {status}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {(status === "ACTIVE" || status === "PAUSED") && (
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <span className="text-emerald-400 flex items-center gap-1">
                <Trophy className="h-3 w-3" /> {playersSold} sold
              </span>
              <span className="text-red-400 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> {playersUnsold} unsold
              </span>
              <span className="text-slate-400">{queueRemaining} left</span>
            </div>
          )}
          {connected ? (
            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
              <Wifi className="h-3.5 w-3.5" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium animate-pulse">
              <WifiOff className="h-3.5 w-3.5" />
              Reconnecting…
            </span>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: teams panel */}
        <div className="w-52 shrink-0 bg-slate-900/60 border-r border-white/10 hidden lg:flex flex-col">
          <TeamsPanel teams={teams} />
        </div>

        {/* Center: main content */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-6">

          {/* SCHEDULED — waiting to start */}
          {status === "SCHEDULED" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6 text-center max-w-lg w-full"
            >
              <div className="h-24 w-24 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
                <Gavel className="h-12 w-12 text-amber-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Auction Ready</h2>
                <p className="text-slate-400 mt-2 text-sm">Verify all conditions below, then start the auction.</p>
              </div>

              {/* Readiness checklist */}
              <div className="w-full bg-slate-900/60 border border-white/10 rounded-2xl p-5 text-left space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Pre-Auction Checklist</p>
                {(teamsReadinessQ.isLoading || playersReadinessQ.isLoading) ? (
                  <div className="space-y-2">
                    {[1,2,3,4].map((i) => <div key={i} className="h-6 rounded bg-slate-800 animate-pulse" />)}
                  </div>
                ) : readinessChecks.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {c.ok
                      ? <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      : <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    }
                    <span className={`text-sm ${c.ok ? "text-slate-300" : "text-red-300"}`}>{c.label}</span>
                  </div>
                ))}
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => sendMessage("start")}
                  disabled={!connected || !allReady}
                  className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xl shadow-2xl shadow-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="h-6 w-6" />
                  Start Auction
                </button>
              )}
              {!isAdmin && (
                <p className="text-slate-500 text-sm">Waiting for admin to start the auction…</p>
              )}
            </motion.div>
          )}

          {/* COMPLETED */}
          {status === "COMPLETED" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 text-center max-w-lg"
            >
              <div className="h-24 w-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Auction Complete!</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                {teams.map((t) => (
                  <div key={t.id} className="bg-slate-800 rounded-2xl p-4 text-center border border-white/10">
                    <p className="text-xs text-slate-400 truncate mb-1">{t.name}</p>
                    <p className="text-xl font-bold text-white">{t.players_count}</p>
                    <p className="text-xs text-slate-400">players</p>
                    <p className="text-sm font-bold text-emerald-400 mt-1">{fmt(t.purse_remaining)}</p>
                    <p className="text-xs text-slate-500">remaining</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate("/auction")}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-white/10 transition-colors"
              >
                View Summary
              </button>
            </motion.div>
          )}

          {/* ACTIVE / PAUSED */}
          {(status === "ACTIVE" || status === "PAUSED") && (
            <div className="w-full max-w-2xl space-y-4">
              {/* Paused banner */}
              {status === "PAUSED" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-900/30 border border-amber-500/40 rounded-xl px-4 py-3 text-center"
                >
                  <p className="text-amber-300 font-semibold text-sm">Auction Paused</p>
                </motion.div>
              )}

              {/* Player presentation */}
              <AnimatePresence mode="wait">
                {hasPlayer ? (
                  <PlayerPresentationCard
                    key={currentPlayer!.id}
                    player={currentPlayer!}
                    currentBid={currentBid}
                    currentBidderName={currentBidderName}
                    timerSeconds={timerSeconds}
                  />
                ) : (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 gap-4"
                  >
                    <div className="h-20 w-20 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                      <Gavel className="h-10 w-10 text-slate-500" />
                    </div>
                    <p className="text-slate-400 text-sm">
                      {queueRemaining > 0
                        ? `${queueRemaining} players in queue — loading next player...`
                        : "All players processed"}
                    </p>
                    {isAdmin && status === "ACTIVE" && queueRemaining > 0 && (
                      <button
                        type="button"
                        onClick={() => sendMessage("next_player")}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-colors"
                      >
                        <SkipForward className="h-4 w-4" />
                        Load Now
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          )}
        </div>

        {/* Right: bid history / stats */}
        <div className="w-52 shrink-0 bg-slate-900/60 border-l border-white/10 hidden xl:flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Bid Info</span>
          </div>
          <div className="flex-1 p-4 space-y-3">
            <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-white/5">
              <p className="text-xs text-slate-400">Queue</p>
              <p className="text-2xl font-bold text-white">{queueRemaining}</p>
              <p className="text-xs text-slate-500">players left</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-white/5">
              <p className="text-xs text-slate-400">Bids</p>
              <p className="text-2xl font-bold text-white">{bidsCount}</p>
              <p className="text-xs text-slate-500">this player</p>
            </div>
            {currentBid > 0 && (
              <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-400">Leading</p>
                <p className="text-lg font-bold text-emerald-300">{fmt(currentBid)}</p>
                {currentBidderName && (
                  <p className="text-xs text-emerald-400/70 mt-0.5 truncate">{currentBidderName}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Admin controls bar ───────────────────────────────────────────────── */}
      {isAdmin && (
        <div className="shrink-0 bg-slate-900/90 border-t border-white/10 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {canPause && (
              <button
                type="button"
                onClick={() => sendMessage("pause")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors"
              >
                <Pause className="h-4 w-4" />
                Pause
              </button>
            )}
            {canResume && (
              <button
                type="button"
                onClick={() => sendMessage("resume")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
              >
                <Play className="h-4 w-4" />
                Resume
              </button>
            )}
            {canControl && hasPlayer && (
              <>
                <button
                  type="button"
                  disabled={!canSold}
                  onClick={() => sendMessage("sold")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Sold
                </button>
                <button
                  type="button"
                  onClick={() => sendMessage("unsold")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Unsold
                </button>
              </>
            )}
            {canControl && (
              <>
                {hasPlayer && status === "ACTIVE" && (
                  <button
                    type="button"
                    onClick={() => sendMessage("reset_timer")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
                    title="Reset timer to 60s"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Timer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => sendMessage("next_player")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                >
                  <SkipForward className="h-4 w-4" />
                  Next Player
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("End the auction? This cannot be undone.")) {
                      sendMessage("end_auction");
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                >
                  <Square className="h-4 w-4" />
                  End Auction
                </button>
              </>
            )}
            {canStart && (
              <button
                type="button"
                onClick={() => sendMessage("start")}
                disabled={!connected}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-bold transition-colors"
              >
                <Play className="h-4 w-4" />
                Start Auction
              </button>
            )}
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} dismiss={dismissToast} />

      {/* Cinematic player reveal overlay */}
      {revealPlayer && (
        <PlayerRevealOverlay
          player={revealPlayer}
          onDismiss={() => setRevealPlayer(null)}
        />
      )}
    </div>
  );
}

export default LiveAuctionPage;
