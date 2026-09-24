import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  FolderOpen,
  CreditCard,
  Receipt,
  Briefcase,
  CheckSquare,
  UserCheck,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  X,
  Compass,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout, hasRole, hasPermission } = useAuth();

  const primaryNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users, permission: 'customers.view' },
    { name: 'Applications', path: '/applications', icon: FileSpreadsheet, permission: 'applications.view' },
    { name: 'Documents', path: '/documents', icon: FolderOpen, permission: 'documents.view' },
    { name: 'Payments', path: '/payments', icon: CreditCard, permission: 'payments.view', roles: ['admin', 'manager', 'accountant'] },
    { name: 'Invoices', path: '/invoices', icon: Receipt, permission: 'invoices.view', roles: ['admin', 'manager', 'accountant'] },
    { name: 'Services', path: '/services', icon: Briefcase, permission: 'services.manage' },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare, permission: 'tasks.view' },
    { name: 'Employees', path: '/employees', icon: UserCheck, permission: 'employees.view', roles: ['admin', 'manager'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, permission: 'reports.view', roles: ['admin', 'manager', 'accountant'] },
  ];

  const managementNavItems = [
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'My Profile', path: '/profile', icon: UserIcon },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin'], permission: 'settings.manage' },
    { name: 'Customer Tracking', path: '/track', icon: Compass, public: true },
  ];

  const isItemVisible = (item: any) => {
    if (user?.role === 'admin') return true;
    if (item.public) return true;
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.roles && !hasRole(item.roles)) return false;
    return true;
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#0B2541] text-slate-300 border-r border-[#102F52] selection:bg-[#31B8C1]/30">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-[#102F52] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#071B30] p-2 rounded-xl border border-[#102F52] flex-shrink-0">
            <img
              src="/bizlink-logo-square.png"
              alt="BizLink Logo"
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-baseline leading-none">
                <span className="font-extrabold text-lg tracking-tight text-white">biz</span>
                <span className="font-extrabold text-lg tracking-tight text-[#31B8C1]">link</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#31B8C1] px-1.5 py-0.5 rounded bg-[#31B8C1]/15 leading-none">
                OMS
              </span>
            </div>
            <p className="text-[10px] text-[#31B8C1] font-semibold tracking-wider mt-0.5 leading-none">
              Services
            </p>
            <p className="text-[11px] text-slate-300 font-medium leading-none mt-1.5">
              Operations Management System
            </p>
            <p className="text-[9px] text-[#31B8C1]/90 uppercase tracking-widest font-mono mt-1 leading-none">
              Internal Business Portal
            </p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#102F52]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Operations */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Core Operations
          </div>
          <nav className="space-y-1">
            {primaryNavItems
              .filter(isItemVisible)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-[#31B8C1] text-white shadow-sm font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-[#102F52]/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </NavLink>
                );
              })}
          </nav>
        </div>

        {/* Management & Portal */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            System & Tools
          </div>
          <nav className="space-y-1">
            {managementNavItems
              .filter(isItemVisible)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-[#31B8C1] text-white shadow-sm font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-[#102F52]/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </NavLink>
                );
              })}
          </nav>
        </div>
      </div>

      {/* Bottom User Persona Badge & Logout */}
      <div className="p-3 border-t border-[#102F52] bg-[#071B30]/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#0B2541] border border-[#102F52]">
          <NavLink
            to="/profile"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 overflow-hidden group hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-[#31B8C1] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate group-hover:text-[#31B8C1] transition-colors">
                {user?.name || 'Authorized Staff'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.designation || (user?.role ? user.role.toUpperCase() : 'Staff')}
              </div>
            </div>
          </NavLink>

          <button
            onClick={() => {
              logout();
              if (onCloseMobile) onCloseMobile();
            }}
            title="Sign Out of Portal"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#102F52] rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-30 shadow-elevated">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#071B30]/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0B2541] shadow-2xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
