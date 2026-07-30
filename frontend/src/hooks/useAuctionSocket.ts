/**
 * useAuctionSocket — React hook for live auction WebSocket.
 *
 * Connects to ws://host/api/v1/ws/auction/{tournamentId}?token=<jwt>
 * Reconnects automatically on disconnect (3-second backoff).
 *
 * Phase 2 voice engine integration:
 * ─ timer_tick drives milestone announcements (30s, 10s) and the final
 *   five-second countdown.  When a bid is active, seconds=5 says "Going once"
 *   and seconds=3 says "Going twice"; without a bid they say the number.
 * ─ player_up clears stale queue items, waits 3.5 s for the reveal animation,
 *   then introduces the player (name / role / base-points / "place your bids").
 * ─ bid_placed cancels any pending "Going once/twice" (the timer reset clears
 *   the danger zone) then queues the latest bid announcement.
 * ─ player_sold/unsold announce the final result and optionally "Preparing
 *   the next player."
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { voiceService, describePlayerRole, numberToWords } from "@/services/voiceService";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AuctionPlayerStats {
  matches: number;
  runs: number;
  highest_score: number;
  average: number;
  strike_rate: number;
  fifties: number;
  hundreds: number;
  wickets: number;
  economy: number;
  best_bowling: string | null;
  catches: number;
  run_outs: number;
  sixes: number;
  fours: number;
}

export interface AuctionPlayer {
  id: string;
  name: string;
  photo_url: string | null;
  role: string;
  jersey_number: number | null;
  batting_style: string | null;
  bowling_style: string | null;
  base_price: number;
  stats: AuctionPlayerStats | null;
}

export interface TeamPurse {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  captain_id: string | null;
  purse_remaining: number;
  players_count: number;
}

export interface AuctionState {
  status: string;           // SCHEDULED | ACTIVE | PAUSED | COMPLETED
  currentPlayer: AuctionPlayer | null;
  currentBid: number;
  currentBidderId: string | null;
  currentBidderName: string | null;
  timerSeconds: number;
  queueRemaining: number;
  bidsCount: number;
  minNextBid: number;
  teams: TeamPurse[];
  playersSold: number;
  playersUnsold: number;
}

export interface ToastEvent {
  id: string;
  type: "sold" | "unsold" | "bid" | "info" | "error";
  message: string;
}

const INITIAL: AuctionState = {
  status: "SCHEDULED",
  currentPlayer: null,
  currentBid: 0,
  currentBidderId: null,
  currentBidderName: null,
  timerSeconds: 60,
  queueRemaining: 0,
  bidsCount: 0,
  minNextBid: 0,
  teams: [],
  playersSold: 0,
  playersUnsold: 0,
};

function fmtBid(n: number): string {
  return `${n} Pts`;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAuctionSocket(tournamentId: string) {
  const token = useAuthStore((s) => s.accessToken);
  const [state, setState] = useState<AuctionState>(INITIAL);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  const wsRef    = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadRef  = useRef(false);

  // Phase 2 voice-state refs — updated synchronously inside WS handlers
  // so the timer_tick handler always reads current values without stale-closure issues.
  const hasPlayerRef = useRef(false);  // true while a player is under the hammer
  const hasBidRef    = useRef(false);  // true once at least one bid exists for current player
  const isPausedRef  = useRef(false);  // true while auction is PAUSED

  const pushToast = useCallback((type: ToastEvent["type"], message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  // Apply partial state fields from a WS message.
  // Uses !== undefined check so that explicit null values correctly clear state.
  const applyStateFields = useCallback((msg: Record<string, unknown>) => {
    setState((prev) => {
      const next = { ...prev };
      if (msg.status !== undefined)              next.status            = msg.status as string;
      if (msg.current_player !== undefined)      next.currentPlayer     = msg.current_player as AuctionPlayer | null;
      if (msg.current_bid !== undefined)         next.currentBid        = msg.current_bid as number;
      if (msg.current_bidder_id !== undefined)   next.currentBidderId   = msg.current_bidder_id as string | null;
      if (msg.current_bidder_name !== undefined) next.currentBidderName = msg.current_bidder_name as string | null;
      if (msg.timer_seconds !== undefined)       next.timerSeconds      = msg.timer_seconds as number;
      if (msg.queue_remaining !== undefined)     next.queueRemaining    = msg.queue_remaining as number;
      if (msg.bids_count !== undefined)          next.bidsCount         = msg.bids_count as number;
      if (msg.min_next_bid !== undefined)        next.minNextBid        = msg.min_next_bid as number;
      if (msg.teams !== undefined)               next.teams             = msg.teams as TeamPurse[];
      if (msg.players_sold !== undefined)        next.playersSold       = msg.players_sold as number;
      if (msg.players_unsold !== undefined)      next.playersUnsold     = msg.players_unsold as number;
      return next;
    });
  }, []);

  const connect = useCallback(() => {
    if (!token || deadRef.current) return;

    const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8000/api/v1";
    const url = `${WS_BASE}/ws/auction/${tournamentId}?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!deadRef.current) setConnected(true);
    };

    ws.onmessage = ({ data }) => {
      if (deadRef.current) return;
      let msg: Record<string, unknown>;
      try { msg = JSON.parse(data as string); } catch { return; }

      const t = msg.type as string;

      // ── timer_tick ─────────────────────────────────────────────────────────
      // Drives milestone announcements and the final countdown.
      // "Going once" (5 s) / "Going twice" (3 s) replace the numeric countdown
      // when a bid is active; a new bid resets the timer and bid_placed will
      // call cancelCountdown() to abort any pending "Going once / twice".
      if (t === "timer_tick") {
        const seconds = msg.seconds as number;
        setState((p) => ({ ...p, timerSeconds: seconds }));

        if (hasPlayerRef.current && !isPausedRef.current) {
          if (seconds === 30) {
            voiceService.speakCountdown("Thirty seconds remaining.");
          } else if (seconds === 10) {
            voiceService.speakCountdown("Final ten seconds.");
          } else if (seconds === 5) {
            voiceService.speakCountdown(hasBidRef.current ? "Going once." : "Five.");
          } else if (seconds === 4 && !hasBidRef.current) {
            voiceService.speakCountdown("Four.");
          } else if (seconds === 3) {
            voiceService.speakCountdown(hasBidRef.current ? "Going twice." : "Three.");
          } else if (seconds === 2) {
            voiceService.speakCountdown("Two.");
          } else if (seconds === 1) {
            voiceService.speakCountdown("One.");
          }
        }
        return;
      }

      // ── player_up ──────────────────────────────────────────────────────────
      // New player enters the auction floor.
      // Clear any stale queue from the previous sold/unsold sequence, wait for
      // the 3.5 s reveal animation, then introduce the player in full.
      if (t === "player_up") {
        applyStateFields(msg);
        hasPlayerRef.current = true;
        hasBidRef.current    = false;
        const p = msg.current_player as AuctionPlayer | null;
        if (p) {
          pushToast("info", `Now: ${p.name}`);
          const roleDesc  = describePlayerRole(p.role, p.batting_style, p.bowling_style);
          const baseWords = numberToWords(p.base_price);
          // Clear pending items from the previous player before adding the intro.
          // The currently-speaking utterance is NOT interrupted.
          voiceService.clearQueued();
          voiceService.announce([
            3500,                            // wait for PlayerRevealOverlay (3.5 s)
            `Next player is ${p.name}.`,
            500,
            `${roleDesc}.`,
            400,
            `Base Points: ${baseWords}.`,
            400,
            "Please place your bids.",
          ]);
        }
        return;
      }

      // ── bid_placed ────────────────────────────────────────────────────────
      // A new highest bid arrived.  The timer resets to 60 s on every bid, so
      // any pending "Going once / Going twice" is no longer valid — cancel it.
      if (t === "bid_placed") {
        applyStateFields(msg);
        hasBidRef.current = true;
        const bidderName = msg.current_bidder_name as string | null;
        if (bidderName) {
          voiceService.cancelCountdown();                     // abort going-once/twice
          voiceService.speakBid(`New highest bid from ${bidderName}.`);
        }
        return;
      }

      // ── player_sold ───────────────────────────────────────────────────────
      if (t === "player_sold") {
        const teams = msg.teams as TeamPurse[] | undefined;
        const qr    = msg.queue_remaining as number | undefined;
        setState((p) => ({
          ...p,
          currentPlayer:     null,
          currentBid:        0,
          currentBidderId:   null,
          currentBidderName: null,
          bidsCount:         0,
          playersSold:       p.playersSold + 1,
          ...(teams ? { teams } : {}),
          ...(qr !== undefined ? { queueRemaining: qr } : {}),
        }));
        hasPlayerRef.current = false;
        hasBidRef.current    = false;
        const price      = msg.price as number;
        const playerName = msg.player_name as string;
        const teamName   = msg.team_name   as string;
        pushToast("sold", `${playerName} → ${teamName} @ ${fmtBid(price)}`);
        voiceService.announce([
          "Sold!",
          500,
          `${playerName} joins ${teamName}.`,
          ...(qr !== undefined && qr > 0 ? [1500 as number, "Preparing the next player."] : []),
        ]);
        return;
      }

      // ── player_unsold ─────────────────────────────────────────────────────
      if (t === "player_unsold") {
        const qr = msg.queue_remaining as number | undefined;
        setState((p) => ({
          ...p,
          currentPlayer:     null,
          currentBid:        0,
          currentBidderId:   null,
          currentBidderName: null,
          bidsCount:         0,
          playersUnsold:     p.playersUnsold + 1,
          ...(qr !== undefined ? { queueRemaining: qr } : {}),
        }));
        hasPlayerRef.current = false;
        hasBidRef.current    = false;
        const playerName = msg.player_name as string;
        pushToast("unsold", `${playerName} went unsold`);
        voiceService.announce([
          "No further bids.",
          300,
          `${playerName} remains unsold.`,
          ...(qr !== undefined && qr > 0 ? [1500 as number, "Preparing the next player."] : []),
        ]);
        return;
      }

      // ── auction_paused ────────────────────────────────────────────────────
      if (t === "auction_paused") {
        applyStateFields(msg);
        setState((p) => ({ ...p, status: "PAUSED" }));
        isPausedRef.current = true;
        voiceService.announce(["Bidding is currently on hold."]);
        return;
      }

      // ── auction_resumed ───────────────────────────────────────────────────
      if (t === "auction_resumed") {
        applyStateFields(msg);
        setState((p) => ({ ...p, status: "ACTIVE" }));
        isPausedRef.current = false;
        voiceService.announce(["Bidding has resumed."]);
        return;
      }

      // ── auction_state (initial snapshot on connect) ───────────────────────
      if (t === "auction_state") {
        applyStateFields(msg);
        // Sync voice refs from the snapshot so a reconnect doesn't start blind.
        const snap = msg as Record<string, unknown>;
        hasPlayerRef.current = snap.current_player != null;
        hasBidRef.current    = (snap.current_bidder_id as string | null) != null;
        isPausedRef.current  = snap.status === "PAUSED";
        return;
      }

      // ── auction_completed ─────────────────────────────────────────────────
      if (t === "auction_completed") {
        const teams = msg.teams as TeamPurse[] | undefined;
        setState((p) => ({
          ...p,
          status:        "COMPLETED",
          currentPlayer: null,
          ...(teams ? { teams } : {}),
        }));
        hasPlayerRef.current = false;
        hasBidRef.current    = false;
        isPausedRef.current  = false;
        pushToast("info", "Auction completed!");
        voiceService.announce(["The auction is now complete.", 600, "Thank you for participating."]);
        return;
      }

      // ── timer_reset ───────────────────────────────────────────────────────
      if (t === "timer_reset") {
        applyStateFields(msg);
        return;
      }

      // ── queue_empty ───────────────────────────────────────────────────────
      if (t === "queue_empty") {
        setState((p) => ({ ...p, queueRemaining: 0, currentPlayer: null }));
        hasPlayerRef.current = false;
        pushToast("info", "All players processed — end the auction.");
        voiceService.announce(["All players have been processed."]);
        return;
      }

      // ── error ─────────────────────────────────────────────────────────────
      if (t === "error") {
        pushToast("error", (msg.message as string) ?? "An error occurred");
      }
    };

    ws.onclose = () => {
      if (!deadRef.current) {
        setConnected(false);
        timerRef.current = setTimeout(() => {
          if (!deadRef.current) connect();
        }, 3000);
      }
    };

    ws.onerror = () => ws.close();
  }, [token, tournamentId, applyStateFields, pushToast]);

  useEffect(() => {
    deadRef.current  = false;
    hasPlayerRef.current = false;
    hasBidRef.current    = false;
    isPausedRef.current  = false;
    connect();
    return () => {
      deadRef.current      = true;
      hasPlayerRef.current = false;
      hasBidRef.current    = false;
      isPausedRef.current  = false;
      voiceService.stop();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback(
    (action: string, data: Record<string, unknown> = {}) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action, ...data }));
      }
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { state, connected, toasts, dismissToast, sendMessage };
}
