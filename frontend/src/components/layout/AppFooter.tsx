import { cn } from "@/lib/utils";

export interface AppFooterProps {
  className?: string;
}

export function AppFooter({ className }: AppFooterProps) {
  return (
    <footer
      className={cn(
        "shrink-0 bg-navy-900 border-t border-white/5",
        "px-6 py-3 flex items-center justify-between gap-4 flex-wrap",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-gold-bright flex items-center justify-center">
            <span className="font-display font-bold text-[10px] text-navy-900 leading-none">T</span>
          </div>
          <span className="text-xs font-bold text-white tracking-widest uppercase">Titan</span>
          <span className="text-xs text-white/40 tracking-widest uppercase">Cricket Auction</span>
        </div>
        <div className="h-3 w-px bg-white/10" />
        <span className="text-[11px] text-white/30 font-mono">v1.0.0</span>
      </div>

      <p className="text-[11px] text-white/30">
        © {new Date().getFullYear()} Titan Cricket Auction Platform
      </p>
    </footer>
  );
}
