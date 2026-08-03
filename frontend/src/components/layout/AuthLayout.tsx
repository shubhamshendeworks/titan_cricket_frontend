import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import titansLogo from "@/assets/branding/titan-logo.png";

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { emoji: "🏆", label: "Teams",        desc: "Manage franchise squads",          rgb: "245,179,1"   },
  { emoji: "👤", label: "Players",      desc: "Player profiles & statistics",     rgb: "59,130,246"  },
  { emoji: "🔨", label: "Live Auction", desc: "Real-time bidding engine",         rgb: "139,92,246"  },
  { emoji: "⚡", label: "Live Updates", desc: "Instant synchronized events",      rgb: "5,150,105"   },
];

const PARTICLES: { x: number; y: number; r: number; delay: number; gold: boolean }[] = [
  { x: 11, y: 16, r: 2,   delay: 0,   gold: true  },
  { x: 83, y: 11, r: 2.5, delay: 0.6, gold: false },
  { x: 72, y: 73, r: 1.5, delay: 1.1, gold: true  },
  { x: 21, y: 78, r: 3,   delay: 1.7, gold: false },
  { x: 92, y: 43, r: 2,   delay: 0.9, gold: true  },
  { x: 7,  y: 54, r: 2.5, delay: 1.3, gold: false },
  { x: 57, y: 93, r: 1.5, delay: 0.4, gold: true  },
  { x: 89, y: 88, r: 2,   delay: 2.0, gold: false },
  { x: 39, y: 5,  r: 1.5, delay: 0.7, gold: true  },
  { x: 64, y: 29, r: 2,   delay: 1.4, gold: false },
  { x: 44, y: 96, r: 1.5, delay: 0.2, gold: true  },
  { x: 4,  y: 36, r: 2,   delay: 1.6, gold: false },
];

// ── Brand Panel ───────────────────────────────────────────────────────────────

function BrandPanel() {
  return (
    <div
      className="hidden lg:flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(160deg,#040D1F 0%,#0B1F4D 55%,#071435 100%)" }}
    >
      {/* Spotlight overlays */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 75% 55% at 50% 42%,rgba(37,99,235,0.14) 0%,transparent 70%)," +
            "radial-gradient(ellipse 35% 25% at 50% 42%,rgba(245,179,1,0.07) 0%,transparent 60%)",
        }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px)," +
            "linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)",
          backgroundSize: "64px 64px",
          opacity: 0.022,
        }}
      />

      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top:  `${p.y}%`,
            width:  p.r * 2,
            height: p.r * 2,
            background: p.gold ? "rgba(245,179,1,0.4)" : "rgba(59,130,246,0.38)",
            boxShadow: p.gold
              ? `0 0 ${p.r * 4}px rgba(245,179,1,0.7)`
              : `0 0 ${p.r * 4}px rgba(59,130,246,0.6)`,
            animation: `al-float ${2.8 + p.delay}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-10 py-10">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group w-fit">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-lg overflow-hidden bg-navy-950/30">
            <img src={titansLogo} alt="Titans" className="h-11 w-11 object-contain" />
          </div>
          <div>
            <p className="font-display font-bold text-white tracking-wider" style={{ fontSize: 18, lineHeight: 1 }}>
              TITAN
            </p>
            <p className="tracking-widest uppercase mt-0.5" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>
              Titan Cricket Auction
            </p>
          </div>
        </Link>

        {/* Center — trophy + text */}
        <div className="flex-1 flex flex-col items-center justify-center gap-7">

          {/* Glow rings + floating trophy */}
          <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: "1px solid rgba(245,179,1,0.08)", animation: "al-ring 4s ease-in-out infinite" }}
            />
            <div
              className="absolute rounded-full"
              style={{ inset: 24, border: "1px solid rgba(245,179,1,0.14)", animation: "al-ring 4s ease-in-out 0.7s infinite" }}
            />
            <div
              className="absolute rounded-full"
              style={{
                inset: 48,
                border: "1px solid rgba(245,179,1,0.24)",
                background: "radial-gradient(circle,rgba(245,179,1,0.06) 0%,transparent 70%)",
                animation: "al-ring 4s ease-in-out 1.4s infinite",
              }}
            />
            <div style={{ animation: "al-trophy 5s ease-in-out infinite" }}>
              <div style={{ filter: "drop-shadow(0 0 24px rgba(245,179,1,0.7)) drop-shadow(0 0 48px rgba(245,179,1,0.28))" }}>
                <img src={titansLogo} alt="Titans" style={{ width: 150, height: 150, objectFit: "contain" }} />
              </div>
            </div>
          </div>

          {/* Hero text */}
          <div className="text-center" style={{ animation: "al-up 0.9s ease 0.2s both" }}>
            <p className="font-display font-bold text-white" style={{ fontSize: 44, lineHeight: 1, letterSpacing: "-0.01em" }}>
              CRICKET LIVE
            </p>
            <p
              className="font-display font-extrabold"
              style={{
                fontSize: 56,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                background: "linear-gradient(90deg,#FFE566,#F5B301 45%,#C07A00)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AUCTION
            </p>
            <p className="font-display font-bold text-white" style={{ fontSize: 44, lineHeight: 1, letterSpacing: "-0.01em" }}>
              SYSTEM
            </p>
            <p className="mt-4 text-body-md" style={{ color: "rgba(255,255,255,0.38)" }}>
              Build your squad. Place your bids.<br />Run a complete live auction.
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-2.5" style={{ animation: "al-up 0.9s ease 0.45s both" }}>
          {FEATURES.map(({ emoji, label, desc, rgb }) => (
            <div
              key={label}
              className="group flex flex-col gap-1.5 px-4 py-3 rounded-2xl transition-all duration-300 cursor-default"
              style={{
                background: `rgba(${rgb},0.07)`,
                border: `1px solid rgba(${rgb},0.18)`,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background      = `rgba(${rgb},0.13)`;
                el.style.borderColor     = `rgba(${rgb},0.32)`;
                el.style.transform       = "translateY(-2px)";
                el.style.boxShadow       = `0 8px 24px rgba(${rgb},0.14)`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background      = `rgba(${rgb},0.07)`;
                el.style.borderColor     = `rgba(${rgb},0.18)`;
                el.style.transform       = "";
                el.style.boxShadow       = "";
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>{emoji}</span>
                <span className="font-semibold text-white" style={{ fontSize: 13 }}>{label}</span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", lineHeight: 1.4 }}>{desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ── AuthLayout ────────────────────────────────────────────────────────────────

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2" style={{ background: "#040D1F" }}>

      {/* Global premium animation styles */}
      <style>{`
        @keyframes al-float {
          0%,100% { transform:translateY(0);   opacity:0.55; }
          50%      { transform:translateY(-9px); opacity:1; }
        }
        @keyframes al-trophy {
          0%,100% { transform:translateY(0) rotate(-1deg); }
          50%     { transform:translateY(-11px) rotate(1deg); }
        }
        @keyframes al-ring {
          0%,100% { transform:scale(1);    opacity:0.55; }
          50%     { transform:scale(1.05); opacity:1; }
        }
        @keyframes al-up {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes al-card-glow {
          0%,100% { box-shadow:0 20px 60px rgba(11,31,77,0.1),0 4px 16px rgba(11,31,77,0.06); }
          50%     { box-shadow:0 24px 72px rgba(11,31,77,0.14),0 4px 16px rgba(11,31,77,0.08),0 0 40px rgba(245,179,1,0.06); }
        }
        /* Premium light form elements used by auth pages */
        .al-label {
          display:block;
          font-size:13px;
          font-weight:600;
          color:#334155;
          margin-bottom:7px;
          letter-spacing:0.01em;
        }
        .al-input {
          width:100%;
          background:#F8FAFC;
          border:1.5px solid #E2E8F0;
          border-radius:12px;
          padding:12px 16px;
          color:#0F172A;
          font-size:15px;
          line-height:1.5;
          outline:none;
          transition:border-color 0.18s,box-shadow 0.18s,background 0.18s;
          -webkit-font-smoothing:antialiased;
        }
        .al-input::placeholder { color:#94A3B8; }
        .al-input:focus {
          background:#FFFFFF;
          border-color:#F5B301;
          box-shadow:0 0 0 3px rgba(245,179,1,0.14),0 1px 4px rgba(245,179,1,0.1);
        }
        .al-input-error {
          border-color:#EF4444 !important;
          box-shadow:0 0 0 3px rgba(239,68,68,0.1) !important;
        }
        .al-input-wrap { position:relative; display:flex; align-items:center; }
        .al-input-wrap .al-input { padding-right:46px; }
        .al-eye {
          position:absolute; right:14px;
          background:none; border:none; cursor:pointer;
          color:#94A3B8; padding:0;
          display:flex; align-items:center;
          transition:color 0.15s;
        }
        .al-eye:hover { color:#475569; }
        .al-err { font-size:12px; color:#EF4444; margin-top:5px; }
        .al-field { margin-bottom:20px; }
        .al-btn {
          width:100%;
          padding:13px;
          border-radius:12px;
          border:none;
          font-weight:700;
          font-size:15px;
          letter-spacing:0.025em;
          color:#0B1F4D;
          cursor:pointer;
          background:linear-gradient(135deg,#FFE566 0%,#F5B301 50%,#C07A00 100%);
          box-shadow:0 4px 20px rgba(245,179,1,0.4),0 1px 0 rgba(255,255,255,0.25) inset;
          transition:transform 0.18s,box-shadow 0.18s;
          position:relative;
          overflow:hidden;
        }
        .al-btn::after {
          content:'';
          position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.18) 0%,transparent 55%);
          border-radius:12px;
          pointer-events:none;
        }
        .al-btn:hover:not(:disabled) {
          transform:translateY(-1px);
          box-shadow:0 8px 28px rgba(245,179,1,0.52),0 1px 0 rgba(255,255,255,0.25) inset;
        }
        .al-btn:active:not(:disabled) {
          transform:translateY(0);
          box-shadow:0 2px 12px rgba(245,179,1,0.35);
        }
        .al-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .al-link { color:#D97706; font-weight:600; text-decoration:none; transition:color 0.15s; }
        .al-link:hover { color:#B45309; text-decoration:underline; }
        .al-forgot { color:#94A3B8; font-size:13px; text-decoration:none; transition:color 0.15s; }
        .al-forgot:hover { color:#D97706; }
      `}</style>

      <BrandPanel />

      {/* Right — login panel */}
      <div
        className="flex flex-col items-center justify-center min-h-screen lg:min-h-0 px-6 py-12 relative"
        style={{ background: "linear-gradient(160deg,#F0F4FF 0%,#FFFFFF 50%,#F5F8FF 100%)" }}
      >
        {/* Subtle premium light radial */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% 40%,rgba(245,179,1,0.04) 0%,rgba(37,99,235,0.03) 50%,transparent 75%)" }}
        />

        {/* Mobile logo */}
        <Link to="/" className="relative z-10 flex items-center gap-2 mb-8 lg:hidden">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-navy-950/20">
            <img src={titansLogo} alt="Titans" className="h-9 w-9 object-contain" />
          </div>
          <span className="font-display font-bold text-navy-900" style={{ fontSize: 22, letterSpacing: "0.05em" }}>TITAN</span>
        </Link>

        {/* Premium white card */}
        <div
          className="relative z-10 w-full max-w-md"
          style={{
            borderRadius: 24,
            padding: "40px 40px",
            background: "#FFFFFF",
            border: "1px solid #E8EFF8",
            animation: "al-up 0.7s ease both, al-card-glow 5s ease-in-out 0.7s infinite",
          }}
        >
          {/* Gold top accent line */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
            style={{
              width: "52%",
              height: 2,
              background: "linear-gradient(90deg,transparent,#F5B301,transparent)",
              borderRadius: "0 0 4px 4px",
            }}
          />

          <div className="mb-8">
            <h1 className="font-display font-bold text-navy-900" style={{ fontSize: 30, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-body-md text-slate-400">{subtitle}</p>
            )}
          </div>

          {children}
        </div>

        {footer && (
          <div className="relative z-10 mt-6 text-center text-body-sm text-slate-400">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
