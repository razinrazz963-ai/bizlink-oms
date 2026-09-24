import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Briefcase,
  Upload,
  CreditCard,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import { WhatsAppModal } from '../components/common/WhatsAppModal.js';
import { api } from '../api/client.js';
import {
  Application,
  Customer,
  ServiceItem,
  DocumentRecord,
  PaymentRecord,
  TaskRecord,
  ApplicationStatus
} from '../types/index.js';

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [service, setService] = useState<ServiceItem | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Change Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('UNDER PROCESSING');
  const [statusNote, setStatusNote] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // WhatsApp Modal
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Document Upload Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Passport');
  const [docExpiry, setDocExpiry] = useState('');

  useEffect(() => {
    if (id) {
      loadApplicationData();
    }
  }, [id]);

  const loadApplicationData = async () => {
    setLoading(true);
    try {
      const res = await api.getApplication(id!);
      setApplication(res.application);
      setCustomer(res.customer);
      setService(res.service);
      setDocuments(res.documents);
      setPayments(res.payments);
      setTasks(res.tasks);
      setNewStatus(res.application.status);
    } catch (err) {
      console.error('Failed to load application:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    setStatusSubmitting(true);
    try {
      await api.updateApplicationStatus(application.id, newStatus, statusNote);
      setIsStatusModalOpen(false);
      setStatusNote('');
      loadApplicationData();
    } catch (err: any) {
      alert(err.message || 'Failed to update application status');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || !customer || !docName) return;

    try {
      await api.uploadDocument({
        customerId: customer.id,
        applicationId: application.id,
        documentName: docName,
        documentType: docType as any,
        expiryDate: docExpiry || undefined,
      });
      setIsDocModalOpen(false);
      setDocName('');
      setDocExpiry('');
      loadApplicationData();
    } catch (err: any) {
      alert(err.message || 'Failed to upload document');
    }
  };

  if (loading || !application || !customer) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading application file...
      </div>
    );
  }

  // Ordered Status Stepper
  const statusPipeline: ApplicationStatus[] = [
    'NEW',
    'DOCUMENTS PENDING',
    'DOCUMENTS RECEIVED',
    'SUBMITTED',
    'UNDER PROCESSING',
    'COMPLETED',
  ];

  const currentStatusIndex = statusPipeline.indexOf(application.status);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <button
          onClick={() => navigate('/applications')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0B2541] font-medium mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Applications</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-[#0B2541]">
                {application.trackingNumber}
              </h1>
              <StatusBadge status={application.status} type="application" />
              <StatusBadge status={application.priority} type="priority" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              {application.serviceName}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
              <span>Customer: <strong className="text-[#0B2541] cursor-pointer hover:underline" onClick={() => navigate(`/customers/${customer.id}`)}>{customer.name}</strong></span>
              <span>•</span>
              <span>Officer: <strong className="text-slate-700">{application.assignedEmployeeName}</strong></span>
              <span>•</span>
              <span>Lodged: <strong className="text-slate-700">{application.applicationDate}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send WhatsApp</span>
            </button>

            <button
              onClick={() => window.open(`/track/${application.trackingNumber}`, '_blank')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              title="Preview what customer sees on public tracking"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#31B8C1]" />
              <span>Public Track View</span>
            </button>

            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Update Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Status Stepper Pipeline */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B2541] mb-6">
          Lifecycle Pipeline Progression
        </h3>

        <div className="relative">
          {/* Timeline Pipeline Track */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {statusPipeline.map((step, idx) => {
              const isPast = currentStatusIndex > idx;
              const isCurrent = currentStatusIndex === idx;
              const isCancelled = application.status === 'CANCELLED';

              return (
                <div
                  key={step}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isCancelled
                      ? 'border-slate-200 bg-slate-50 opacity-50'
                      : isCurrent
                      ? 'border-[#31B8C1] bg-[#31B8C1]/10 text-[#0B2541] ring-2 ring-[#31B8C1]/30 font-bold shadow-xs'
                      : isPast
                      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  <div className="flex justify-center mb-1.5">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <span className="w-4 h-4 rounded-full bg-[#31B8C1] flex items-center justify-center text-white text-[10px] font-bold">
                        {idx + 1}
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider leading-tight">
                    {step}
                  </div>
                </div>
              );
            })}
          </div>

          {application.status === 'CANCELLED' && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>This application was marked as <strong>CANCELLED</strong>.</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Details & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Service Info Box */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B2541] mb-4">
              Applicant & Service Particulars
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Customer Name</span>
                <span className="font-semibold text-slate-800">{customer.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Contact Number</span>
                <span className="text-slate-800">{customer.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Nationality</span>
                <span className="text-slate-800">{customer.nationality}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Service Category</span>
                <span className="text-slate-800">{service?.category || 'General'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Service Standard Fee</span>
                <span className="font-mono text-slate-800">AED {service?.totalFee.toLocaleString() || '0'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Government Ref No</span>
                <span className="font-mono font-semibold text-[#31B8C1]">
                  {application.governmentReferenceNo || 'Pending Submission'}
                </span>
              </div>
            </div>

            {application.notes && (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
                <span className="font-semibold text-[#0B2541]">Internal File Notes: </span>
                {application.notes}
              </div>
            )}
          </div>

          {/* Linked Documents Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B2541]">
                  Required & Attached Documents
                </h3>
                <p className="text-[11px] text-slate-500">
                  Documentation attached for UAE processing
                </p>
              </div>
              <button
                onClick={() => setIsDocModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B2541] hover:bg-[#102F52] text-white text-xs font-medium"
              >
                <Upload className="w-3.5 h-3.5 text-[#31B8C1]" />
                <span>Upload Document</span>
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500">No documents attached yet.</p>
                <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="mt-2 text-xs font-semibold text-[#31B8C1] hover:underline"
                >
                  + Upload first document
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#0B2541]">{d.documentName}</div>
                      <div className="text-[10px] text-slate-400">
                        Type: {d.documentType} {d.expiryDate ? `• Expiry: ${d.expiryDate}` : ''}
                      </div>
                    </div>
                    <StatusBadge status={d.status} type="document" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Status History Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B2541] mb-4">
            Status Transition History
          </h3>

          <div className="relative pl-6 space-y-5 border-l-2 border-slate-100 text-xs">
            {application.statusHistory.map((hist) => (
              <div key={hist.id} className="relative">
                <div className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-[#31B8C1] ring-4 ring-white" />
                <div className="flex items-center gap-2">
                  <StatusBadge status={hist.status} type="application" />
                </div>
                <p className="text-slate-700 mt-1 font-medium">{hist.note}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  By {hist.changedByName} • {new Date(hist.timestamp).toLocaleDateString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Update Status: ${application.trackingNumber}`}
        subtitle="Progress file to next UAE government clearing stage"
        maxWidth="md"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            >
              {statusPipeline.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Transition Note / Government Reference
            </label>
            <textarea
              rows={3}
              required
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="e.g. Biometrics completed, submitted to GDRFA Dubai under ref #9821..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={statusSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-[#31B8C1] hover:bg-[#279CA4] text-white rounded-xl shadow-xs"
            >
              {statusSubmitting ? 'Saving...' : 'Apply Status Update'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Upload Document"
        subtitle={`Attach document to application ${application.trackingNumber}`}
        maxWidth="md"
      >
        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Document Name *
            </label>
            <input
              type="text"
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Attested Degree Certificate"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Document Type *
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            >
              {['Passport', 'Emirates ID', 'Visa', 'Photo', 'Medical Document', 'Application Form', 'Attestation Document', 'Translation Document', 'Other'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              value={docExpiry}
              onChange={(e) => setDocExpiry(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDocModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#0B2541] text-white rounded-xl shadow-xs"
            >
              Attach Document
            </button>
          </div>
        </form>
      </Modal>

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        customerName={customer.name}
        customerPhone={customer.phone}
        trackingNumber={application.trackingNumber}
        serviceName={application.serviceName}
      />
    </div>
  );
};
