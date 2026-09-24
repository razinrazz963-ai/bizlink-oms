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
  ApplicationStatus
} from '../types/index.js';
import {
  INITIAL_DEMO_CUSTOMERS,
  INITIAL_DEMO_APPLICATIONS,
  INITIAL_DEMO_DOCUMENTS,
  INITIAL_DEMO_PAYMENTS,
  INITIAL_DEMO_INVOICES,
  INITIAL_DEMO_TASKS,
  INITIAL_DEMO_NOTIFICATIONS,
  INITIAL_DEMO_EMPLOYEES,
  INITIAL_DEMO_SERVICES,
  INITIAL_DEMO_SETTINGS,
  INITIAL_DEMO_ACTIVITY_LOGS
} from './demoData.js';

interface DemoDataStore {
  customers: Customer[];
  applications: Application[];
  documents: DocumentRecord[];
  payments: PaymentRecord[];
  invoices: Invoice[];
  tasks: TaskRecord[];
  notifications: NotificationRecord[];
  employees: User[];
  services: ServiceItem[];
  settings: CompanySettings;
  activityLogs: ActivityLog[];
}

const STORAGE_KEY = 'bizlink_demo_data';

export const isDemoModeActive = (): boolean => {
  return localStorage.getItem('bizlink_demo_mode') === 'true';
};

function getInitialData(): DemoDataStore {
  return {
    customers: JSON.parse(JSON.stringify(INITIAL_DEMO_CUSTOMERS)),
    applications: JSON.parse(JSON.stringify(INITIAL_DEMO_APPLICATIONS)),
    documents: JSON.parse(JSON.stringify(INITIAL_DEMO_DOCUMENTS)),
    payments: JSON.parse(JSON.stringify(INITIAL_DEMO_PAYMENTS)),
    invoices: JSON.parse(JSON.stringify(INITIAL_DEMO_INVOICES)),
    tasks: JSON.parse(JSON.stringify(INITIAL_DEMO_TASKS)),
    notifications: JSON.parse(JSON.stringify(INITIAL_DEMO_NOTIFICATIONS)),
    employees: JSON.parse(JSON.stringify(INITIAL_DEMO_EMPLOYEES)),
    services: JSON.parse(JSON.stringify(INITIAL_DEMO_SERVICES)),
    settings: JSON.parse(JSON.stringify(INITIAL_DEMO_SETTINGS)),
    activityLogs: JSON.parse(JSON.stringify(INITIAL_DEMO_ACTIVITY_LOGS))
  };
}

function loadStore(): DemoDataStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse demo data from localStorage, re-initializing:', e);
  }
  const fresh = getInitialData();
  saveStore(fresh);
  return fresh;
}

function saveStore(store: DemoDataStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save demo store to localStorage:', e);
  }
}

export const demoStore = {
  resetDemoData: () => {
    const fresh = getInitialData();
    saveStore(fresh);
    return fresh;
  },

  // Customers
  getCustomers: (params?: { search?: string; nationality?: string; status?: string; customerType?: string }) => {
    const store = loadStore();
    let result = [...store.customers];

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.emiratesId && c.emiratesId.includes(q)) ||
        (c.passportNumber && c.passportNumber.toLowerCase().includes(q))
      );
    }

    if (params?.nationality) {
      result = result.filter(c => c.nationality === params.nationality);
    }

    if (params?.status) {
      result = result.filter(c => c.status === params.status);
    }

    if (params?.customerType) {
      result = result.filter(c => c.customerType === params.customerType);
    }

    return Promise.resolve(result);
  },

  getCustomer: (id: string) => {
    const store = loadStore();
    const customer = store.customers.find(c => c.id === id);
    if (!customer) throw new Error('Customer not found');

    const applications = store.applications.filter(a => a.customerId === id);
    const documents = store.documents.filter(d => d.customerId === id);
    const payments = store.payments.filter(p => p.customerId === id);
    const invoices = store.invoices.filter(i => i.customerId === id);
    const tasks = store.tasks.filter(t => t.customerId === id);
    const activityLogs = store.activityLogs.filter(act => act.entityId === id || act.description.includes(customer.name));

    const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.paidAmount, 0);
    const totalOutstanding = Math.max(0, totalInvoiced - totalPaid);

    return Promise.resolve({
      customer,
      applications,
      documents,
      payments,
      invoices,
      tasks,
      activityLogs,
      summary: {
        totalApplications: applications.length,
        activeApplications: applications.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length,
        totalDocuments: documents.length,
        totalInvoiced,
        totalPaid,
        totalOutstanding
      }
    });
  },

  createCustomer: (data: Partial<Customer>) => {
    const store = loadStore();
    const count = store.customers.length + 1;
    const customerCode = `BLC-${String(count).padStart(6, '0')}`;

    const newCustomer: Customer = {
      id: `cust-demo-${Date.now()}`,
      customerCode,
      name: data.name || 'Unnamed Client',
      email: data.email || '',
      phone: data.phone || '',
      nationality: data.nationality || '',
      dateOfBirth: data.dateOfBirth || '',
      gender: data.gender || 'Male',
      passportNumber: data.passportNumber || '',
      passportExpiryDate: data.passportExpiryDate || '',
      emiratesId: data.emiratesId || '',
      emiratesIdExpiryDate: data.emiratesIdExpiryDate || '',
      visaNumber: data.visaNumber || '',
      visaExpiryDate: data.visaExpiryDate || '',
      customerType: data.customerType || 'Individual',
      companyName: data.companyName || '',
      address: data.address || '',
      status: 'active',
      notes: data.notes || '',
      activeApplicationsCount: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.customers.unshift(newCustomer);

    store.activityLogs.unshift({
      id: `act-${Date.now()}`,
      userId: 'usr-demo-admin',
      userName: 'Demo Administrator',
      userRole: 'admin',
      action: 'CREATE_CUSTOMER',
      entityType: 'customer',
      entityId: newCustomer.id,
      description: `Created customer ${newCustomer.name} (${newCustomer.customerCode})`,
      timestamp: new Date().toISOString()
    });

    saveStore(store);
    return Promise.resolve(newCustomer);
  },

  updateCustomer: (id: string, updates: Partial<Customer>) => {
    const store = loadStore();
    const idx = store.customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer not found');

    store.customers[idx] = {
      ...store.customers[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    saveStore(store);
    return Promise.resolve(store.customers[idx]);
  },

  deleteCustomer: (id: string) => {
    const store = loadStore();
    store.customers = store.customers.filter(c => c.id !== id);
    saveStore(store);
    return Promise.resolve({ success: true, message: 'Customer removed' });
  },

  // Applications
  getApplications: (params?: { status?: string; priority?: string; serviceId?: string; customerId?: string; search?: string }) => {
    const store = loadStore();
    let result = [...store.applications];

    if (params?.status) {
      result = result.filter(a => a.status === params.status);
    }
    if (params?.priority) {
      result = result.filter(a => a.priority === params.priority);
    }
    if (params?.serviceId) {
      result = result.filter(a => a.serviceId === params.serviceId);
    }
    if (params?.customerId) {
      result = result.filter(a => a.customerId === params.customerId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(a =>
        a.trackingNumber.toLowerCase().includes(q) ||
        a.customerName.toLowerCase().includes(q) ||
        a.serviceName.toLowerCase().includes(q)
      );
    }

    return Promise.resolve(result);
  },

  getApplication: (id: string) => {
    const store = loadStore();
    const application = store.applications.find(a => a.id === id);
    if (!application) throw new Error('Application not found');

    const customer = store.customers.find(c => c.id === application.customerId) || store.customers[0];
    const service = store.services.find(s => s.id === application.serviceId) || store.services[0];
    const documents = store.documents.filter(d => d.applicationId === id);
    const payments = store.payments.filter(p => p.applicationId === id);
    const tasks = store.tasks.filter(t => t.applicationId === id);

    return Promise.resolve({
      application,
      customer,
      service,
      documents,
      payments,
      tasks
    });
  },

  createApplication: (appData: {
    customerId: string;
    serviceId: string;
    assignedEmployeeId?: string;
    priority?: string;
    notes?: string;
    governmentReferenceNo?: string;
    applicationDate?: string;
  }) => {
    const store = loadStore();
    const customer = store.customers.find(c => c.id === appData.customerId);
    if (!customer) throw new Error('Customer not found');

    const service = store.services.find(s => s.id === appData.serviceId);
    const serviceName = service ? service.name : 'General Service';

    let assignedName = 'Unassigned';
    if (appData.assignedEmployeeId) {
      const emp = store.employees.find(e => e.id === appData.assignedEmployeeId);
      if (emp) assignedName = emp.name;
    }

    const count = store.applications.length + 1;
    const trackingNumber = `BL-DEMO-${String(count).padStart(5, '0')}`;
    const now = new Date().toISOString();

    const newApp: Application = {
      id: `app-demo-${Date.now()}`,
      trackingNumber,
      customerId: customer.id,
      customerName: customer.name,
      serviceId: appData.serviceId,
      serviceName,
      assignedEmployeeId: appData.assignedEmployeeId,
      assignedEmployeeName: assignedName,
      status: 'NEW',
      priority: (appData.priority as any) || 'medium',
      applicationDate: appData.applicationDate || now.split('T')[0],
      notes: appData.notes || '',
      governmentReferenceNo: appData.governmentReferenceNo || '',
      paymentStatus: 'Pending',
      totalPaid: 0,
      totalDue: service ? service.totalFee : 1000,
      statusHistory: [
        {
          id: `hist-${Date.now()}`,
          status: 'NEW',
          note: 'Application initiated in demo mode',
          changedBy: 'usr-demo-admin',
          changedByName: 'Demo Administrator',
          timestamp: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    store.applications.unshift(newApp);

    // Update customer active applications count
    customer.activeApplicationsCount = (customer.activeApplicationsCount || 0) + 1;

    // Add notification
    store.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'New Application Created',
      message: `Application ${trackingNumber} created for ${customer.name}`,
      type: 'application',
      link: '/applications',
      isRead: false,
      createdAt: now
    });

    saveStore(store);
    return Promise.resolve(newApp);
  },

  updateApplicationStatus: (id: string, status: string, note?: string) => {
    const store = loadStore();
    const app = store.applications.find(a => a.id === id);
    if (!app) throw new Error('Application not found');

    const oldStatus = app.status;
    app.status = status as ApplicationStatus;
    app.updatedAt = new Date().toISOString();

    app.statusHistory.push({
      id: `hist-${Date.now()}`,
      oldStatus,
      status: app.status,
      note: note || `Status updated from ${oldStatus} to ${status}`,
      changedBy: 'usr-demo-admin',
      changedByName: 'Demo Administrator',
      timestamp: new Date().toISOString()
    });

    saveStore(store);
    return Promise.resolve(app);
  },

  assignApplication: (id: string, assignedEmployeeId: string) => {
    const store = loadStore();
    const app = store.applications.find(a => a.id === id);
    if (!app) throw new Error('Application not found');

    const emp = store.employees.find(e => e.id === assignedEmployeeId);
    app.assignedEmployeeId = assignedEmployeeId;
    app.assignedEmployeeName = emp ? emp.name : 'Staff';
    app.updatedAt = new Date().toISOString();

    saveStore(store);
    return Promise.resolve(app);
  },

  updateApplication: (id: string, updates: Partial<Application>) => {
    const store = loadStore();
    const idx = store.applications.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Application not found');

    store.applications[idx] = {
      ...store.applications[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    saveStore(store);
    return Promise.resolve(store.applications[idx]);
  },

  deleteApplication: (id: string) => {
    const store = loadStore();
    store.applications = store.applications.filter(a => a.id !== id);
    saveStore(store);
    return Promise.resolve({ success: true });
  },

  // Documents
  getDocuments: (params?: { documentType?: string; status?: string; customerId?: string; search?: string }) => {
    const store = loadStore();
    let result = [...store.documents];

    if (params?.documentType) {
      result = result.filter(d => d.documentType === params.documentType);
    }
    if (params?.status) {
      result = result.filter(d => d.status === params.status);
    }
    if (params?.customerId) {
      result = result.filter(d => d.customerId === params.customerId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(d =>
        d.documentName.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q)
      );
    }

    return Promise.resolve(result);
  },

  getExpiringDocuments: () => {
    const store = loadStore();
    const today = new Date();

    const next7Days: DocumentRecord[] = [];
    const next15Days: DocumentRecord[] = [];
    const next30Days: DocumentRecord[] = [];
    const next60Days: DocumentRecord[] = [];
    const expired: DocumentRecord[] = [];

    store.documents.forEach(doc => {
      if (!doc.expiryDate) return;
      const exp = new Date(doc.expiryDate);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        expired.push(doc);
      } else if (diffDays <= 7) {
        next7Days.push(doc);
      } else if (diffDays <= 15) {
        next15Days.push(doc);
      } else if (diffDays <= 30) {
        next30Days.push(doc);
      } else if (diffDays <= 60) {
        next60Days.push(doc);
      }
    });

    return Promise.resolve({
      next7Days,
      next15Days,
      next30Days,
      next60Days,
      expired
    });
  },

  uploadFile: (file: File) => {
    return Promise.resolve({
      fileUrl: URL.createObjectURL(file),
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/pdf'
    });
  },

  uploadDocument: (doc: Partial<DocumentRecord>) => {
    const store = loadStore();
    const customer = store.customers.find(c => c.id === doc.customerId);

    const newDoc: DocumentRecord = {
      id: `doc-demo-${Date.now()}`,
      documentName: doc.documentName || 'Uploaded File',
      documentType: doc.documentType || 'Passport',
      customerId: doc.customerId || '',
      customerName: customer ? customer.name : (doc.customerName || 'Client'),
      applicationId: doc.applicationId,
      applicationTrackingNumber: doc.applicationTrackingNumber,
      fileName: doc.fileName || 'document.pdf',
      fileUrl: doc.fileUrl || '/mock/docs/sample.pdf',
      fileSize: doc.fileSize || '1.5 MB',
      fileType: doc.fileType || 'application/pdf',
      issueDate: doc.issueDate,
      expiryDate: doc.expiryDate,
      daysRemaining: doc.expiryDate ? Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined,
      status: (doc.status as any) || 'valid',
      uploadedBy: 'usr-demo-admin',
      uploadedByName: 'Demo Administrator',
      uploadedAt: new Date().toISOString(),
      notes: doc.notes || ''
    };

    store.documents.unshift(newDoc);
    saveStore(store);
    return Promise.resolve(newDoc);
  },

  deleteDocument: (id: string) => {
    const store = loadStore();
    store.documents = store.documents.filter(d => d.id !== id);
    saveStore(store);
    return Promise.resolve({ success: true });
  },

  // Services
  getServices: (params?: { category?: string; activeOnly?: boolean; search?: string }) => {
    const store = loadStore();
    let result = [...store.services];

    if (params?.category) {
      result = result.filter(s => s.category === params.category);
    }
    if (params?.activeOnly) {
      result = result.filter(s => s.isActive);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
    }

    return Promise.resolve(result);
  },

  createService: (srv: Partial<ServiceItem>) => {
    const store = loadStore();
    const newSrv: ServiceItem = {
      id: `srv-demo-${Date.now()}`,
      name: srv.name || 'New Service',
      code: srv.code || `SRV-${Date.now().toString().slice(-4)}`,
      category: srv.category || 'Other',
      description: srv.description || '',
      basePrice: Number(srv.basePrice) || 0,
      governmentFee: Number(srv.governmentFee) || 0,
      serviceFee: Number(srv.serviceFee) || 0,
      totalFee: (Number(srv.basePrice) || 0) + (Number(srv.governmentFee) || 0) + (Number(srv.serviceFee) || 0),
      vatApplicable: Boolean(srv.vatApplicable),
      isActive: true,
      requiredDocuments: srv.requiredDocuments || [],
      estimatedDays: Number(srv.estimatedDays) || 3,
      createdAt: new Date().toISOString()
    };

    store.services.push(newSrv);
    saveStore(store);
    return Promise.resolve(newSrv);
  },

  updateService: (id: string, updates: Partial<ServiceItem>) => {
    const store = loadStore();
    const idx = store.services.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Service not found');

    const base = Number(updates.basePrice ?? store.services[idx].basePrice);
    const gov = Number(updates.governmentFee ?? store.services[idx].governmentFee);
    const serv = Number(updates.serviceFee ?? store.services[idx].serviceFee);

    store.services[idx] = {
      ...store.services[idx],
      ...updates,
      basePrice: base,
      governmentFee: gov,
      serviceFee: serv,
      totalFee: base + gov + serv
    };

    saveStore(store);
    return Promise.resolve(store.services[idx]);
  },

  toggleService: (id: string) => {
    const store = loadStore();
    const srv = store.services.find(s => s.id === id);
    if (!srv) throw new Error('Service not found');
    srv.isActive = !srv.isActive;
    saveStore(store);
    return Promise.resolve(srv);
  },

  deleteService: (id: string) => {
    const store = loadStore();
    store.services = store.services.filter(s => s.id !== id);
    saveStore(store);
    return Promise.resolve({ success: true, message: 'Service removed' });
  },

  // Payments
  getPayments: (params?: { status?: string; paymentMethod?: string; customerId?: string; search?: string }) => {
    const store = loadStore();
    let result = [...store.payments];

    if (params?.status) {
      result = result.filter(p => p.status === params.status);
    }
    if (params?.paymentMethod) {
      result = result.filter(p => p.paymentMethod === params.paymentMethod);
    }
    if (params?.customerId) {
      result = result.filter(p => p.customerId === params.customerId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(p =>
        p.receiptNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q))
      );
    }

    return Promise.resolve(result);
  },

  getPaymentsSummary: () => {
    const store = loadStore();
    const totalRevenue = store.payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.paidAmount, 0);
    const totalOutstanding = store.invoices.reduce((sum, inv) => sum + inv.balance, 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRevenue = store.payments
      .filter(p => p.status === 'Paid' && p.paymentDate === todayStr)
      .reduce((sum, p) => sum + p.paidAmount, 0);

    return Promise.resolve({
      totalRevenue,
      totalOutstanding,
      todayRevenue,
      totalTransactions: store.payments.length
    });
  },

  recordPayment: (payment: Partial<PaymentRecord>) => {
    const store = loadStore();
    const customer = store.customers.find(c => c.id === payment.customerId);
    const count = store.payments.length + 1;
    const receiptNumber = `REC-2026-${String(count).padStart(5, '0')}`;

    const newPayment: PaymentRecord = {
      id: `pay-demo-${Date.now()}`,
      receiptNumber,
      customerId: payment.customerId || '',
      customerName: customer ? customer.name : (payment.customerName || 'Client'),
      applicationId: payment.applicationId,
      applicationTrackingNumber: payment.applicationTrackingNumber,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoiceNumber,
      serviceName: payment.serviceName || 'General Operations',
      totalAmount: Number(payment.totalAmount) || Number(payment.paidAmount) || 0,
      paidAmount: Number(payment.paidAmount) || 0,
      balance: Math.max(0, (Number(payment.totalAmount) || Number(payment.paidAmount) || 0) - (Number(payment.paidAmount) || 0)),
      paymentMethod: payment.paymentMethod || 'Cash',
      paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
      status: payment.status || 'Paid',
      referenceNo: payment.referenceNo || `TRX-${Date.now().toString().slice(-6)}`,
      recordedBy: 'usr-demo-admin',
      recordedByName: 'Demo Administrator',
      notes: payment.notes || '',
      createdAt: new Date().toISOString()
    };

    store.payments.unshift(newPayment);

    // If an invoice was linked, reduce invoice balance
    if (payment.invoiceId) {
      const inv = store.invoices.find(i => i.id === payment.invoiceId);
      if (inv) {
        inv.paidAmount += newPayment.paidAmount;
        inv.balance = Math.max(0, inv.totalAmount - inv.paidAmount);
        inv.status = inv.balance === 0 ? 'Paid' : 'Partially Paid';
      }
    }

    saveStore(store);
    return Promise.resolve(newPayment);
  },

  deletePayment: (id: string) => {
    const store = loadStore();
    store.payments = store.payments.filter(p => p.id !== id);
    saveStore(store);
    return Promise.resolve({ success: true });
  },

  // Invoices
  getInvoices: (params?: { status?: string; customerId?: string; search?: string }) => {
    const store = loadStore();
    let result = [...store.invoices];

    if (params?.status) {
      result = result.filter(i => i.status === params.status);
    }
    if (params?.customerId) {
      result = result.filter(i => i.customerId === params.customerId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(i =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q)
      );
    }

    return Promise.resolve(result);
  },

  getInvoice: (id: string) => {
    const store = loadStore();
    const invoice = store.invoices.find(i => i.id === id);
    if (!invoice) throw new Error('Invoice not found');

    const customer = store.customers.find(c => c.id === invoice.customerId) || store.customers[0];
    const payments = store.payments.filter(p => p.invoiceId === id);

    return Promise.resolve({
      invoice,
      customer,
      company: store.settings,
      payments
    });
  },

  createInvoice: (data: any) => {
    const store = loadStore();
    const customer = store.customers.find(c => c.id === data.customerId);
    const count = store.invoices.length + 1;
    const invoiceNumber = `INV-2026-${String(count).padStart(5, '0')}`;

    const items = data.items || [];
    const subtotal = items.reduce((sum: number, it: any) => sum + (Number(it.total) || 0), 0);
    const vatRate = store.settings.vatEnabled ? (store.settings.vatRate || 5) : 0;
    const vatAmount = (subtotal * vatRate) / 100;
    const totalAmount = subtotal + vatAmount;

    const newInvoice: Invoice = {
      id: `inv-demo-${Date.now()}`,
      invoiceNumber,
      customerId: data.customerId || '',
      customerName: customer ? customer.name : 'Client',
      customerPhone: customer?.phone,
      customerEmail: customer?.email,
      customerAddress: customer?.address,
      applicationId: data.applicationId,
      applicationTrackingNumber: data.applicationTrackingNumber,
      issueDate: data.issueDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items,
      subtotal,
      vatRate,
      vatAmount,
      totalAmount,
      paidAmount: 0,
      balance: totalAmount,
      status: 'Issued',
      paymentTerms: data.paymentTerms || 'Payment due within 14 days',
      notes: data.notes || '',
      createdBy: 'usr-demo-admin',
      createdByName: 'Demo Administrator',
      createdAt: new Date().toISOString()
    };

    store.invoices.unshift(newInvoice);
    saveStore(store);
    return Promise.resolve(newInvoice);
  },

  updateInvoice: (id: string, updates: Partial<Invoice>) => {
    const store = loadStore();
    const idx = store.invoices.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Invoice not found');

    store.invoices[idx] = {
      ...store.invoices[idx],
      ...updates
    };

    saveStore(store);
    return Promise.resolve(store.invoices[idx]);
  },

  deleteInvoice: (id: string) => {
    const store = loadStore();
    store.invoices = store.invoices.filter(i => i.id !== id);
    saveStore(store);
    return Promise.resolve({ success: true });
  },

  // Employees
  getEmployees: () => {
    const store = loadStore();
    return Promise.resolve(store.employees);
  },

  getEmployee: (id: string) => {
    const store = loadStore();
    const employee = store.employees.find(e => e.id === id);
    if (!employee) throw new Error('Employee not found');

    const assignedApplications = store.applications.filter(a => a.assignedEmployeeId === id);
    const assignedTasks = store.tasks.filter(t => t.assignedEmployeeId === id);
    const activityLogs = store.activityLogs.filter(act => act.userId === id);

    return Promise.resolve({
      employee,
      assignedApplications,
      assignedTasks,
      activityLogs,
      metrics: {
        totalApplications: assignedApplications.length,
        activeApplications: assignedApplications.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length,
        completedApplications: assignedApplications.filter(a => a.status === 'COMPLETED').length,
        pendingTasks: assignedTasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length
      }
    });
  },

  addEmployee: (data: Partial<User> & { password?: string }) => {
    const store = loadStore();
    const count = store.employees.length + 1;
    const employeeId = `BL-EMP-${String(count).padStart(4, '0')}`;

    const newEmp: User = {
      id: `usr-demo-${Date.now()}`,
      employeeId,
      name: data.name || 'New Staff',
      email: data.email || 'staff@bizlink.ae',
      phone: data.phone || '+971 4 000 0000',
      designation: data.designation || 'Operations Executive',
      department: data.department || 'Operations',
      role: data.role || 'employee',
      permissions: data.permissions || ['customers.view', 'applications.view'],
      status: 'active',
      activeApplicationsCount: 0,
      activeTasksCount: 0,
      createdAt: new Date().toISOString()
    };

    store.employees.push(newEmp);
    saveStore(store);
    return Promise.resolve(newEmp);
  },

  updateEmployee: (id: string, updates: Partial<User>) => {
    const store = loadStore();
    const idx = store.employees.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Employee not found');

    store.employees[idx] = {
      ...store.employees[idx],
      ...updates
    };

    saveStore(store);
    return Promise.resolve(store.employees[idx]);
  },

  resetEmployeePassword: (id: string) => {
    return Promise.resolve({ success: true, message: 'Password reset successfully for demo employee.' });
  },

  deleteEmployee: (id: string) => {
    const store = loadStore();
    store.employees = store.employees.filter(e => e.id !== id);
    saveStore(store);
    return Promise.resolve({ success: true, message: 'Employee deactivated' });
  },

  // Tasks
  getTasks: (params?: { status?: string; priority?: string; employeeId?: string; myTasksOnly?: boolean }) => {
    const store = loadStore();
    let result = [...store.tasks];

    if (params?.status) {
      result = result.filter(t => t.status === params.status);
    }
    if (params?.priority) {
      result = result.filter(t => t.priority === params.priority);
    }
    if (params?.employeeId) {
      result = result.filter(t => t.assignedEmployeeId === params.employeeId);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const overdue = result.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled' && t.dueDate < todayStr);
    const dueToday = result.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled' && t.dueDate === todayStr);
    const upcoming = result.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled' && t.dueDate > todayStr);
    const completed = result.filter(t => t.status === 'Completed');

    return Promise.resolve({
      all: result,
      summary: {
        total: result.length,
        overdueCount: overdue.length,
        dueTodayCount: dueToday.length,
        upcomingCount: upcoming.length,
        completedCount: completed.length
      },
      sections: {
        overdue,
        dueToday,
        upcoming,
        completed
      }
    });
  },

  createTask: (data: Partial<TaskRecord>) => {
    const store = loadStore();
    const customer = store.customers.find(c => c.id === data.customerId);
    const emp = store.employees.find(e => e.id === data.assignedEmployeeId) || store.employees[0];
    const assignedEmpId = emp ? emp.id : 'usr-demo-admin';
    const assignedEmpName = emp ? emp.name : 'Demo Administrator';

    const newTask: TaskRecord = {
      id: `task-demo-${Date.now()}`,
      title: data.title || 'New Task',
      description: data.description || '',
      customerId: data.customerId,
      customerName: customer ? customer.name : undefined,
      applicationId: data.applicationId,
      applicationTrackingNumber: data.applicationTrackingNumber,
      assignedEmployeeId: assignedEmpId,
      assignedEmployeeName: assignedEmpName,
      priority: data.priority || 'medium',
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      status: data.status || 'To Do',
      createdBy: 'usr-demo-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.tasks.unshift(newTask);
    saveStore(store);
    return Promise.resolve(newTask);
  },

  updateTask: (id: string, updates: Partial<TaskRecord>) => {
    const store = loadStore();
    const idx = store.tasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Task not found');

    store.tasks[idx] = {
      ...store.tasks[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    saveStore(store);
    return Promise.resolve(store.tasks[idx]);
  },

  deleteTask: (id: string) => {
    const store = loadStore();
    store.tasks = store.tasks.filter(t => t.id !== id);
    saveStore(store);
    return Promise.resolve({ success: true });
  },

  // Notifications
  getNotifications: () => {
    const store = loadStore();
    const unreadCount = store.notifications.filter(n => !n.isRead).length;
    return Promise.resolve({
      notifications: store.notifications,
      unreadCount
    });
  },

  markNotificationRead: (id: string) => {
    const store = loadStore();
    const notif = store.notifications.find(n => n.id === id);
    if (notif) notif.isRead = true;
    saveStore(store);
    return Promise.resolve({ success: true });
  },

  markAllNotificationsRead: () => {
    const store = loadStore();
    store.notifications.forEach(n => { n.isRead = true; });
    saveStore(store);
    return Promise.resolve({ success: true });
  },

  clearReadNotifications: () => {
    const store = loadStore();
    store.notifications = store.notifications.filter(n => !n.isRead);
    saveStore(store);
    return Promise.resolve({ success: true, message: 'Read notifications cleared' });
  },

  // Reports
  getReports: () => {
    const store = loadStore();
    const totalCustomers = store.customers.length;
    const activeApplications = store.applications.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length;
    const completedApplications = store.applications.filter(a => a.status === 'COMPLETED').length;
    const totalRevenue = store.payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.paidAmount, 0);
    const totalOutstanding = store.invoices.reduce((sum, i) => sum + i.balance, 0);
    const totalBilled = store.invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalDocuments = store.documents.length;

    // Apps by status
    const statusCounts: Record<string, number> = {};
    store.applications.forEach(a => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });
    const appsByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    // Apps by service
    const serviceCounts: Record<string, number> = {};
    store.applications.forEach(a => {
      serviceCounts[a.serviceName] = (serviceCounts[a.serviceName] || 0) + 1;
    });
    const appsByService = Object.entries(serviceCounts).map(([name, count]) => ({ name, count }));

    // Monthly performance computed dynamically from actual demo transactions
    const currentMonth = new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    const monthlyPerformance = [
      { month: currentMonth, revenue: totalRevenue, applications: store.applications.length }
    ];

    // Employee workload
    const employeeWorkload = store.employees.map(emp => {
      const activeApps = store.applications.filter(a => a.assignedEmployeeId === emp.id && a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length;
      const completedApps = store.applications.filter(a => a.assignedEmployeeId === emp.id && a.status === 'COMPLETED').length;
      return {
        name: emp.name,
        activeApps,
        completedApps
      };
    });

    return Promise.resolve({
      kpi: {
        totalCustomers,
        activeApplications,
        completedApplications,
        totalRevenue,
        totalOutstanding,
        totalBilled,
        totalDocuments
      },
      appsByService,
      appsByStatus,
      monthlyPerformance,
      employeeWorkload,
      expiryBreakdown: {
        valid: store.documents.filter(d => d.status === 'valid').length,
        expiringSoon: store.documents.filter(d => d.status === 'expiring_soon').length,
        expired: store.documents.filter(d => d.status === 'expired').length
      }
    });
  },

  // Settings
  getSettings: () => {
    const store = loadStore();
    return Promise.resolve(store.settings);
  },

  updateSettings: (settings: Partial<CompanySettings>) => {
    const store = loadStore();
    store.settings = { ...store.settings, ...settings };
    saveStore(store);
    return Promise.resolve(store.settings);
  },

  // Activity Logs
  getActivityLogs: () => {
    const store = loadStore();
    return Promise.resolve(store.activityLogs);
  },

  // Global Search
  searchGlobal: (query: string) => {
    const store = loadStore();
    const q = query.toLowerCase();

    const customers = store.customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.customerCode.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );

    const applications = store.applications.filter(a =>
      a.trackingNumber.toLowerCase().includes(q) ||
      a.customerName.toLowerCase().includes(q) ||
      a.serviceName.toLowerCase().includes(q)
    );

    const documents = store.documents.filter(d =>
      d.documentName.toLowerCase().includes(q) ||
      d.customerName.toLowerCase().includes(q)
    );

    const invoices = store.invoices.filter(i =>
      i.invoiceNumber.toLowerCase().includes(q) ||
      i.customerName.toLowerCase().includes(q)
    );

    const payments = store.payments.filter(p =>
      p.receiptNumber.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q)
    );

    return Promise.resolve({
      customers,
      applications,
      documents,
      invoices,
      payments,
      totalMatches: customers.length + applications.length + documents.length + invoices.length + payments.length
    });
  },

  // Public Tracking
  trackApplication: (trackingNumber: string) => {
    const store = loadStore();
    const app = store.applications.find(a => a.trackingNumber.toLowerCase() === trackingNumber.toLowerCase());
    if (!app) throw new Error('Application tracking ID not found');

    const statuses: ApplicationStatus[] = [
      'NEW',
      'DOCUMENTS PENDING',
      'DOCUMENTS RECEIVED',
      'SUBMITTED',
      'UNDER PROCESSING',
      'COMPLETED'
    ];

    const currentIdx = statuses.indexOf(app.status);

    const timeline = statuses.map((st, idx) => {
      let state: 'completed' | 'current' | 'upcoming' = 'upcoming';
      if (idx < currentIdx) state = 'completed';
      else if (idx === currentIdx) state = 'current';

      return {
        key: st,
        label: st,
        description: `Status checkpoint for ${st.toLowerCase()}`,
        state
      };
    });

    return Promise.resolve({
      trackingNumber: app.trackingNumber,
      serviceName: app.serviceName,
      applicant: app.customerName,
      status: app.status,
      applicationDate: app.applicationDate,
      updatedAt: app.updatedAt,
      targetCompletionDate: app.targetCompletionDate,
      completedDate: app.completedDate,
      timeline,
      company: {
        name: store.settings.companyName,
        contactPhone: store.settings.phone || '+971 4 222 3456',
        supportEmail: store.settings.email || 'operations@bizlink.ae'
      }
    });
  }
};
