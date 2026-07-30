/**
 * AppLayout — backward-compat wrapper for Sprint 2 auth-protected routes.
 * Delegates to AppShell which provides the full APEX dashboard layout.
 * New feature modules should import AppShell directly.
 */
import { AppShell } from "./AppShell";

export function AppLayout() {
  return <AppShell />;
}
