/**
 * FixturesPage — Admin module for scheduling tournament matches.
 *
 * - Admin: full Create / Edit / Delete
 * - Captain / Others: view only
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  X,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  Radio,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Swords,
  Download,
} from "lucide-react";

import { apiClient } from "@/lib/api";
import { useTournament } from "@/contexts/TournamentContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Fixture {
  id: string;
  tournament_id: string;
  match_number: number;
  round_number: number;
  team_a_id: string;
  team_a_name: string;
  team_b_id: string;
  team_b_name: string;
  venue: string | null;
  scheduled_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Team {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
}

interface FixtureForm {
  team_a_id: string;
  team_b_id: string;
  date: string;
}

const EMPTY_FORM: FixtureForm = {
  team_a_id: "",
  team_b_id: "",
  date: "",
};

const ALL_STATUSES = ["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"] as const;

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  SCHEDULED: {
    label: "Scheduled",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <Calendar className="h-3 w-3" />,
  },
  LIVE: {
    label: "Live",
    cls: "bg-orange-50 text-orange-700 border-orange-200",
    icon: <Radio className="h-3 w-3" />,
  },
  COMPLETED: {
    label: "Completed",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-red-50 text-red-600 border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.SCHEDULED;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border", cfg.cls)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function TeamBadge({ name, shortName, logoUrl }: { name: string; shortName: string | null; logoUrl: string | null }) {
  const initials = (shortName || name)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
  return (
    <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
      <div
        className="h-[110px] w-[110px] rounded-2xl flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{
          background: logoUrl ? "white" : "linear-gradient(135deg, #1e3a5f 0%, #2d5c8e 100%)",
          border: "3px solid white",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(245,179,1,0.20), 0 0 20px rgba(245,179,1,0.07)",
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={name} className="h-full w-full object-contain p-2" />
        ) : (
          <span className="text-2xl font-black text-white tracking-wide select-none">{initials}</span>
        )}
      </div>
      <div className="text-center min-w-0 w-full px-1">
        <p className="text-sm font-extrabold text-slate-800 leading-tight line-clamp-2">{name}</p>
        {shortName && shortName !== name && (
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.12em] uppercase mt-0.5">{shortName}</p>
        )}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// ── Fixture Card ───────────────────────────────────────────────────────────────

function FixtureCard({
  fixture,
  index,
  isAdmin,
  onEdit,
  onDelete,
  teamMap,
}: {
  fixture: Fixture;
  index: number;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  teamMap: Record<string, { logo_url: string | null; short_name: string | null }>;
}) {
  const teamA = teamMap[fixture.team_a_id];
  const teamB = teamMap[fixture.team_b_id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.28), ease: "easeOut" }}
      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col transition-all duration-300 hover:border-amber-200/60"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)"; }}
    >
      {/* Header: Match number + Status — navy dark */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "linear-gradient(135deg, #0f1f3d 0%, #1a3460 100%)" }}
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Swords className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span className="text-xs font-extrabold text-white/90 uppercase tracking-widest">
            Match {fixture.match_number}
          </span>
        </div>
        <StatusPill status={fixture.status} />
      </div>

      {/* Teams matchup — hero section */}
      <div className="flex items-center justify-between gap-4 px-5 py-6 flex-1" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)" }}>
        <TeamBadge
          name={fixture.team_a_name}
          shortName={teamA?.short_name ?? null}
          logoUrl={teamA?.logo_url ?? null}
        />

        {/* VS medallion */}
        <div className="flex flex-col items-center justify-center shrink-0 gap-2">
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #f97316 0%, #f59e0b 100%)",
              boxShadow: "0 4px 16px rgba(249,115,22,0.30), 0 0 0 3px rgba(249,115,22,0.12)",
            }}
          >
            <span className="text-[13px] font-black text-white tracking-widest leading-none">VS</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-px w-4 bg-slate-200 rounded-full" />
            <div className="h-1 w-1 rounded-full bg-slate-300" />
            <div className="h-px w-4 bg-slate-200 rounded-full" />
          </div>
        </div>

        <TeamBadge
          name={fixture.team_b_name}
          shortName={teamB?.short_name ?? null}
          logoUrl={teamB?.logo_url ?? null}
        />
      </div>

      {/* Footer: date / time / venue + actions */}
      <div className="border-t border-slate-100 px-4 py-2.5" style={{ background: "linear-gradient(to right, #f8fafc, #f1f5f9)" }}>
        <div className="flex items-center justify-between gap-2">
          {/* Info */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 min-w-0">
            {fixture.scheduled_at ? (
              <>
                <span className="flex items-center gap-1 shrink-0">
                  <Calendar className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="font-semibold text-slate-600">{formatDate(fixture.scheduled_at)}</span>
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                  {formatTime(fixture.scheduled_at)}
                </span>
              </>
            ) : (
              <span className="italic text-slate-400">Date TBC</span>
            )}
            {fixture.venue && (
              <span className="flex items-center gap-1 min-w-0">
                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="truncate">{fixture.venue}</span>
              </span>
            )}
          </div>

          {/* Admin icon actions */}
          {isAdmin && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={onEdit}
                title="Edit fixture"
                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onDelete}
                title="Delete fixture"
                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Fixture Form Body ──────────────────────────────────────────────────────────

function FixtureFormBody({
  form,
  teams,
  onChange,
}: {
  form: FixtureForm;
  teams: Team[];
  onChange: (f: FixtureForm) => void;
}) {
  const inp = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-colors";
  const teamBOptions = teams.filter((t) => t.id !== form.team_a_id);

  return (
    <div className="space-y-4">
      {/* Team A */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Team A <span className="text-orange-500">*</span>
        </label>
        <select
          className={inp}
          value={form.team_a_id}
          onChange={(e) => {
            const newA = e.target.value;
            onChange({ ...form, team_a_id: newA, team_b_id: form.team_b_id === newA ? "" : form.team_b_id });
          }}
        >
          <option value="">— Select Team A —</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Team B */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Team B <span className="text-orange-500">*</span>
        </label>
        <select
          className={inp}
          value={form.team_b_id}
          onChange={(e) => onChange({ ...form, team_b_id: e.target.value })}
          disabled={!form.team_a_id}
        >
          <option value="">— Select Team B —</option>
          {teamBOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {form.team_a_id && teamBOptions.length === 0 && (
          <p className="text-xs text-red-500 mt-1">No other teams available.</p>
        )}
      </div>

      {/* VS preview */}
      {form.team_a_id && form.team_b_id && (
        <div className="flex items-center justify-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
          <span className="font-bold text-slate-900 text-sm">
            {teams.find((t) => t.id === form.team_a_id)?.name ?? "Team A"}
          </span>
          <span className="text-xs font-black text-orange-500 uppercase tracking-widest">vs</span>
          <span className="font-bold text-slate-900 text-sm">
            {teams.find((t) => t.id === form.team_b_id)?.name ?? "Team B"}
          </span>
        </div>
      )}

      {/* Match Date only */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Match Date</label>
        <input
          type="date"
          className={inp}
          value={form.date}
          onChange={(e) => onChange({ ...form, date: e.target.value })}
        />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export function FixturesPage() {
  const { tournamentId, loading } = useTournament();
  const qc = useQueryClient();
  const { isAdmin } = usePermissions();
  const filterContainerRef = useRef<HTMLDivElement>(null);

  // State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FixtureForm>(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<Fixture | null>(null);
  const [editForm, setEditForm] = useState<FixtureForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Fixture | null>(null);

  // Close filter popover on outside click
  useEffect(() => {
    if (!filtersOpen) return;
    const handler = (e: MouseEvent) => {
      if (!filterContainerRef.current?.contains(e.target as Node)) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filtersOpen]);

  // ── Queries ─────────────────────────────────────────────────────────────────

  const tournamentQ = useQuery<{ id: string; name: string }>({
    queryKey: ["tournament-detail", tournamentId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tournaments/${tournamentId}`);
      return data.data;
    },
    enabled: !!tournamentId,
    staleTime: 60_000,
  });

  const fixturesQ = useQuery<Fixture[]>({
    queryKey: ["fixtures", tournamentId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: Fixture[] } }>(
        `/tournaments/${tournamentId}/fixtures?page_size=200`
      );
      return data.data.items;
    },
    enabled: !!tournamentId,
    staleTime: 30_000,
  });

  const teamsQ = useQuery<Team[]>({
    queryKey: ["teams-list", tournamentId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: Team[] } }>(
        `/tournaments/${tournamentId}/teams?page_size=100`
      );
      return data.data.items;
    },
    enabled: !!tournamentId,
    staleTime: 60_000,
  });

  const teams = teamsQ.data ?? [];
  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, { logo_url: t.logo_url, short_name: t.short_name }])),
    [teams],
  );
  const tournamentName = tournamentQ.data?.name ?? "Tournament Fixtures";

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["fixtures", tournamentId] });
  }, [qc, tournamentId]);

  // ── Client-side filtering ────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const raw = fixturesQ.data ?? [];
    const q = search.trim().toLowerCase();
    return raw.filter((f) => {
      if (statusFilter && f.status !== statusFilter) return false;
      if (dateFilter && f.scheduled_at) {
        const fDate = f.scheduled_at.slice(0, 10);
        if (fDate !== dateFilter) return false;
      }
      if (q) {
        const haystack = `${f.team_a_name} ${f.team_b_name} ${f.venue ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [fixturesQ.data, search, statusFilter, dateFilter]);

  const hasFilters = !!(search || statusFilter || dateFilter);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = useCallback(() => {
    setSearch(""); setStatusFilter(""); setDateFilter(""); setPage(1);
  }, []);

  // ── Form helpers ─────────────────────────────────────────────────────────────

  function formToPayload(form: FixtureForm) {
    return {
      team_a_id: form.team_a_id,
      team_b_id: form.team_b_id,
      scheduled_at: form.date ? new Date(`${form.date}T00:00:00`).toISOString() : null,
    };
  }

  function fixtureToForm(f: Fixture): FixtureForm {
    return {
      team_a_id: f.team_a_id,
      team_b_id: f.team_b_id,
      date: f.scheduled_at ? new Date(f.scheduled_at).toISOString().slice(0, 10) : "",
    };
  }

  // ── PDF Export ───────────────────────────────────────────────────────────────

  function downloadFixturesPDF() {
    const all = (fixturesQ.data ?? []).slice().sort((a, b) => a.match_number - b.match_number);
    if (!all.length) { toast.error("No fixtures to export."); return; }
    const logoAbsUrl = window.location.origin + "/titan-logo.png";

    const rows = all
      .map((f) => {
        const dateStr = f.scheduled_at ? formatDate(f.scheduled_at) : "";
        return `<tr>
          <td class="num">Match ${f.match_number}</td>
          <td class="vs">${f.team_a_name} <span class="vslabel">vs</span> ${f.team_b_name}</td>
          <td class="date">${dateStr}</td>
        </tr>`;
      })
      .join("\n");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${tournamentName} — Fixture Schedule</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; padding: 48px 56px; }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
    p.sub { font-size: 12px; color: #666; margin-bottom: 32px; letter-spacing: 0.05em; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #e5e5e5; }
    tr:last-child { border-bottom: none; }
    td { padding: 10px 8px; font-size: 13px; vertical-align: middle; }
    td.num { color: #888; font-weight: 700; width: 100px; white-space: nowrap; }
    td.vs { font-weight: 600; }
    td.vs .vslabel { color: #f97316; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 6px; }
    td.date { color: #555; width: 130px; white-space: nowrap; text-align: right; }
    @media print { body { padding: 20px 24px; } }
  </style>
</head>
<body>
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
    <img src="${logoAbsUrl}" style="height:52px;object-fit:contain" alt="Titans" />
    <div>
      <h1 style="margin:0">${tournamentName}</h1>
      <p class="sub" style="margin:2px 0 0">Fixture Schedule &bull; ${all.length} match${all.length !== 1 ? "es" : ""}</p>
    </div>
  </div>
  <table><tbody>
    ${rows}
  </tbody></table>
</body>
</html>`;

    const w = window.open("", "_blank", "width=750,height=900");
    if (!w) { toast.error("Pop-up blocked — please allow pop-ups for this site."); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const createMut = useMutation({
    mutationFn: async (form: FixtureForm) => {
      await apiClient.post(`/tournaments/${tournamentId}/fixtures`, formToPayload(form));
    },
    onSuccess: () => {
      toast.success("Fixture created.");
      invalidate();
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
    },
    onError: (e: any) => {
      const detail = e?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Could not create fixture.");
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: FixtureForm }) => {
      await apiClient.put(`/tournaments/${tournamentId}/fixtures/${id}`, formToPayload(form));
    },
    onSuccess: () => {
      toast.success("Fixture updated.");
      invalidate();
      setEditTarget(null);
    },
    onError: (e: any) => {
      const detail = e?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Could not update fixture.");
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/tournaments/${tournamentId}/fixtures/${id}`);
    },
    onSuccess: () => {
      toast.success("Fixture deleted.");
      invalidate();
      setDeleteTarget(null);
    },
    onError: () => toast.error("Could not delete fixture."),
  });

  // ── Validation ───────────────────────────────────────────────────────────────

  function validateForm(form: FixtureForm): string | null {
    if (!form.team_a_id) return "Please select Team A.";
    if (!form.team_b_id) return "Please select Team B.";
    if (form.team_a_id === form.team_b_id) return "Team A and Team B cannot be the same.";
    return null;
  }

  // ── Loading / no tournament ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!tournamentId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CalendarDays className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm">No active tournament — configure one in Settings.</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 space-y-6"
    >
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Fixtures" }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fixtures</h1>
          {!fixturesQ.isLoading && (
            <p className="text-sm text-slate-500 mt-0.5">
              {total} match{total !== 1 ? "es" : ""}{hasFilters ? " matching filters" : ` scheduled (${fixturesQ.data?.length ?? 0} total)`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search teams, venue..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-colors"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter popover */}
          <div ref={filterContainerRef} className="relative">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors shadow-sm",
                filtersOpen ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-slate-200 text-slate-600",
              )}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-orange-500 ml-0.5" />}
            </button>

            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white rounded-2xl border border-slate-100 shadow-xl px-5 py-4 space-y-4"
                  style={{ minWidth: "280px" }}
                >
                  {/* Status filter */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setStatusFilter(""); setPage(1); }}
                        className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                          !statusFilter ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}
                      >All</button>
                      {ALL_STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { setStatusFilter(statusFilter === s ? "" : s); setPage(1); }}
                          className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                            statusFilter === s ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-700")}
                        >
                          {STATUS_CONFIG[s]?.label ?? s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date filter */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Match Date</p>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400"
                    />
                    {dateFilter && (
                      <button
                        type="button"
                        onClick={() => { setDateFilter(""); setPage(1); }}
                        className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 hover:text-orange-600 transition-colors"
                      >
                        <X className="h-3 w-3" /> Clear date
                      </button>
                    )}
                  </div>

                  {hasFilters && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => { clearFilters(); setFiltersOpen(false); }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear all
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PDF Download */}
          <button
            type="button"
            onClick={downloadFixturesPDF}
            disabled={!fixturesQ.data?.length}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium shadow-sm hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            title="Download fixtures as PDF"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Create button (admin only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => { setCreateForm(EMPTY_FORM); setCreateOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Fixture
            </button>
          )}
        </div>
      </div>

      {/* Cards / States */}
      {fixturesQ.isError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm text-red-500 mb-4">Failed to load fixtures.</p>
          <button onClick={() => fixturesQ.refetch()} className="text-sm text-slate-600 underline">Retry</button>
        </div>
      ) : fixturesQ.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : pageSlice.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-6 shadow-md">
            <Swords className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {hasFilters ? "No fixtures match your filters" : "No fixtures scheduled yet"}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mb-8">
            {hasFilters
              ? "Try clearing the filters to see all fixtures."
              : isAdmin
              ? "Create the first fixture for this tournament."
              : "Fixtures will appear here once they are scheduled."}
          </p>
          {hasFilters ? (
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-white transition-all">
              <X className="h-4 w-4" /> Clear Filters
            </button>
          ) : isAdmin ? (
            <button type="button" onClick={() => { setCreateForm(EMPTY_FORM); setCreateOpen(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-sm transition-colors">
              <Plus className="h-4 w-4" /> Add Fixture
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {pageSlice.map((fixture, i) => (
              <FixtureCard
                key={fixture.id}
                fixture={fixture}
                index={i}
                isAdmin={isAdmin}
                onEdit={() => { setEditTarget(fixture); setEditForm(fixtureToForm(fixture)); }}
                onDelete={() => setDeleteTarget(fixture)}
                teamMap={teamMap}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)}
            </span>{" "}
            of <span className="font-medium text-slate-700">{total}</span> fixtures
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 7) {
                if (page <= 4) p = i + 1;
                else if (page >= totalPages - 3) p = totalPages - 6 + i;
                else p = page - 3 + i;
              }
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={cn(
                    "h-8 w-8 rounded-lg text-sm font-medium border transition-colors",
                    p === page ? "bg-orange-500 text-white border-orange-500" : "border-slate-200 text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Create Modal ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setCreateForm(EMPTY_FORM); }}
        title="Schedule Fixture"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); setCreateForm(EMPTY_FORM); }}>
              Cancel
            </Button>
            <button
              disabled={!createForm.team_a_id || !createForm.team_b_id || createMut.isPending}
              onClick={() => {
                const err = validateForm(createForm);
                if (err) { toast.error(err); return; }
                createMut.mutate(createForm);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              {createMut.isPending ? "Creating…" : "Create Fixture"}
            </button>
          </>
        }
      >
        <FixtureFormBody form={createForm} teams={teams} onChange={setCreateForm} />
      </Modal>

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={editTarget ? `Edit — M${editTarget.match_number}: ${editTarget.team_a_name} vs ${editTarget.team_b_name}` : "Edit Fixture"}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <button
              disabled={!editForm.team_a_id || !editForm.team_b_id || updateMut.isPending}
              onClick={() => {
                const err = validateForm(editForm);
                if (err) { toast.error(err); return; }
                updateMut.mutate({ id: editTarget!.id, form: editForm });
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              {updateMut.isPending ? "Saving…" : "Save Changes"}
            </button>
          </>
        }
      >
        <FixtureFormBody form={editForm} teams={teams} onChange={setEditForm} />
      </Modal>

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget!.id)}
        title={`Delete M${deleteTarget?.match_number}: ${deleteTarget?.team_a_name ?? ""} vs ${deleteTarget?.team_b_name ?? ""}?`}
        description="This will permanently remove the fixture from the schedule."
        confirmLabel="Delete Fixture"
        loading={deleteMut.isPending}
        variant="danger"
      />
    </motion.div>
  );
}

export default FixturesPage;
