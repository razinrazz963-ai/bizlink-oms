import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  CreditCard,
  CheckSquare,
  Clock,
  Filter
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState.js';
import { api } from '../api/client.js';
import { NotificationRecord } from '../types/index.js';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'application' | 'document_expiry' | 'payment' | 'task'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filter);

  const getIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <FileSpreadsheet className="w-4 h-4 text-blue-500" />;
      case 'document_expiry':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-[#31B8C1]" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B2541]">Notification Center</h1>
          <p className="text-xs text-slate-500">
            System activity alerts, expiring document notices, and task assignments
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'application', label: 'Applications' },
          { id: 'document_expiry', label: 'Expiry Notices' },
          { id: 'payment', label: 'Payments' },
          { id: 'task', label: 'Tasks' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              filter === tab.id
                ? 'border-[#31B8C1] text-[#0B2541]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You have no notifications in this category. You will be notified when applications are assigned or documents require renewal."
            />
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkSingleRead(n.id)}
              className={`p-4 flex items-start gap-4 transition-colors cursor-pointer hover:bg-slate-50 ${
                !n.isRead ? 'bg-[#31B8C1]/5' : ''
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-100 mt-0.5 flex-shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#0B2541]">{n.title}</h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
              </div>
              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-[#31B8C1] flex-shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
