import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Modal } from '../components/common/Modal.js';
import { api } from '../api/client.js';
import { Application, Customer, ServiceItem, User as EmployeeUser, ApplicationStatus } from '../types/index.js';

export const Applications: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  // New Application Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    serviceId: '',
    assignedEmployeeId: '',
    priority: 'medium',
    notes: '',
    governmentReferenceNo: '',
    applicationDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadApplications();
    loadFormDependencies();
  }, [search, statusFilter, priorityFilter, serviceFilter]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await api.getApplications({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        serviceId: serviceFilter !== 'all' ? serviceFilter : undefined,
      });
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFormDependencies = async () => {
    try {
      const [custs, srvs, emps] = await Promise.all([
        api.getCustomers(),
        api.getServices({ activeOnly: true }),
        api.getEmployees(),
      ]);
      setCustomers(custs);
      setServices(srvs);
      setEmployees(emps);
      if (custs.length > 0 && !formData.customerId) {
        setFormData((prev) => ({ ...prev, customerId: custs[0].id }));
      }
      if (srvs.length > 0 && !formData.serviceId) {
        setFormData((prev) => ({ ...prev, serviceId: srvs[0].id }));
      }
    } catch (err) {
      console.error('Failed to load dependencies:', err);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.serviceId) {
      alert('Please select both a Customer and a Service');
      return;
    }

    setFormSubmitting(true);
    try {
      const created = await api.createApplication(formData);
      setIsNewModalOpen(false);
      setFormData({
        customerId: customers[0]?.id || '',
        serviceId: services[0]?.id || '',
        assignedEmployeeId: '',
        priority: 'medium',
        notes: '',
        governmentReferenceNo: '',
        applicationDate: new Date().toISOString().split('T')[0],
      });
      loadApplications();
      navigate(`/applications/${created.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create application');
    } finally {
      setFormSubmitting(false);
    }
  };

  const statusOptions: ApplicationStatus[] = [
    'NEW',
    'DOCUMENTS PENDING',
    'DOCUMENTS RECEIVED',
    'SUBMITTED',
    'UNDER PROCESSING',
    'COMPLETED',
    'CANCELLED',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B2541]">Application Management</h1>
          <p className="text-xs text-slate-500">
            UAE government filing pipeline and clearance lifecycle
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search tracking ID, applicant, service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-[#0B2541] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31B8C1]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#31B8C1]"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#31B8C1]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#31B8C1]"
          >
            <option value="all">All Services</option>
            {services.map((srv) => (
              <option key={srv.id} value={srv.id}>{srv.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Table / Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FileSpreadsheet}
              title="No applications yet"
              description="Launch your first government application or visa clearance file."
              actionText="Create Application"
              onAction={() => setIsNewModalOpen(true)}
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
                  <th className="py-3 px-4">Date Lodged</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#31B8C1]">
                      {app.trackingNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0B2541]">
                      {app.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 truncate max-w-[180px]">
                      {app.serviceName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {app.assignedEmployeeName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {app.applicationDate}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={app.priority} type="priority" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} type="application" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.paymentStatus || 'Unpaid'} type="payment" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/applications/${app.id}`);
                        }}
                        className="p-1.5 text-slate-400 hover:text-[#31B8C1] rounded-lg hover:bg-slate-100"
                        title="View Application Lifecycle"
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

      {/* New Application Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Initiate New Application"
        subtitle="Create an official filing ticket linked to a registered customer"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateApplication} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer *
              </label>
              {customers.length === 0 ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
                  <p className="font-bold text-[#0B2541]">No customers available.</p>
                  <p className="text-slate-600">Please add a customer before creating an application.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewModalOpen(false);
                      navigate('/customers?action=add');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#31B8C1] hover:bg-[#279CA4] text-white font-bold text-xs shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Customer</span>
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
                >
                  <option value="">-- Select Registered Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode}) - {c.phone}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Service Package *
              </label>
              <select
                required
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              >
                <option value="">-- Select Service --</option>
                {services.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name} (AED {srv.totalFee.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Staff
              </label>
              <select
                value={formData.assignedEmployeeId}
                onChange={(e) => setFormData({ ...formData, assignedEmployeeId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              >
                <option value="">Auto-Assign (Current User)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.designation || emp.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Application Date
              </label>
              <input
                type="date"
                value={formData.applicationDate}
                onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Government Reference / Application No (if existing)
            </label>
            <input
              type="text"
              value={formData.governmentReferenceNo}
              onChange={(e) => setFormData({ ...formData, governmentReferenceNo: e.target.value })}
              placeholder="e.g. GDRFA-2026-98124 or ICP Application No"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Internal Notes / File Remarks
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Initial documents received, special conditions, or urgency instructions..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting || customers.length === 0}
              className="px-4 py-2 text-xs font-semibold bg-[#31B8C1] hover:bg-[#279CA4] text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'Initiating...' : 'Generate Tracking ID & Launch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
