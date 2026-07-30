import { expect, test } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

test.describe("Auth flows", () => {
  // ── Redirect rules ────────────────────────────────────────────────────────

  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("/login renders sign-in form", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("login form shows field errors on empty submit", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  // ── Forgot password ───────────────────────────────────────────────────────

  test("/forgot-password renders correctly", async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`);
    await expect(page.getByRole("heading", { name: /forgot password/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("forgot-password link is accessible from login page", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByRole("link", { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  // ── Verify email ──────────────────────────────────────────────────────────

  test("/verify-email renders correctly", async ({ page }) => {
    await page.goto(`${BASE}/verify-email?email=test@example.com`);
    await expect(page.getByRole("heading", { name: /verify/i })).toBeVisible();
    await expect(page.getByLabel(/code/i)).toBeVisible();
  });

  // ── Reset password ────────────────────────────────────────────────────────

  test("/reset-password renders all fields", async ({ page }) => {
    await page.goto(`${BASE}/reset-password?email=test@example.com`);
    await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible();
    await expect(page.getByLabel(/reset code/i)).toBeVisible();
    await expect(page.getByLabel(/new password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm/i)).toBeVisible();
  });

  // ── Navigation links ──────────────────────────────────────────────────────

  test("login page links to register", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const link = page.getByRole("link", { name: /create one/i });
    await expect(link).toBeVisible();
  });

  test("reset-password page links back to login", async ({ page }) => {
    await page.goto(`${BASE}/reset-password`);
    await page.getByRole("link", { name: /back to sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
