import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // ── Titan Color Palette (CSS-variable-driven for light/navy theme switching)
      colors: {
        // Surface scale — resolves via CSS vars (light by default, navy inside .titan-navy)
        surface: {
          void:    "var(--surface-void)",
          base:    "var(--surface-base)",
          deep:    "var(--surface-deep)",
          raised:  "var(--surface-raised)",
          float:   "var(--surface-float)",
          overlay: "var(--surface-overlay)",
          border:  "var(--surface-border)",
        },
        // Gold — primary accent (resolves via CSS var, brighter in .titan-navy)
        gold: {
          bright:  "var(--gold-bright)",
          muted:   "#A07B1A",
          dim:     "#7A5C0F",
          surface: "rgba(201,162,39,0.1)",
          glow:    "rgba(201,162,39,0.2)",
        },
        // Navy — sidebar and important sections
        navy: {
          950: "#050F28",
          900: "#0B1F4D",
          800: "#162860",
          700: "#1D3A8A",
          600: "#2455C0",
        },
        // Royal Blue — accent for links, active states, CTA secondary
        royal: {
          700: "#1D4ED8",
          600: "#2563EB",
          500: "#3B82F6",
          100: "#DBEAFE",
          50:  "#EFF6FF",
        },
        // Sport green — live / active indicator
        sport: {
          vivid:   "var(--sport-vivid)",
          muted:   "#047857",
          surface: "rgba(5,150,105,0.1)",
        },
        // Danger red — errors / UNSOLD / suspended
        danger: {
          vivid:   "var(--danger-vivid)",
          muted:   "#B91C1C",
          surface: "rgba(220,38,38,0.08)",
        },
        // Warning amber — alerts / RTM eligible
        warn: {
          vivid:   "var(--warn-vivid)",
          muted:   "#B45309",
          surface: "rgba(217,119,6,0.08)",
        },
        // Text scale — semantic foreground tokens (CSS-variable-driven)
        text: {
          primary:   "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary:  "var(--text-tertiary)",
          disabled:  "var(--text-disabled)",
          inverse:   "var(--text-inverse)",
        },
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        display: ["Barlow Condensed", "sans-serif"],
        sans:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
      },

      fontSize: {
        "data-xs":   ["11px", { lineHeight: "1.4", letterSpacing: "0.02em" }],
        "data-sm":   ["13px", { lineHeight: "1.4", letterSpacing: "0.01em" }],
        "data-md":   ["15px", { lineHeight: "1.4" }],
        "data-lg":   ["18px", { lineHeight: "1.3" }],
        "data-hero": ["40px", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        "body-xs":   ["11px", { lineHeight: "1.5" }],
        "body-sm":   ["13px", { lineHeight: "1.5" }],
        "body-md":   ["15px", { lineHeight: "1.6" }],
        "body-lg":   ["17px", { lineHeight: "1.6" }],
        "heading-sm": ["13px", { lineHeight: "1.3", letterSpacing: "0.05em" }],
        "heading-md": ["16px", { lineHeight: "1.3" }],
        "heading-lg": ["20px", { lineHeight: "1.25" }],
        "heading-xl": ["24px", { lineHeight: "1.2" }],
        "display-sm":   ["24px", { lineHeight: "1.1",  letterSpacing: "-0.01em" }],
        "display-md":   ["32px", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg":   ["40px", { lineHeight: "1.0",  letterSpacing: "-0.02em" }],
        "display-xl":   ["56px", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-hero": ["72px", { lineHeight: "0.9",  letterSpacing: "-0.03em" }],
      },

      // ── Spacing (4px base grid) ────────────────────────────────────────────
      spacing: {
        "space-0":  "0px",
        "space-1":  "4px",
        "space-2":  "8px",
        "space-3":  "12px",
        "space-4":  "16px",
        "space-5":  "20px",
        "space-6":  "24px",
        "space-7":  "28px",
        "space-8":  "32px",
        "space-10": "40px",
        "space-12": "48px",
        "space-16": "64px",
        "space-20": "80px",
        "space-24": "96px",
      },

      // ── Border Radius ──────────────────────────────────────────────────────
      borderRadius: {
        xs:     "2px",
        sm:     "4px",
        md:     "6px",
        lg:     "8px",
        xl:     "12px",
        "2xl":  "16px",
        "3xl":  "24px",
        pill:   "9999px",
        circle: "50%",
      },

      // ── Shadows — light-theme calibrated ──────────────────────────────────
      boxShadow: {
        sm:     "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        md:     "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)",
        lg:     "0 8px 24px rgba(0,0,0,0.1),  0 4px 8px rgba(0,0,0,0.06)",
        xl:     "0 16px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)",
        gold:   "0 0 0 2px rgba(201,162,39,0.25), 0 2px 8px rgba(201,162,39,0.2)",
        sport:  "0 0 0 2px rgba(5,150,105,0.25), 0 2px 8px rgba(5,150,105,0.15)",
        danger: "0 0 0 2px rgba(220,38,38,0.25), 0 2px 8px rgba(220,38,38,0.15)",
        glass:  "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
      },

      // ── Animation easing curves ────────────────────────────────────────────
      transitionTimingFunction: {
        crisp:  "cubic-bezier(0.25, 0, 0.1, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        exit:   "cubic-bezier(0.4, 0, 1, 1)",
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      // ── Animation durations ────────────────────────────────────────────────
      transitionDuration: {
        instant:  "80ms",
        fast:     "150ms",
        normal:   "200ms",
        medium:   "300ms",
        slow:     "500ms",
        dramatic: "800ms",
      },

      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%":   { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%":   { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
        "ticker": {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },

      animation: {
        "fade-in":        "fade-in 200ms ease-smooth both",
        "slide-up":       "slide-up 200ms ease-smooth both",
        "slide-down":     "slide-down 200ms ease-smooth both",
        "slide-in-right": "slide-in-right 200ms ease-smooth both",
        "slide-in-left":  "slide-in-left 200ms ease-smooth both",
        "scale-in":       "scale-in 150ms ease-crisp both",
        "pulse-glow":     "pulse-glow 2s ease-in-out infinite",
        "ticker":         "ticker 30s linear infinite",
      },

      // ── Z-Index stack ──────────────────────────────────────────────────────
      zIndex: {
        base:               "0",
        sticky:             "100",
        header:             "200",
        sidebar:            "300",
        panel:              "350",
        dropdown:           "400",
        overlay:            "500",
        modal:              "600",
        toast:              "700",
        "auction-critical": "800",
        tooltip:            "900",
      },

      backdropBlur: {
        glass: "12px",
      },

      // ── Layout dimensions ──────────────────────────────────────────────────
      width: {
        sidebar:             "240px",
        "sidebar-admin":     "260px",
        "sidebar-collapsed": "56px",
      },

      height: {
        header:                "60px",
        "header-auction":      "52px",
        "header-presentation": "80px",
        "bid-bar":             "72px",
        "purse-bar":           "160px",
      },
    },
  },
  plugins: [],
};

export default config;
