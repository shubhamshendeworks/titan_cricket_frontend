/**
 * PlayersPage — Cricket players for the active tournament.
 * Route: /players
 * Captain management moved to /captains
 */

import { useNavigate } from "react-router-dom";
import { useTournament } from "@/contexts/TournamentContext";
import { PlayerListInner } from "@/pages/players/PlayerListPage";
import { motion } from "framer-motion";
import { Shirt } from "lucide-react";

import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/Button";

// ── Page ───────────────────────────────────────────────────────────────────────

export function PlayersPage() {
  const { tournamentId, loading } = useTournament();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 space-y-6"
    >
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Players" }]} />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Players</h1>
        <p className="text-sm text-slate-500 mt-0.5">Cricket players registered for the active tournament</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 py-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : !tournamentId ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <div className="h-20 w-20 rounded-2xl bg-navy-900 flex items-center justify-center mb-6">
            <Shirt className="h-10 w-10 text-gold-bright" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Tournament</h3>
          <p className="text-sm text-slate-500 max-w-sm text-center mb-8">
            Create or select a tournament to manage players.
          </p>
          <Button variant="gold" onClick={() => navigate("/tournament")}>
            Go to Tournament
          </Button>
        </div>
      ) : (
        <PlayerListInner tournamentId={tournamentId} />
      )}
    </motion.div>
  );
}

export default PlayersPage;
