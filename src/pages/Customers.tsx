import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Download,
  Building,
  User as UserIcon,
  Phone,
  Mail,
  CreditCard
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState.js';
import { Modal } from '../components/common/Modal.js';
import { api } from '../api/client.js';
import { Customer } from '../types/index.js';

export const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nationality: 'United Arab Emirates',
    dateOfBirth: '',
    gender: 'Male',
    passportNumber: '',
    passportExpiryDate: '',
    emiratesId: '',
    emiratesIdExpiryDate: '',
    visaNumber: '',
    visaExpiryDate: '',
    customerType: 'Individual',
    customCustomerType: '',
    companyName: '',
    address: 'Dubai, UAE',
    notes: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'add' || params.get('new') === 'true') {
      setIsAddModalOpen(true);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [search, nationalityFilter, typeFilter, statusFilter]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomers({
        search: search || undefined,
        nationality: nationalityFilter !== 'all' ? nationalityFilter : undefined,
        customerType: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const effectiveType = formData.customerType === 'Other' && formData.customCustomerType
        ? formData.customCustomerType
        : formData.customerType;

      const created = await api.createCustomer({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        nationality: formData.nationality,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender as any,
        passportNumber: formData.passportNumber || undefined,
        passportExpiryDate: formData.passportExpiryDate || undefined,
        emiratesId: formData.emiratesId || undefined,
        emiratesIdExpiryDate: formData.emiratesIdExpiryDate || undefined,
        visaNumber: formData.visaNumber || undefined,
        visaExpiryDate: formData.visaExpiryDate || undefined,
        customerType: effectiveType as any,
        companyName: formData.companyName || undefined,
        address: formData.address,
        notes: formData.notes,
      });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        nationality: 'United Arab Emirates',
        dateOfBirth: '',
        gender: 'Male',
        passportNumber: '',
        passportExpiryDate: '',
        emiratesId: '',
        emiratesIdExpiryDate: '',
        visaNumber: '',
        visaExpiryDate: '',
        customerType: 'Individual',
        customCustomerType: '',
        companyName: '',
        address: 'Dubai, UAE',
        notes: '',
      });
      loadCustomers();
      navigate(`/customers/${created.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete customer record "${name}"?`)) {
      try {
        await api.deleteCustomer(id);
        loadCustomers();
      } catch (err: any) {
        alert(err.message || 'Failed to delete customer');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B2541]">Customer Management</h1>
          <p className="text-xs text-slate-500">
            Registered corporate clients and individual applicants
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Name, Phone, Passport, Emirates ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-[#0B2541] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31B8C1]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#31B8C1]"
          >
            <option value="all">All Client Types</option>
            <option value="individual">Individual Applicants</option>
            <option value="corporate">Corporate / Companies</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#31B8C1]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customer Table / Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No customers yet"
              description="Add your first customer to begin managing UAE visa applications, document attestation, and invoicing."
              actionText="Add Customer"
              onAction={() => setIsAddModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Name / Entity</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Nationality</th>
                  <th className="py-3 px-4">Passport / EID</th>
                  <th className="py-3 px-4 text-center">Active Apps</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#31B8C1]">
                      {c.customerCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#0B2541] flex items-center gap-1.5">
                        {c.customerType === 'Company' || c.customerType === 'Business Owner' ? (
                          <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        ) : (
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        )}
                        <span>{c.name}</span>
                      </div>
                      {c.companyName && (
                        <div className="text-[10px] text-slate-400">{c.companyName}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{c.phone}</div>
                      {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{c.nationality}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <div>{c.passportNumber || '—'}</div>
                      {c.emiratesId && (
                        <div className="text-[10px] text-slate-400">{c.emiratesId}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {c.activeApplicationsCount || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium">
                      {(c.outstandingBalance || 0) > 0 ? (
                        <span className="text-rose-600">
                          AED {(c.outstandingBalance || 0).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-600">AED 0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          c.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/customers/${c.id}`)}
                          className="p-1.5 text-slate-400 hover:text-[#31B8C1] rounded-lg hover:bg-slate-100"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Customer File"
        subtitle="Add a corporate client or individual applicant to the BizLink database"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer Type *
              </label>
              <select
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              >
                <option value="Individual">Individual</option>
                <option value="Company">Company</option>
                <option value="Business Owner">Business Owner</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {formData.customerType === 'Other' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Specify Customer Type *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customCustomerType}
                  onChange={(e) => setFormData({ ...formData, customCustomerType: e.target.value })}
                  placeholder="e.g. Freezone Enterprise or Partner"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
                />
              </div>
            )}

            {(formData.customerType === 'Company' || formData.customerType === 'Business Owner') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Al Hashimi General Trading LLC"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Mohammed Al Hashimi"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number (with Country Code) *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+971 50 123 4567"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@example.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nationality
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="e.g. United Arab Emirates"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Passport & EID Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Passport Number
              </label>
              <input
                type="text"
                value={formData.passportNumber}
                onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                placeholder="e.g. N12345678"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Passport Expiry Date
              </label>
              <input
                type="date"
                value={formData.passportExpiryDate}
                onChange={(e) => setFormData({ ...formData, passportExpiryDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Emirates ID (EID) Number
              </label>
              <input
                type="text"
                value={formData.emiratesId}
                onChange={(e) => setFormData({ ...formData, emiratesId: e.target.value })}
                placeholder="784-1990-1234567-1"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Emirates ID Expiry Date
              </label>
              <input
                type="date"
                value={formData.emiratesIdExpiryDate}
                onChange={(e) => setFormData({ ...formData, emiratesIdExpiryDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Visa Number
              </label>
              <input
                type="text"
                value={formData.visaNumber}
                onChange={(e) => setFormData({ ...formData, visaNumber: e.target.value })}
                placeholder="e.g. 201/2026/123456"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Visa Expiry Date
              </label>
              <input
                type="date"
                value={formData.visaExpiryDate}
                onChange={(e) => setFormData({ ...formData, visaExpiryDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Physical / Business Address in UAE
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Flat 304, Al Rigga, Deira, Dubai"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Internal Notes / File Remarks
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Special instructions, sponsor notes, or preferred contact channel..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-[#31B8C1] hover:bg-[#279CA4] text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'Creating Customer...' : 'Save Customer Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
