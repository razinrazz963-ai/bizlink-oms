import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileSpreadsheet,
  FolderOpen,
  CreditCard,
  Plus,
  ArrowRight,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle,
  ExternalLink,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api/client.js';
import { Application, DocumentRecord, TaskRecord } from '../types/index.js';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Live Stats from Database
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeApplications: 0,
    pendingDocuments: 0,
    pendingPayments: 0,
  });

  const [personalStats, setPersonalStats] = useState({
    myActiveApps: 0,
    myTotalApps: 0,
    myPendingTasks: 0,
    myOverdueTasks: 0,
    totalRevenue: 0,
  });

  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<{
    next7Days: DocumentRecord[];
    next15Days: DocumentRecord[];
    next30Days: DocumentRecord[];
    next60Days: DocumentRecord[];
    expired: DocumentRecord[];
  }>({
    next7Days: [],
    next15Days: [],
    next30Days: [],
    next60Days: [],
    expired: [],
  });

  const [activeExpiryTab, setActiveExpiryTab] = useState<'7' | '15' | '30' | '60'>('15');

  const [tasksSummary, setTasksSummary] = useState<{
    overdue: TaskRecord[];
    dueToday: TaskRecord[];
    upcoming: TaskRecord[];
  }>({
    overdue: [],
    dueToday: [],
    upcoming: [],
  });

  const [appSearch, setAppSearch] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [custs, apps, docs, paymentsSum, expiring, tasksRes] = await Promise.all([
        api.getCustomers(),
        api.getApplications(),
        api.getDocuments(),
        api.getPaymentsSummary(),
        api.getExpiringDocuments(),
        api.getTasks({ myTasksOnly: false }),
      ]);

      const activeAppsCount = apps.filter(
        (a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED'
      ).length;

      const pendingDocsCount = docs.filter(
        (d) => d.status === 'under_review' || d.status === 'expiring_soon'
      ).length;

      setStats({
        totalCustomers: custs.length,
        activeApplications: activeAppsCount,
        pendingDocuments: pendingDocsCount,
        pendingPayments: paymentsSum.totalOutstanding,
      });

      // Personal calculations
      const myApps = apps.filter((a) => a.assignedEmployeeId === user?.id);
      const myActiveApps = myApps.filter((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED');
      const myTasks = tasksRes.all.filter((t) => t.assignedEmployeeId === user?.id);
      const myPendingTasks = myTasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled');
      const now = new Date().toISOString();
      const myOverdueTasks = myPendingTasks.filter((t) => t.dueDate && t.dueDate < now);

      setPersonalStats({
        myActiveApps: myActiveApps.length,
        myTotalApps: myApps.length,
        myPendingTasks: myPendingTasks.length,
        myOverdueTasks: myOverdueTasks.length,
        totalRevenue: paymentsSum.totalRevenue || 0,
      });

      setRecentApplications(apps.slice(0, 5));
      setExpiringDocs(expiring);
      setTasksSummary({
        overdue: tasksRes.sections.overdue.slice(0, 3),
        dueToday: tasksRes.sections.dueToday.slice(0, 3),
        upcoming: tasksRes.sections.upcoming.slice(0, 3),
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredApps = () => {
    if (!appSearch) return recentApplications;
    const q = appSearch.toLowerCase();
    return recentApplications.filter(
      (a) =>
        a.trackingNumber.toLowerCase().includes(q) ||
        a.customerName.toLowerCase().includes(q) ||
        a.serviceName.toLowerCase().includes(q)
    );
  };

  const currentExpiringList =
    activeExpiryTab === '7'
      ? expiringDocs.next7Days
      : activeExpiryTab === '15'
      ? expiringDocs.next15Days
      : activeExpiryTab === '30'
      ? expiringDocs.next30Days
      : expiringDocs.next60Days;

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = user?.name ? user.name.split(' ')[0] : 'Team Member';
    if (hour < 12) return `Good Morning, ${firstName}`;
    if (hour < 17) return `Good Afternoon, ${firstName}`;
    return `Good Evening, ${firstName}`;
  };

  return (
    <div className="space-y-6">
      {/* Personalized Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0B2541] to-[#102F52] text-white p-5 rounded-2xl shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#31B8C1]">
            Operations Portal • {user?.designation || user?.role || 'Staff'}
          </span>
          <h1 className="text-xl font-bold mt-0.5">{getGreeting()}</h1>
          <p className="text-xs text-slate-300 mt-1">
            {user?.role === 'employee'
              ? 'Your assigned government filings, operational tasks, and pending document verifications'
              : user?.role === 'accountant'
              ? 'Real-time billing, receivables, and client collection metrics'
              : 'Enterprise overview of UAE clearance pipeline and registered client files'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-medium border border-white/10">
            {user?.department || 'Operations'} Department
          </span>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-[#0B2541]">Operations Quick Actions</h2>
          <p className="text-xs text-slate-500">Initiate customer files and documents in the UAE registry</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/customers')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B2541] hover:bg-[#102F52] text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#31B8C1]" />
            <span>Add Customer</span>
          </button>

          <button
            onClick={() => navigate('/applications')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>New Application</span>
          </button>

          <button
            onClick={() => navigate('/documents')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload Document</span>
          </button>

          <button
            onClick={() => navigate('/payments')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all"
          >
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 4 Adaptive Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {user?.role === 'employee' ? (
          <>
            <StatCard
              title="My Active Applications"
              value={personalStats.myActiveApps}
              icon={FileSpreadsheet}
              subtitle={personalStats.myActiveApps === 0 ? 'No files assigned currently' : `${personalStats.myTotalApps} total assigned`}
              onClick={() => navigate('/applications')}
            />
            <StatCard
              title="My Pending Tasks"
              value={personalStats.myPendingTasks}
              icon={CheckCircle}
              subtitle={personalStats.myOverdueTasks > 0 ? `${personalStats.myOverdueTasks} overdue tasks!` : 'All tasks on schedule'}
              onClick={() => navigate('/tasks')}
            />
            <StatCard
              title="Pending Documents"
              value={stats.pendingDocuments}
              icon={FolderOpen}
              subtitle={stats.pendingDocuments === 0 ? 'All vault documents verified' : 'Requires verification'}
              onClick={() => navigate('/documents')}
            />
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers}
              icon={Users}
              subtitle={stats.totalCustomers === 0 ? 'No customers yet' : 'Verified active client files'}
              onClick={() => navigate('/customers')}
            />
          </>
        ) : user?.role === 'accountant' ? (
          <>
            <StatCard
              title="Pending Receivables"
              value={`AED ${stats.pendingPayments.toLocaleString()}`}
              icon={CreditCard}
              subtitle={stats.pendingPayments === 0 ? 'All invoices fully settled' : 'Outstanding client balance'}
              onClick={() => navigate('/payments')}
            />
            <StatCard
              title="Collected Revenue"
              value={`AED ${personalStats.totalRevenue.toLocaleString()}`}
              icon={CreditCard}
              subtitle="Total verified collections"
              onClick={() => navigate('/payments')}
            />
            <StatCard
              title="Active Applications"
              value={stats.activeApplications}
              icon={FileSpreadsheet}
              subtitle={stats.activeApplications === 0 ? 'No open applications' : 'Applications in pipeline'}
              onClick={() => navigate('/applications')}
            />
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers}
              icon={Users}
              subtitle={stats.totalCustomers === 0 ? 'No registered clients yet' : 'Client accounts'}
              onClick={() => navigate('/customers')}
            />
          </>
        ) : (
          <>
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers}
              icon={Users}
              subtitle={stats.totalCustomers === 0 ? 'No registered customers yet' : 'Verified active client files'}
              onClick={() => navigate('/customers')}
            />
            <StatCard
              title="Active Applications"
              value={stats.activeApplications}
              icon={FileSpreadsheet}
              subtitle={stats.activeApplications === 0 ? 'No open applications in pipeline' : 'Under government processing'}
              onClick={() => navigate('/applications')}
            />
            <StatCard
              title="Pending Documents"
              value={stats.pendingDocuments}
              icon={FolderOpen}
              subtitle={stats.pendingDocuments === 0 ? 'All client documentation verified' : 'Requires review or expiring'}
              onClick={() => navigate('/documents')}
            />
            <StatCard
              title="Pending Payments"
              value={`AED ${stats.pendingPayments.toLocaleString()}`}
              icon={CreditCard}
              subtitle={stats.pendingPayments === 0 ? 'All invoices fully settled' : 'Outstanding client balance'}
              onClick={() => navigate('/payments')}
            />
          </>
        )}
      </div>

      {/* Main Grid: Recent Applications & Expiry Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Applications */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#0B2541]">Recent Applications</h3>
              <p className="text-xs text-slate-500">Live operational files under processing</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter recent..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#0B2541] focus:outline-none focus:ring-1 focus:ring-[#31B8C1] w-36 sm:w-44"
                />
              </div>

              <button
                onClick={() => navigate('/applications')}
                className="text-xs font-semibold text-[#31B8C1] hover:underline whitespace-nowrap"
              >
                View All →
              </button>
            </div>
          </div>

          {recentApplications.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={FileSpreadsheet}
                title="No applications yet"
                description="Create your first client application to begin tracking UAE visa, Emirates ID, or document clearing files."
                actionText="Create Application"
                onAction={() => navigate('/applications')}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-4">Tracking ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Assigned Officer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getFilteredApps().map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => navigate(`/applications/${app.id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#0B2541]">
                        {app.trackingNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {app.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-[180px]">
                        {app.serviceName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {app.assignedEmployeeName}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={app.status} type="application" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/applications/${app.id}`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#31B8C1] rounded-lg hover:bg-slate-100"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Documents Expiring Soon (Expiry Radar) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-[#0B2541]">Documents Expiring Soon</h3>
              </div>
              <button
                onClick={() => navigate('/documents')}
                className="text-xs font-semibold text-[#31B8C1] hover:underline"
              >
                Vault →
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Proactive radar for client passport, visa, & ID renewals
            </p>

            {/* Filter Tabs: 7d, 15d, 30d, 60d */}
            <div className="grid grid-cols-4 gap-1 mt-4 p-1 bg-slate-100 rounded-xl">
              {(['7', '15', '30', '60'] as const).map((days) => (
                <button
                  key={days}
                  onClick={() => setActiveExpiryTab(days)}
                  className={`py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    activeExpiryTab === days
                      ? 'bg-white text-[#0B2541] shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto max-h-80">
            {currentExpiringList.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">No documents expiring in {activeExpiryTab} days</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All monitored applicant files are up to date.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {currentExpiringList.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => navigate('/documents')}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[#0B2541]">{doc.documentName}</div>
                        <div className="text-[11px] text-slate-500">{doc.customerName}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        (doc.daysRemaining || 0) <= 7
                          ? 'bg-rose-100 text-rose-700'
                          : (doc.daysRemaining || 0) <= 15
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {doc.daysRemaining} days left
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Expires: {doc.expiryDate}</span>
                      <span className="text-[#31B8C1] font-medium hover:underline">Remind Client →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Internal Task Pipeline (My Tasks) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0B2541]">Operational Tasks</h3>
            <p className="text-xs text-slate-500">Internal actions and government appointments</p>
          </div>
          <button
            onClick={() => navigate('/tasks')}
            className="text-xs font-semibold text-[#31B8C1] hover:underline"
          >
            All Tasks →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overdue */}
          <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Overdue</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {tasksSummary.overdue.length}
              </span>
            </div>
            {tasksSummary.overdue.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-3 text-center">No overdue tasks 🎉</p>
            ) : (
              <div className="space-y-2">
                {tasksSummary.overdue.map((t) => (
                  <div key={t.id} className="p-2 bg-white rounded-lg border border-rose-200 text-xs">
                    <div className="font-semibold text-slate-800">{t.title}</div>
                    <div className="text-[10px] text-rose-600 mt-1">Due: {t.dueDate}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Due Today */}
          <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Due Today</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {tasksSummary.dueToday.length}
              </span>
            </div>
            {tasksSummary.dueToday.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-3 text-center">No tasks scheduled for today</p>
            ) : (
              <div className="space-y-2">
                {tasksSummary.dueToday.map((t) => (
                  <div key={t.id} className="p-2 bg-white rounded-lg border border-amber-200 text-xs">
                    <div className="font-semibold text-slate-800">{t.title}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Assignee: {t.assignedEmployeeName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Upcoming</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {tasksSummary.upcoming.length}
              </span>
            </div>
            {tasksSummary.upcoming.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-3 text-center">No upcoming tasks queued</p>
            ) : (
              <div className="space-y-2">
                {tasksSummary.upcoming.map((t) => (
                  <div key={t.id} className="p-2 bg-white rounded-lg border border-slate-200 text-xs">
                    <div className="font-semibold text-slate-800">{t.title}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Target: {t.dueDate}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
