export type UserRole = 'admin' | 'manager' | 'employee' | 'accountant' | 'custom';

export const ALL_PERMISSIONS = [
  'customers.view',
  'customers.create',
  'customers.edit',
  'customers.delete',
  'applications.view',
  'applications.create',
  'applications.edit',
  'applications.assign',
  'applications.status',
  'documents.view',
  'documents.upload',
  'documents.download',
  'documents.delete',
  'payments.view',
  'payments.create',
  'payments.edit',
  'invoices.view',
  'invoices.create',
  'invoices.edit',
  'tasks.view',
  'tasks.create',
  'tasks.edit',
  'tasks.delete',
  'employees.view',
  'employees.create',
  'employees.edit',
  'employees.disable',
  'reports.view',
  'services.manage',
  'settings.manage',
  'roles.manage',
  'notifications.manage'
] as const;

export type PermissionKey = typeof ALL_PERMISSIONS[number];

export interface User {
  id: string;
  employeeId: string; // e.g. "BL-EMP-0001"
  name: string;
  email: string;
  phone: string;
  designation: string; // e.g. "Founder & CEO", "Manager & Accountant", "Typist", "PRO"
  department: string;
  role: UserRole;
  customRoleName?: string;
  permissions: string[];
  avatar?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  lastLogin?: string;
  activeApplicationsCount?: number;
  activeTasksCount?: number;
}

export type CustomerType = 'Individual' | 'Company' | 'Business Owner' | 'Other' | string;

export interface Customer {
  id: string;
  customerCode: string; // e.g. "BLC-000001"
  name: string;
  email?: string;
  phone: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  passportNumber?: string;
  passportExpiryDate?: string;
  emiratesId?: string;
  emiratesIdExpiryDate?: string;
  visaNumber?: string;
  visaExpiryDate?: string;
  customerType: CustomerType;
  companyName?: string;
  address?: string;
  status: 'active' | 'inactive';
  notes?: string;
  activeApplicationsCount?: number;
  outstandingBalance?: number;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus = 
  | 'NEW'
  | 'DOCUMENTS PENDING'
  | 'DOCUMENTS RECEIVED'
  | 'SUBMITTED'
  | 'UNDER PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface ApplicationStatusHistory {
  id: string;
  oldStatus?: ApplicationStatus;
  status: ApplicationStatus;
  note: string;
  changedBy: string;
  changedByName: string;
  timestamp: string;
}

export interface ApplicationAssignmentHistory {
  id: string;
  previousEmployeeId?: string;
  previousEmployeeName?: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  assignedBy: string;
  assignedByName: string;
  timestamp: string;
}

export interface Application {
  id: string;
  trackingNumber: string; // e.g. "BL-2026-00001"
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  status: ApplicationStatus;
  priority: PriorityLevel;
  applicationDate: string;
  targetCompletionDate?: string;
  completedDate?: string;
  notes?: string;
  governmentReferenceNo?: string;
  paymentStatus?: string;
  totalPaid?: number;
  totalDue?: number;
  statusHistory: ApplicationStatusHistory[];
  assignmentHistory?: ApplicationAssignmentHistory[];
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = 
  | 'Passport'
  | 'Emirates ID'
  | 'Visa'
  | 'Photo'
  | 'Medical Document'
  | 'Application Form'
  | 'Attestation Document'
  | 'Translation Document'
  | 'Other';

export interface DocumentRecord {
  id: string;
  documentName: string;
  documentType: DocumentType;
  customerId: string;
  customerName: string;
  applicationId?: string;
  applicationTrackingNumber?: string;
  fileName: string;
  fileUrl: string;
  fileSize?: string | number;
  fileType: string;
  issueDate?: string;
  expiryDate?: string; // YYYY-MM-DD
  daysRemaining?: number;
  status: 'valid' | 'expiring_soon' | 'expired' | 'under_review';
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  notes?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  basePrice: number; // AED
  governmentFee: number; // AED
  serviceFee: number; // AED
  totalFee: number; // AED
  vatApplicable: boolean;
  isActive: boolean;
  requiredDocuments: string[];
  estimatedDays: number;
  createdAt: string;
}

export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer' | 'Other';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Pending' | 'Refunded';

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  applicationId?: string;
  applicationTrackingNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  serviceName: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  status: PaymentStatus;
  referenceNo?: string;
  recordedBy: string;
  recordedByName: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  applicationId?: string;
  applicationTrackingNumber?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: 'Draft' | 'Issued' | 'Partially Paid' | 'Paid' | 'Cancelled';
  paymentTerms?: string;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  customerId?: string;
  customerName?: string;
  applicationId?: string;
  applicationTrackingNumber?: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  priority: PriorityLevel;
  dueDate: string;
  status: 'To Do' | 'In Progress' | 'Completed' | 'Cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: 'application' | 'document_expiry' | 'payment' | 'task' | 'system';
  link?: string;
  isRead: boolean;
  targetUserId?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  timestamp: string;
}

export interface CompanySettings {
  companyName: string;
  subtitle: string;
  registrationNumber: string;
  trn: string;
  vatEnabled: boolean;
  vatRate: number;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  invoicePrefix: string;
  receiptPrefix: string;
  applicationPrefix: string;
  customerPrefix: string;
  employeePrefix: string;
  invoiceFooterNote: string;
}
