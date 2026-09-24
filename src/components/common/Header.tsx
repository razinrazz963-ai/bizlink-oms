import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Menu,
  Calendar,
  User as UserIcon,
  ChevronDown,
  LogOut,
  KeyRound,
  CheckCircle,
  ExternalLink,
  Trash2,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { NotificationRecord } from '../../types/index.js';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenSearch }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Current Date in Dubai UAE
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchNotifs = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      // quiet fallback
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearRead = async () => {
    try {
      await api.clearReadNotifications();
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu + Greeting */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-slate-500 hover:text-[#0B2541] hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#0B2541] leading-tight">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Staff'}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {user?.designation ? `${user.designation} • ` : ''}BizLink Operations Management Portal
            </p>
          </div>
        </div>

        {/* Right Side: Global Search + Date + Notification Bell + User Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-[#0B2541] text-xs border border-slate-200 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-[#31B8C1]" />
            <span className="hidden sm:inline">Search records...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white rounded border border-slate-200">
              Ctrl+K
            </kbd>
          </button>

          {/* Current Date */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80">
            <Calendar className="w-3.5 h-3.5 text-[#31B8C1]" />
            <span>{formattedDate}</span>
          </div>

          {/* Notification Icon */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-[#0B2541] hover:bg-slate-100 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 overflow-hidden animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B2541]">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-[#31B8C1] text-white font-semibold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#31B8C1] hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={handleClearRead}
                      className="text-[11px] text-slate-400 hover:text-rose-500 font-medium"
                      title="Clear read alerts"
                    >
                      Clear read
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={async () => {
                          if (!n.isRead) {
                            await api.markNotificationRead(n.id);
                            fetchNotifs();
                          }
                          if (n.link) {
                            setShowNotifications(false);
                            navigate(n.link);
                          }
                        }}
                        className={`p-3 text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                          !n.isRead ? 'bg-[#31B8C1]/5 font-medium' : ''
                        }`}
                      >
                        <div className="font-semibold text-[#0B2541] flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5 leading-relaxed text-[11px]">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 text-center bg-slate-50">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/notifications');
                    }}
                    className="text-xs text-[#31B8C1] font-semibold hover:underline"
                  >
                    View All Notifications →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu (Replaces Switch Role Persona) */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-[#0B2541] text-[#31B8C1] flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="text-left hidden sm:block leading-tight">
                <div className="text-xs font-bold text-[#0B2541] truncate max-w-[120px]">
                  {user?.name || 'Staff User'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                  {user?.designation || (user?.role ? user.role.toUpperCase() : 'Staff')}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <div className="font-bold text-[#0B2541] text-xs truncate">{user?.name}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#31B8C1]/10 text-[#0B2541] border border-[#31B8C1]/20">
                      {user?.role}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {user?.department}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition-colors font-medium"
                  >
                    <UserIcon className="w-4 h-4 text-[#31B8C1]" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile#password');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition-colors font-medium"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    <span>Change Password</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
