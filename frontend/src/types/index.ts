/**
 * Global TypeScript types for the APEX Sports Platform.
 * Phase 9 — Extended with APEX IA types.
 */

// ── API Response Envelope ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PageMeta;
  error_code?: string;
  detail?: ValidationErrorDetail[] | unknown;
}

export interface PageMeta {
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  type: string;
}

// ── WebSocket ──────────────────────────────────────────────────────────────────

export interface WsMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
}

export type WsConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

// ── Utility ───────────────────────────────────────────────────────────────────

export type ID = string;
export type ISODateString = string;

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

// ── RBAC ──────────────────────────────────────────────────────────────────────

export type AppRole =
  | "SPECTATOR"
  | "PLAYER"
  | "CAPTAIN"
  | "OWNER"
  | "TOURNAMENT_ADMIN"
  | "SUPER_ADMIN";

export const ROLE_LEVELS: Record<AppRole, number> = {
  SPECTATOR:        0,
  PLAYER:           1,
  CAPTAIN:          2,
  OWNER:            3,
  TOURNAMENT_ADMIN: 4,
  SUPER_ADMIN:      5,
};

export type AuthProvider = "EMAIL" | "GOOGLE";

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  global_role: AppRole;
  is_verified: boolean;
  is_active: boolean;
  is_suspended: boolean;
  avatar_url?: string | null;
}

// ── Navigation ────────────────────────────────────────────────────────────────

import type { ComponentType } from "react";

export interface NavItem {
  to: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  badge?: string | number;
  minRole?: AppRole;
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  minRole?: AppRole;
  collapsible?: boolean;
}

// ── Entity statuses ───────────────────────────────────────────────────────────

export type TournamentStatus =
  | "DRAFT"
  | "REGISTRATION"
  | "AUCTION"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type MatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "POSTPONED"
  | "ABANDONED";

export type AuctionSessionStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export type PlayerAuctionStatus =
  | "AVAILABLE"
  | "SOLD"
  | "UNSOLD"
  | "RTM_ELIGIBLE"
  | "RETAINED";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DEACTIVATED" | "PENDING";

export type TournamentFormat = "T20" | "ODI" | "T10" | "TEST" | "CUSTOM";

export type PlayerRole = "BATSMAN" | "BOWLER" | "ALL_ROUNDER" | "WICKET_KEEPER";

export type PlayerCategory = "ICON" | "CAPPED" | "UNCAPPED" | "OVERSEAS" | "ASSOCIATE";

// ── Pagination params ─────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
