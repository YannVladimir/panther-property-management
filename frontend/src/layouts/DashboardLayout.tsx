import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  CalendarCheck2,
  Users,
  Building,
  DoorOpen,
  Receipt,
  UserCheck,
  TrendingDown,
  Repeat,
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  Droplets,
  Briefcase,
  FileBarChart,
  History,
  Bell,
  Settings,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Clock,
  Layers,
  DollarSign,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  useMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../api/notifications';
import { RoleSwitcher } from '../components/common/RoleSwitcher';
import { GlobalSearchModal } from '../components/common/GlobalSearchModal';

const SEARCH_ENABLED_ROLES = ['operations', 'admin', 'owner'];

export const DashboardLayout: React.FC = () => {
  const { currentRole, currentUser, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const notificationsQuery = useMyNotificationsQuery();
  const notifications = notificationsQuery.data ?? [];
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const markNotificationRead = (id: string) => markReadMutation.mutate(id);
  const markAllNotificationsRead = () => markAllReadMutation.mutate();
  const canSearch = SEARCH_ENABLED_ROLES.includes(currentRole);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('panther_sidebar_collapsed') === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('panther_sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real notifications are already scoped to the logged-in user server-side (GET /notifications/me) —
  // no client-side role filtering needed (the old mock-era version filtered a shared broadcast array
  // by currentRole, which is exactly the kind of self-service-scoping bug found in every prior domain).
  const unreadNotifs = notifications.filter((n) => !n.read);

  // Navigation configs based on logged-in role
  const getNavLinks = () => {
    switch (currentRole) {
      case 'client':
        return [
          { label: 'Dashboard', path: '/client', icon: LayoutDashboard },
          { label: 'My Booking', path: '/client/my-booking', icon: CalendarCheck2 },
          { label: 'My Room', path: '/client/my-room', icon: DoorOpen },
          { label: 'Payments & Receipts', path: '/client/payments', icon: Receipt },
          { label: 'My Materials', path: '/client/my-materials', icon: Package },
          { label: 'Report Issue', path: '/client/report-issue', icon: Wrench },
          { label: 'Notifications', path: '/client/notifications', icon: Bell },
          { label: 'Profile & Settings', path: '/client/settings', icon: Settings },
        ];
      case 'owner':
        return [
          { label: 'Executive Dashboard', path: '/owner', icon: LayoutDashboard },
          { label: 'Properties Portfolio', path: '/owner/properties', icon: Building },
          { label: 'Financial Analytics', path: '/owner/financials', icon: DollarSign },
          { label: 'Occupancy Analytics', path: '/owner/occupancy', icon: Layers },
          { label: 'Clients & Tenancy', path: '/owner/clients', icon: Users },
          { label: 'Maintenance ROI', path: '/owner/maintenance', icon: Wrench },
          { label: 'Executive Reports', path: '/owner/reports', icon: FileBarChart },
          { label: 'Smart Alerts', path: '/owner/notifications', icon: Bell },
          { label: 'Settings', path: '/owner/settings', icon: Settings },
        ];
      case 'household':
        return [
          { label: 'Dashboard', path: '/household', icon: LayoutDashboard },
          { label: 'Preventive Checklist', path: '/household/checklist', icon: ClipboardCheck },
          { label: 'My Assigned Tasks', path: '/household/tasks', icon: CalendarCheck2 },
          { label: 'Task History', path: '/household/history', icon: History },
          { label: 'Salary History', path: '/household/salary', icon: Receipt },
          { label: 'Notifications', path: '/household/notifications', icon: Bell },
          { label: 'Profile', path: '/household/settings', icon: Settings },
        ];
      case 'admin':
        return [
          { label: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
          { label: 'Properties CRUD', path: '/admin/properties', icon: Building },
          { label: 'Buildings & Rooms', path: '/admin/buildings-rooms', icon: DoorOpen },
          { label: 'Rental Types Config', path: '/admin/rental-types', icon: Layers },
          { label: 'Users & Roles', path: '/admin/users', icon: Users },
          { label: 'System Settings', path: '/admin/settings', icon: Settings },
          { label: 'Activity Logs', path: '/admin/logs', icon: History },
        ];
      case 'operations':
      default:
        return [
          { label: 'Overview Dashboard', path: '/operations', icon: LayoutDashboard },
          { label: 'Bookings Workflow', path: '/operations/bookings', icon: CalendarCheck2 },
          { label: 'Clients / Tenants', path: '/operations/clients', icon: Users },
          { label: 'Properties & Units', path: '/operations/properties', icon: Building },
          { label: 'Payment Ledger', path: '/operations/payments', icon: Receipt },
          { label: 'Agents & Commissions', path: '/operations/agents', icon: UserCheck },
          { label: 'Expense Tracker', path: '/operations/expenses', icon: TrendingDown },
          { label: 'Recurring Bills', path: '/operations/recurring-bills', icon: Repeat },
          { label: 'Technicians Directory', path: '/operations/technicians', icon: Wrench },
          { label: 'Preventive Maintenance', path: '/operations/preventive-maintenance', icon: ClipboardCheck },
          { label: 'Damages Manager', path: '/operations/damages', icon: AlertTriangle },
          { label: 'Water Meter Readings', path: '/operations/water-meters', icon: Droplets },
          { label: 'HR & Payroll', path: '/operations/hr-payroll', icon: Briefcase },
          { label: 'Reports Hub', path: '/operations/reports', icon: FileBarChart },
          { label: 'Activity Timeline', path: '/operations/activity-log', icon: History },
          { label: 'Notifications', path: '/operations/notifications', icon: Bell },
          { label: 'System Settings', path: '/operations/settings', icon: Settings },
        ];
    }
  };

  const navLinks = getNavLinks();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 h-screen z-20 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Brand Header & Single Sidebar Collapse Button */}
        <div className={`h-16 flex items-center border-b border-slate-100 dark:border-slate-800 transition-all ${
          sidebarCollapsed ? 'px-3 justify-center' : 'px-4 justify-between'
        }`}>
          <NavLink to="/" className="flex items-center gap-2.5 min-w-0" title="Panther Living PMS">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-500 to-sky-400 flex items-center justify-center text-white shadow-glow shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <span className="text-base font-extrabold font-display tracking-tight text-slate-900 dark:text-white truncate block">
                  PANTHER <span className="text-brand-500 text-xs font-bold">PMS</span>
                </span>
                <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 -mt-0.5 truncate">
                  {currentRole} Mode
                </p>
              </div>
            )}
          </NavLink>

          {/* The Single Toggle Button */}
          <button
            onClick={toggleSidebar}
            className={`p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              sidebarCollapsed ? 'hidden' : 'block'
            }`}
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsed Expand Trigger Strip */}
        {sidebarCollapsed && (
          <div className="px-2 pt-2">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/60 transition-colors group relative"
              title="Expand Sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
              <div className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                Expand Sidebar
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-800" />
              </div>
            </button>
          </div>
        )}

        {/* User Card Pill */}
        {currentUser && (
          <div
            className={`p-2.5 my-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center transition-all group relative ${
              sidebarCollapsed ? 'mx-2 justify-center cursor-pointer' : 'mx-3 gap-2.5'
            }`}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0"
            />
            {!sidebarCollapsed ? (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-brand-600 dark:text-brand-400 capitalize font-medium truncate">
                  {currentUser.title || currentUser.role}
                </p>
              </div>
            ) : (
              /* Floating Tooltip for User Avatar */
              <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                <p className="font-bold">{currentUser.name}</p>
                <p className="text-[10px] text-brand-400 capitalize">{currentUser.title || currentUser.role}</p>
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-800" />
              </div>
            )}
          </div>
        )}

        {/* Navigation List */}
        <div className={`flex-1 px-2.5 py-2 space-y-1 ${
          sidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto'
        }`}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isExact =
              link.path === '/client' ||
              link.path === '/operations' ||
              link.path === '/owner' ||
              link.path === '/household' ||
              link.path === '/admin';
            const isActive = isExact ? location.pathname === link.path : location.pathname.startsWith(link.path);

            return (
              <NavLink
                key={link.path}
                to={link.path}
                title={sidebarCollapsed ? link.label : undefined}
                className={`relative flex items-center rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`} />
                
                {!sidebarCollapsed ? (
                  <span className="truncate">{link.label}</span>
                ) : (
                  /* Floating Tooltip when Collapsed */
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-2xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 flex items-center gap-2">
                    <span>{link.label}</span>
                    {link.label.includes('Notifications') && unreadNotifs.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                        {unreadNotifs.length}
                      </span>
                    )}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-800" />
                  </div>
                )}

                {link.label.includes('Notifications') && unreadNotifs.length > 0 && (
                  sidebarCollapsed ? (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  ) : (
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white text-brand-700' : 'bg-rose-500 text-white'}`}>
                      {unreadNotifs.length}
                    </span>
                  )
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
          {sidebarCollapsed ? (
            <>
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center p-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group relative"
              >
                <Building2 className="w-4 h-4" />
                <div className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                  Public Website
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-800" />
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors group relative"
              >
                <LogOut className="w-4 h-4" />
                <div className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                  Log Out
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-800" />
                </div>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>Public Website</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-16 glass border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Spotlight Search bar trigger — real GET /search is restricted server-side to
                operations/admin/owner, so the trigger is hidden entirely for client/household rather
                than shown and then 403ing on first use. */}
            {canSearch && (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs w-48 sm:w-72 transition-colors"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span className="truncate">Search apartments, tenants, invoices...</span>
                <kbd className="hidden sm:inline-block ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">
                  ⌘K
                </kbd>
              </button>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Floating Role Switcher */}
            <RoleSwitcher />

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-40 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-brand-500" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Notifications</span>
                        <span className="text-xs bg-brand-50 text-brand-600 dark:bg-brand-950/80 px-2 py-0.5 rounded-full font-semibold">
                          {unreadNotifs.length} New
                        </span>
                      </div>
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs font-semibold text-brand-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 my-2">
                      {notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.link) navigate(n.link);
                            setNotifDropdownOpen(false);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                            n.read ? 'opacity-70 hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-brand-50/50 dark:bg-brand-950/30 hover:bg-brand-50 dark:hover:bg-brand-950/60'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</p>
                            <span className="text-[10px] text-slate-400">{n.time}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </header>

        {/* Dashboard Main Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Search Modal — real search is role-restricted, see canSearch above */}
      {canSearch && <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />}

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <span className="text-base font-bold font-display text-slate-900 dark:text-white">
                Panther Living
              </span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? 'bg-brand-600 text-white font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
