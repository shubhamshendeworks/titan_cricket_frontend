/**
 * CaptainAuctionPage — Captain's live auction dashboard.
 * Route: /auction/bid
 *
 * Shows current player (with full stats), timer, current bid, bid history,
 * my squad, all teams purse summary, and bid buttons.
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTournament } from "@/contexts/TournamentContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gavel,
  Wifi,
  WifiOff,
  Clock,
  Users,
  CheckCircle,
  TrendingUp,
  History,
  Shield,
} from "lucide-react";

import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useAuctionSocket, type AuctionPlayer } from "@/hooks/useAuctionSocket";
import { PlayerRevealOverlay } from "@/components/auction/PlayerRevealOverlay";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function fmt(n: number) {
  return `${n} pts`;
}

const ROLE_COLORS: Record<string, string> = {
  BATSMAN:       "bg-blue-100 text-blue-700 border-blue-200",
  BOWLER:        "bg-emerald-100 text-emerald-700 border-emerald-200",
  ALL_ROUNDER:   "bg-purple-100 text-purple-700 border-purple-200",
  WICKET_KEEPER: "bg-amber-100 text-amber-700 border-amber-200",
};

// ── Timer display ─────────────────────────────────────────────────────────────

function TimerBar({ seconds, max = 60 }: { seconds: number; max?: number }) {
  const pct = (seconds / max) * 100;
  const color = seconds > 20 ? "bg-emerald-500" : seconds > 10 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 flex items-center gap-1">
          <Clock className="h-3 w-3" /> Timer
        </span>
        <span className={cn("font-bold tabular-nums", seconds <= 10 ? "text-red-600 animate-pulse" : "text-slate-700")}>
          {seconds}s
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Stat row ──────────────────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-bold text-slate-800 tabular-nums">{value}</span>
    </div>
  );
}

// ── Full player card ──────────────────────────────────────────────────────────

function CurrentPlayerCard({ player }: { player: AuctionPlayer }) {
  const s = player.stats;

  return (
    <div className="space-y-4">
      {/* Photo + basic info */}
      <div className="flex gap-4 items-start">
        <div className="relative shrink-0">
          <div className="h-24 w-24 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 shadow-md flex items-center justify-center">
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">{getInitials(player.name)}</span>
            )}
          </div>
          {player.jersey_number != null && (
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              #{player.jersey_number}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-slate-900 leading-tight">{player.name}</h3>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border", ROLE_COLORS[player.role] ?? "bg-slate-100 text-slate-600 border-slate-200")}>
              {player.role.replace(/_/g, " ")}
            </span>
          </div>
          <div className="mt-2 space-y-0.5">
            {player.batting_style && (
              <p className="text-xs text-slate-500">Bat: <span className="font-medium text-slate-700">{player.batting_style.replace(/_/g, " ")}</span></p>
            )}
            {player.bowling_style && (
              <p className="text-xs text-slate-500">Bowl: <span className="font-medium text-slate-700">{player.bowling_style.replace(/_/g, " ")}</span></p>
            )}
            <p className="text-xs text-slate-500">
              Base: <span className="font-bold text-amber-600">{fmt(player.base_price)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {s && s.matches > 0 ? (
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Career Statistics</p>
          <div className="grid grid-cols-2 gap-x-4">
            {s.matches      > 0  && <StatRow label="Matches"      value={s.matches} />}
            {s.runs         > 0  && <StatRow label="Runs"         value={s.runs} />}
            {s.highest_score > 0 && <StatRow label="Best Score"   value={s.highest_score} />}
            {s.average      > 0  && <StatRow label="Average"      value={s.average.toFixed(1)} />}
            {s.strike_rate  > 0  && <StatRow label="Strike Rate"  value={s.strike_rate.toFixed(1)} />}
            {s.fifties      > 0  && <StatRow label="50s"          value={s.fifties} />}
            {s.hundreds     > 0  && <StatRow label="100s"         value={s.hundreds} />}
            {s.wickets      > 0  && <StatRow label="Wickets"      value={s.wickets} />}
            {s.economy      > 0  && <StatRow label="Economy"      value={s.economy.toFixed(2)} />}
            {s.best_bowling      && <StatRow label="Best Bowling" value={s.best_bowling} />}
            {s.catches      > 0  && <StatRow label="Catches"      value={s.catches} />}
            {s.run_outs     > 0  && <StatRow label="Run Outs"     value={s.run_outs} />}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center py-1">No previous statistics</p>
      )}
    </div>
  );
}

// ── Bid button group ──────────────────────────────────────────────────────────

function BidButtons({
  minNextBid,
  purse,
  onBid,
  disabled,
}: {
  minNextBid: number;
  purse: number;
  onBid: (amount: number) => void;
  disabled: boolean;
}) {
  const increment = minNextBid <= 100 ? 10 : minNextBid <= 500 ? 20 : minNextBid <= 1000 ? 50 : 100;
  const options = [minNextBid, minNextBid + increment, minNextBid + increment * 2].filter((v) => v <= purse);
  const [custom, setCustom] = useState("");

  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        {options.length > 0 ? (
          options.map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={disabled}
              onClick={() => onBid(amt)}
              className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-sm"
            >
              {fmt(amt)}
            </button>
          ))
        ) : (
          <p className="text-sm text-red-500 text-center w-full font-medium">Insufficient points to bid</p>
        )}
      </div>
      {options.length > 0 && (
        <div className="flex gap-2">
          <input
            type="number"
            min={minNextBid}
            max={purse}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={`Custom (min ${fmt(minNextBid)})`}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
          />
          <button
            type="button"
            disabled={disabled || !custom || Number(custom) < minNextBid || Number(custom) > purse}
            onClick={() => { onBid(Number(custom)); setCustom(""); }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            Bid
          </button>
        </div>
      )}
    </div>
  );
}

// ── Squad item ────────────────────────────────────────────────────────────────

interface SquadPlayer { id: string; name: string; role: string; sold_price: number | null }

// ── Page ──────────────────────────────────────────────────────────────────────

export function CaptainAuctionPage() {
  const { tournamentId } = useTournament();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { state, connected, toasts, dismissToast, sendMessage } = useAuctionSocket(tournamentId ?? "");

  const {
    status, currentPlayer, currentBid, currentBidderId, currentBidderName,
    timerSeconds, queueRemaining, minNextBid, teams, playersSold, playersUnsold,
  } = state;

  const myTeam = teams.find((t) => t.captain_id === user?.id);
  const myPurse = myTeam?.purse_remaining ?? 0;
  const isMyBid = myTeam ? currentBidderId === myTeam.id : false;

  const canBid = connected && status === "ACTIVE" && !!currentPlayer && myPurse >= minNextBid;

  // ── Cinematic reveal: trigger on new currentPlayer ─────────────────────────
  const [revealPlayer, setRevealPlayer] = useState<AuctionPlayer | null>(null);
  const revealPlayerIdRef = useRef<string | null>(null);

  useEffect(() => {
    const newId = currentPlayer?.id ?? null;
    if (newId && newId !== revealPlayerIdRef.current) {
      setRevealPlayer(currentPlayer);
    }
    revealPlayerIdRef.current = newId;
  }, [currentPlayer]);

  // ── Bid history (tracked locally) ──────────────────────────────────────────
  interface BidEntry { bidder: string; amount: number; ts: number; mine: boolean }
  const [bidHistory, setBidHistory] = useState<BidEntry[]>([]);
  const prevBidRef = useRef(0);
  const prevPlayerIdRef = useRef<string | null>(null);

  useEffect(() => {
    const pid = currentPlayer?.id ?? null;
    if (pid !== prevPlayerIdRef.current) {
      prevPlayerIdRef.current = pid;
      setBidHistory([]);
      prevBidRef.current = 0;
    }
  }, [currentPlayer?.id]);

  useEffect(() => {
    if (currentBid > prevBidRef.current && currentBid > 0 && currentBidderName) {
      const mine = myTeam ? currentBidderId === myTeam.id : false;
      setBidHistory((prev) => [
        { bidder: currentBidderName, amount: currentBid, ts: Date.now(), mine },
        ...prev,
      ].slice(0, 10));
      prevBidRef.current = currentBid;
    }
  }, [currentBid, currentBidderName, currentBidderId, myTeam]);

  // ── My squad (REST, auto-refreshes on WS player-count change) ──────────────
  const squadQ = useQuery<SquadPlayer[]>({
    queryKey: ["my-squad", tournamentId, myTeam?.id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: SquadPlayer[] } }>(
        `/tournaments/${tournamentId}/players?team_id=${myTeam!.id}&page_size=100`
      );
      return data.data.items;
    },
    enabled: !!tournamentId && !!myTeam?.id,
    staleTime: 5_000,
  });

  const prevPlayersCount = useRef(myTeam?.players_count ?? 0);
  useEffect(() => {
    if (!myTeam) return;
    if (myTeam.players_count !== prevPlayersCount.current) {
      prevPlayersCount.current = myTeam.players_count;
      qc.invalidateQueries({ queryKey: ["my-squad", tournamentId, myTeam.id] });
    }
  }, [myTeam?.players_count, myTeam, tournamentId, qc]);

  function placeBid(amount: number) {
    sendMessage("bid", { amount });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-amber-400" />
          <span className="font-bold">Live Auction</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-semibold",
            status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300" :
            status === "PAUSED" ? "bg-amber-500/20 text-amber-300" :
            status === "COMPLETED" ? "bg-blue-500/20 text-blue-300" :
            "bg-slate-700 text-slate-300"
          )}>
            {status}
          </span>
          {connected ? (
            <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
              <Wifi className="h-3.5 w-3.5" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-400 text-xs font-medium animate-pulse">
              <WifiOff className="h-3.5 w-3.5" /> Reconnecting…
            </span>
          )}
        </div>
      </div>

      {/* ── Team purse bar ─────────────────────────────────────────────────── */}
      {myTeam && (
        <div className="bg-slate-800 text-white px-4 py-3 flex items-center gap-4 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold">{myTeam.short_name.slice(0, 3)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 truncate">{myTeam.name}</p>
            <p className="text-sm font-bold text-amber-400">{fmt(myPurse)} remaining</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400">Squad</p>
            <p className="text-sm font-bold">{myTeam.players_count} players</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400">Queue</p>
            <p className="text-sm font-bold text-slate-300">{queueRemaining}</p>
          </div>
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto w-full p-4 space-y-4 pb-8">

          {/* Auction progress bar */}
          {(status === "ACTIVE" || status === "PAUSED") && (
            <div className="flex items-center gap-3 text-xs text-slate-500 bg-white rounded-xl border border-slate-100 px-4 py-2 shadow-sm">
              <span className="text-emerald-600 font-semibold">{playersSold} sold</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                {(playersSold + playersUnsold + queueRemaining) > 0 && (
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(playersSold / Math.max(1, playersSold + playersUnsold + queueRemaining)) * 100}%` }}
                  />
                )}
              </div>
              <span className="text-slate-400">{playersUnsold} unsold · {queueRemaining} left</span>
            </div>
          )}

          {/* ── SCHEDULED state ─────────────────────────────────────────── */}
          {status === "SCHEDULED" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center"
            >
              <Gavel className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">Waiting for Auction to Start</h3>
              <p className="text-sm text-slate-500 mt-1">The admin will start the auction shortly.</p>
            </motion.div>
          )}

          {/* ── COMPLETED state ─────────────────────────────────────────── */}
          {status === "COMPLETED" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center"
            >
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">Auction Completed!</h3>
              {myTeam && (
                <div className="mt-4 bg-emerald-50 rounded-xl p-4 space-y-1">
                  <p className="text-sm text-slate-600">
                    Final squad: <span className="font-bold text-slate-900">{myTeam.players_count} players</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Remaining points: <span className="font-bold text-emerald-700">{fmt(myPurse)}</span>
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate("/auction-results")}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold transition-colors"
              >
                View Results
              </button>
            </motion.div>
          )}

          {/* ── PAUSED banner ───────────────────────────────────────────── */}
          {status === "PAUSED" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
              <p className="font-semibold text-amber-800 text-sm">Auction Paused</p>
              <p className="text-xs text-amber-600 mt-0.5">Waiting for the admin to resume.</p>
            </div>
          )}

          {/* ── Current player card (ACTIVE or PAUSED) ─────────────────── */}
          {(status === "ACTIVE" || status === "PAUSED") && currentPlayer && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPlayer.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4"
              >
                <CurrentPlayerCard player={currentPlayer} />

                <TimerBar seconds={timerSeconds} max={60} />

                {/* Current bid display */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Current Bid</p>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={currentBid}
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 22 }}
                          className="text-2xl font-bold text-slate-900"
                        >
                          {currentBid > 0
                            ? <span className="text-emerald-700">{fmt(currentBid)}</span>
                            : <span className="text-slate-400 text-lg">No bids yet</span>
                          }
                        </motion.p>
                      </AnimatePresence>
                      {currentBidderName && (
                        <p className={cn("text-xs mt-0.5 font-semibold", isMyBid ? "text-emerald-600" : "text-slate-500")}>
                          {isMyBid ? "🏆 Your bid is leading!" : currentBidderName}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400 mb-0.5">My Points</p>
                      <p className="text-lg font-bold text-emerald-700">{fmt(myPurse)}</p>
                    </div>
                  </div>
                </div>

                {/* Bid buttons */}
                {status === "ACTIVE" && (
                  <BidButtons minNextBid={minNextBid} purse={myPurse} onBid={placeBid} disabled={!canBid} />
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* No player yet (ACTIVE, between players) */}
          {status === "ACTIVE" && !currentPlayer && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
              <TrendingUp className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Waiting for next player…</p>
            </div>
          )}

          {/* ── Bid history ─────────────────────────────────────────────── */}
          {bidHistory.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                <History className="h-3.5 w-3.5" /> Bid History
              </p>
              <div className="space-y-1.5">
                {bidHistory.map((b, i) => (
                  <div key={b.ts} className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-1.5 text-xs",
                    i === 0 ? (b.mine ? "bg-emerald-50 border border-emerald-100" : "bg-blue-50 border border-blue-100") : "bg-slate-50"
                  )}>
                    <span className={cn("font-medium truncate", i === 0 && b.mine ? "text-emerald-700" : "text-slate-700")}>
                      {b.bidder}
                    </span>
                    <span className={cn("font-bold ml-3 shrink-0", i === 0 ? "text-slate-900" : "text-slate-600")}>
                      {fmt(b.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── My current squad ────────────────────────────────────────── */}
          {myTeam && myTeam.players_count > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                <Shield className="h-3.5 w-3.5" /> My Squad ({myTeam.players_count})
              </p>
              {squadQ.isLoading ? (
                <div className="space-y-1.5">
                  {[1, 2, 3].map((i) => <div key={i} className="h-7 rounded-lg bg-slate-100 animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {(squadQ.data ?? []).filter(p => p.sold_price != null).map((p) => (
                    <div key={p.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0",
                        ROLE_COLORS[p.role] ?? "bg-slate-100 text-slate-600 border-slate-200"
                      )}>
                        {p.role === "ALL_ROUNDER" ? "AR" : p.role === "WICKET_KEEPER" ? "WK" : p.role[0]}
                      </span>
                      <span className="text-xs font-medium text-slate-700 flex-1 truncate">{p.name}</span>
                      {p.sold_price && (
                        <span className="text-xs font-bold text-amber-600 shrink-0">{fmt(p.sold_price)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── All teams purse summary ──────────────────────────────────── */}
          {teams.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                <Users className="h-3.5 w-3.5" /> All Teams
              </p>
              <div className="space-y-2">
                {[...teams].sort((a, b) => b.purse_remaining - a.purse_remaining).map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors",
                      t.id === myTeam?.id ? "bg-emerald-50 border border-emerald-100" : "bg-slate-50"
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {t.logo_url
                        ? <img src={t.logo_url} alt={t.name} className="w-full h-full object-cover" />
                        : <span className="text-xs font-bold text-slate-600">{t.short_name[0]}</span>
                      }
                    </div>
                    <span className={cn("flex-1 text-xs font-medium truncate", t.id === myTeam?.id ? "text-emerald-800" : "text-slate-700")}>
                      {t.name}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0">{t.players_count}p</span>
                    <span className={cn("text-xs font-bold shrink-0", t.id === myTeam?.id ? "text-emerald-700" : "text-slate-600")}>
                      {fmt(t.purse_remaining)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Toast notifications ─────────────────────────────────────────────── */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none max-w-xs w-full">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              onClick={() => dismissToast(t.id)}
              className={cn(
                "px-4 py-2.5 rounded-xl shadow-lg text-white text-sm font-medium cursor-pointer pointer-events-auto",
                t.type === "sold"   ? "bg-emerald-600" :
                t.type === "unsold" ? "bg-slate-600"   :
                t.type === "bid"    ? "bg-blue-600"    :
                t.type === "error"  ? "bg-red-600"     : "bg-slate-700"
              )}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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

export default CaptainAuctionPage;
