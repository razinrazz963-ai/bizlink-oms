import {
  Customer,
  Application,
  DocumentRecord,
  ServiceItem,
  PaymentRecord,
  Invoice,
  TaskRecord,
  NotificationRecord,
  ActivityLog,
  CompanySettings,
  User,
  ALL_PERMISSIONS
} from '../types/index.js';

export const DEMO_USER: User = {
  id: 'usr-demo-admin',
  employeeId: 'DEMO-0001',
  name: 'Demo Administrator',
  email: 'demo@bizlink.ae',
  phone: '+971 4 000 0000',
  designation: 'System Administrator',
  department: 'Operations & Management',
  role: 'admin',
  permissions: [...ALL_PERMISSIONS],
  status: 'active',
  activeApplicationsCount: 0,
  activeTasksCount: 0,
  createdAt: new Date().toISOString()
};

export const INITIAL_DEMO_EMPLOYEES: User[] = [DEMO_USER];

export const INITIAL_DEMO_CUSTOMERS: Customer[] = [];
export const INITIAL_DEMO_APPLICATIONS: Application[] = [];
export const INITIAL_DEMO_DOCUMENTS: DocumentRecord[] = [];
export const INITIAL_DEMO_PAYMENTS: PaymentRecord[] = [];
export const INITIAL_DEMO_INVOICES: Invoice[] = [];
export const INITIAL_DEMO_TASKS: TaskRecord[] = [];
export const INITIAL_DEMO_NOTIFICATIONS: NotificationRecord[] = [];
export const INITIAL_DEMO_ACTIVITY_LOGS: ActivityLog[] = [];

export const INITIAL_DEMO_SERVICES: ServiceItem[] = [
  {
    id: 'srv-1',
    name: 'Employment Visa (New / Renewal)',
    code: 'SRV-VISA-01',
    category: 'Visa Services',
    description: 'UAE residency and employment visa processing including quota, entry permit, and stamping.',
    basePrice: 1200,
    governmentFee: 2850,
    serviceFee: 1000,
    totalFee: 5050,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['Passport Copy', 'Photo (White Background)', 'Attested Degree Certificate', 'Offer Letter'],
    estimatedDays: 7,
    createdAt: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'srv-2',
    name: 'Emirates ID (New / Renewal)',
    code: 'SRV-EID-02',
    category: 'Emirates ID Services',
    description: 'Federal Authority for Identity and Citizenship (ICP) registration and biometrics issuance.',
    basePrice: 150,
    governmentFee: 370,
    serviceFee: 130,
    totalFee: 650,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['Passport Copy', 'Residency Visa Copy', 'Old Emirates ID (if renewal)'],
    estimatedDays: 4,
    createdAt: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'srv-3',
    name: 'Amer Service - Residency Cancellation',
    code: 'SRV-AMER-03',
    category: 'Amer Services',
    description: 'General Directorate of Residency and Foreigners Affairs (GDRFA) visa cancellation processing.',
    basePrice: 150,
    governmentFee: 250,
    serviceFee: 150,
    totalFee: 550,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['Original Passport / Copy', 'Original Emirates ID', 'Company Clearance Letter'],
    estimatedDays: 2,
    createdAt: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'srv-4',
    name: 'Tasheel - Labor Contract Submission',
    code: 'SRV-TASH-04',
    category: 'Tasheel Services',
    description: 'Ministry of Human Resources and Emiratisation (MOHRE) work permit and electronic labor contract submission.',
    basePrice: 200,
    governmentFee: 350,
    serviceFee: 200,
    totalFee: 750,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['MOHRE Approved Offer Letter', 'Employee Passport Copy', 'Valid Trade License Copy'],
    estimatedDays: 3,
    createdAt: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'srv-5',
    name: 'Tadbeer - Domestic Worker Visa',
    code: 'SRV-TADB-05',
    category: 'Tadbeer Services',
    description: 'MOHRE Tadbeer domestic helper and driver visa processing under family sponsorship.',
    basePrice: 1500,
    governmentFee: 4500,
    serviceFee: 1200,
    totalFee: 7200,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['Sponsor Passport & Visa Copy', 'Sponsor Salary Certificate / Ejari', 'Worker Passport & Medical Report'],
    estimatedDays: 5,
    createdAt: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'srv-6',
    name: 'Document Attestation (MOFA / Consulate)',
    code: 'SRV-ATT-06',
    category: 'Attestation',
    description: 'Official Ministry of Foreign Affairs (MOFA) and embassy legal document authentication.',
    basePrice: 200,
    governmentFee: 150,
    serviceFee: 150,
    totalFee: 500,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['Original Certificate', 'Applicant Passport Copy'],
    estimatedDays: 5,
    createdAt: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'srv-7',
    name: 'Legal Translation (Arabic / English)',
    code: 'SRV-TRANS-07',
    category: 'Translation',
    description: 'Ministry of Justice certified legal translation for government submittals and court filings.',
    basePrice: 80,
    governmentFee: 0,
    serviceFee: 80,
    totalFee: 160,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['Original Document (High Resolution Scan)'],
    estimatedDays: 2,
    createdAt: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'srv-8',
    name: 'UAE Business License / Trade License Setup',
    code: 'SRV-BIZ-08',
    category: 'Business Setup',
    description: 'Mainland (DED) or Freezone new company formation, initial approvals, and memorandum drafting.',
    basePrice: 4000,
    governmentFee: 12500,
    serviceFee: 3500,
    totalFee: 20000,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['Shareholder Passports', 'Proposed Trade Names', 'Tenancy Contract (Ejari)'],
    estimatedDays: 14,
    createdAt: '2026-09-01T00:00:00.000Z'
  }
];

export const INITIAL_DEMO_SETTINGS: CompanySettings = {
  companyName: 'BizLink Services',
  subtitle: 'Operations Management System',
  registrationNumber: 'DXB-CORP-2024-88',
  trn: '100293847500003',
  vatEnabled: true,
  vatRate: 5,
  address: 'Suite 408, Al Rostamani Building, Al Rigga Road, Deira',
  city: 'Dubai',
  country: 'United Arab Emirates',
  phone: '+971 4 222 3456',
  email: 'operations@bizlink.ae',
  website: 'https://bizlink.ae',
  currency: 'AED',
  invoicePrefix: 'INV-2026-',
  receiptPrefix: 'REC-2026-',
  applicationPrefix: 'BL-2026-',
  customerPrefix: 'BLC-',
  employeePrefix: 'BL-EMP-',
  invoiceFooterNote: 'Thank you for choosing BizLink Services. Official tax invoices are subject to UAE Federal Tax Authority regulations.'
};
