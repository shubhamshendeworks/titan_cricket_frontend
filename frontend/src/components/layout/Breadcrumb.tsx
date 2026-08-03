import { Fragment } from "react";
import { Link, useMatches } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  items: BreadcrumbItem[];
  "data-testid"?: string;
}

// ── usePageTitle hook ─────────────────────────────────────────────────────────

/**
 * Reads the page title from the nearest matching route's handle.
 * Routes can expose `handle: { title: "Page Name" }` in their route definition.
 * Falls back to undefined when no title handle is found.
 */
export function usePageTitle(): string | undefined {
  const matches = useMatches();
  // Walk from the deepest match upward, return first handle with a title
  const match = [...matches]
    .reverse()
    .find(
      (m) =>
        m.handle != null &&
        typeof m.handle === "object" &&
        "title" in (m.handle as Record<string, unknown>)
    );
  if (!match) return undefined;
  const title = (match.handle as Record<string, unknown>).title;
  return typeof title === "string" ? title : undefined;
}

// ── Breadcrumb component ──────────────────────────────────────────────────────

export function Breadcrumb({ items, className, ...props }: BreadcrumbProps) {
  return (
    <motion.nav
      aria-label="Breadcrumb"
      data-testid="breadcrumb"
      className={["flex items-center gap-1", className].filter(Boolean).join(" ")}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      {...props}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={`${item.label}-${index}`}>
              <li className="flex items-center">
                {isLast || !item.href ? (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={[
                      "text-sm font-medium leading-none select-none",
                      isLast
                        ? "text-slate-900"
                        : "text-slate-600 hover:text-slate-900 transition-colors duration-150",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.href}
                    className="text-sm font-medium leading-none text-slate-600 hover:text-slate-900 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4FD8] focus-visible:ring-offset-1 rounded-sm"
                  >
                    {item.label}
                  </Link>
                )}
              </li>

              {!isLast && (
                <li
                  aria-hidden="true"
                  className="flex items-center text-slate-400 select-none"
                >
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </motion.nav>
  );
}

export default Breadcrumb;
