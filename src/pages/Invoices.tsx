import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Eye,
  Printer,
  FileText,
  DollarSign,
  Calendar,
  Building
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Modal } from '../components/common/Modal.js';
import { api } from '../api/client.js';
import { Invoice, Customer, Application, ServiceItem } from '../types/index.js';

export const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Invoice Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [items, setItems] = useState([
    { description: 'UAE Residency Visa Processing', quantity: 1, unitPrice: 3500 },
  ]);
  const [notes, setNotes] = useState('Payment due on receipt. Subject to 5% UAE VAT.');
  const [initialPaidAmount, setInitialPaidAmount] = useState('0');

  useEffect(() => {
    loadInvoices();
    loadDependencies();
  }, [search, statusFilter]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await api.getInvoices({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [custs, apps, srvs] = await Promise.all([
        api.getCustomers(),
        api.getApplications(),
        api.getServices(),
      ]);
      setCustomers(custs);
      setApplications(apps);
      setServices(srvs);
      if (custs.length > 0 && !customerId) {
        setCustomerId(custs[0].id);
      }
    } catch (err) {
      console.error('Failed to load invoice dependencies:', err);
    }
  };

  const addItemRow = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, it) => acc + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0), 0);
  };

  const subtotal = calculateSubtotal();
  const vat = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + vat;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0) {
      alert('Please select a customer and provide at least one item');
      return;
    }

    try {
      const created = await api.createInvoice({
        customerId,
        applicationId: applicationId || undefined,
        items,
        notes,
        initialPaidAmount: Number(initialPaidAmount) || 0,
      });

      setIsCreateModalOpen(false);
      loadInvoices();
      navigate(`/invoices/${created.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create invoice');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B2541]">Tax Invoices</h1>
          <p className="text-xs text-slate-500">
            UAE FTA compliant tax invoicing with 5% VAT and printable receipts
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Tax Invoice</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search invoice number, client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-[#0B2541] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31B8C1]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#31B8C1]"
          >
            <option value="all">All Invoice Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoices Table / Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Receipt}
              title="No tax invoices generated yet"
              description="Create an official 5% UAE VAT invoice with BizLink branding for customer billing."
              actionText="Create Tax Invoice"
              onAction={() => setIsCreateModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Application</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">VAT (5%)</th>
                  <th className="py-3 px-4 text-right">Total (AED)</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#31B8C1]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0B2541]">
                      {inv.customerName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {inv.applicationTrackingNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{inv.issueDate}</td>
                    <td className="py-3.5 px-4 text-slate-600">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      AED {inv.subtotal.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      AED {inv.vatAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0B2541]">
                      AED {inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {inv.balance > 0 ? (
                        <span className="text-rose-600">AED {inv.balance.toLocaleString()}</span>
                      ) : (
                        <span className="text-emerald-600">Settled</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inv.status} type="payment" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="p-1.5 text-slate-400 hover:text-[#31B8C1] rounded-lg hover:bg-slate-100"
                          title="View / Print Tax Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Issue Official Tax Invoice"
        subtitle="Itemized billing with automated 5% UAE VAT calculation"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer *
              </label>
              {customers.length === 0 ? (
                <div className="text-xs text-rose-600 p-2 bg-rose-50 rounded-lg">
                  Please register a customer first.
                </div>
              ) : (
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
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
                Link to Application (Optional)
              </label>
              <select
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              >
                <option value="">General Account Invoicing</option>
                {applications.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.trackingNumber} - {a.serviceName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Services & Billable Line Items
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs font-semibold text-[#31B8C1] hover:underline"
              >
                + Add Another Line
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Description of professional service"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    className="w-16 px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-center focus:ring-2 focus:ring-[#31B8C1]"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Unit Price (AED)"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                    className="w-28 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right focus:ring-2 focus:ring-[#31B8C1]"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown Calculation */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">AED {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>UAE Federal Tax Authority VAT (5%):</span>
              <span className="font-mono">AED {vat.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#0B2541] pt-2 border-t border-slate-200">
              <span>Total Gross Invoice Amount:</span>
              <span className="font-mono text-[#0B2541]">AED {total.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Deposit Paid (AED)
            </label>
            <input
              type="number"
              min="0"
              value={initialPaidAmount}
              onChange={(e) => setInitialPaidAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={customers.length === 0}
              className="px-4 py-2 text-xs font-semibold bg-[#31B8C1] hover:bg-[#279CA4] text-white rounded-xl shadow-xs disabled:opacity-50"
            >
              Generate Official Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
