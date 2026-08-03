import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { Eye, EyeOff, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Input ─────────────────────────────────────────────────────────────────────

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix'> {
  error?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, prefix, suffix, className, disabled, ...props }, ref) => {
    const baseInputCls = cn(
      "flex-1 min-w-0 bg-transparent px-3 py-2",
      "text-body-md text-slate-900 placeholder:text-slate-400",
      "outline-none border-none",
      disabled && "cursor-not-allowed",
    );

    const wrapperCls = cn(
      "flex items-center w-full rounded-lg border bg-white",
      "transition-colors duration-fast",
      error
        ? "border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100"
        : "border-slate-300 focus-within:border-navy-900 focus-within:ring-2 focus-within:ring-navy-900/10",
      disabled && "opacity-50 cursor-not-allowed bg-slate-50",
      className,
    );

    if (prefix || suffix) {
      return (
        <div className={wrapperCls}>
          {prefix && <div className="flex items-center pl-3 text-slate-400 shrink-0">{prefix}</div>}
          <input ref={ref} disabled={disabled} className={baseInputCls} {...props} />
          {suffix && <div className="flex items-center pr-3 text-slate-400 shrink-0">{suffix}</div>}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        disabled={disabled}
        className={cn(
          "block w-full rounded-lg border bg-white",
          "px-3 py-2 text-body-md text-slate-900 placeholder:text-slate-400",
          "transition-colors duration-fast outline-none",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-slate-300 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

// ── PasswordInput ─────────────────────────────────────────────────────────────

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type" | "suffix">>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <Input
        ref={ref}
        type={show ? "text" : "password"}
        suffix={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        className={className}
        {...props}
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";

// ── SearchInput ───────────────────────────────────────────────────────────────

export interface SearchInputProps extends Omit<InputProps, "prefix" | "suffix"> {
  onClear?: () => void;
  value?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, value, className, ...props }, ref) => (
    <Input
      ref={ref}
      value={value}
      prefix={<Search className="h-4 w-4" />}
      suffix={
        value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        ) : undefined
      }
      className={className}
      {...props}
    />
  ),
);

SearchInput.displayName = "SearchInput";

// ── Textarea ──────────────────────────────────────────────────────────────────

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  showCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, showCount, maxLength, className, value, ...props }, ref) => (
    <div className="relative">
      <textarea
        ref={ref}
        maxLength={maxLength}
        value={value}
        className={cn(
          "block w-full rounded-lg border bg-white",
          "px-3 py-2 text-body-md text-slate-900 placeholder:text-slate-400",
          "resize-y min-h-[80px] transition-colors duration-fast outline-none",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-slate-300 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10",
          className,
        )}
        {...props}
      />
      {showCount && maxLength && (
        <span className="absolute bottom-2 right-3 text-data-xs text-slate-400 pointer-events-none">
          {String(value ?? "").length}/{maxLength}
        </span>
      )}
    </div>
  ),
);

Textarea.displayName = "Textarea";

// ── Select ────────────────────────────────────────────────────────────────────

export interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, "size"> {
  options: { value: string; label: string; disabled?: boolean }[];
  error?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, error, placeholder, className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "block w-full rounded-lg border bg-white",
        "px-3 py-2 text-body-md text-slate-900",
        "transition-colors duration-fast outline-none appearance-none cursor-pointer",
        error
          ? "border-red-400 focus:border-red-500"
          : "border-slate-300 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10",
        className,
      )}
      {...props}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
);

Select.displayName = "Select";
