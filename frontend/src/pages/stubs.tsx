// ── Error pages ───────────────────────────────────────────────────────────────

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-void">
      <div className="text-center max-w-sm">
        <p className="text-display-hero font-display font-bold text-surface-border mb-4">403</p>
        <h1 className="text-heading-xl font-semibold text-text-primary mb-2">Access Denied</h1>
        <p className="text-body-md text-text-secondary mb-8">
          You don't have permission to view this page.
        </p>
        <a
          href="/dashboard"
          className="px-6 py-2 rounded-lg text-body-md font-medium bg-gold-bright text-navy-900 hover:bg-gold-muted transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-void">
      <div className="text-center max-w-sm">
        <p className="text-display-hero font-display font-bold text-surface-border mb-4">404</p>
        <h1 className="text-heading-xl font-semibold text-text-primary mb-2">Page Not Found</h1>
        <p className="text-body-md text-text-secondary mb-8">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/dashboard"
          className="px-6 py-2 rounded-lg text-body-md font-medium bg-gold-bright text-navy-900 hover:bg-gold-muted transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
