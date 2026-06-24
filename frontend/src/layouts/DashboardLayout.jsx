import React, { useState } from 'react';
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
  User as UserIcon
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define sidebar navigation items based on role
  const getNavItems = () => {
    const role = user?.role;
    const items = [
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
        name: 'Billing & Invoices',
        path: '/billing',
        icon: Receipt,
        roles: ['Admin', 'Receptionist']
      },
      {
        name: 'Medicine Inventory',
        path: '/inventory',
        icon: Pill,
        roles: ['Admin', 'Pharmacist']
      }
    ];

    return items.filter((item) => item.roles.includes(role));
  };

  const navItems = getNavItems();

  // Helper to check if current route matches
  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Get human readable role badge classes
  const getRoleBadgeClasses = (role) => {
    switch (role) {
      case 'Admin': return 'bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30';
      case 'Doctor': return 'bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30';
      case 'Receptionist': return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30';
      case 'Pharmacist': return 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-[#080b11] dark:text-slate-100 transition-colors duration-200">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white/90 dark:bg-slate-950/40 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/40 flex-shrink-0">
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200/80 dark:border-slate-800/40">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg">
            <span className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/30 glow-blue">
              <Stethoscope size={20} />
            </span>
            <span className="font-extrabold tracking-tight text-gradient-primary">HIMS Hub</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 group ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 glow-blue transform translate-x-1'
                    : 'text-slate-500 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon size={18} className={`transition-transform duration-300 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/40">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 w-full px-4 py-3.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-450 dark:hover:bg-rose-950/20 transition-all duration-300 font-semibold text-sm cursor-pointer"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Sidebar for Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/60 backdrop-blur-sm">
          <aside className="w-64 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200/80 dark:border-slate-800/40">
              <Link to="/" className="flex items-center gap-2.5 font-bold text-lg">
                <span className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-lg">
                  <Stethoscope size={20} />
                </span>
                <span className="font-extrabold tracking-tight text-gradient-primary">HIMS Hub</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-905"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      active
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'text-slate-500 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-slate-105'
                    }`}
                  >
                    <Icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/40">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3.5 w-full px-4 py-3.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-450 dark:hover:bg-rose-950/20 transition-all font-semibold text-sm"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Navbar */}
        <header className="h-20 glass-navbar flex items-center justify-between px-6 md:px-8 flex-shrink-0 z-30">
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-slate-850 dark:text-white leading-tight">
              Hospital Management System
            </h1>
          </div>

          <div className="flex items-center gap-4.5">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-350 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/40 hover:scale-105 transition-all duration-200 cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 text-left focus:outline-none hover:opacity-90 transition-opacity cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 border border-blue-500/20 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shadow-inner">
                  {user?.username ? user.username.substring(0, 2).toUpperCase() : 'UI'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {user?.username || 'Staff Member'}
                  </p>
                  <span className={`inline-block text-[9px] px-2.5 py-0.5 rounded-full font-bold mt-1 tracking-wider uppercase ${getRoleBadgeClasses(user?.role)}`}>
                    {user?.role}
                  </span>
                </div>
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-3.5 w-52 glass-card rounded-2xl shadow-xl py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <Link
                      to="/change-password"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 transition-colors font-medium"
                    >
                      <Key size={15} className="text-slate-400" />
                      Change Password
                    </Link>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-rose-650 hover:bg-rose-500/10 text-left transition-colors font-semibold cursor-pointer"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-[#080b11] p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default DashboardLayout;
