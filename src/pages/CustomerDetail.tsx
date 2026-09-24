import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  FolderOpen,
  CreditCard,
  Receipt,
  Plus,
  Clock,
  ShieldCheck,
  Building,
  Upload,
  MessageSquare,
  CheckSquare,
  UploadCloud,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { WhatsAppModal } from '../components/common/WhatsAppModal.js';
import { api } from '../api/client.js';
import {
  Customer,
  Application,
  DocumentRecord,
  PaymentRecord,
  Invoice,
  ActivityLog,
  ServiceItem,
  TaskRecord
} from '../types/index.js';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'applications' | 'documents' | 'payments' | 'invoices' | 'tasks' | 'activity'
  >('overview');

  // Action Modals
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Forms
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [appNotes, setAppNotes] = useState('');
  const [appPriority, setAppPriority] = useState('medium');

  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Passport');
  const [docExpiry, setDocExpiry] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  const [invDescription, setInvDescription] = useState('Government Document Processing');
  const [invAmount, setInvAmount] = useState('1500');

  useEffect(() => {
    if (id) {
      loadCustomerDetails();
    }
  }, [id]);

  const loadCustomerDetails = async () => {
    setLoading(true);
    try {
      const [data, srvs] = await Promise.all([
        api.getCustomer(id!),
        api.getServices(),
      ]);
      setCustomer(data.customer);
      setApplications(data.applications);
      setDocuments(data.documents);
      setPayments(data.payments);
      setInvoices(data.invoices);
      setTasks(data.tasks || []);
      setActivityLogs(data.activityLogs);
      setSummary(data.summary);
      setServices(srvs);
      if (srvs.length > 0) setSelectedServiceId(srvs[0].id);
    } catch (err) {
      console.error('Failed to load customer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !selectedServiceId) return;
    try {
      await api.createApplication({
        customerId: customer.id,
        serviceId: selectedServiceId,
        priority: appPriority,
        notes: appNotes,
      });
      setIsAppModalOpen(false);
      setAppNotes('');
      loadCustomerDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to create application');
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !docName) return;
    setUploadingDoc(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;

      if (docFile) {
        const uploadRes = await api.uploadFile(docFile);
        fileUrl = uploadRes.fileUrl;
        fileName = uploadRes.fileName;
        fileSize = uploadRes.fileSize;
      }

      await api.uploadDocument({
        customerId: customer.id,
        documentName: docName,
        documentType: docType as any,
        expiryDate: docExpiry || undefined,
        fileUrl,
        fileName,
        fileSize: fileSize !== undefined ? String(fileSize) : undefined,
      });
      setIsDocModalOpen(false);
      setDocName('');
      setDocExpiry('');
      setDocFile(null);
      loadCustomerDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !taskTitle) return;
    try {
      await api.createTask({
        customerId: customer.id,
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority as any,
        dueDate: taskDueDate || undefined,
      });
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      loadCustomerDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !invAmount) return;
    try {
      await api.createInvoice({
        customerId: customer.id,
        items: [
          {
            description: invDescription,
            quantity: 1,
            unitPrice: parseFloat(invAmount),
            total: parseFloat(invAmount),
          },
        ],
      });
      setIsInvModalOpen(false);
      setInvAmount('1500');
      loadCustomerDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to create invoice');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading verified customer file and operational history...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto">
        <h2 className="text-base font-bold text-[#0B2541]">Customer Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested client record does not exist.</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 px-4 py-2 bg-[#0B2541] text-white text-xs font-semibold rounded-xl"
        >
          Return to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <button
        onClick={() => navigate('/customers')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0B2541]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Customer Directory</span>
      </button>

      {/* Customer Header Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0B2541] text-[#31B8C1] font-bold text-2xl flex items-center justify-center shadow-sm">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0B2541]">{customer.name}</h1>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#31B8C1]/10 text-[#0B2541]">
                  {customer.customerCode}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {customer.customerType || 'Individual'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.nationality}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => setIsAppModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Application</span>
            </button>

            <button
              onClick={() => setIsDocModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B2541] hover:bg-[#102F52] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#31B8C1]" />
              <span>Upload Document</span>
            </button>

            <button
              onClick={() => setIsInvModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
            >
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>

        {/* 7 Core Tab Navigation */}
        <div className="flex border-b border-slate-100 mt-6 -mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'applications', label: `Applications (${applications.length})` },
            { id: 'documents', label: `Documents (${documents.length})` },
            { id: 'payments', label: `Payments (${payments.length})` },
            { id: 'invoices', label: `Invoices (${invoices.length})` },
            { id: 'tasks', label: `Tasks (${tasks.length})` },
            { id: 'activity', label: 'Activity' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-[#31B8C1] text-[#0B2541] font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Complete Customer Profile Details */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B2541] mb-4">
                Personal & Verification Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Customer ID</span>
                  <span className="font-mono font-bold text-[#0B2541]">{customer.customerCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Customer Type</span>
                  <span className="font-semibold text-slate-800">{customer.customerType || 'Individual'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Nationality</span>
                  <span className="font-semibold text-slate-800">{customer.nationality}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Date of Birth</span>
                  <span className="text-slate-800">
                    {customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString('en-GB') : 'Not Recorded'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Gender</span>
                  <span className="text-slate-800">{customer.gender || 'Not Recorded'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Registration Date</span>
                  <span className="text-slate-800">
                    {new Date(customer.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Passport Number</span>
                    <span className="font-mono font-bold text-slate-800">
                      {customer.passportNumber || 'Not Recorded'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Expiry: {customer.passportExpiryDate ? new Date(customer.passportExpiryDate).toLocaleDateString('en-GB') : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Emirates ID (EID)</span>
                    <span className="font-mono font-bold text-slate-800">
                      {customer.emiratesId || 'Not Recorded'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Expiry: {customer.emiratesIdExpiryDate ? new Date(customer.emiratesIdExpiryDate).toLocaleDateString('en-GB') : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Visa Number</span>
                    <span className="font-mono font-bold text-slate-800">
                      {customer.visaNumber || 'Not Recorded'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Expiry: {customer.visaExpiryDate ? new Date(customer.visaExpiryDate).toLocaleDateString('en-GB') : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <span className="text-slate-400 block mb-0.5">Physical / Business Address in UAE</span>
                  <span className="text-slate-800">{customer.address || 'Dubai, UAE'}</span>
                </div>

                {customer.notes && (
                  <div className="sm:col-span-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-slate-700">
                    <span className="text-amber-800 font-bold block mb-1">File Notes / Special Remarks:</span>
                    <p className="text-xs">{customer.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] text-slate-500 block">Total Applications</span>
                <span className="text-xl font-bold text-[#0B2541] mt-1 block">
                  {summary?.totalApplications || 0}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] text-slate-500 block">Active Files</span>
                <span className="text-xl font-bold text-[#31B8C1] mt-1 block">
                  {summary?.activeApplications || 0}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] text-slate-500 block">Documents on File</span>
                <span className="text-xl font-bold text-[#0B2541] mt-1 block">
                  {summary?.totalDocuments || 0}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] text-slate-500 block">Outstanding</span>
                <span className={`text-xl font-bold mt-1 block font-mono ${
                  (summary?.totalOutstanding || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  AED {(summary?.totalOutstanding || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Recent Active Applications */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B2541]">
                  Active Application Files
                </h3>
                <button
                  onClick={() => setIsAppModalOpen(true)}
                  className="text-xs font-semibold text-[#31B8C1] hover:underline"
                >
                  + New Application
                </button>
              </div>
              {applications.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No applications initiated for this customer yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {applications.slice(0, 4).map((app) => (
                    <div
                      key={app.id}
                      onClick={() => navigate(`/applications/${app.id}`)}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-[#31B8C1] mr-2">
                          {app.trackingNumber}
                        </span>
                        <span className="font-semibold text-[#0B2541]">{app.serviceName}</span>
                      </div>
                      <StatusBadge status={app.status} type="application" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right 1 Col: Customer Activity Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B2541] mb-4">
              Recent Activity
            </h3>
            {activityLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No recent activity recorded.</p>
            ) : (
              <div className="relative pl-6 space-y-4 border-l-2 border-slate-100 text-xs">
                {activityLogs.slice(0, 6).map((act) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-[#31B8C1] ring-4 ring-white" />
                    <div className="font-medium text-slate-800">{act.description}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      By {act.userName} • {new Date(act.timestamp).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Applications */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#0B2541]">All Applications</h3>
            <button
              onClick={() => setIsAppModalOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#31B8C1] text-white"
            >
              + Add Application
            </button>
          </div>
          {applications.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No applications yet"
              description="Initiate an official UAE government service application for this customer."
              actionText="Create Application"
              onAction={() => setIsAppModalOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => navigate(`/applications/${app.id}`)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-[#31B8C1] cursor-pointer transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#31B8C1]">{app.trackingNumber}</span>
                      <span className="font-bold text-[#0B2541]">{app.serviceName}</span>
                    </div>
                    <div className="text-slate-500 mt-1">
                      Assigned Officer: {app.assignedEmployeeName} • Lodged: {app.applicationDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} type="application" />
                    <span className="text-[#31B8C1] font-semibold">View File →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#0B2541]">Customer Vault Documents</h3>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0B2541] text-white"
            >
              + Upload Document
            </button>
          </div>
          {documents.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No documents uploaded"
              description="Upload passport scans, Emirates ID, or certificates for this applicant."
              actionText="Upload Document"
              onAction={() => setIsDocModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-[#0B2541] truncate">{doc.documentName}</span>
                    <StatusBadge status={doc.status} type="document" />
                  </div>
                  <div className="text-slate-500 space-y-0.5">
                    <div>Type: <strong>{doc.documentType}</strong></div>
                    {doc.expiryDate && <div>Expires: <strong>{doc.expiryDate}</strong></div>}
                    {doc.fileSize && (
                      <div>Size: {typeof doc.fileSize === 'number' ? `${(doc.fileSize / 1024).toFixed(1)} KB` : doc.fileSize}</div>
                    )}
                  </div>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#31B8C1] font-semibold hover:underline pt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View File</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#0B2541]">Recorded Payments</h3>
            <button
              onClick={() => navigate('/payments')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#31B8C1] text-white"
            >
              Go to Payments
            </button>
          </div>
          {payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments recorded"
              description="Record fees and cash/card collections received from this client."
              actionText="Go to Payments"
              onAction={() => navigate('/payments')}
            />
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-[#0B2541] mr-2">
                      {p.receiptNumber || 'REC'}
                    </span>
                    <span className="text-slate-500">Method: {p.paymentMethod}</span>
                    {p.referenceNo && (
                      <span className="text-slate-400 ml-2">Ref: {p.referenceNo}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-emerald-600">
                      AED {p.paidAmount?.toLocaleString() || p.totalAmount?.toLocaleString()}
                    </span>
                    <StatusBadge status={p.status} type="payment" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#0B2541]">Tax Invoices</h3>
            <button
              onClick={() => setIsInvModalOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#31B8C1] text-white"
            >
              + Issue Invoice
            </button>
          </div>
          {invoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No invoices generated"
              description="Create official UAE tax invoices for services rendered to this customer."
              actionText="Create Invoice"
              onAction={() => setIsInvModalOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-[#31B8C1] cursor-pointer flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-[#0B2541] mr-2">{inv.invoiceNumber}</span>
                    <span className="text-slate-500">Issued: {inv.issueDate}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-[#0B2541]">
                      AED {inv.totalAmount.toLocaleString()}
                    </span>
                    <StatusBadge status={inv.status} type="payment" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Tasks */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#0B2541]">Operational Tasks</h3>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0B2541] text-white"
            >
              + Add Task
            </button>
          </div>
          {tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks assigned"
              description="Create reminders, typing tasks, or submission checkpoints for this customer."
              actionText="Add First Task"
              onAction={() => setIsTaskModalOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-bold text-[#0B2541] block">{task.title}</span>
                    {task.description && (
                      <p className="text-slate-500 text-[11px] mt-0.5">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-slate-400 text-[10px] mt-1">
                      <span>Priority: <strong className="capitalize">{task.priority}</strong></span>
                      {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString('en-GB')}</span>}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      task.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : task.status === 'In Progress'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Activity Timeline */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <h3 className="text-sm font-bold text-[#0B2541] mb-4">Complete Audit & Activity Trail</h3>
          {activityLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No activity history logged yet.</p>
          ) : (
            <div className="relative pl-6 space-y-4 border-l-2 border-slate-100 text-xs">
              {activityLogs.map((act) => (
                <div key={act.id} className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-[#31B8C1] ring-4 ring-white" />
                  <div className="font-semibold text-slate-800">{act.description}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    User: <strong className="text-slate-700">{act.userName}</strong> • Action:{' '}
                    <span className="font-mono text-slate-600">{act.action}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(act.timestamp).toLocaleString('en-GB')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Application Modal */}
      <Modal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        title={`New Application for ${customer.name}`}
        subtitle="Select a standard UAE government or document service"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateApplication} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Service *
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            >
              {services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name} ({srv.category}) - AED {srv.totalFee.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={appPriority}
              onChange={(e) => setAppPriority(e.target.value)}
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
              File Notes / Special Handling
            </label>
            <textarea
              rows={3}
              value={appNotes}
              onChange={(e) => setAppNotes(e.target.value)}
              placeholder="Sponsor details, VIP handling, or specific requirements..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAppModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#31B8C1] hover:bg-[#279CA4] text-white rounded-xl shadow-xs"
            >
              Launch Application
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Upload Document"
        subtitle={`Attach document to ${customer.name}'s verified vault`}
        maxWidth="md"
      >
        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Passport Scan (Color Front Page)"
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
              Expiry Date (For radar tracking)
            </label>
            <input
              type="date"
              value={docExpiry}
              onChange={(e) => setDocExpiry(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Upload File Scan (PDF, JPG, PNG)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#31B8C1]/10 file:text-[#0B2541] hover:file:bg-[#31B8C1]/20"
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
              disabled={uploadingDoc}
              className="px-4 py-2 text-xs font-semibold bg-[#0B2541] hover:bg-[#102F52] text-white rounded-xl shadow-xs disabled:opacity-50"
            >
              {uploadingDoc ? 'Uploading...' : 'Save to Vault'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add Operational Task"
        subtitle={`Create action item for ${customer.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Verify sponsor salary certificate"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
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
                Due Date
              </label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Task Description
            </label>
            <textarea
              rows={2}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Provide instructions or checklist items..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#31B8C1] hover:bg-[#279CA4] text-white rounded-xl shadow-xs"
            >
              Save Task
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isInvModalOpen}
        onClose={() => setIsInvModalOpen(false)}
        title="Create Tax Invoice"
        subtitle="Generate itemized tax invoice with 5% UAE VAT"
        maxWidth="md"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Service Description
            </label>
            <input
              type="text"
              required
              value={invDescription}
              onChange={(e) => setInvDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Amount (AED, before 5% VAT)
            </label>
            <input
              type="number"
              required
              value={invAmount}
              onChange={(e) => setInvAmount(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>AED {Number(invAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>VAT (5%):</span>
              <span>AED {(Number(invAmount || 0) * 0.05).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-[#0B2541] pt-1 border-t border-slate-200">
              <span>Total Payable:</span>
              <span>AED {(Number(invAmount || 0) * 1.05).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInvModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#31B8C1] hover:bg-[#279CA4] text-white rounded-xl shadow-xs"
            >
              Generate Invoice
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
      />
    </div>
  );
};
