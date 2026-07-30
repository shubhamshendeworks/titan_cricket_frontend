/**
 * PlayerRevealOverlay — Cinematic player reveal animation.
 *
 * Triggered when the auction engine emits `player_up`. All connected clients
 * (Admin + Captains) see the same synchronized animation via the WS event.
 *
 * Animation timeline:
 *  0ms   — dark overlay fades in
 *  100ms — spotlight blooms from center
 *  200ms — 12 radial light beams (staggered by 30ms each)
 *  450ms — 3D card entrance (rotateX + translate + scale)
 *  750ms — player photo
 * 1000ms — player name
 * 1200ms — role badge
 * 1400ms — batting style
 * 1550ms — bowling style
 * 1700ms — base points number
 * 2000ms — glow pulse
 * 3500ms — auto-dismiss
 *
 * Click anywhere to skip.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AuctionPlayer } from "@/hooks/useAuctionSocket";
import { cn } from "@/lib/utils";

// ── Role colours ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, {
  gradient: string;
  glow: string;
  beam: string;
  badge: string;
  label: string;
}> = {
  BATSMAN: {
    gradient: "from-blue-600 via-blue-700 to-blue-900",
    glow:     "rgba(59,130,246,0.6)",
    beam:     "#3B82F6",
    badge:    "bg-blue-500/30 text-blue-200 border-blue-400/30",
    label:    "Batsman",
  },
  BOWLER: {
    gradient: "from-emerald-600 via-emerald-700 to-emerald-900",
    glow:     "rgba(16,185,129,0.6)",
    beam:     "#10B981",
    badge:    "bg-emerald-500/30 text-emerald-200 border-emerald-400/30",
    label:    "Bowler",
  },
  ALL_ROUNDER: {
    gradient: "from-purple-600 via-purple-700 to-purple-900",
    glow:     "rgba(139,92,246,0.6)",
    beam:     "#8B5CF6",
    badge:    "bg-purple-500/30 text-purple-200 border-purple-400/30",
    label:    "All-Rounder",
  },
  WICKET_KEEPER: {
    gradient: "from-amber-500 via-amber-600 to-amber-800",
    glow:     "rgba(245,158,11,0.6)",
    beam:     "#F59E0B",
    badge:    "bg-amber-500/30 text-amber-200 border-amber-400/30",
    label:    "Wicket Keeper",
  },
};

const DEFAULT_ROLE = {
  gradient: "from-slate-600 via-slate-700 to-slate-900",
  glow:     "rgba(100,116,139,0.6)",
  beam:     "#64748B",
  badge:    "bg-slate-500/30 text-slate-200 border-slate-400/30",
  label:    "Player",
};

function getRoleConfig(role: string) {
  return ROLE_CONFIG[role] ?? DEFAULT_ROLE;
}

function getInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RevealText({
  children,
  delay,
  className,
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0, 0.1, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  player: AuctionPlayer | null;
  onDismiss: () => void;
}

const BEAM_COUNT = 12;
const AUTO_DISMISS_MS = 3500;

export function PlayerRevealOverlay({ player, onDismiss }: Props) {
  const cfg = player ? getRoleConfig(player.role) : DEFAULT_ROLE;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Auto-dismiss after 3.5 seconds
  useEffect(() => {
    setDismissed(false);
    timerRef.current = setTimeout(() => {
      setDismissed(true);
      setTimeout(onDismiss, 500); // let fade-out finish
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [player?.id, onDismiss]);

  function handleSkip() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDismissed(true);
    setTimeout(onDismiss, 300);
  }

  if (!player) return null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          key="reveal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleSkip}
          className="fixed inset-0 flex items-center justify-center overflow-hidden"
          style={{
            zIndex: 800,
            background: "rgba(3,7,18,0.96)",
            backdropFilter: "blur(4px)",
          }}
        >
          {/* ── Spotlight ─────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0, 0.1, 1] }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${cfg.glow} 0%, transparent 70%)`,
            }}
          />

          {/* ── Radial Light Beams ─────────────────────────────────────────── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {Array.from({ length: BEAM_COUNT }, (_, i) => {
              const angle = (i * 360) / BEAM_COUNT;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: [0, 0.25, 0] }}
                  transition={{
                    duration: 2.5,
                    delay: 0.2 + i * 0.03,
                    ease: "easeOut",
                  }}
                  className="absolute origin-bottom"
                  style={{
                    width: "2px",
                    height: "50vmax",
                    background: `linear-gradient(to top, ${cfg.beam}50, transparent)`,
                    transform: `rotate(${angle}deg)`,
                    bottom: "50%",
                    left: "calc(50% - 1px)",
                  }}
                />
              );
            })}
          </div>

          {/* ── Player Card ────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 60, rotateX: 18, scale: 0.82 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.25, 0, 0.1, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm mx-4"
            style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
          >
            {/* Outer glow halo */}
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, delay: 2.0, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-4 rounded-3xl blur-2xl pointer-events-none"
              style={{ background: cfg.glow }}
            />

            {/* Card body */}
            <div
              className={cn(
                "relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl",
                `bg-gradient-to-br ${cfg.gradient}`,
              )}
            >
              {/* Diagonal stripe pattern */}
              <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.08) 10px, rgba(255,255,255,.08) 11px)",
                }}
              />

              {/* Header content */}
              <div className="relative z-10 flex flex-col items-center pt-10 pb-6 px-6">

                {/* ── Photo ──────────────────────────────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.75, ease: [0.34, 1.56, 0.64, 1] }}
                  className="relative mb-5"
                >
                  {/* Photo glow ring */}
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, delay: 2.0, repeat: Infinity }}
                    className="absolute -inset-1.5 rounded-full blur-md opacity-60 pointer-events-none"
                    style={{ background: cfg.glow }}
                  />
                  <div
                    className="relative h-32 w-32 rounded-full border-4 shadow-2xl overflow-hidden"
                    style={{ borderColor: "rgba(255,255,255,0.35)" }}
                  >
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-white/10">
                        <span className="text-3xl font-black text-white">
                          {getInitials(player.name)}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Jersey number */}
                  {player.jersey_number != null && (
                    <div
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30"
                      style={{ background: cfg.glow }}
                    >
                      <span className="text-white font-black text-xs">
                        {player.jersey_number}
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* ── Name ───────────────────────────────────────────────── */}
                <RevealText delay={1.0} className="text-center mb-2">
                  <h2 className="font-display font-black text-3xl text-white leading-tight tracking-wide uppercase">
                    {player.name}
                  </h2>
                </RevealText>

                {/* ── Role badge ─────────────────────────────────────────── */}
                <RevealText delay={1.2} className="mb-4">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-widest",
                    cfg.badge,
                  )}>
                    {cfg.label}
                  </span>
                </RevealText>

                {/* ── Playing styles ─────────────────────────────────────── */}
                <div className="w-full space-y-2 mb-5">
                  {player.batting_style && (
                    <RevealText delay={1.4}>
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/8 border border-white/10">
                        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Batting</span>
                        <span className="text-sm font-bold text-white">{player.batting_style}</span>
                      </div>
                    </RevealText>
                  )}
                  {player.bowling_style && (
                    <RevealText delay={1.55}>
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/8 border border-white/10">
                        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Bowling</span>
                        <span className="text-sm font-bold text-white">{player.bowling_style}</span>
                      </div>
                    </RevealText>
                  )}
                </div>

                {/* ── Base Points ────────────────────────────────────────── */}
                <RevealText delay={1.7} className="w-full">
                  <div className="rounded-2xl border border-white/15 bg-black/30 p-4 text-center">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1 font-semibold">
                      Base Points
                    </p>
                    <motion.p
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.75, ease: [0.34, 1.56, 0.64, 1] }}
                      className="font-display font-black text-4xl text-white"
                    >
                      {player.base_price}
                      <span className="text-lg font-bold text-white/50 ml-1">pts</span>
                    </motion.p>
                  </div>
                </RevealText>
              </div>

            </div>
          </motion.div>

          {/* ── Skip hint ───────────────────────────────────────────────────── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/25 font-medium pointer-events-none select-none"
          >
            Tap anywhere to skip
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
