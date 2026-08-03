/**
 * SettingsPage — Account and profile settings.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { User, Lock, CheckCircle, Trophy, Building2, FileSpreadsheet, Upload, AlertCircle, GitMerge, Eye, EyeOff, Loader2, Download } from "lucide-react";

import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useTournament } from "@/contexts/TournamentContext";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { cn } from "@/lib/utils";

// ── Schemas ────────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(120),
  phone: z.string().max(20).optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ── Field component ────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5",
        "text-sm text-slate-900 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        props.className
      )}
    />
  );
}

function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10",
          "text-sm text-slate-900 placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          props.className
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5",
        "text-sm text-slate-900 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900",
        "resize-none",
        props.className
      )}
    />
  );
}

// ── Organization Settings Section ────────────────────────────────────────────

const LS_ORG_KEY = "apex_org_settings";

function getOrgSettings() {
  try {
    return JSON.parse(localStorage.getItem(LS_ORG_KEY) ?? "{}");
  } catch { return {}; }
}

function OrganizationSection() {
  const saved = getOrgSettings();
  const [orgName, setOrgName] = useState<string>(saved.orgName ?? "");
  const [currency, setCurrency] = useState<string>(saved.currency ?? "₹");
  const [savedOk, setSavedOk] = useState(false);

  function handleSave() {
    localStorage.setItem(LS_ORG_KEY, JSON.stringify({ orgName, currency }));
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2500);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-violet-600" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Organization</h2>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. BCCI, Premier League"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Currency Symbol</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40"
          >
            <option value="₹">₹ Indian Rupee</option>
            <option value="$">$ US Dollar</option>
            <option value="£">£ British Pound</option>
            <option value="€">€ Euro</option>
          </select>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
          >
            Save
          </button>
          {savedOk && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

// ── Active Tournament Section ─────────────────────────────────────────────────

interface TournamentItem { id: string; name: string; status: string }

function ActiveTournamentSection() {
  const { tournament, tournamentId, setActiveTournament } = useTournament();
  const [selected, setSelected] = useState(tournamentId ?? "");
  const [saved, setSaved] = useState(false);

  const tournamentsQ = useQuery<TournamentItem[]>({
    queryKey: ["tournaments-list-settings"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: TournamentItem[] } }>("/tournaments?page_size=100");
      return data.data.items;
    },
    staleTime: 60_000,
  });

  function handleSave() {
    const found = tournamentsQ.data?.find((t) => t.id === selected);
    if (!found) return;
    setActiveTournament({ id: found.id, name: found.name, status: found.status });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <Trophy className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Active Auction</h2>
          {tournament && (
            <p className="text-xs text-slate-500 mt-0.5">Current: <span className="font-medium text-amber-700">{tournament.name}</span></p>
          )}
        </div>
      </div>
      <div className="p-6 space-y-4">
        <p className="text-sm text-slate-500">
          Select which tournament drives the auction. All pages (Teams, Players, Auction) will use this tournament.
        </p>
        <div className="flex gap-3">
          <select
            value={selected}
            onChange={(e) => { setSelected(e.target.value); setSaved(false); }}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          >
            <option value="">— Select tournament —</option>
            {tournamentsQ.isLoading && <option disabled>Loading…</option>}
            {tournamentsQ.data?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selected || selected === tournamentId}
            onClick={handleSave}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Set Active
          </button>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle className="h-4 w-4" />
            Active tournament updated
          </span>
        )}
        {tournamentsQ.data?.length === 0 && (
          <p className="text-sm text-slate-400">No tournaments found. <a href="/tournament" className="text-navy-900 font-medium underline">Create one</a> in the Tournament page.</p>
        )}
      </div>
    </div>
  );
}

// ── Season Source Section ─────────────────────────────────────────────────────

interface TournamentFull {
  id: string;
  name: string;
  status: string;
  source_tournament_id: string | null;
}

function SeasonSourceSection() {
  const { tournamentId } = useTournament();
  const [selected, setSelected] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const [initDone, setInitDone] = useState<{ players: number; teams: number; name: string } | null>(null);

  const tournamentsQ = useQuery<TournamentFull[]>({
    queryKey: ["tournaments-list-source"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: TournamentFull[] } }>("/tournaments?page_size=100");
      return data.data.items;
    },
    staleTime: 60_000,
  });

  const currentTournament = tournamentsQ.data?.find((t) => t.id === tournamentId) ?? null;
  const currentSourceId = currentTournament?.source_tournament_id ?? null;
  const currentSourceName = tournamentsQ.data?.find((t) => t.id === currentSourceId)?.name;
  const otherTournaments = tournamentsQ.data?.filter((t) => t.id !== tournamentId) ?? [];

  const sourceMut = useMutation({
    mutationFn: async (sourceId: string | null) => {
      await apiClient.put(`/tournaments/${tournamentId}`, { source_tournament_id: sourceId ?? "" });
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      tournamentsQ.refetch();
    },
  });

  const initMut = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ data: { players_carried_forward: number; teams_carried_forward: number; source_tournament_name: string } }>(
        `/tournaments/${tournamentId}/new-season`
      );
      return data.data;
    },
    onSuccess: (res) => {
      setInitDone({ players: res.players_carried_forward, teams: res.teams_carried_forward, name: res.source_tournament_name });
      tournamentsQ.refetch();
    },
    onError: (e: any) => {
      const msg = (e as any)?.response?.data?.message ?? "Failed to initialize season.";
      alert(msg);
    },
  });

  if (!tournamentId) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <GitMerge className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Season Continuity</h2>
          {currentSourceName && (
            <p className="text-xs text-slate-500 mt-0.5">
              Linked to: <span className="font-medium text-indigo-700">{currentSourceName}</span>
            </p>
          )}
        </div>
      </div>
      <div className="p-6 space-y-5">
        {/* Step 1 — Link source */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Step 1 — Link previous season</p>
          <div className="flex gap-3">
            <select
              value={selected || currentSourceId || ""}
              onChange={(e) => { setSelected(e.target.value); setSaved(false); }}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            >
              <option value="">— None (independent tournament) —</option>
              {otherTournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
              ))}
            </select>
            <button
              type="button"
              disabled={sourceMut.isPending}
              onClick={() => sourceMut.mutate(selected || null)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {sourceMut.isPending ? "Saving…" : "Link"}
            </button>
          </div>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle className="h-4 w-4" />
              Season linked
            </span>
          )}
        </div>

        {/* Step 2 — Initialize (only shown when a source is linked) */}
        {currentSourceId && (
          <div className="space-y-3 border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Step 2 — Carry forward players & teams</p>
            <p className="text-sm text-slate-600">
              Copies all players and teams from <strong>{currentSourceName ?? "previous season"}</strong> into this
              tournament — all players set to <span className="font-medium text-emerald-700">AVAILABLE</span>, teams
              get a fresh budget, captain assignments are preserved.
            </p>

            {initDone ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">Season initialized from "{initDone.name}"</span>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-xl font-bold text-emerald-700">{initDone.players}</p>
                    <p className="text-xs text-slate-500">Players carried forward</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-emerald-700">{initDone.teams}</p>
                    <p className="text-xs text-slate-500">Teams carried forward</p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={initMut.isPending}
                onClick={() => initMut.mutate()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {initMut.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Initializing…</>
                ) : (
                  <><GitMerge className="h-4 w-4" /> Initialize Season</>
                )}
              </button>
            )}
          </div>
        )}

        {sourceMut.isError && (
          <span className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {(sourceMut.error as any)?.response?.data?.message ?? "Failed to update season link"}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Import Excel Section ──────────────────────────────────────────────────────

interface ImportResult {
  tournament: { name: string; id: string; action: string };
  teams: { name: string; action: string }[];
  players: { name: string; action: string; photo?: boolean; team?: string }[];
  stats: { player: string; action: string }[];
  errors: string[];
}

interface TournamentOption {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
}

const STATS_CSV_HEADERS = [
  "Name", "Matches", "Runs", "Average", "Strike Rate",
  "Highest Score", "Sixes", "Fours", "50s/100s", "",
  "Wickets", "Economy", "Catches/RunOuts",
];

function ImportExcelSection() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const tournamentsQ = useQuery<TournamentOption[]>({
    queryKey: ["settings-tournaments"],
    queryFn: async () => {
      const { data } = await apiClient.get("/tournaments?page_size=50");
      return data.data.items ?? [];
    },
    staleTime: 60_000,
  });

  const tournaments = tournamentsQ.data ?? [];
  const selectedTournament = tournaments.find((t) => t.id === selectedId) ?? null;
  const isCustom = selectedId === "__custom__";

  const tournamentName = isCustom
    ? customName
    : (selectedTournament?.name ?? "");

  const seasonYear = selectedTournament?.start_date
    ? String(new Date(selectedTournament.start_date).getFullYear())
    : String(new Date().getFullYear());

  const canImport = !!file && !!tournamentName.trim();

  const importMut = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      if (!tournamentName.trim()) throw new Error("Select or enter a tournament name");
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await apiClient.post<{ data: ImportResult }>(
        `/import/excel?tournament_name=${encodeURIComponent(tournamentName.trim())}&season_label=${encodeURIComponent(seasonYear)}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.data;
    },
    onSuccess: (data) => setResult(data),
    onError: () => setResult(null),
  });

  async function downloadTemplate() {
    setIsDownloadingTemplate(true);
    try {
      let playerNames: string[] = [];
      if (selectedId && !isCustom) {
        try {
          const { data } = await apiClient.get(`/players?tournament_id=${selectedId}&page_size=200`);
          playerNames = (data.data?.items ?? []).map((p: any) => String(p.name));
        } catch {
          /* generate template without names */
        }
      }

      const dataRows: string[][] = playerNames.length > 0
        ? playerNames.map((name) => [name, "", "", "", "", "", "", "", "0/0", "", "", "", "0/0"])
        : Array.from({ length: 5 }, (_, i) => [`Player ${i + 1}`, "", "", "", "", "", "", "", "0/0", "", "", "", "0/0"]);

      const escapeCell = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const csvContent = [STATS_CSV_HEADERS, ...dataRows]
        .map((row) => row.map(escapeCell).join(","))
        .join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = selectedTournament?.name.replace(/[^a-z0-9]/gi, "_") ?? "template";
      a.download = `stats_template_${safeName}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  const created = result
    ? {
        players: result.players.filter((p) => p.action === "created").length,
        teams: result.teams.filter((t) => t.action === "created").length,
        stats: result.stats.filter((s) => s.action === "created").length,
        photos: result.players.filter((p) => p.action === "created" && p.photo).length,
      }
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Import from Excel</h2>
          <p className="text-xs text-slate-500 mt-0.5">Import players, teams, and stats from the Excel roster file</p>
        </div>
      </div>
      <div className="p-6 space-y-4">

        {/* Tournament selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Tournament</label>
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setResult(null); }}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500"
          >
            <option value="">— Select tournament —</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}{t.status === "COMPLETED" ? " ✓" : t.status === "ACTIVE" ? " (active)" : ""}
              </option>
            ))}
            <option value="__custom__">+ Enter custom name…</option>
          </select>
          {tournamentsQ.isLoading && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading tournaments…
            </p>
          )}
        </div>

        {/* Custom name input */}
        {isCustom && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Custom Tournament Name</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Titan Season 2026"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500"
            />
            <p className="text-xs text-slate-400 mt-1">A new tournament will be created with this name.</p>
          </div>
        )}

        {/* Download template (only when tournament selected) */}
        {selectedId && !isCustom && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700">Stats Template</p>
              <p className="text-xs text-slate-500 mt-0.5">Download a CSV template pre-filled with player names for this tournament.</p>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              disabled={isDownloadingTemplate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {isDownloadingTemplate
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />
              }
              Download Template
            </button>
          </div>
        )}

        {/* File picker */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Excel File (.xlsx)</label>
          <label className="flex items-center gap-3 w-full cursor-pointer rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 px-4 py-4 transition-colors">
            <Upload className="h-5 w-5 text-slate-400 shrink-0" />
            <div className="min-w-0">
              {file ? (
                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
              ) : (
                <p className="text-sm text-slate-400">Click to choose Excel file</p>
              )}
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
            />
          </label>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            disabled={!canImport || importMut.isPending}
            onClick={() => importMut.mutate()}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
              "bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            <FileSpreadsheet className="h-4 w-4" />
            {importMut.isPending ? "Importing…" : "Import Data"}
          </button>
          {!canImport && !importMut.isPending && (
            <span className="text-xs text-slate-400">
              {!tournamentName.trim() ? "Select a tournament first" : "Choose an Excel file"}
            </span>
          )}
          {importMut.isError && (
            <span className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {(importMut.error as any)?.response?.data?.message ?? "Import failed"}
            </span>
          )}
        </div>

        {result && created && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">Import complete</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Players", value: created.players },
                { label: "Teams", value: created.teams },
                { label: "Stats", value: created.stats },
                { label: "Photos", value: created.photos },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-lg border border-emerald-200 p-3 text-center">
                  <p className="text-xl font-bold text-emerald-700">{value}</p>
                  <p className="text-xs text-slate-500">{label} created</p>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500">
              Tournament: <span className="font-medium text-slate-700">{result.tournament.name}</span>
              {" "}({result.tournament.action}) · Season {seasonYear}
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">Warnings ({result.errors.length})</p>
                <ul className="space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-xs text-amber-600">{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { user } = useAuthStore();
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? "",
      phone: user?.phone ?? "",
      bio: user?.bio ?? "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  const profileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      await apiClient.put("/users/me", data);
    },
    onSuccess: () => {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      await apiClient.post("/auth/change-password", {
        current_password: data.current_password,
        new_password: data.new_password,
      });
    },
    onSuccess: () => {
      setPasswordSaved(true);
      setPasswordError("");
      passwordForm.reset();
      setTimeout(() => setPasswordSaved(false), 3000);
    },
    onError: (err: any) => {
      setPasswordError(err?.response?.data?.message ?? "Failed to change password.");
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto py-8 space-y-8"
    >
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]} />

      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      {/* ── Active Auction ─────────────────────────────────────────────────── */}
      <ActiveTournamentSection />

      {/* ── Season Source ─────────────────────────────────────────────────── */}
      <SeasonSourceSection />

      {/* ── Import Excel ──────────────────────────────────────────────────── */}
      <ImportExcelSection />

      {/* ── Organization ──────────────────────────────────────────────────── */}
      <OrganizationSection />

      {/* ── Profile card ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Profile</h2>
        </div>
        <form
          onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))}
          className="p-6 space-y-5"
        >
          {/* Email — read only */}
          <Field label="Email">
            <Input value={user?.email ?? ""} disabled />
          </Field>

          <Field label="Full Name" error={profileForm.formState.errors.full_name?.message}>
            <Input
              {...profileForm.register("full_name")}
              placeholder="Your full name"
            />
          </Field>

          <Field label="Phone" error={profileForm.formState.errors.phone?.message}>
            <Input
              {...profileForm.register("phone")}
              type="tel"
              placeholder="+91 98765 43210"
            />
          </Field>

          <Field label="Bio" error={profileForm.formState.errors.bio?.message}>
            <Textarea
              {...profileForm.register("bio")}
              placeholder="A short bio..."
              rows={3}
            />
          </Field>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={profileMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {profileMutation.isPending ? "Saving…" : "Save Profile"}
            </button>
            {profileSaved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <CheckCircle className="h-4 w-4" />
                Saved
              </span>
            )}
            {profileMutation.isError && (
              <span className="text-sm text-red-600">Failed to save.</span>
            )}
          </div>
        </form>
      </div>

      {/* ── Change password card ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Lock className="h-4 w-4 text-amber-600" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Change Password</h2>
        </div>
        <form
          onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))}
          className="p-6 space-y-5"
        >
          <Field
            label="Current Password"
            error={passwordForm.formState.errors.current_password?.message}
          >
            <PasswordInput
              {...passwordForm.register("current_password")}
              placeholder="Enter current password"
            />
          </Field>

          <Field
            label="New Password"
            error={passwordForm.formState.errors.new_password?.message}
          >
            <PasswordInput
              {...passwordForm.register("new_password")}
              placeholder="At least 6 characters"
            />
          </Field>

          <Field
            label="Confirm New Password"
            error={passwordForm.formState.errors.confirm_password?.message}
          >
            <PasswordInput
              {...passwordForm.register("confirm_password")}
              placeholder="Repeat new password"
            />
          </Field>

          {passwordError && (
            <p className="text-sm text-red-600">{passwordError}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={passwordMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {passwordMutation.isPending ? "Updating…" : "Update Password"}
            </button>
            {passwordSaved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <CheckCircle className="h-4 w-4" />
                Password updated
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ── Account info ──────────────────────────────────────────────────── */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Account Info</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Role</p>
            <p className="font-semibold text-slate-900">{user?.global_role ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-500">Status</p>
            <p className={cn("font-semibold", user?.is_active ? "text-emerald-600" : "text-red-600")}>
              {user?.is_active ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SettingsPage;
