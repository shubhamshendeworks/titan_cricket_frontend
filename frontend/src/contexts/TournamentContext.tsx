import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiClient } from "@/lib/api";

const LS_KEY = "apex_active_tournament";
const POLL_INTERVAL_MS = 60_000; // re-fetch every 60 s to pick up admin changes

export interface ActiveTournament {
  id: string;
  name: string;
  status: string;
}

interface TournamentItem {
  id: string;
  name: string;
  status: string;
}

interface TournamentCtx {
  tournament: ActiveTournament | null;
  tournamentId: string | null;
  loading: boolean;
  setActiveTournament: (t: ActiveTournament) => void;
  refetch: () => void;
}

const TournamentContext = createContext<TournamentCtx>({
  tournament: null,
  tournamentId: null,
  loading: true,
  setActiveTournament: () => {},
  refetch: () => {},
});

/**
 * Priority order:
 *  1. ACTIVE  — the live tournament always wins, regardless of localStorage
 *  2. localStorage preference (if status is not DRAFT)
 *  3. COMPLETED (most recently completed)
 *  4. First tournament in the list
 */
function pickTournament(
  all: TournamentItem[],
  savedId?: string | null,
): TournamentItem | null {
  if (!all.length) return null;

  // 1. Always prefer the ACTIVE tournament
  const active = all.find((t) => t.status === "ACTIVE");
  if (active) return active;

  // 2. Use localStorage preference if it's a valid non-DRAFT tournament
  if (savedId) {
    const saved = all.find((t) => t.id === savedId);
    if (saved && saved.status !== "DRAFT") return saved;
  }

  // 3. Fall back to COMPLETED, then first
  return all.find((t) => t.status === "COMPLETED") ?? all[0];
}

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournament, setTournamentState] = useState<ActiveTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const doFetch = useCallback((isInitial = false) => {
    if (isInitial) setLoading(true);

    let savedId: string | null = null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { id?: string };
        savedId = parsed?.id ?? null;
      }
    } catch {}

    apiClient
      .get<{ data: { items: TournamentItem[] } }>("/tournaments?page_size=50")
      .then(({ data }) => {
        const all = data.data.items;
        const picked = pickTournament(all, savedId);
        if (picked) {
          setTournamentState({ id: picked.id, name: picked.name, status: picked.status });
          localStorage.setItem(
            LS_KEY,
            JSON.stringify({ id: picked.id, name: picked.name, status: picked.status }),
          );
        } else {
          setTournamentState(null);
        }
      })
      .catch(() => {
        // Backend unreachable — restore from localStorage if available
        try {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as ActiveTournament;
            if (parsed?.id) setTournamentState(parsed);
          }
        } catch {}
      })
      .finally(() => { if (isInitial) setLoading(false); });
  }, []);

  // Re-run whenever tick changes (manual refetch call)
  useEffect(() => {
    doFetch(tick === 0);
  }, [tick, doFetch]);

  // Poll every 60 s so captains auto-sync when admin changes the active tournament
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Re-fetch when the browser tab regains focus (captain switches back to the app)
  useEffect(() => {
    function onFocus() { setTick((n) => n + 1); }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  function refetch() {
    setTick((n) => n + 1);
  }

  function setActiveTournament(t: ActiveTournament) {
    setTournamentState(t);
    localStorage.setItem(LS_KEY, JSON.stringify(t));
  }

  return (
    <TournamentContext.Provider
      value={{
        tournament,
        tournamentId: tournament?.id ?? null,
        loading,
        setActiveTournament,
        refetch,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  return useContext(TournamentContext);
}
