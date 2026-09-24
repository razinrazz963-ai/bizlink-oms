import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
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
  ALL_PERMISSIONS
} from './schema.js';

interface DatabaseData {
  users: User[];
  customers: Customer[];
  applications: Application[];
  documents: DocumentRecord[];
  services: ServiceItem[];
  payments: PaymentRecord[];
  invoices: Invoice[];
  tasks: TaskRecord[];
  notifications: NotificationRecord[];
  activityLogs: ActivityLog[];
  settings: CompanySettings;
}

const DB_FILE = path.resolve(process.cwd(), 'server/data/db.json');

// Configurable standard UAE service templates
const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'srv-1',
    name: 'Employment Visa (New / Renewal)',
    code: 'SRV-VISA-01',
    category: 'Visa Services',
    description: 'UAE residency and employment visa processing including quota, entry permit, and stamping.',
    basePrice: 0,
    governmentFee: 0,
    serviceFee: 0,
    totalFee: 0,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['Passport Copy', 'Photo (White Background)', 'Attested Degree Certificate', 'Offer Letter'],
    estimatedDays: 7,
    createdAt: new Date().toISOString()
  },
  {
    id: 'srv-2',
    name: 'Emirates ID (New / Renewal)',
    code: 'SRV-EID-02',
    category: 'Emirates ID Services',
    description: 'Federal Authority for Identity and Citizenship (ICP) registration and biometrics issuance.',
    basePrice: 0,
    governmentFee: 0,
    serviceFee: 0,
    totalFee: 0,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['Passport Copy', 'Residency Visa Copy', 'Old Emirates ID (if renewal)'],
    estimatedDays: 4,
    createdAt: new Date().toISOString()
  },
  {
    id: 'srv-3',
    name: 'Amer Service - Residency Cancellation',
    code: 'SRV-AMER-03',
    category: 'Amer Services',
    description: 'GDRFA official cancellation of residency visa for individuals or dependents.',
    basePrice: 0,
    governmentFee: 0,
    serviceFee: 0,
    totalFee: 0,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['Passport Copy', 'Original Emirates ID', 'Labor Card Cancellation'],
    estimatedDays: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'srv-4',
    name: 'Tasheel - Labor Contract Amendment',
    code: 'SRV-TASH-04',
    category: 'Tasheel Services',
    description: 'MOHRE labor contract modifications, salary adjustments, and job title updates.',
    basePrice: 0,
    governmentFee: 0,
    serviceFee: 0,
    totalFee: 0,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['Trade License Copy', 'Establishment Card', 'Signed Amendment Form'],
    estimatedDays: 3,
    createdAt: new Date().toISOString()
  },
  {
    id: 'srv-5',
    name: 'Tadbeer - Domestic Worker Processing',
    code: 'SRV-TADB-05',
    category: 'Tadbeer Services',
    description: 'Domestic worker sponsorship documentation, medical fitness screening, and contract clearance.',
    basePrice: 0,
    governmentFee: 0,
    serviceFee: 0,
    totalFee: 0,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['Sponsor Passport & EID', 'Salary Certificate/Tenancy Contract', 'Worker Passport & Photo'],
    estimatedDays: 10,
    createdAt: new Date().toISOString()
  },
  {
    id: 'srv-6',
    name: 'Legal Translation & Attestation',
    code: 'SRV-DOC-06',
    category: 'Document Clearing',
    description: 'Ministry of Foreign Affairs (MOFA) attestation and sworn legal translation.',
    basePrice: 0,
    governmentFee: 0,
    serviceFee: 0,
    totalFee: 0,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['Original Document', 'Passport Copy'],
    estimatedDays: 5,
    createdAt: new Date().toISOString()
  },
  {
    id: 'srv-7',
    name: 'UAE Business Setup & Commercial License',
    code: 'SRV-BIZ-07',
    category: 'Business Setup',
    description: 'Department of Economy and Tourism (DET) LLC company formation, initial approval, and MOA clearance.',
    basePrice: 0,
    governmentFee: 0,
    serviceFee: 0,
    totalFee: 0,
    vatApplicable: true,
    isActive: true,
    requiredDocuments: ['Shareholder Passports', 'Proposed Trade Names', 'Tenancy Contract (Ejari)'],
    estimatedDays: 14,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_SETTINGS: CompanySettings = {
  companyName: 'BizLink Services',
  subtitle: 'Operations Management System',
  registrationNumber: '',
  trn: '',
  vatEnabled: false,
  vatRate: 5,
  address: '',
  city: 'Dubai',
  country: 'United Arab Emirates',
  phone: '',
  email: 'operations@bizlink.ae',
  website: '',
  currency: 'AED',
  invoicePrefix: 'INV-2026-',
  receiptPrefix: 'REC-2026-',
  applicationPrefix: 'BL-2026-',
  customerPrefix: 'BLC-',
  employeePrefix: 'BL-EMP-',
  invoiceFooterNote: 'Thank you for choosing BizLink Services. Official tax invoices are subject to UAE Federal Tax Authority regulations.'
};

class DatabaseStore {
  private data: DatabaseData;

  constructor() {
    this.data = this.loadData();
  }

  public resetToCleanState(): void {
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);

    this.data = {
      users: [
        {
          id: 'usr-admin',
          employeeId: 'BL-EMP-0001',
          name: 'System Administrator',
          email: 'admin@bizlink.ae',
          passwordHash: adminPasswordHash,
          phone: '',
          designation: 'System Administrator',
          department: 'Administration',
          role: 'admin',
          permissions: [...ALL_PERMISSIONS],
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ],
      customers: [],
      applications: [],
      documents: [],
      services: INITIAL_SERVICES,
      payments: [],
      invoices: [],
      tasks: [],
      notifications: [],
      activityLogs: [],
      settings: INITIAL_SETTINGS
    };
    this.save();
  }

  public getCounts() {
    return {
      customers: this.data.customers.length,
      applications: this.data.applications.length,
      documents: this.data.documents.length,
      payments: this.data.payments.length,
      invoices: this.data.invoices.length,
      tasks: this.data.tasks.length,
      notifications: this.data.notifications.length,
    };
  }

  private loadData(): DatabaseData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all arrays exist
        parsed.users = parsed.users || [];
        parsed.customers = parsed.customers || [];
        parsed.applications = parsed.applications || [];
        parsed.documents = parsed.documents || [];
        parsed.services = parsed.services || INITIAL_SERVICES;
        parsed.payments = parsed.payments || [];
        parsed.invoices = parsed.invoices || [];
        parsed.tasks = parsed.tasks || [];
        parsed.notifications = parsed.notifications || [];
        parsed.activityLogs = parsed.activityLogs || [];
        parsed.settings = { ...INITIAL_SETTINGS, ...(parsed.settings || {}) };
        return parsed;
      }
    } catch (e) {
      console.error('Error loading db.json, initializing fresh store:', e);
    }

    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);

    const initialData: DatabaseData = {
      users: [
        {
          id: 'usr-admin',
          employeeId: 'BL-EMP-0001',
          name: 'System Administrator',
          email: 'admin@bizlink.ae',
          passwordHash: adminPasswordHash,
          phone: '',
          designation: 'System Administrator',
          department: 'Administration',
          role: 'admin',
          permissions: [...ALL_PERMISSIONS],
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ],
      customers: [],
      applications: [],
      documents: [],
      services: INITIAL_SERVICES,
      payments: [],
      invoices: [],
      tasks: [],
      notifications: [],
      activityLogs: [],
      settings: INITIAL_SETTINGS
    };

    this.saveDataDirect(initialData);
    return initialData;
  }

  private saveDataDirect(data: DatabaseData): void {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write db.json:', e);
    }
  }

  public save(): void {
    this.saveDataDirect(this.data);
  }

  public reload(): void {
    this.data = this.loadData();
  }

  // Auto-increment ID Generators
  public generateCustomerCode(): string {
    const prefix = this.data.settings.customerPrefix || 'BLC-';
    let maxNum = 0;
    for (const c of this.data.customers) {
      if (c.customerCode && c.customerCode.startsWith(prefix)) {
        const numPart = parseInt(c.customerCode.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
      }
    }
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(6, '0')}`;
  }

  public generateTrackingNumber(): string {
    const year = new Date().getFullYear();
    const prefix = this.data.settings.applicationPrefix || `BL-${year}-`;
    let maxNum = 0;
    for (const a of this.data.applications) {
      if (a.trackingNumber && a.trackingNumber.startsWith(prefix)) {
        const numPart = parseInt(a.trackingNumber.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
      }
    }
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(5, '0')}`;
  }

  public generateEmployeeId(): string {
    const prefix = this.data.settings.employeePrefix || 'BL-EMP-';
    let maxNum = 0;
    for (const u of this.data.users) {
      if (u.employeeId && u.employeeId.startsWith(prefix)) {
        const numPart = parseInt(u.employeeId.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
      }
    }
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  public generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const prefix = this.data.settings.invoicePrefix || `INV-${year}-`;
    let maxNum = 0;
    for (const i of this.data.invoices) {
      if (i.invoiceNumber && i.invoiceNumber.startsWith(prefix)) {
        const numPart = parseInt(i.invoiceNumber.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
      }
    }
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(5, '0')}`;
  }

  public generateReceiptNumber(): string {
    const year = new Date().getFullYear();
    const prefix = this.data.settings.receiptPrefix || `REC-${year}-`;
    let maxNum = 0;
    for (const p of this.data.payments) {
      if (p.receiptNumber && p.receiptNumber.startsWith(prefix)) {
        const numPart = parseInt(p.receiptNumber.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
      }
    }
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(5, '0')}`;
  }

  // Getters
  public getUsers(): User[] { return this.data.users; }
  public getCustomers(): Customer[] { return this.data.customers; }
  public getApplications(): Application[] { return this.data.applications; }
  public getDocuments(): DocumentRecord[] { return this.data.documents; }
  public getServices(): ServiceItem[] { return this.data.services; }
  public getPayments(): PaymentRecord[] { return this.data.payments; }
  public getInvoices(): Invoice[] { return this.data.invoices; }
  public getTasks(): TaskRecord[] { return this.data.tasks; }
  public getNotifications(): NotificationRecord[] { return this.data.notifications; }
  public getActivityLogs(): ActivityLog[] { return this.data.activityLogs; }
  public getSettings(): CompanySettings { return this.data.settings; }

  // Setters / Mutators
  public updateSettings(newSettings: Partial<CompanySettings>): CompanySettings {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    return this.data.settings;
  }

  public addCustomer(cust: Customer): Customer {
    this.data.customers.unshift(cust);
    this.save();
    return cust;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const idx = this.data.customers.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.customers[idx] = { ...this.data.customers[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.customers[idx];
  }

  public deleteCustomer(id: string): boolean {
    const prevLen = this.data.customers.length;
    this.data.customers = this.data.customers.filter(c => c.id !== id);
    if (this.data.customers.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addApplication(app: Application): Application {
    this.data.applications.unshift(app);
    this.save();
    return app;
  }

  public updateApplication(id: string, updates: Partial<Application>): Application | null {
    const idx = this.data.applications.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.data.applications[idx] = { ...this.data.applications[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.applications[idx];
  }

  public deleteApplication(id: string): boolean {
    const prevLen = this.data.applications.length;
    this.data.applications = this.data.applications.filter(a => a.id !== id);
    if (this.data.applications.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addDocument(doc: DocumentRecord): DocumentRecord {
    this.data.documents.unshift(doc);
    this.save();
    return doc;
  }

  public updateDocument(id: string, updates: Partial<DocumentRecord>): DocumentRecord | null {
    const idx = this.data.documents.findIndex(d => d.id === id);
    if (idx === -1) return null;
    this.data.documents[idx] = { ...this.data.documents[idx], ...updates };
    this.save();
    return this.data.documents[idx];
  }

  public deleteDocument(id: string): boolean {
    const prevLen = this.data.documents.length;
    this.data.documents = this.data.documents.filter(d => d.id !== id);
    if (this.data.documents.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addPayment(payment: PaymentRecord): PaymentRecord {
    this.data.payments.unshift(payment);
    this.save();
    return payment;
  }

  public addInvoice(inv: Invoice): Invoice {
    this.data.invoices.unshift(inv);
    this.save();
    return inv;
  }

  public updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
    const idx = this.data.invoices.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.data.invoices[idx] = { ...this.data.invoices[idx], ...updates };
    this.save();
    return this.data.invoices[idx];
  }

  public addService(srv: ServiceItem): ServiceItem {
    this.data.services.push(srv);
    this.save();
    return srv;
  }

  public updateService(id: string, updates: Partial<ServiceItem>): ServiceItem | null {
    const idx = this.data.services.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.services[idx] = { ...this.data.services[idx], ...updates };
    this.save();
    return this.data.services[idx];
  }

  public deleteService(id: string): boolean {
    const prevLen = this.data.services.length;
    this.data.services = this.data.services.filter(s => s.id !== id);
    if (this.data.services.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addTask(task: TaskRecord): TaskRecord {
    this.data.tasks.unshift(task);
    this.save();
    return task;
  }

  public updateTask(id: string, updates: Partial<TaskRecord>): TaskRecord | null {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.tasks[idx] = { ...this.data.tasks[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.tasks[idx];
  }

  public deleteTask(id: string): boolean {
    const prevLen = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    if (this.data.tasks.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addEmployee(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateEmployee(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  public deleteEmployee(id: string): boolean {
    const prevLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addNotification(notif: NotificationRecord): NotificationRecord {
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  public markNotificationRead(id: string): void {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.save();
    }
  }

  public markAllNotificationsRead(userId?: string): void {
    this.data.notifications.forEach(n => {
      if (!userId || !n.targetUserId || n.targetUserId === userId) {
        n.isRead = true;
      }
    });
    this.save();
  }

  public clearReadNotifications(userId?: string): void {
    this.data.notifications = this.data.notifications.filter(n => {
      if (!n.isRead) return true;
      if (userId && n.targetUserId && n.targetUserId !== userId) return true;
      return false;
    });
    this.save();
  }

  public logActivity(userId: string, userName: string, userRole: string, action: string, entityType: ActivityLog['entityType'], description: string, entityId?: string): void {
    const log: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      userName,
      userRole,
      action,
      entityType,
      entityId,
      description,
      timestamp: new Date().toISOString()
    };
    this.data.activityLogs.unshift(log);
    if (this.data.activityLogs.length > 500) {
      this.data.activityLogs.pop();
    }
    this.save();
  }
}

export const db = new DatabaseStore();
