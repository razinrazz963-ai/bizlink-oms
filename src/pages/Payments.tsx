import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Receipt,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Modal } from '../components/common/Modal.js';
import { api } from '../api/client.js';
import { PaymentRecord, Customer, Application, PaymentMethod, PaymentStatus } from '../types/index.js';

export const Payments: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOutstanding: 0,
    todayRevenue: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  // Record Payment Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    applicationId: '',
    serviceName: '',
    totalAmount: '',
    paidAmount: '',
    paymentMethod: 'Bank Transfer' as PaymentMethod,
    referenceNo: '',
    notes: '',
  });

  useEffect(() => {
    loadPayments();
    loadCustomersAndApps();
  }, [search, statusFilter, methodFilter]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const [data, sum] = await Promise.all([
        api.getPayments({
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          paymentMethod: methodFilter !== 'all' ? methodFilter : undefined,
        }),
        api.getPaymentsSummary(),
      ]);
      setPayments(data);
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomersAndApps = async () => {
    try {
      const [custs, apps] = await Promise.all([
        api.getCustomers(),
        api.getApplications(),
      ]);
      setCustomers(custs);
      setApplications(apps);
      if (custs.length > 0 && !formData.customerId) {
        setFormData((prev) => ({ ...prev, customerId: custs[0].id }));
      }
    } catch (err) {
      console.error('Failed to load customers for payment:', err);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.totalAmount || !formData.paidAmount) {
      alert('Please fill in customer and amounts');
      return;
    }

    try {
      await api.recordPayment({
        customerId: formData.customerId,
        applicationId: formData.applicationId || undefined,
        serviceName: formData.serviceName || undefined,
        totalAmount: Number(formData.totalAmount),
        paidAmount: Number(formData.paidAmount),
        paymentMethod: formData.paymentMethod,
        referenceNo: formData.referenceNo,
        notes: formData.notes,
      });

      setIsRecordModalOpen(false);
      setFormData({
        customerId: customers[0]?.id || '',
        applicationId: '',
        serviceName: '',
        totalAmount: '',
        paidAmount: '',
        paymentMethod: 'Bank Transfer',
        referenceNo: '',
        notes: '',
      });
      loadPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B2541]">Payment Management</h1>
          <p className="text-xs text-slate-500">
            Internal financial settlements, receipts, and outstanding balances
          </p>
        </div>

        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold uppercase text-slate-400">Total Collected Revenue</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">
            AED {summary.totalRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Verified bank transfers, cash, & card</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold uppercase text-slate-400">Pending Receivables (Balance)</div>
          <div className={`text-2xl font-bold font-mono mt-2 ${summary.totalOutstanding > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            AED {summary.totalOutstanding.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Unsettled application balances</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold uppercase text-slate-400">Today's Collections</div>
          <div className="text-2xl font-bold font-mono text-[#0B2541] mt-2">
            AED {summary.todayRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{summary.totalTransactions} total transactions on file</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search receipt, customer, service, ref..."
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
            <option value="all">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#31B8C1]"
          >
            <option value="all">All Payment Methods</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Cash">Cash</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Payments Table / Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={CreditCard}
              title="No payments recorded yet"
              description="Record your first client fee payment or deposit against a service application."
              actionText="Record Payment"
              onAction={() => setIsRecordModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Application</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#31B8C1]">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0B2541]">
                      {p.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 truncate max-w-[180px]">
                      {p.serviceName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {p.applicationTrackingNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-800">
                      AED {p.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      AED {p.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {p.balance > 0 ? (
                        <span className="text-rose-600">AED {p.balance.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400">AED 0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{p.paymentMethod}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} type="payment" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{p.paymentDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Client Payment"
        subtitle="Log received fees or initial deposit against an application"
        maxWidth="lg"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer *
              </label>
              {customers.length === 0 ? (
                <div className="text-xs text-rose-600 p-2 bg-rose-50 rounded-lg">
                  Please add a customer first.
                </div>
              ) : (
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Linked Application (Optional)
              </label>
              <select
                value={formData.applicationId}
                onChange={(e) => {
                  const appId = e.target.value;
                  const app = applications.find((a) => a.id === appId);
                  setFormData({
                    ...formData,
                    applicationId: appId,
                    serviceName: app ? app.serviceName : formData.serviceName,
                  });
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              >
                <option value="">General Account Payment</option>
                {applications.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.trackingNumber} - {a.serviceName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Service / Description
            </label>
            <input
              type="text"
              value={formData.serviceName}
              onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
              placeholder="e.g. UAE Employment Visa Processing & Medical"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Total Agreed Fee (AED) *
              </label>
              <input
                type="number"
                required
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                placeholder="5050"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Amount Paid Today (AED) *
              </label>
              <input
                type="number"
                required
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                placeholder="3000"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              >
                <option value="Bank Transfer">Bank Transfer (WPS / Direct Deposit)</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Cash">Cash in Hand</option>
                <option value="Other">Cheque / Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Bank / Authorization Reference
              </label>
              <input
                type="text"
                value={formData.referenceNo}
                onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                placeholder="e.g. ENBD-TXN-98421"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={customers.length === 0}
              className="px-4 py-2 text-xs font-semibold bg-[#31B8C1] hover:bg-[#279CA4] text-white rounded-xl shadow-xs disabled:opacity-50"
            >
              Save Receipt & Settle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
