import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// ── Variant & size maps ───────────────────────────────────────────────────────

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-navy-900 text-white font-semibold border border-navy-900 " +
    "hover:bg-royal-700 hover:border-royal-700 hover:text-white active:bg-navy-950 shadow-sm",
  secondary:
    "bg-white text-slate-700 border border-slate-200 " +
    "hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 shadow-sm",
  ghost:
    "bg-transparent text-slate-600 border border-transparent " +
    "hover:bg-slate-100 hover:text-slate-900",
  danger:
    "bg-red-50 text-red-600 border border-red-200 " +
    "hover:bg-red-600 hover:text-white hover:border-red-600 shadow-sm",
  gold:
    "bg-gold-bright text-navy-900 font-semibold border border-gold-bright " +
    "hover:bg-gold-muted hover:border-gold-muted shadow-sm",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-7  px-2   text-body-xs  gap-1",
  sm: "h-8  px-3   text-body-sm  gap-1.5",
  md: "h-9  px-4   text-body-md  gap-2",
  lg: "h-10 px-5   text-body-md  gap-2",
  xl: "h-12 px-6   text-body-lg  gap-2.5",
};

// ── Button ────────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-sans font-medium rounded-lg",
          "transition-all duration-fast ease-smooth select-none whitespace-nowrap",
          variantClasses[variant],
          sizeClasses[size],
          isDisabled && variant === "primary"
            ? "!bg-slate-300 !border-slate-300 !text-white cursor-not-allowed pointer-events-none"
            : isDisabled
            ? "opacity-50 cursor-not-allowed pointer-events-none"
            : "",
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}

        {children}

        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";

// ── IconButton ────────────────────────────────────────────────────────────────

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  label: string;
  loading?: boolean;
}

const iconSizeClasses = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "ghost", size = "md", label, loading, children, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg",
        "transition-all duration-fast ease-smooth",
        variantClasses[variant],
        iconSizeClasses[size],
        (disabled || loading) && "opacity-50 cursor-not-allowed pointer-events-none",
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        children
      )}
    </button>
  ),
);

IconButton.displayName = "IconButton";
