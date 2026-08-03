/**
 * AuctionPage — Auction management.
 * Shows tournament selector when no tournament, create/schedule auction, player pool, auction state.
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Gavel,
  Trophy,
  Users,
  TrendingUp,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Trash2,
  Play,
  Settings,
  Clock,
  Lock,
} from "lucide-react";

import { usePermissions } from "@/hooks/usePermissions";

import { useTournament } from "@/contexts/TournamentContext";

import { apiClient } from "@/lib/api";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuctionState {
  id: string;
  name: string;
  status: string;
  scheduled_at: string | null;
  team_purse: number;
  min_bid_increment: number;
  max_squad_size: number;
  min_squad_size: number;
  players_sold: number;
  players_unsold: number;
  total_amount_spent: number;
  current_player_id: string | null;
  current_bid: number;
  current_bidder_team_name: string | null;
  started_at: string | null;
  completed_at: string | null;
}

interface Team {
  id: string;
  name: string;
  captain_name?: string | null;
  is_active: boolean;
}

interface AuctionPlayer {
  id: string;
  name: string;
  photo_url?: string | null;
  role: string;
  base_price: number;
  status: string;
}

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  SCHEDULED: { label: "Scheduled",  cls: "bg-blue-50 text-blue-700 border-blue-200",     dot: "bg-blue-400" },
  ACTIVE:    { label: "Live",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  PAUSED:    { label: "Paused",     cls: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400" },
  COMPLETED: { label: "Completed",  cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  CANCELLED: { label: "Cancelled",  cls: "bg-red-50 text-red-600 border-red-200",        dot: "bg-red-400" },
};

const ROLE_LABELS: Record<string, string> = {
  BATSMAN: "BAT", BOWLER: "BOWL", ALL_ROUNDER: "AR", WICKET_KEEPER: "WK",
};

// ── No tournament view ─────────────────────────────────────────────────────────

function NoTournamentView() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 px-8 text-center"
    >
      <div className="h-20 w-20 rounded-2xl bg-navy-900 flex items-center justify-center mb-6 shadow-md">
        <Gavel className="h-10 w-10 text-gold-bright" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Tournament</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-8">
        Create or select a tournament to set up and manage the auction.
      </p>
      <button
        type="button"
        onClick={() => navigate("/tournament")}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold transition-colors"
      >
        <Trophy className="h-4 w-4 text-gold-bright" />
        Go to Tournament
      </button>
    </motion.div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number;
  icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

// ── Readiness checklist ────────────────────────────────────────────────────────

function ReadinessItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {ok ? <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" /> : <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
      <span className={cn("text-sm", ok ? "text-slate-700" : "text-slate-400")}>{label}</span>
    </div>
  );
}

// ── Create/Schedule Auction Modal ─────────────────────────────────────────────

function AuctionConfigFields({
  teamPurse, setTeamPurse,
  minIncrement, setMinIncrement,
  maxSquad, setMaxSquad,
  minSquad, setMinSquad,
}: {
  teamPurse: string; setTeamPurse: (v: string) => void;
  minIncrement: string; setMinIncrement: (v: string) => void;
  maxSquad: string; setMaxSquad: (v: string) => void;
  minSquad: string; setMinSquad: (v: string) => void;
}) {
  const inp = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40";
  return (
    <div className="space-y-3 pt-1">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Auction Rules</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Team Points</label>
          <input type="number" min={0} value={teamPurse} onChange={(e) => setTeamPurse(e.target.value)} className={inp} placeholder="e.g. 1000" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Min Bid Increment (pts)</label>
          <input type="number" min={1} value={minIncrement} onChange={(e) => setMinIncrement(e.target.value)} className={inp} placeholder="e.g. 5" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Max Squad Size</label>
          <input type="number" min={1} value={maxSquad} onChange={(e) => setMaxSquad(e.target.value)} className={inp} placeholder="e.g. 25" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Min Squad Size</label>
          <input type="number" min={1} value={minSquad} onChange={(e) => setMinSquad(e.target.value)} className={inp} placeholder="e.g. 11" />
        </div>
      </div>
    </div>
  );
}

function CreateAuctionModal({ isOpen, onClose, tournamentId }: {
  isOpen: boolean; onClose: () => void; tournamentId: string;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("Auction");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [teamPurse, setTeamPurse] = useState("1000");
  const [minIncrement, setMinIncrement] = useState("5");
  const [maxSquad, setMaxSquad] = useState("25");
  const [minSquad, setMinSquad] = useState("11");

  const createMut = useMutation({
    mutationFn: async () => {
      let scheduled_at: string | null = null;
      if (scheduledDate) {
        scheduled_at = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      }
      await apiClient.post(`/tournaments/${tournamentId}/auction`, {
        name,
        scheduled_at,
        team_purse: parseInt(teamPurse, 10) || 0,
        min_bid_increment: parseInt(minIncrement, 10) || 5,
        max_squad_size: parseInt(maxSquad, 10) || 25,
        min_squad_size: parseInt(minSquad, 10) || 11,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auction", tournamentId] });
      toast.success("Auction created");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to create auction"),
  });

  const inp = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Auction" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Auction Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g.  2026 Auction" className={inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date (optional)</label>
          <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className={inp} />
        </div>
        {scheduledDate && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Time</label>
            <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className={inp} />
          </div>
        )}
        <AuctionConfigFields
          teamPurse={teamPurse} setTeamPurse={setTeamPurse}
          minIncrement={minIncrement} setMinIncrement={setMinIncrement}
          maxSquad={maxSquad} setMaxSquad={setMaxSquad}
          minSquad={minSquad} setMinSquad={setMinSquad}
        />
        {createMut.isError && (
          <p className="text-sm text-red-600">{(createMut.error as any)?.response?.data?.message ?? "Failed to create auction"}</p>
        )}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50">Cancel</button>
          <button
            type="button"
            disabled={createMut.isPending}
            onClick={() => createMut.mutate()}
            className="flex-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {createMut.isPending ? "Creating…" : "Create Auction"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Edit Auction Config Modal ─────────────────────────────────────────────────

function EditConfigModal({ isOpen, onClose, tournamentId, auction }: {
  isOpen: boolean; onClose: () => void; tournamentId: string; auction: AuctionState;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(auction.name);
  const [teamPurse, setTeamPurse] = useState(String(auction.team_purse ?? 0));
  const [minIncrement, setMinIncrement] = useState(String(auction.min_bid_increment ?? 5));
  const [maxSquad, setMaxSquad] = useState(String(auction.max_squad_size ?? 25));
  const [minSquad, setMinSquad] = useState(String(auction.min_squad_size ?? 11));

  const saveMut = useMutation({
    mutationFn: async () => {
      await apiClient.put(`/tournaments/${tournamentId}/auction`, {
        name,
        team_purse: parseInt(teamPurse, 10) || 0,
        min_bid_increment: parseInt(minIncrement, 10) || 5,
        max_squad_size: parseInt(maxSquad, 10) || 25,
        min_squad_size: parseInt(minSquad, 10) || 11,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auction", tournamentId] });
      toast.success("Auction config updated");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to update config"),
  });

  const inp = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Auction" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Auction Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inp} />
        </div>
        <AuctionConfigFields
          teamPurse={teamPurse} setTeamPurse={setTeamPurse}
          minIncrement={minIncrement} setMinIncrement={setMinIncrement}
          maxSquad={maxSquad} setMaxSquad={setMaxSquad}
          minSquad={minSquad} setMinSquad={setMinSquad}
        />
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50">Cancel</button>
          <button
            type="button"
            disabled={saveMut.isPending}
            onClick={() => saveMut.mutate()}
            className="flex-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {saveMut.isPending ? "Saving…" : "Save Config"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Schedule Update Modal ─────────────────────────────────────────────────────

function ScheduleModal({ isOpen, onClose, tournamentId, auction }: {
  isOpen: boolean; onClose: () => void; tournamentId: string; auction: AuctionState;
}) {
  const qc = useQueryClient();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");

  // Re-sync whenever the modal opens or the saved schedule changes
  useEffect(() => {
    if (!isOpen) return;
    const d = auction.scheduled_at ? new Date(auction.scheduled_at) : null;
    setDate(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "");
    setTime(d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "10:00");
  }, [isOpen, auction.scheduled_at]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const scheduled_at = date ? new Date(`${date}T${time}:00`).toISOString() : null;
      const { data } = await apiClient.put<{ data: AuctionState }>(`/tournaments/${tournamentId}/auction`, { scheduled_at });
      return data.data;
    },
    onSuccess: (updatedAuction) => {
      qc.setQueryData(["auction", tournamentId], updatedAuction);
      toast.success("Schedule updated");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to update schedule"),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Auction" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50">Cancel</button>
          <button
            type="button"
            disabled={!date || saveMut.isPending}
            onClick={() => saveMut.mutate()}
            className="flex-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {saveMut.isPending ? "Saving…" : "Save Schedule"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Captain read-only view ────────────────────────────────────────────────────

function CaptainAuctionView({ tournamentId }: { tournamentId: string }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState("—");

  const auctionQ = useQuery<AuctionState | null>({
    queryKey: ["auction", tournamentId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ data: AuctionState }>(`/tournaments/${tournamentId}/auction`);
        return res.data.data;
      } catch {
        return null;
      }
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const auction = auctionQ.data ?? null;
  const statusCfg = auction ? STATUS_CONFIG[auction.status] ?? STATUS_CONFIG.SCHEDULED : null;
  const isActive = auction?.status === "ACTIVE";
  const isScheduled = auction?.status === "SCHEDULED";

  useEffect(() => {
    if (!auction?.scheduled_at || isActive) return;
    const tick = () => {
      const diff = new Date(auction.scheduled_at!).getTime() - Date.now();
      if (diff <= 0) { setCountdown("Starting soon…"); return; }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setCountdown(`${d > 0 ? d + "d " : ""}${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [auction?.scheduled_at, isActive]);

  if (auctionQ.isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {!auction ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Gavel className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-700 mb-2">No Auction Scheduled</h3>
          <p className="text-sm text-slate-400">The admin has not scheduled an auction yet. Check back later.</p>
        </div>
      ) : (
        <>
          {/* Status card */}
          <div className={cn(
            "rounded-2xl border-2 p-6",
            isActive
              ? "bg-emerald-50 border-emerald-300"
              : isScheduled
              ? "bg-blue-50 border-blue-200"
              : "bg-white border-slate-100 shadow-sm"
          )}>
            <div className="flex items-center gap-3 mb-4">
              <span className={cn(
                "h-3.5 w-3.5 rounded-full shrink-0",
                statusCfg?.dot ?? "bg-slate-400",
                isActive && "animate-pulse",
              )} />
              <span className={cn("text-sm font-bold px-3 py-1 rounded-full border", statusCfg?.cls ?? "")}>
                {statusCfg?.label ?? auction.status}
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-1">{auction.name}</h2>

            {isActive && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold text-emerald-700 animate-pulse">
                  ● Auction is live right now!
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Sold", value: auction.players_sold, color: "text-emerald-700" },
                    { label: "Unsold", value: auction.players_unsold, color: "text-red-600" },
                    { label: "Pts Spent", value: auction.total_amount_spent, color: "text-blue-700" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-white/50">
                      <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isScheduled && auction.scheduled_at && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
                  {new Date(auction.scheduled_at).toLocaleString()}
                </div>
                <div className="bg-white rounded-xl border border-blue-100 p-4 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Starts in</p>
                  <p className="text-3xl font-black text-blue-700 font-mono">{countdown}</p>
                </div>
              </div>
            )}

            {!isActive && !isScheduled && (
              <p className="text-sm text-slate-500 mt-2">
                Status: <span className="font-semibold">{auction.status}</span>
              </p>
            )}
          </div>

          {/* Join button */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
            {isActive ? (
              <>
                <p className="text-sm text-emerald-700 font-semibold mb-4">
                  The auction is live — join now to place bids!
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/auction/bid")}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
                >
                  <Play className="h-4 w-4" />
                  Join Auction Now
                </button>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Lock className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  Join button will activate when the auction goes live.
                </p>
                <button
                  disabled
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-slate-200 text-slate-400 font-bold text-sm cursor-not-allowed"
                >
                  <Lock className="h-4 w-4" />
                  Join Auction
                </button>
              </>
            )}
          </div>

          {/* Results link if completed */}
          {auction.status === "COMPLETED" && (
            <button
              type="button"
              onClick={() => navigate("/auction-results")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-sm transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              View Auction Results
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Inner page (has tournamentId) ─────────────────────────────────────────────

function AuctionInner({ tournamentId }: { tournamentId: string }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"overview" | "pool">("overview");
  const [createOpen, setCreateOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const auctionQ = useQuery<AuctionState | null>({
    queryKey: ["auction", tournamentId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ data: AuctionState }>(`/tournaments/${tournamentId}/auction`);
        return res.data.data;
      } catch {
        return null;
      }
    },
    staleTime: 10_000,
  });

  const teamsQ = useQuery<Team[]>({
    queryKey: ["auction-teams", tournamentId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: Team[] } }>(
        `/tournaments/${tournamentId}/teams?page_size=100`
      );
      return data.data.items;
    },
    staleTime: 30_000,
  });

  const poolQ = useQuery<AuctionPlayer[]>({
    queryKey: ["auction-pool", tournamentId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: AuctionPlayer[] } }>(
        `/tournaments/${tournamentId}/players?status=AVAILABLE&page_size=200`
      );
      return data.data.items.filter((p) => p.status === "AVAILABLE");
    },
    staleTime: 30_000,
  });

  const deleteMut = useMutation({
    mutationFn: () => apiClient.delete(`/tournaments/${tournamentId}/auction`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auction", tournamentId] });
      toast.success("Auction deleted");
      setDeleteOpen(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to delete auction"),
  });

  if (auctionQ.isPending || teamsQ.isPending) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />)}
      </div>
    );
  }

  const auction = auctionQ.data ?? null;
  const teams = Array.isArray(teamsQ.data) ? teamsQ.data : [];
  const pool = poolQ.data ?? [];

  const teamsWithCaptain = teams.filter((t) => t.captain_name && t.is_active).length;
  const readiness = {
    hasTeams: teams.length >= 2,
    hasCaptains: teamsWithCaptain > 0,
    hasPlayers: pool.length > 0,
    hasAuction: !!auction,
    hasSchedule: !!auction?.scheduled_at,
  };

  const statusCfg = auction ? STATUS_CONFIG[auction.status] ?? STATUS_CONFIG.SCHEDULED : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Auction</h1>
          {auction && statusCfg && (
            <span className={cn("mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border", statusCfg.cls)}>
              <Gavel className="h-3.5 w-3.5" />
              {statusCfg.label}
              {auction.scheduled_at && (
                <span className="opacity-75">
                  — {new Date(auction.scheduled_at).toLocaleString()}
                </span>
              )}
            </span>
          )}
        </div>
        {!auction && !auctionQ.isLoading && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Auction
          </button>
        )}
        {auction && (
          <div className="flex gap-2 flex-wrap">
            {["SCHEDULED", "ACTIVE", "PAUSED"].includes(auction.status) && (
              <Link
                to="/auction/live"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Play className="h-4 w-4" />
                {auction.status === "ACTIVE" ? "Rejoin Live" : "Go Live"}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setScheduleOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              {auction.scheduled_at ? "Reschedule" : "Schedule"}
            </button>
            <button
              type="button"
              onClick={() => setConfigOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Configure
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {auction && (
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {(["overview", "pool"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t === "overview" ? "Overview" : "Player Pool"}
            </button>
          ))}
        </div>
      )}

      {auctionQ.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : !auction ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* No auction — readiness */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Auction Readiness</h2>
            <div className="divide-y divide-slate-50">
              <ReadinessItem ok={readiness.hasTeams} label={`Teams created (${teams.length} found, need ≥2)`} />
              <ReadinessItem ok={readiness.hasCaptains} label={`Captains assigned (${teamsWithCaptain}/${teams.length} teams have captain)`} />
              <ReadinessItem ok={false} label="Players registered (go to Players to add)" />
              <ReadinessItem ok={readiness.hasAuction} label="Auction created" />
              <ReadinessItem ok={readiness.hasSchedule} label="Auction scheduled" />
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col justify-center text-center">
            <Gavel className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="font-semibold text-amber-900 mb-2">No Auction Yet</h3>
            <p className="text-sm text-amber-700 mb-4">
              Create an auction to configure scheduling and start the player bidding process.
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mx-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Auction
            </button>
          </div>
        </div>
      ) : tab === "overview" ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Players Sold" value={auction.players_sold} icon={Users} color="bg-emerald-500" />
            <StatCard label="Players Unsold" value={auction.players_unsold} icon={Users} color="bg-red-400" />
            <StatCard label="Total Spent" value={`${auction.total_amount_spent} Pts`} icon={TrendingUp} color="bg-blue-500" />
            <StatCard label="Teams" value={teams.length} icon={Trophy} color="bg-amber-500" />
          </div>

          {/* Readiness */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Auction Readiness</h2>
            <div className="divide-y divide-slate-50">
              <ReadinessItem ok={readiness.hasTeams} label={`Teams: ${teams.length} created`} />
              <ReadinessItem ok={readiness.hasCaptains} label={`Captains: ${teamsWithCaptain}/${teams.length} teams have captain`} />
              <ReadinessItem ok={readiness.hasAuction} label="Auction created" />
              <ReadinessItem ok={readiness.hasSchedule} label={auction.scheduled_at ? `Scheduled: ${new Date(auction.scheduled_at).toLocaleString()}` : "Auction not scheduled yet"} />
            </div>
          </div>

          {/* Config summary */}
          {(auction.team_purse > 0 || auction.min_bid_increment > 0) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Auction Configuration</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-slate-50">
                  <p className="text-xs text-slate-500 mb-1">Team Points</p>
                  <p className="font-bold text-slate-900">{auction.team_purse} pts</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50">
                  <p className="text-xs text-slate-500 mb-1">Min Increment</p>
                  <p className="font-bold text-slate-900">{auction.min_bid_increment} pts</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50">
                  <p className="text-xs text-slate-500 mb-1">Max Squad</p>
                  <p className="font-bold text-slate-900">{auction.max_squad_size} players</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50">
                  <p className="text-xs text-slate-500 mb-1">Min Squad</p>
                  <p className="font-bold text-slate-900">{auction.min_squad_size} players</p>
                </div>
              </div>
            </div>
          )}

          {auction.status === "ACTIVE" && auction.current_bidder_team_name && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center gap-4">
              <Trophy className="h-8 w-8 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm text-emerald-700 font-medium">Current Highest Bidder</p>
                <p className="text-xl font-bold text-emerald-900">
                  {auction.current_bidder_team_name} — {auction.current_bid} Pts
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Player Pool tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Eligible Players ({pool.length})</h2>
            <p className="text-xs text-slate-500">Showing: status=AVAILABLE, auction_eligible=true</p>
          </div>
          {poolQ.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : pool.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <Users className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No eligible players found</p>
              <p className="text-sm text-slate-400 mt-1">Players must be active, available, and auction-eligible</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Player</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide hidden sm:table-cell">Role</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide hidden md:table-cell">Set</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide">Base Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pool.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0">
                            {p.photo_url ? (
                              <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover rounded-full" />
                            ) : (
                              <span className="text-xs font-bold text-white">{p.name[0]?.toUpperCase()}</span>
                            )}
                          </div>
                          <span className="font-medium text-slate-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {ROLE_LABELS[p.role] ?? p.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{p.base_price} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateAuctionModal isOpen={createOpen} onClose={() => setCreateOpen(false)} tournamentId={tournamentId} />
      {auction && (
        <ScheduleModal
          isOpen={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          tournamentId={tournamentId}
          auction={auction}
        />
      )}
      {auction && (
        <EditConfigModal
          isOpen={configOpen}
          onClose={() => setConfigOpen(false)}
          tournamentId={tournamentId}
          auction={auction}
        />
      )}
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMut.mutate()}
        title="Delete Auction"
        description="Are you sure you want to delete this auction? All auction data will be lost."
        confirmLabel="Delete"
        loading={deleteMut.isPending}
        variant="danger"
      />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function AuctionPage() {
  const { tournamentId, loading } = useTournament();
  const { isCaptain } = usePermissions();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 space-y-6"
    >
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Auction" }]} />

      {/* Captain header */}
      {isCaptain && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
          <Clock className="h-4 w-4 text-blue-500 shrink-0" />
          <p className="text-sm text-blue-800 font-medium">
            Captain View — you can join the auction when it becomes active.
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : !tournamentId ? (
        <NoTournamentView />
      ) : isCaptain ? (
        <CaptainAuctionView tournamentId={tournamentId} />
      ) : (
        <AuctionInner tournamentId={tournamentId} />
      )}
    </motion.div>
  );
}

export default AuctionPage;
