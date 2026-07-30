import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Settings,
  Menu,
  X,
  ChevronDown,
  Trophy,
  Calendar,
  BarChart2,
  Users,
  User,
  MapPin,
  FileText,
  Film,
  HelpCircle,
  Gavel,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NavItem {
  label: string;
  path: string;
  testId: string;
}

interface DropdownItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PRIMARY_NAV: NavItem[] = [
  { label: 'Tournaments', path: '/tournaments', testId: 'nav-tournaments' },
  { label: 'Teams', path: '/teams', testId: 'nav-teams' },
  { label: 'Players', path: '/players', testId: 'nav-players' },
  { label: 'Auction', path: '/auction', testId: 'nav-auction' },
  { label: 'Matches', path: '/matches', testId: 'nav-matches' },
  { label: 'Points Table', path: '/points-table', testId: 'nav-points-table' },
  { label: 'Statistics', path: '/statistics', testId: 'nav-statistics' },
];

const MORE_ITEMS: DropdownItem[] = [
  { label: 'Seasons', path: '/seasons', icon: <Calendar size={15} /> },
  { label: 'Venues', path: '/venues', icon: <MapPin size={15} /> },
  { label: 'Reports', path: '/reports', icon: <FileText size={15} /> },
  { label: 'Media', path: '/media', icon: <Film size={15} /> },
  { label: 'Notifications', path: '/notifications', icon: <Bell size={15} /> },
  { label: 'Help', path: '/help', icon: <HelpCircle size={15} /> },
];

// ---------------------------------------------------------------------------
// CricketBatIcon — inline SVG
// ---------------------------------------------------------------------------
const CricketBatIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* bat handle */}
    <line x1="3" y1="21" x2="9" y2="15" />
    {/* bat blade */}
    <path d="M9 15 L20 4 Q22 2 21 1 Q20 0 18 1 L7 12 Z" />
    {/* grip wrap */}
    <line x1="3" y1="21" x2="5.5" y2="18.5" strokeWidth="2.5" />
  </svg>
);

// ---------------------------------------------------------------------------
// NavLinkItem — desktop primary link
// ---------------------------------------------------------------------------
const NavLinkItem: React.FC<{ item: NavItem }> = ({ item }) => {
  const location = useLocation();
  const isActive =
    location.pathname === item.path ||
    location.pathname.startsWith(item.path + '/');

  return (
    <NavLink
      to={item.path}
      data-testid={item.testId}
      className={[
        'relative whitespace-nowrap text-sm font-medium px-1 py-1 transition-colors duration-150',
        isActive
          ? 'text-amber-400'
          : 'text-white hover:text-amber-400',
      ].join(' ')}
    >
      {item.label}
      {isActive && (
        <motion.span
          layoutId="nav-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full"
        />
      )}
    </NavLink>
  );
};

// ---------------------------------------------------------------------------
// MoreDropdown — "More ▼" desktop dropdown
// ---------------------------------------------------------------------------
const MoreDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        data-testid="nav-more-dropdown"
        onClick={() => setOpen((v) => !v)}
        className={[
          'flex items-center gap-1 whitespace-nowrap text-sm font-medium px-1 py-1 transition-colors duration-150',
          open ? 'text-amber-400' : 'text-white hover:text-amber-400',
        ].join(' ')}
        aria-haspopup="true"
        aria-expanded={open}
      >
        More
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex"
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ originY: 0 }}
            className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-white shadow-lg border border-slate-100 overflow-hidden z-50"
          >
            {MORE_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100',
                    isActive
                      ? 'bg-amber-50 text-amber-600 font-medium'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-royal-blue',
                  ].join(' ')
                }
              >
                <span className="text-slate-400">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// MobileMenu — full-screen slide-down drawer
// ---------------------------------------------------------------------------
interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  notificationCount: number;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ open, onClose, notificationCount }) => {
  const allItems: Array<{ label: string; path: string; icon?: React.ReactNode }> = [
    { label: 'Tournaments', path: '/tournaments', icon: <Trophy size={18} /> },
    { label: 'Teams', path: '/teams', icon: <Users size={18} /> },
    { label: 'Players', path: '/players', icon: <User size={18} /> },
    { label: 'Auction', path: '/auction', icon: <Gavel size={18} /> },
    { label: 'Matches', path: '/matches', icon: <Calendar size={18} /> },
    { label: 'Points Table', path: '/points-table', icon: <BarChart2 size={18} /> },
    { label: 'Statistics', path: '/statistics', icon: <BarChart2 size={18} /> },
    { label: 'Seasons', path: '/seasons', icon: <Calendar size={18} /> },
    { label: 'Venues', path: '/venues', icon: <MapPin size={18} /> },
    { label: 'Reports', path: '/reports', icon: <FileText size={18} /> },
    { label: 'Media', path: '/media', icon: <Film size={18} /> },
    { label: 'Notifications', path: '/notifications', icon: <Bell size={18} /> },
    { label: 'Help', path: '/help', icon: <HelpCircle size={18} /> },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* backdrop */}
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* drawer */}
          <motion.nav
            key="mobile-drawer"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 left-0 right-0 z-50 bg-[#0A1628] pt-20 pb-8 px-6 overflow-y-auto max-h-screen"
          >
            {/* close row */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>

            <div className="space-y-1">
              {allItems.map((item, idx) => {
                const isSection =
                  idx === PRIMARY_NAV.length &&
                  idx !== 0;
                return (
                  <React.Fragment key={item.path}>
                    {isSection && (
                      <div className="pt-4 pb-2">
                        <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                          More
                        </span>
                      </div>
                    )}
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        [
                          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-white/10 text-amber-400'
                            : 'text-white/80 hover:bg-white/10 hover:text-white',
                        ].join(' ')
                      }
                    >
                      <span className="text-white/50">{item.icon}</span>
                      {item.label}
                      {item.path === '/notifications' && notificationCount > 0 && (
                        <span className="ml-auto bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                      )}
                    </NavLink>
                  </React.Fragment>
                );
              })}
            </div>

            {/* bottom actions */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4">
              <button className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                <Settings size={16} />
                Settings
              </button>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
};

// ---------------------------------------------------------------------------
// TopNavbar — main export
// ---------------------------------------------------------------------------
interface TopNavbarProps {
  notificationCount?: number;
  userAvatarUrl?: string;
  userName?: string;
  onSearchOpen?: () => void;
  onUserClick?: () => void;
  onSettingsClick?: () => void;
  [key: string]: unknown;
}

const TopNavbar: React.FC<TopNavbarProps> = ({
  notificationCount = 0,
  userAvatarUrl,
  userName = 'User',
  onSearchOpen,
  onUserClick,
  onSettingsClick,
  ...props
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header
        data-testid="top-navbar"
        className="fixed top-0 left-0 right-0 z-50 w-full bg-[#0A1628] shadow-md"
        {...props}
      >
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-6 px-4 sm:px-6 lg:px-8">

          {/* ---- Logo ---- */}
          <NavLink
            to="/"
            data-testid="nav-home"
            className="flex items-center gap-2.5 shrink-0 mr-2"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#1B4FD8]">
              <CricketBatIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-extrabold text-base tracking-wide">
                CRICKET
              </span>
              <span className="text-amber-400 text-[9px] font-semibold tracking-widest uppercase">
                Auction Platform
              </span>
            </div>
          </NavLink>

          {/* ---- Desktop Nav (hidden on mobile) ---- */}
          <nav className="hidden lg:flex flex-1 items-center gap-5 overflow-x-auto scrollbar-none">
            {PRIMARY_NAV.map((item) => (
              <NavLinkItem key={item.path} item={item} />
            ))}
            <MoreDropdown />
          </nav>

          {/* ---- Right Actions ---- */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {/* Search */}
            <button
              data-testid="navbar-search-btn"
              onClick={onSearchOpen}
              aria-label="Open search"
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Search size={18} />
            </button>

            {/* Notifications */}
            <button
              data-testid="navbar-notifications-btn"
              onClick={() => {}}
              aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
              className="relative p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-[#EA580C] rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>

            {/* User Avatar */}
            <button
              data-testid="navbar-user-btn"
              onClick={onUserClick}
              aria-label="User account"
              className="relative w-8 h-8 rounded-full bg-[#1B4FD8] hover:ring-2 hover:ring-amber-400 transition-all overflow-hidden flex items-center justify-center shrink-0"
            >
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-xs font-semibold">{initials}</span>
              )}
            </button>

            {/* Settings — hidden on small screens */}
            <button
              data-testid="navbar-settings-btn"
              onClick={onSettingsClick}
              aria-label="Settings"
              className="hidden sm:inline-flex p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Settings size={18} />
            </button>

            {/* Mobile hamburger */}
            <button
              data-testid="navbar-mobile-menu-btn"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="lg:hidden p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex"
                  >
                    <X size={20} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex"
                  >
                    <Menu size={20} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — rendered outside header to cover full screen */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        notificationCount={notificationCount}
      />
    </>
  );
};

export default TopNavbar;
