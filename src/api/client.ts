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
  User
} from '../types/index.js';
import { demoStore, isDemoModeActive } from '../demo/demoStore.js';

const envApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const API_BASE = envApiUrl ? (envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl}/api`) : '/api';

function getHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem('bizlink_token');
  const headers: HeadersInit = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...getHeaders(isFormData),
        ...options.headers,
      },
    });
  } catch (netErr: any) {
    throw new Error(
      'Unable to connect to the operations server. Please check your network connection or verify that the backend API service is online.'
    );
  }

  if (response.status === 401) {
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/track')) {
      localStorage.removeItem('bizlink_token');
      localStorage.removeItem('bizlink_user');
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    let errorMsg = '';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || '';
    } catch {
      // Body was not JSON (e.g. HTML 404/502/503 from edge proxy)
    }

    if (!errorMsg) {
      if (response.status === 401) {
        errorMsg = 'Invalid email or password. Please verify your credentials.';
      } else if (response.status === 403) {
        errorMsg = 'Account deactivated or unauthorized access.';
      } else if (response.status === 404) {
        errorMsg = 'Backend service unavailable (API endpoint not found).';
      } else if (response.status >= 500) {
        errorMsg = 'Internal server error. Please try again shortly or contact support.';
      } else {
        errorMsg = `Request failed with HTTP status ${response.status}.`;
      }
    }

    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Demo Mode Helpers
  isDemoMode: isDemoModeActive,
  resetDemoData: () => demoStore.resetDemoData(),

  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getCurrentUser: () => {
    if (isDemoModeActive()) {
      const saved = localStorage.getItem('bizlink_user');
      if (saved) return Promise.resolve(JSON.parse(saved));
    }
    return request<User>('/auth/me');
  },

  changePassword: (data: { currentPassword: string; newPassword: string; confirmNewPassword?: string }) => {
    if (isDemoModeActive()) {
      return Promise.resolve({ success: true, message: 'Password updated successfully in demo mode' });
    }
    return request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateProfile: (profile: Partial<User>) => {
    if (isDemoModeActive()) {
      const saved = localStorage.getItem('bizlink_user');
      const current = saved ? JSON.parse(saved) : {};
      const updated = { ...current, ...profile };
      localStorage.setItem('bizlink_user', JSON.stringify(updated));
      return Promise.resolve(updated);
    }
    return request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },

  // Customers
  getCustomers: (params?: { search?: string; nationality?: string; status?: string; customerType?: string }) => {
    if (isDemoModeActive()) return demoStore.getCustomers(params);
    const q = new URLSearchParams(params as any).toString();
    return request<Customer[]>(`/customers${q ? `?${q}` : ''}`);
  },

  getCustomer: (id: string) => {
    if (isDemoModeActive()) return demoStore.getCustomer(id);
    return request<{
      customer: Customer;
      applications: Application[];
      documents: DocumentRecord[];
      payments: PaymentRecord[];
      invoices: Invoice[];
      tasks: TaskRecord[];
      activityLogs: ActivityLog[];
      summary: {
        totalApplications: number;
        activeApplications: number;
        totalDocuments: number;
        totalInvoiced: number;
        totalPaid: number;
        totalOutstanding: number;
      };
    }>(`/customers/${id}`);
  },

  createCustomer: (customer: Partial<Customer>) => {
    if (isDemoModeActive()) return demoStore.createCustomer(customer);
    return request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },

  updateCustomer: (id: string, customer: Partial<Customer>) => {
    if (isDemoModeActive()) return demoStore.updateCustomer(id, customer);
    return request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  },

  deleteCustomer: (id: string) => {
    if (isDemoModeActive()) return demoStore.deleteCustomer(id);
    return request<{ success: boolean; message?: string }>(`/customers/${id}`, {
      method: 'DELETE',
    });
  },

  // Applications
  getApplications: (params?: { status?: string; priority?: string; serviceId?: string; customerId?: string; assignedEmployeeId?: string; search?: string }) => {
    if (isDemoModeActive()) return demoStore.getApplications(params);
    const q = new URLSearchParams(params as any).toString();
    return request<Application[]>(`/applications${q ? `?${q}` : ''}`);
  },

  getApplication: (id: string) => {
    if (isDemoModeActive()) return demoStore.getApplication(id);
    return request<{
      application: Application;
      customer: Customer;
      service: ServiceItem;
      documents: DocumentRecord[];
      payments: PaymentRecord[];
      tasks: TaskRecord[];
    }>(`/applications/${id}`);
  },

  createApplication: (app: {
    customerId: string;
    serviceId: string;
    assignedEmployeeId?: string;
    priority?: string;
    notes?: string;
    governmentReferenceNo?: string;
    applicationDate?: string;
    targetCompletionDate?: string;
  }) => {
    if (isDemoModeActive()) return demoStore.createApplication(app);
    return request<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(app),
    });
  },

  updateApplicationStatus: (id: string, status: string, note?: string) => {
    if (isDemoModeActive()) return demoStore.updateApplicationStatus(id, status, note);
    return request<Application>(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  },

  assignApplication: (id: string, assignedEmployeeId: string) => {
    if (isDemoModeActive()) return demoStore.assignApplication(id, assignedEmployeeId);
    return request<Application>(`/applications/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ assignedEmployeeId }),
    });
  },

  updateApplication: (id: string, updates: Partial<Application>) => {
    if (isDemoModeActive()) return demoStore.updateApplication(id, updates);
    return request<Application>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteApplication: (id: string) => {
    if (isDemoModeActive()) return demoStore.deleteApplication(id);
    return request<{ success: boolean }>(`/applications/${id}`, {
      method: 'DELETE',
    });
  },

  // Documents
  uploadFile: (file: File) => {
    if (isDemoModeActive()) return demoStore.uploadFile(file);
    const formData = new FormData();
    formData.append('file', file);
    return request<{ fileUrl: string; fileName: string; fileSize: number; mimeType: string }>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  getDocuments: (params?: { documentType?: string; status?: string; customerId?: string; applicationId?: string; search?: string; expiryRange?: string }) => {
    if (isDemoModeActive()) return demoStore.getDocuments(params);
    const q = new URLSearchParams(params as any).toString();
    return request<DocumentRecord[]>(`/documents${q ? `?${q}` : ''}`);
  },

  getExpiringDocuments: () => {
    if (isDemoModeActive()) return demoStore.getExpiringDocuments();
    return request<{
      next7Days: DocumentRecord[];
      next15Days: DocumentRecord[];
      next30Days: DocumentRecord[];
      next60Days: DocumentRecord[];
      expired: DocumentRecord[];
    }>('/documents/expiring');
  },

  uploadDocument: (doc: Partial<DocumentRecord>) => {
    if (isDemoModeActive()) return demoStore.uploadDocument(doc);
    return request<DocumentRecord>('/documents', {
      method: 'POST',
      body: JSON.stringify(doc),
    });
  },

  deleteDocument: (id: string) => {
    if (isDemoModeActive()) return demoStore.deleteDocument(id);
    return request<{ success: boolean }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  },

  // Services
  getServices: (params?: { category?: string; activeOnly?: boolean; search?: string }) => {
    if (isDemoModeActive()) return demoStore.getServices(params);
    const q = new URLSearchParams(params as any).toString();
    return request<ServiceItem[]>(`/services${q ? `?${q}` : ''}`);
  },

  createService: (srv: Partial<ServiceItem>) => {
    if (isDemoModeActive()) return demoStore.createService(srv);
    return request<ServiceItem>('/services', {
      method: 'POST',
      body: JSON.stringify(srv),
    });
  },

  updateService: (id: string, updates: Partial<ServiceItem>) => {
    if (isDemoModeActive()) return demoStore.updateService(id, updates);
    return request<ServiceItem>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  toggleService: (id: string) => {
    if (isDemoModeActive()) return demoStore.toggleService(id);
    return request<ServiceItem>(`/services/${id}/toggle`, {
      method: 'PUT',
    });
  },

  deleteService: (id: string) => {
    if (isDemoModeActive()) return demoStore.deleteService(id);
    return request<{ success: boolean; message?: string }>(`/services/${id}`, {
      method: 'DELETE',
    });
  },

  // Payments
  getPayments: (params?: { status?: string; paymentMethod?: string; customerId?: string; applicationId?: string; search?: string }) => {
    if (isDemoModeActive()) return demoStore.getPayments(params);
    const q = new URLSearchParams(params as any).toString();
    return request<PaymentRecord[]>(`/payments${q ? `?${q}` : ''}`);
  },

  getPaymentsSummary: () => {
    if (isDemoModeActive()) return demoStore.getPaymentsSummary();
    return request<{
      totalRevenue: number;
      totalOutstanding: number;
      todayRevenue: number;
      totalTransactions: number;
    }>('/payments/summary');
  },

  recordPayment: (payment: Partial<PaymentRecord>) => {
    if (isDemoModeActive()) return demoStore.recordPayment(payment);
    return request<PaymentRecord>('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  },

  deletePayment: (id: string) => {
    if (isDemoModeActive()) return demoStore.deletePayment(id);
    return request<{ success: boolean }>(`/payments/${id}`, {
      method: 'DELETE',
    });
  },

  // Invoices
  getInvoices: (params?: { status?: string; customerId?: string; applicationId?: string; search?: string }) => {
    if (isDemoModeActive()) return demoStore.getInvoices(params);
    const q = new URLSearchParams(params as any).toString();
    return request<Invoice[]>(`/invoices${q ? `?${q}` : ''}`);
  },

  getInvoice: (id: string) => {
    if (isDemoModeActive()) return demoStore.getInvoice(id);
    return request<{
      invoice: Invoice;
      customer: Customer;
      company: CompanySettings;
      payments: PaymentRecord[];
    }>(`/invoices/${id}`);
  },

  createInvoice: (invoiceData: any) => {
    if (isDemoModeActive()) return demoStore.createInvoice(invoiceData);
    return request<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  },

  updateInvoice: (id: string, updates: Partial<Invoice>) => {
    if (isDemoModeActive()) return demoStore.updateInvoice(id, updates);
    return request<Invoice>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteInvoice: (id: string) => {
    if (isDemoModeActive()) return demoStore.deleteInvoice(id);
    return request<{ success: boolean }>(`/invoices/${id}`, {
      method: 'DELETE',
    });
  },

  // Employees
  getEmployees: () => {
    if (isDemoModeActive()) return demoStore.getEmployees();
    return request<User[]>('/employees');
  },

  getEmployee: (id: string) => {
    if (isDemoModeActive()) return demoStore.getEmployee(id);
    return request<{
      employee: User;
      assignedApplications: Application[];
      assignedTasks: TaskRecord[];
      activityLogs: ActivityLog[];
      metrics: {
        totalApplications: number;
        activeApplications: number;
        completedApplications: number;
        pendingTasks: number;
      };
    }>(`/employees/${id}`);
  },

  addEmployee: (employee: Partial<User> & { password?: string }) => {
    if (isDemoModeActive()) return demoStore.addEmployee(employee);
    return request<User>('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  },

  updateEmployee: (id: string, updates: Partial<User> & { password?: string }) => {
    if (isDemoModeActive()) return demoStore.updateEmployee(id, updates);
    return request<User>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  resetEmployeePassword: (id: string, newPassword: string) => {
    if (isDemoModeActive()) return demoStore.resetEmployeePassword(id);
    return request<{ success: boolean; message: string }>(`/employees/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },

  deleteEmployee: (id: string) => {
    if (isDemoModeActive()) return demoStore.deleteEmployee(id);
    return request<{ success: boolean; message: string }>(`/employees/${id}`, {
      method: 'DELETE',
    });
  },

  // Tasks
  getTasks: (params?: { status?: string; priority?: string; employeeId?: string; myTasksOnly?: boolean }) => {
    if (isDemoModeActive()) return demoStore.getTasks(params);
    const q = new URLSearchParams(params as any).toString();
    return request<{
      all: TaskRecord[];
      summary: {
        total: number;
        overdueCount: number;
        dueTodayCount: number;
        upcomingCount: number;
        completedCount: number;
      };
      sections: {
        overdue: TaskRecord[];
        dueToday: TaskRecord[];
        upcoming: TaskRecord[];
        completed: TaskRecord[];
      };
    }>(`/tasks${q ? `?${q}` : ''}`);
  },

  createTask: (task: Partial<TaskRecord>) => {
    if (isDemoModeActive()) return demoStore.createTask(task);
    return request<TaskRecord>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  updateTask: (id: string, updates: Partial<TaskRecord>) => {
    if (isDemoModeActive()) return demoStore.updateTask(id, updates);
    return request<TaskRecord>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteTask: (id: string) => {
    if (isDemoModeActive()) return demoStore.deleteTask(id);
    return request<{ success: boolean }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  // Notifications
  getNotifications: () => {
    if (isDemoModeActive()) return demoStore.getNotifications();
    return request<{
      notifications: NotificationRecord[];
      unreadCount: number;
    }>('/notifications');
  },

  markNotificationRead: (id: string) => {
    if (isDemoModeActive()) return demoStore.markNotificationRead(id);
    return request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllNotificationsRead: () => {
    if (isDemoModeActive()) return demoStore.markAllNotificationsRead();
    return request<{ success: boolean }>('/notifications/mark-all-read', {
      method: 'POST',
    });
  },

  clearReadNotifications: () => {
    if (isDemoModeActive()) return demoStore.clearReadNotifications();
    return request<{ success: boolean; message: string }>('/notifications/clear-read', {
      method: 'DELETE',
    });
  },

  // Reports
  getReports: (range?: string) => {
    if (isDemoModeActive()) return demoStore.getReports();
    return request<{
      kpi: {
        totalCustomers: number;
        activeApplications: number;
        completedApplications: number;
        totalRevenue: number;
        totalOutstanding: number;
        totalBilled: number;
        totalDocuments: number;
      };
      appsByService: { name: string; count: number }[];
      appsByStatus: { status: string; count: number }[];
      monthlyPerformance: { month: string; revenue: number; applications: number }[];
      employeeWorkload: { name: string; activeApps: number; completedApps: number }[];
      expiryBreakdown: { valid: number; expiringSoon: number; expired: number };
    }>(`/reports${range ? `?range=${range}` : ''}`);
  },

  // Settings
  getSettings: () => {
    if (isDemoModeActive()) return demoStore.getSettings();
    return request<CompanySettings>('/settings');
  },

  updateSettings: (settings: Partial<CompanySettings>) => {
    if (isDemoModeActive()) return demoStore.updateSettings(settings);
    return request<CompanySettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Activity Logs
  getActivityLogs: () => {
    if (isDemoModeActive()) return demoStore.getActivityLogs();
    return request<ActivityLog[]>('/activity-logs');
  },

  // Global Search
  searchGlobal: (query: string) => {
    if (isDemoModeActive()) return demoStore.searchGlobal(query);
    return request<{
      customers: Customer[];
      applications: Application[];
      documents: DocumentRecord[];
      invoices: Invoice[];
      payments: PaymentRecord[];
      totalMatches: number;
    }>(`/search?q=${encodeURIComponent(query)}`);
  },

  // Public Track
  trackApplication: (trackingNumber: string) => {
    if (isDemoModeActive()) return demoStore.trackApplication(trackingNumber);
    return request<{
      trackingNumber: string;
      serviceName: string;
      applicant: string;
      status: string;
      applicationDate: string;
      updatedAt: string;
      targetCompletionDate?: string;
      completedDate?: string;
      timeline: {
        key: string;
        label: string;
        description: string;
        state: 'completed' | 'current' | 'upcoming';
      }[];
      company: {
        name: string;
        contactPhone: string;
        supportEmail: string;
      };
    }>(`/track/${encodeURIComponent(trackingNumber)}`);
  },
};

export { isDemoModeActive };

