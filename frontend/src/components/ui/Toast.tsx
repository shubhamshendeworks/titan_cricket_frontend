import toast, { Toaster, type ToastOptions } from "react-hot-toast";

// ── APEX-themed Toaster configuration ─────────────────────────────────────────

const BASE_STYLE: React.CSSProperties = {
  background:  "#1A2235",
  color:       "#F1F5F9",
  border:      "1px solid #2A3550",
  borderRadius:"12px",
  padding:     "12px 16px",
  fontSize:    "14px",
  fontFamily:  "Inter, system-ui, sans-serif",
  maxWidth:    "360px",
  boxShadow:   "0 8px 20px rgba(0,0,0,0.45)",
};

export function ApexToaster() {
  return (
    <Toaster
      position="bottom-right"
      gutter={8}
      containerStyle={{ zIndex: 700 }}
      toastOptions={{
        duration: 4000,
        style: BASE_STYLE,
      }}
    />
  );
}

// ── Toast utility ─────────────────────────────────────────────────────────────

export const showToast = {
  success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      duration: 4000,
      ...options,
      style: {
        ...BASE_STYLE,
        color:  "#00D4AA",
        border: "1px solid rgba(0,212,170,0.3)",
      },
      iconTheme: { primary: "#00D4AA", secondary: "#1A2235" },
    });
  },

  error(message: string, options?: ToastOptions) {
    return toast.error(message, {
      duration: 5000,
      ...options,
      style: {
        ...BASE_STYLE,
        color:  "#FF3B5C",
        border: "1px solid rgba(255,59,92,0.3)",
      },
      iconTheme: { primary: "#FF3B5C", secondary: "#1A2235" },
    });
  },

  warning(message: string, options?: ToastOptions) {
    return toast(message, {
      duration: 4000,
      icon: "⚠",
      ...options,
      style: {
        ...BASE_STYLE,
        color:  "#FF8C00",
        border: "1px solid rgba(255,140,0,0.3)",
      },
    });
  },

  info(message: string, options?: ToastOptions) {
    return toast(message, {
      duration: 4000,
      icon: "ℹ",
      ...options,
      style: BASE_STYLE,
    });
  },

  auction(message: string, options?: ToastOptions) {
    return toast(message, {
      duration: 6000,
      icon: "🔨",
      ...options,
      style: {
        ...BASE_STYLE,
        color:     "#F5C842",
        border:    "1px solid rgba(245,200,66,0.3)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.45), 0 0 20px rgba(245,200,66,0.2)",
      },
    });
  },

  loading(message: string, options?: ToastOptions) {
    return toast.loading(message, {
      ...options,
      style: BASE_STYLE,
    });
  },

  dismiss: toast.dismiss,
};

export { toast };
