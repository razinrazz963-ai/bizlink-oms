import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Upload,
  Search,
  Filter,
  Eye,
  Trash2,
  Download,
  Calendar,
  AlertTriangle,
  FileText,
  User,
  CheckCircle,
  Plus
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Modal } from '../components/common/Modal.js';
import { DocumentPreviewModal } from '../components/common/DocumentPreviewModal.js';
import { api } from '../api/client.js';
import { DocumentRecord, Customer, Application, DocumentType } from '../types/index.js';

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewTab, setViewTab] = useState<'all' | 'expiring'>('all');

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

  // Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    customerId: '',
    applicationId: '',
    documentName: '',
    documentType: 'Passport' as DocumentType,
    expiryDate: '',
    notes: '',
  });

  useEffect(() => {
    loadDocuments();
    loadCustomersAndApps();
  }, [search, typeFilter, statusFilter]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await api.getDocuments({
        search: search || undefined,
        documentType: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
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
      if (custs.length > 0 && !uploadData.customerId) {
        setUploadData((prev) => ({ ...prev, customerId: custs[0].id }));
      }
    } catch (err) {
      console.error('Failed to load customers for upload:', err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.customerId || !uploadData.documentName) {
      alert('Customer and document name are required');
      return;
    }

    setIsUploading(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;

      if (selectedFile) {
        const uploadRes = await api.uploadFile(selectedFile);
        fileUrl = uploadRes.fileUrl;
        fileName = uploadRes.fileName;
        fileSize = uploadRes.fileSize;
      }

      await api.uploadDocument({
        ...uploadData,
        applicationId: uploadData.applicationId || undefined,
        expiryDate: uploadData.expiryDate || undefined,
        fileUrl,
        fileName,
        fileSize: fileSize !== undefined ? String(fileSize) : undefined,
      });
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setUploadData({
        customerId: customers[0]?.id || '',
        applicationId: '',
        documentName: '',
        documentType: 'Passport',
        expiryDate: '',
        notes: '',
      });
      loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteDocument(id);
      loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  const docTypes: DocumentType[] = [
    'Passport',
    'Emirates ID',
    'Visa',
    'Photo',
    'Medical Document',
    'Application Form',
    'Attestation Document',
    'Translation Document',
    'Other',
  ];

  const expiringDocuments = documents.filter((d) => d.status === 'expiring_soon' || d.status === 'expired');

  const displayedDocs = viewTab === 'expiring' ? expiringDocuments : documents;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B2541]">Document Vault & Expiry Radar</h1>
          <p className="text-xs text-slate-500">
            UAE residency, passport scans, medical fitness, and legal translations
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Tabs: All Vault vs Expiring Radar */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setViewTab('all')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            viewTab === 'all'
              ? 'border-[#31B8C1] text-[#0B2541]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          All Vault Documents ({documents.length})
        </button>
        <button
          onClick={() => setViewTab('expiring')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
            viewTab === 'expiring'
              ? 'border-[#31B8C1] text-[#0B2541]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Expiring / Attention Required ({expiringDocuments.length})</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by document name, customer, application..."
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
            <option value="all">All Document Types</option>
            {docTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#31B8C1]"
          >
            <option value="all">All Statuses</option>
            <option value="valid">Valid</option>
            <option value="expiring_soon">Expiring Soon (≤30d)</option>
            <option value="expired">Expired</option>
            <option value="under_review">Under Review</option>
          </select>
        </div>
      </div>

      {/* Documents Table / Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {displayedDocs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FolderOpen}
              title="No documents found"
              description="Upload customer passports, Emirates ID cards, visas, or attested government forms."
              actionText="Upload Document"
              onAction={() => setIsUploadModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Application</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setPreviewDoc(doc)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-[#0B2541]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#31B8C1] flex-shrink-0" />
                        <span>{doc.documentName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{doc.documentType}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{doc.customerName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {doc.applicationTrackingNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {doc.expiryDate ? (
                        <div className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{doc.expiryDate}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">No expiry</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={doc.status} type="document" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{doc.uploadedByName}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 text-slate-400 hover:text-[#31B8C1] rounded-lg hover:bg-slate-100"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Delete Document"
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

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Document to Vault"
        subtitle="Attach PDF or scan to customer records"
        maxWidth="lg"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select Customer *
              </label>
              {customers.length === 0 ? (
                <div className="text-xs text-rose-600 p-2 bg-rose-50 rounded-lg">
                  Please add a customer first.
                </div>
              ) : (
                <select
                  required
                  value={uploadData.customerId}
                  onChange={(e) => setUploadData({ ...uploadData, customerId: e.target.value })}
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
                value={uploadData.applicationId}
                onChange={(e) => setUploadData({ ...uploadData, applicationId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              >
                <option value="">General Customer Document</option>
                {applications.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.trackingNumber} - {a.serviceName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={uploadData.documentName}
                onChange={(e) => setUploadData({ ...uploadData, documentName: e.target.value })}
                placeholder="e.g. Passport Bio Page Scan"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Document Type *
              </label>
              <select
                value={uploadData.documentType}
                onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              >
                {docTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Document Expiry Date (For tracking & reminders)
            </label>
            <input
              type="date"
              value={uploadData.expiryDate}
              onChange={(e) => setUploadData({ ...uploadData, expiryDate: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Document Scan (PDF, JPG, PNG)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setSelectedFile(f);
                if (f && !uploadData.documentName) {
                  setUploadData((prev) => ({
                    ...prev,
                    documentName: f.name.replace(/\.[^/.]+$/, ''),
                  }));
                }
              }}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#31B8C1]/10 file:text-[#0B2541] hover:file:bg-[#31B8C1]/20 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={customers.length === 0 || isUploading}
              className="px-4 py-2 text-xs font-semibold bg-[#31B8C1] hover:bg-[#279CA4] text-white rounded-xl shadow-xs disabled:opacity-50"
            >
              {isUploading ? 'Uploading to Vault...' : 'Save Document'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Interactive Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        onDelete={handleDelete}
      />
    </div>
  );
};
