import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  BarChart3,
  Calendar,
  Download,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Users,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api/client.js';

export const Reports: React.FC = () => {
  const [range, setRange] = useState('30days');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [range]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReports(range);
      setData(res);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value\n' +
      `Total Customers,${data.kpi.totalCustomers}\n` +
      `Active Applications,${data.kpi.activeApplications}\n` +
      `Completed Applications,${data.kpi.completedApplications}\n` +
      `Total Collected Revenue (AED),${data.kpi.totalRevenue}\n` +
      `Outstanding Receivables (AED),${data.kpi.totalOutstanding}\n` +
      `Total Billed (AED),${data.kpi.totalBilled}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bizlink-operations-report-${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const PIE_COLORS = ['#31B8C1', '#0B2541', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#64748B'];

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Generating operational reports and financial metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B2541]">Reports & Executive Analytics</h1>
          <p className="text-xs text-slate-500">
            Performance indicators, application velocity, and financial collections
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#31B8C1] ml-2" />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-transparent text-xs text-slate-700 pr-2 py-1 focus:outline-none font-medium"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B2541] hover:bg-[#102F52] text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#31B8C1]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-2">
            AED {data.kpi.totalRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Billed: AED {data.kpi.totalBilled.toLocaleString()}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Balance</span>
          <div className={`text-xl font-bold font-mono mt-2 ${data.kpi.totalOutstanding > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            AED {data.kpi.totalOutstanding.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Pending client settlements</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Applications</span>
          <div className="text-xl font-bold text-[#0B2541] mt-2">
            {data.kpi.activeApplications}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Completed: {data.kpi.completedApplications}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Clients</span>
          <div className="text-xl font-bold text-[#31B8C1] mt-2">
            {data.kpi.totalCustomers}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Vault Docs: {data.kpi.totalDocuments}</span>
        </div>
      </div>

      {/* Main Charts: Monthly Performance & Applications by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0B2541]">Monthly Collections & Volume</h3>
              <p className="text-xs text-slate-500">Revenue trajectory over time</p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#31B8C1]">AED Curve</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#31B8C1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#31B8C1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [`AED ${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0B2541', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#31B8C1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Status Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0B2541]">Applications by Status</h3>
            <p className="text-xs text-slate-500 mb-4">Current stage distribution</p>

            <div className="h-48 w-full flex items-center justify-center">
              {data.kpi.activeApplications + data.kpi.completedApplications === 0 ? (
                <p className="text-xs text-slate-400">No applications recorded yet</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.appsByStatus.filter((s: any) => s.count > 0)}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      innerRadius={40}
                      paddingAngle={4}
                    >
                      {data.appsByStatus.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0B2541', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="space-y-1 mt-2 text-xs divide-y divide-slate-100">
            {data.appsByStatus.filter((s: any) => s.count > 0).map((s: any, idx: number) => (
              <div key={s.status} className="flex justify-between py-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-slate-600 truncate max-w-[130px]">{s.status}</span>
                </div>
                <span className="font-bold text-slate-800">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Services Distribution & Employee Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services Popularity Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <h3 className="text-sm font-bold text-[#0B2541] mb-1">Volume by Service Category</h3>
          <p className="text-xs text-slate-500 mb-4">Top utilized document and visa packages</p>

          <div className="h-60 w-full">
            {data.appsByService.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No service applications recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.appsByService} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B2541', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="count" fill="#0B2541" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Staff Workload */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <h3 className="text-sm font-bold text-[#0B2541] mb-1">PRO Staff Workload Allocation</h3>
          <p className="text-xs text-slate-500 mb-4">Active and completed files handled per officer</p>

          <div className="h-60 w-full">
            {data.employeeWorkload.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No active employee assignments yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.employeeWorkload} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B2541', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="activeApps" name="Active Files" fill="#31B8C1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completedApps" name="Completed Files" fill="#0B2541" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
