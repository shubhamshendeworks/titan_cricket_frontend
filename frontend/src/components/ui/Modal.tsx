import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

// ── Modal ─────────────────────────────────────────────────────────────────────

export type ModalSize = "sm" | "md" | "lg" | "xl" | "fullscreen";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  footer?: ReactNode;
  children: ReactNode;
  closeOnBackdrop?: boolean;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm:         "max-w-sm w-full",
  md:         "max-w-md w-full",
  lg:         "max-w-2xl w-full",
  xl:         "max-w-4xl w-full",
  fullscreen: "w-full h-full max-w-none rounded-none",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  footer,
  children,
  closeOnBackdrop = true,
  className,
}: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-modal flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => closeOnBackdrop && e.target === backdropRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={cn(
          "relative bg-white border border-slate-200 rounded-2xl shadow-xl",
          "flex flex-col max-h-[90vh] animate-scale-in",
          sizeClasses[size],
          className,
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div>
              {title && (
                <h2 className="text-heading-lg font-semibold text-slate-900">{title}</h2>
              )}
              {description && (
                <p className="mt-1 text-body-sm text-slate-500">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="ml-4 text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1 hover:bg-slate-100 shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div
          className={cn(
            "shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
            variant === "danger" ? "bg-danger-surface" : "bg-warn-surface",
          )}
        >
          <AlertTriangle
            className={cn(
              "h-5 w-5",
              variant === "danger" ? "text-danger-vivid" : "text-warn-vivid",
            )}
          />
        </div>
        <div>
          <h3 className="text-heading-md font-semibold text-slate-900">{title}</h3>
          {description && (
            <p className="mt-1 text-body-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────────

export type DrawerSide = "left" | "right" | "bottom";
export type DrawerSize = "sm" | "md" | "lg" | "full";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: DrawerSide;
  size?: DrawerSize;
  title?: string;
  children: ReactNode;
  className?: string;
}

const drawerSizeMap: Record<DrawerSide, Record<DrawerSize, string>> = {
  right:  { sm: "w-80",  md: "w-[480px]", lg: "w-[640px]", full: "w-full" },
  left:   { sm: "w-80",  md: "w-[480px]", lg: "w-[640px]", full: "w-full" },
  bottom: { sm: "h-1/3", md: "h-1/2",     lg: "h-2/3",     full: "h-full" },
};

const drawerPositionMap: Record<DrawerSide, string> = {
  right:  "inset-y-0 right-0 animate-slide-in-right",
  left:   "inset-y-0 left-0  animate-slide-in-left",
  bottom: "inset-x-0 bottom-0 animate-slide-up rounded-t-3xl",
};

export function Drawer({
  isOpen,
  onClose,
  side = "right",
  size = "md",
  title,
  children,
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-panel animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-void/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "absolute flex flex-col bg-surface-raised border-surface-border shadow-xl",
          side !== "bottom" ? "border-l" : "border-t",
          drawerPositionMap[side],
          drawerSizeMap[side][size],
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-surface-border shrink-0">
            <h2 className="text-heading-lg font-semibold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-text-tertiary hover:text-text-primary transition-colors rounded-lg p-1 hover:bg-surface-float"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
