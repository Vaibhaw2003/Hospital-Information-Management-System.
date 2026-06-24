import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  ClipboardList,
  FileSpreadsheet,
  Receipt,
  Pill,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Key,
  ChevronDown,
  Bell,
  Activity,
  Building2
} from 'lucide-react';

const NAV_ITEMS = [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    roles: ['Admin', 'Receptionist', 'Doctor', 'Pharmacist']
  },
  {
    name: 'Doctors',
    path: '/doctors',
    icon: Stethoscope,
    roles: ['Admin', 'Receptionist']
  },
  {
    name: 'Patients',
    path: '/patients',
    icon: Users,
    roles: ['Admin', 'Receptionist', 'Doctor']
  },
  {
    name: 'OPD Queue',
    path: '/opd',
    icon: ClipboardList,
    roles: ['Admin', 'Receptionist', 'Doctor']
  },
  {
    name: 'Prescriptions',
    path: '/prescriptions',
    icon: FileSpreadsheet,
    roles: ['Admin', 'Doctor', 'Pharmacist']
  },
  {
    name: 'Billing',
    path: '/billing',
    icon: Receipt,
    roles: ['Admin', 'Receptionist']
  },
  {
    name: 'Inventory',
    path: '/inventory',
    icon: Pill,
    roles: ['Admin', 'Pharmacist']
  }
];

const ROLE_COLORS = {
  Admin:        { dot: 'bg-rose-500',   text: 'text-rose-400',   badge: 'bg-rose-500/15 text-rose-300 ring-rose-500/20' },
  Doctor:       { dot: 'bg-blue-500',   text: 'text-blue-400',   badge: 'bg-blue-500/15 text-blue-300 ring-blue-500/20' },
  Receptionist: { dot: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/20' },
  Pharmacist:   { dot: 'bg-amber-500',  text: 'text-amber-400',  badge: 'bg-amber-500/15 text-amber-300 ring-amber-500/20' },
};

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/doctors': 'Doctors',
  '/patients': 'Patients',
  '/opd': 'OPD Queue',
  '/prescriptions': 'Prescriptions',
  '/billing': 'Billing',
  '/inventory': 'Inventory',
  '/change-password': 'Change Password',
};

function SidebarContent({ navItems, isActiveRoute, handleLogout, user, closeSidebar }) {
  const roleColor = ROLE_COLORS[user?.role] || {};

  return (
    <>
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-6 h-16 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', boxShadow: '0 4px 14px rgba(37,99,235,0.40)' }}>
          <Activity size={16} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-white font-bold text-[15px] tracking-tight leading-none">HIMS</p>
          <p className="text-white/40 text-[10px] font-medium mt-0.5">Hospital System</p>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="mx-4 mt-4 rounded-xl p-3 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)' }}>
            {user?.username?.substring(0, 2).toUpperCase() || 'HM'}
          </div>
          <div className="min-w-0">
            <p className="text-white/90 text-[13px] font-semibold truncate">{user?.username || 'Staff'}</p>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${roleColor.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${roleColor.dot}`}></span>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={closeSidebar}
              className={`nav-item ${active ? 'active' : ''}`}
            >
              <Icon size={16} className="nav-icon" />
              <span>{item.name}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 pb-4 space-y-1 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '4px' }}>
        <Link
          to="/change-password"
          onClick={closeSidebar}
          className="nav-item"
        >
          <Key size={16} className="nav-icon" />
          Change Password
        </Link>
        <button
          onClick={handleLogout}
          className="nav-item w-full text-left"
          style={{ color: 'rgba(248,113,113,0.85)' }}
        >
          <LogOut size={16} style={{ color: 'rgba(248,113,113,0.50)' }} />
          Sign Out
        </button>
      </div>
    </>
  );
}

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = NAV_ITEMS.filter(item => item.roles.includes(user?.role));

  const isActiveRoute = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const currentTitle = PAGE_TITLES[location.pathname] || 'HIMS';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const roleColor = ROLE_COLORS[user?.role] || {};

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface-2)' }}>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex sidebar">
        <SidebarContent
          navItems={navItems}
          isActiveRoute={isActiveRoute}
          handleLogout={handleLogout}
          user={user}
          closeSidebar={() => {}}
        />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="sidebar"
            style={{ animation: 'slideInLeft 0.2s cubic-bezier(0.16,1,0.3,1)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
            >
              <X size={16} />
            </button>
            <SidebarContent
              navItems={navItems}
              isActiveRoute={isActiveRoute}
              handleLogout={handleLogout}
              user={user}
              closeSidebar={() => setSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Topbar ── */}
        <header className="topbar">
          <div className="flex items-center gap-4">
            {/* Mobile menu */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden btn btn-ghost btn-icon"
            >
              <Menu size={20} />
            </button>

            {/* Page Title */}
            <div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Building2 size={12} />
                <span>HIMS Hospital</span>
                <span style={{ color: 'var(--border-2)' }}>/</span>
                <span style={{ color: 'var(--text-secondary)' }}>{currentTitle}</span>
              </div>
              <h1 className="text-[18px] font-bold tracking-tight leading-tight mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {currentTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-icon"
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {theme === 'dark'
                ? <Sun size={18} style={{ color: 'var(--text-secondary)' }} />
                : <Moon size={18} style={{ color: 'var(--text-secondary)' }} />
              }
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                style={{
                  background: dropdownOpen ? 'var(--surface-3)' : 'transparent',
                  border: '1.5px solid',
                  borderColor: dropdownOpen ? 'var(--border-2)' : 'transparent'
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)' }}
                >
                  {user?.username?.substring(0, 2).toUpperCase() || 'HM'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[13px] font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>
                    {user?.username}
                  </p>
                  <p className={`text-[10px] font-semibold mt-0.5 ${roleColor.text}`}>
                    {user?.role}
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    color: 'var(--text-muted)',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease'
                  }}
                />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden fade-in"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 40
                  }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      to="/change-password"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Key size={15} style={{ color: 'var(--text-muted)' }} />
                      Change Password
                    </Link>
                    <button
                      onClick={() => { setDropdownOpen(false); handleLogout(); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-left transition-colors"
                      style={{ color: '#dc2626' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={15} style={{ color: '#dc2626' }} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-screen-xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
