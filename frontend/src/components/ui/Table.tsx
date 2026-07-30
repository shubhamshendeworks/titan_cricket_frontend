import {
  type ReactNode,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null;
export type TableDensity  = "comfortable" | "default" | "dense";

// ── Density padding helper ────────────────────────────────────────────────────

const densityPad: Record<TableDensity, string> = {
  comfortable: "px-4 py-4",
  default:     "px-4 py-3",
  dense:       "px-3 py-2",
};

// ── Table root ────────────────────────────────────────────────────────────────

export function Table({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-xl border border-surface-border",
        className,
      )}
    >
      <table className="w-full border-collapse text-body-sm">{children}</table>
    </div>
  );
}

// ── TableHead ─────────────────────────────────────────────────────────────────

export function TableHead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <thead
      className={cn(
        "bg-surface-deep border-b border-surface-border sticky top-0 z-sticky",
        className,
      )}
    >
      {children}
    </thead>
  );
}

// ── TableBody ─────────────────────────────────────────────────────────────────

export function TableBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tbody className={cn("divide-y divide-surface-border", className)}>
      {children}
    </tbody>
  );
}

// ── TableRow ──────────────────────────────────────────────────────────────────

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  clickable?: boolean;
}

export function TableRow({
  selected,
  clickable,
  children,
  className,
  ...props
}: TableRowProps) {
  return (
    <tr
      className={cn(
        "transition-colors duration-instant",
        selected
          ? "bg-gold-surface"
          : "bg-surface-raised hover:bg-surface-float",
        clickable && "cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

// ── Th (header cell) ──────────────────────────────────────────────────────────

export interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
  density?: TableDensity;
}

export function Th({
  sortable,
  sortDirection,
  onSort,
  density = "default",
  children,
  className,
  ...props
}: ThProps) {
  return (
    <th
      className={cn(
        "text-left text-heading-sm font-semibold text-text-tertiary",
        "uppercase tracking-wider whitespace-nowrap",
        densityPad[density],
        sortable && "cursor-pointer select-none hover:text-text-secondary",
        className,
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <span>
            {sortDirection === "asc"  && <ChevronUp    className="h-3.5 w-3.5 text-gold-bright" />}
            {sortDirection === "desc" && <ChevronDown  className="h-3.5 w-3.5 text-gold-bright" />}
            {!sortDirection            && <ChevronsUpDown className="h-3.5 w-3.5 text-text-disabled" />}
          </span>
        )}
      </div>
    </th>
  );
}

// ── Td (data cell) ────────────────────────────────────────────────────────────

export interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  density?: TableDensity;
  mono?: boolean;
}

export function Td({
  density = "default",
  mono,
  children,
  className,
  ...props
}: TdProps) {
  return (
    <td
      className={cn(
        "text-text-primary",
        densityPad[density],
        mono && "font-mono text-data-sm",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

// ── TableEmpty (zero-result row) ──────────────────────────────────────────────

export function TableEmpty({ message = "No results found." }: { message?: string }) {
  return (
    <tr>
      <td
        colSpan={100}
        className="py-12 text-center text-body-sm text-text-tertiary"
      >
        {message}
      </td>
    </tr>
  );
}

// ── TablePagination ───────────────────────────────────────────────────────────

export interface TablePaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function TablePagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border bg-surface-deep">
      <p className="text-body-sm text-text-tertiary">
        {total === 0 ? "No results" : `${from}–${to} of ${total}`}
      </p>

      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-text-tertiary">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-surface-raised border border-surface-border rounded-md text-body-sm text-text-primary px-2 py-1 outline-none focus:border-gold-bright/60"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="h-8 w-8 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface-float disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-body-md"
          >
            ‹
          </button>
          <span className="text-body-sm text-text-secondary px-2 tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
            className="h-8 w-8 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface-float disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-body-md"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BulkActionBar ─────────────────────────────────────────────────────────────

export interface BulkAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

export interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
}

export function BulkActionBar({
  selectedCount,
  actions,
  onClearSelection,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gold-surface border border-gold-bright/20 rounded-lg mb-3 animate-slide-down">
      <span className="text-body-sm font-medium text-gold-bright">
        {selectedCount} selected
      </span>
      <div className="h-4 w-px bg-surface-border" />
      <div className="flex items-center gap-2 flex-1">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-body-sm font-medium",
              "transition-colors duration-fast",
              action.danger
                ? "text-danger-vivid hover:bg-danger-surface"
                : "text-text-secondary hover:bg-surface-float hover:text-text-primary",
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
      <button
        onClick={onClearSelection}
        className="text-text-tertiary hover:text-text-secondary text-body-sm transition-colors"
      >
        Clear
      </button>
    </div>
  );
}
