/**
 * AuctionResultsPage — Final auction results table.
 * Route: /auction/results
 */

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart2,
  CheckCircle,
  XCircle,
  Gavel,
  ArrowLeft,
} from "lucide-react";

import { apiClient } from "@/lib/api";
import { useTournament } from "@/contexts/TournamentContext";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ResultPlayer {
  player_id: string;
  player_name: string;
  role: string;
  base_price: number;
  final_price: number | null;
  status: "SOLD" | "UNSOLD" | "SKIPPED";
  sold_to_team_id: string | null;
  sold_to_team_name: string | null;
  total_bids: number;
}

interface AuctionResults {
  auction_id: string;
  auction_name: string;
  tournament_id: string;
  status: string;
  players_sold: number;
  players_unsold: number;
  total_amount_spent: number;
  results: ResultPlayer[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  BATSMAN: "BAT",
  BOWLER: "BOWL",
  ALL_ROUNDER: "AR",
  WICKET_KEEPER: "WK",
};

function fmt(n: number) {
  return `${n} pts`;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function AuctionResultsPage() {
  const { tournamentId, loading: tLoading } = useTournament();
  const navigate = useNavigate();

  const resultsQ = useQuery<AuctionResults>({
    queryKey: ["auction-results", tournamentId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: AuctionResults }>(
        `/tournaments/${tournamentId}/auction/results`
      );
      return data.data;
    },
    enabled: !!tournamentId,
    staleTime: 30_000,
    retry: false,
  });

  const results = resultsQ.data;
  const rows = results?.results ?? [];
  const sold = rows.filter((r) => r.status === "SOLD");
  const unsold = rows.filter((r) => r.status !== "SOLD");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 space-y-6"
    >
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Auction Results" },
        ]}
      />

      {/* Loading */}
      {(tLoading || resultsQ.isLoading) && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* No tournament */}
      {!tLoading && !tournamentId && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-navy-900 flex items-center justify-center mb-6">
            <BarChart2 className="h-10 w-10 text-gold-bright" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Tournament</h3>
          <p className="text-sm text-slate-500 mb-6">
            Create or select a tournament to view auction results.
          </p>
          <button
            type="button"
            onClick={() => navigate("/tournament")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Tournament
          </button>
        </div>
      )}

      {/* Error / no results */}
      {!tLoading && tournamentId && resultsQ.isError && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Gavel className="h-16 w-16 text-slate-300 mb-6" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Results Yet</h3>
          <p className="text-sm text-slate-500 mb-6">
            The auction hasn't been completed. Run the auction to generate results.
          </p>
          <button
            type="button"
            onClick={() => navigate("/auction")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Auction
          </button>
        </div>
      )}

      {/* Results */}
      {results && !resultsQ.isLoading && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Auction Results</h1>
              <p className="text-sm text-slate-500 mt-0.5">{results.auction_name}</p>
            </div>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold border",
              results.status === "COMPLETED"
                ? "bg-slate-100 text-slate-600 border-slate-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            )}>
              {results.status}
            </span>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Players Sold</p>
                <p className="text-2xl font-bold text-slate-900">{results.players_sold}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-red-400 flex items-center justify-center shrink-0">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Players Unsold</p>
                <p className="text-2xl font-bold text-slate-900">{results.players_unsold}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <BarChart2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Spend</p>
                <p className="text-2xl font-bold text-slate-900">{fmt(results.total_amount_spent)}</p>
              </div>
            </div>
          </div>

          {/* Results table */}
          {rows.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">All Players ({rows.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Player</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide hidden sm:table-cell">Role</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide hidden md:table-cell">Team</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide">Base</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide">Final</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide hidden lg:table-cell">Bids</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((p) => (
                      <tr key={p.player_id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-900">{p.player_name}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {ROLE_LABELS[p.role] ?? p.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                          {p.sold_to_team_name ?? <span className="text-slate-300 italic">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">{fmt(p.base_price)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {p.final_price != null ? fmt(p.final_price) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full border",
                            p.status === "SOLD"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-600 border-red-200"
                          )}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 hidden lg:table-cell">{p.total_bids}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sold section summary */}
          {sold.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <h3 className="font-semibold text-emerald-900 mb-3">Sold Players ({sold.length})</h3>
              <div className="flex flex-wrap gap-2">
                {sold.map((p) => (
                  <div key={p.player_id} className="bg-white rounded-xl border border-emerald-200 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-900">{p.player_name}</span>
                    {p.sold_to_team_name && (
                      <span className="text-emerald-700 ml-1.5">→ {p.sold_to_team_name}</span>
                    )}
                    {p.final_price != null && (
                      <span className="text-slate-500 ml-1.5">@ {fmt(p.final_price)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unsold */}
          {unsold.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <h3 className="font-semibold text-red-900 mb-3">Unsold Players ({unsold.length})</h3>
              <div className="flex flex-wrap gap-2">
                {unsold.map((p) => (
                  <span key={p.player_id} className="bg-white rounded-xl border border-red-200 px-3 py-2 text-sm text-slate-700">
                    {p.player_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default AuctionResultsPage;
