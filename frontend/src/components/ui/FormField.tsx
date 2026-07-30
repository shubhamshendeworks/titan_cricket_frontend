import { type ReactNode, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// ── FormField ─────────────────────────────────────────────────────────────────

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required,
  helpText,
  error,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-body-sm font-medium text-slate-700"
        >
          {label}
          {required && (
            <span className="ml-1 text-danger-vivid" aria-hidden="true">*</span>
          )}
        </label>
      )}

      {children}

      {error ? (
        <p role="alert" className="flex items-center gap-1 text-body-xs text-danger-vivid">
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-3 w-3 shrink-0"
            aria-hidden="true"
          >
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 8 3zm-.75 2.75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3zm.75 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
          </svg>
          {error}
        </p>
      ) : helpText ? (
        <p className="text-body-xs text-text-tertiary">{helpText}</p>
      ) : null}
    </div>
  );
}
