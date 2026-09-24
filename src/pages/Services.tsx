import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit2,
  DollarSign,
  Clock,
  FileText
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState.js';
import { Modal } from '../components/common/Modal.js';
import { api } from '../api/client.js';
import { ServiceItem } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

export const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { hasRole } = useAuth();
  const canManage = hasRole(['admin', 'manager']);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Visa Services',
    description: '',
    price: '',
    governmentFee: '',
    estimatedDays: '5',
    requiredDocs: '',
  });

  useEffect(() => {
    loadServices();
  }, [search, categoryFilter]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await api.getServices({
        search: search || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      setServices(data);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    if (!canManage) return;
    try {
      await api.toggleService(id);
      loadServices();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle service');
    }
  };

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({
      name: '',
      code: `SRV-${Date.now().toString().slice(-4)}`,
      category: 'Visa Services',
      description: '',
      price: '500',
      governmentFee: '1200',
      estimatedDays: '5',
      requiredDocs: 'Passport Copy, Photo, Emirates ID',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv: ServiceItem) => {
    setEditingService(srv);
    setFormData({
      name: srv.name,
      code: srv.code,
      category: srv.category,
      description: srv.description,
      price: String((srv as any).price ?? srv.serviceFee ?? srv.basePrice ?? 0),
      governmentFee: String(srv.governmentFee),
      estimatedDays: String(srv.estimatedDays),
      requiredDocs: srv.requiredDocuments.join(', '),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      code: formData.code,
      category: formData.category,
      description: formData.description,
      price: Number(formData.price),
      governmentFee: Number(formData.governmentFee),
      estimatedDays: Number(formData.estimatedDays),
      requiredDocuments: formData.requiredDocs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (editingService) {
        await api.updateService(editingService.id, payload);
      } else {
        await api.createService(payload);
      }
      setIsModalOpen(false);
      loadServices();
    } catch (err: any) {
      alert(err.message || 'Failed to save service');
    }
  };

  const categories = [
    'Visa Services',
    'Emirates ID Services',
    'Amer Services',
    'Tasheel Services',
    'Tadbeer Services',
    'Document Clearing',
    'Business Setup',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B2541]">Services Catalog</h1>
          <p className="text-xs text-slate-500">
            UAE government packages, official fees, PRO processing margins, and document checklists
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service Package</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by service name, code, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-[#0B2541] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31B8C1]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#31B8C1]"
          >
            <option value="all">All Service Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((srv) => (
          <div
            key={srv.id}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
              srv.isActive ? 'border-slate-200/90 hover:border-[#31B8C1]' : 'border-slate-200 bg-slate-50/60 opacity-75'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#31B8C1] bg-[#31B8C1]/10 px-2 py-0.5 rounded">
                  {srv.category}
                </span>
                <span className="font-mono text-[11px] text-slate-400">{srv.code}</span>
              </div>

              <h3 className="text-sm font-bold text-[#0B2541] leading-snug">{srv.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {srv.description}
              </p>

              {/* Fee Breakdown */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>BizLink Professional Fee:</span>
                  <span className="font-mono font-medium">AED {((srv as any).price ?? srv.serviceFee ?? srv.basePrice ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Govt / Authority Fee:</span>
                  <span className="font-mono font-medium">AED {srv.governmentFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-[#0B2541] pt-1 border-t border-slate-200">
                  <span>Total Client Rate:</span>
                  <span className="font-mono text-[#31B8C1]">AED {srv.totalFee.toLocaleString()}</span>
                </div>
              </div>

              {/* SLA & Requirements */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Est. {srv.estimatedDays} Working Days</span>
                </div>
                <div>{srv.requiredDocuments.length} required docs</div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggle(srv.id)}
                disabled={!canManage}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                  srv.isActive ? 'text-emerald-700 hover:text-emerald-800' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {srv.isActive ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active in System</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Disabled</span>
                  </>
                )}
              </button>

              {canManage && (
                <button
                  type="button"
                  onClick={() => handleOpenEdit(srv)}
                  className="p-1.5 text-slate-400 hover:text-[#31B8C1] rounded-lg hover:bg-slate-50"
                  title="Edit Service Details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Edit Service Package' : 'Add New Service Package'}
        subtitle="Configure UAE government service fees and standard SLA"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Service Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. 2-Year UAE Residence Visa (Investor)"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Estimated Turnaround (Working Days)
              </label>
              <input
                type="number"
                min="1"
                value={formData.estimatedDays}
                onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                BizLink Service Fee (AED)
              </label>
              <input
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="1500"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                UAE Govt Authority Fee (AED)
              </label>
              <input
                type="number"
                min="0"
                value={formData.governmentFee}
                onChange={(e) => setFormData({ ...formData, governmentFee: e.target.value })}
                placeholder="3200"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description / Scope of Work
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What this service covers (e.g. GDRFA typing, medical test booking, EID biometrics appointment)..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Required Documents (Comma separated)
            </label>
            <input
              type="text"
              value={formData.requiredDocs}
              onChange={(e) => setFormData({ ...formData, requiredDocs: e.target.value })}
              placeholder="Passport Copy, Emirates ID, Attested Certificate, Photo"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#31B8C1] hover:bg-[#279CA4] text-white rounded-xl shadow-xs"
            >
              Save Service
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
