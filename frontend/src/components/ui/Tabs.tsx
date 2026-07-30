import {
  createContext,
  useContext,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

// ── Context ───────────────────────────────────────────────────────────────────

export type TabsVariant = "underline" | "pill" | "bordered-card";

interface TabsContextValue {
  activeTab: string;
  onChange: (id: string) => void;
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tab components must be used within <Tabs>");
  return ctx;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TabDef {
  id: string;
  label: string;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabDef[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: TabsVariant;
  children?: ReactNode;
  className?: string;
}

// ── Style maps ────────────────────────────────────────────────────────────────

const tabBarVariant: Record<TabsVariant, string> = {
  "underline":     "border-b border-surface-border gap-0",
  "pill":          "bg-surface-raised rounded-lg p-1 gap-1",
  "bordered-card": "border-b border-surface-border gap-0",
};

const tabItemStyle: Record<
  TabsVariant,
  { base: string; active: string; inactive: string }
> = {
  "underline": {
    base:     "px-4 py-3 text-body-md font-medium border-b-2 -mb-px transition-all duration-fast",
    active:   "border-gold-bright text-gold-bright",
    inactive: "border-transparent text-text-secondary hover:text-text-primary hover:border-surface-overlay",
  },
  "pill": {
    base:     "px-4 py-2 text-body-sm font-medium rounded-md transition-all duration-fast",
    active:   "bg-gold-surface text-gold-bright",
    inactive: "text-text-secondary hover:text-text-primary hover:bg-surface-float",
  },
  "bordered-card": {
    base:     "px-4 py-3 text-body-md font-medium border-b-2 -mb-px transition-all duration-fast",
    active:   "border-gold-bright text-text-primary",
    inactive: "border-transparent text-text-secondary hover:text-text-primary",
  },
};

// ── Tabs ──────────────────────────────────────────────────────────────────────

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  children,
  className,
}: TabsProps) {
  return (
    <TabsContext.Provider value={{ activeTab, onChange, variant }}>
      <div className={className}>
        <div className={cn("flex items-center overflow-x-auto", tabBarVariant[variant])}>
          {tabs.map((tab) => {
            const styles = tabItemStyle[variant];
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                disabled={tab.disabled}
                onClick={() => !tab.disabled && onChange(tab.id)}
                className={cn(
                  styles.base,
                  "inline-flex items-center gap-1.5 whitespace-nowrap shrink-0",
                  isActive ? styles.active : styles.inactive,
                  tab.disabled && "opacity-40 cursor-not-allowed",
                )}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      "text-data-xs px-1.5 py-px rounded-pill font-mono",
                      isActive
                        ? "bg-gold-bright/20 text-gold-bright"
                        : "bg-surface-float text-text-tertiary",
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// ── TabPanel ──────────────────────────────────────────────────────────────────

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  tabId: string;
  children: ReactNode;
}

export function TabPanel({ tabId, children, className, ...props }: TabPanelProps) {
  const { activeTab } = useTabsContext();
  if (activeTab !== tabId) return null;
  return (
    <div role="tabpanel" className={cn("mt-6", className)} {...props}>
      {children}
    </div>
  );
}
