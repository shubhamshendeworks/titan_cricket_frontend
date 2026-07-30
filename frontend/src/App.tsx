import { Navigate, Route, Routes } from "react-router-dom";
import { TournamentProvider } from "@/contexts/TournamentContext";

// ── Layouts ───────────────────────────────────────────────────────────────────
import { AppLayout }      from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

// ── Auth pages ────────────────────────────────────────────────────────────────
import { LoginPage }           from "@/features/auth/LoginPage";
import { RegisterPage }        from "@/features/auth/RegisterPage";
import { ForgotPasswordPage }  from "@/features/auth/ForgotPasswordPage";
import { ResetPasswordPage }   from "@/features/auth/ResetPasswordPage";
import { VerifyEmailPage }     from "@/features/auth/VerifyEmailPage";

// ── Pages ─────────────────────────────────────────────────────────────────────
import { DashboardPage }      from "@/features/dashboard/DashboardPage";
import { TournamentPage }     from "@/pages/tournament/TournamentPage";
import { TeamListPage }       from "@/pages/teams/TeamListPage";
import { TeamDetailPage }     from "@/pages/teams/TeamDetailPage";
import { CaptainsPage }       from "@/pages/captains/CaptainsPage";
import { PlayersPage }        from "@/pages/players/PlayersPage";
import { PlayerDetailPage }   from "@/pages/players/PlayerDetailPage";
import { AuctionPage }        from "@/pages/auction/AuctionPage";
import { LiveAuctionPage }    from "@/pages/auction/LiveAuctionPage";
import { CaptainAuctionPage } from "@/pages/auction/CaptainAuctionPage";
import { AuctionResultsPage } from "@/pages/auction/AuctionResultsPage";
import { FixturesPage }            from "@/pages/fixtures/FixturesPage";
import { TournamentHistoryPage }  from "@/pages/history/TournamentHistoryPage";
import { SettingsPage }           from "@/pages/settings/SettingsPage";

// ── Error pages ───────────────────────────────────────────────────────────────
import { UnauthorizedPage, NotFoundPage } from "@/pages/stubs";

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* ── Auth routes ──────────────────────────────────────────────────── */}
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />
      <Route path="/verify-email"    element={<VerifyEmailPage />} />
      <Route path="/unauthorized"    element={<UnauthorizedPage />} />

      {/* ── Protected app routes ─────────────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <TournamentProvider>
              <AppLayout />
            </TournamentProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Tournament */}
        <Route path="/tournament" element={<TournamentPage />} />

        {/* Teams */}
        <Route path="/teams"         element={<TeamListPage />} />
        <Route path="/teams/:teamId" element={<TeamDetailPage />} />

        {/* Captains — admin only */}
        <Route path="/captains" element={<ProtectedRoute requiredRole="TOURNAMENT_ADMIN"><CaptainsPage /></ProtectedRoute>} />

        {/* Players */}
        <Route path="/players"           element={<PlayersPage />} />
        <Route path="/players/:playerId" element={<PlayerDetailPage />} />

        {/* Auction */}
        <Route path="/auction"         element={<AuctionPage />} />
        <Route path="/auction/live"    element={<LiveAuctionPage />} />
        <Route path="/auction/bid"     element={<CaptainAuctionPage />} />
        <Route path="/auction-results" element={<AuctionResultsPage />} />

        {/* Fixtures */}
        <Route path="/fixtures" element={<FixturesPage />} />

        {/* History */}
        <Route path="/history" element={<TournamentHistoryPage />} />

        {/* Settings — admin only */}
        <Route path="/settings" element={<ProtectedRoute requiredRole="TOURNAMENT_ADMIN"><SettingsPage /></ProtectedRoute>} />
      </Route>

      {/* ── Catch-all ─────────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
