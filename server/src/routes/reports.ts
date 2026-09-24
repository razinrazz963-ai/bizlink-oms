import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/reports
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { range } = req.query; // 'today' | '7days' | '30days' | 'month' | 'last_month' | 'all'

  const applications = db.getApplications();
  const customers = db.getCustomers();
  const payments = db.getPayments();
  const documents = db.getDocuments();
  const services = db.getServices();
  const users = db.getUsers();

  // 1. Applications by Service
  const appsByService: Record<string, number> = {};
  applications.forEach(a => {
    appsByService[a.serviceName] = (appsByService[a.serviceName] || 0) + 1;
  });
  const appsByServiceData = Object.entries(appsByService).map(([name, count]) => ({
    name,
    count
  }));

  // 2. Applications by Status
  const statusCounts: Record<string, number> = {
    'NEW': 0,
    'DOCUMENTS PENDING': 0,
    'DOCUMENTS RECEIVED': 0,
    'SUBMITTED': 0,
    'UNDER PROCESSING': 0,
    'COMPLETED': 0,
    'CANCELLED': 0
  };
  applications.forEach(a => {
    if (statusCounts[a.status] !== undefined) {
      statusCounts[a.status]++;
    }
  });
  const appsByStatusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count
  }));

  // 3. Financial Metrics
  const totalRevenue = payments.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  const totalOutstanding = payments.reduce((acc, p) => acc + (p.balance || 0), 0);
  const totalBilled = totalRevenue + totalOutstanding;

  // Monthly Revenue / Volume
  const monthlyData: Record<string, { month: string; revenue: number; applications: number }> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const curYear = new Date().getFullYear();

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    monthlyData[key] = { month: key, revenue: 0, applications: 0 };
  }

  payments.forEach(p => {
    if (p.paymentDate) {
      const d = new Date(p.paymentDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyData[key]) {
        monthlyData[key].revenue += p.paidAmount;
      }
    }
  });

  applications.forEach(a => {
    if (a.applicationDate) {
      const d = new Date(a.applicationDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyData[key]) {
        monthlyData[key].applications++;
      }
    }
  });

  // 4. Employee Workload
  const employeeWorkload = users
    .filter(u => u.role !== 'accountant')
    .map(u => ({
      name: u.name,
      activeApps: applications.filter(a => a.assignedEmployeeId === u.id && a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length,
      completedApps: applications.filter(a => a.assignedEmployeeId === u.id && a.status === 'COMPLETED').length
    }));

  // 5. Expiry breakdown
  const now = new Date();
  const expiryBreakdown = {
    valid: documents.filter(d => d.status === 'valid').length,
    expiringSoon: documents.filter(d => d.status === 'expiring_soon').length,
    expired: documents.filter(d => d.status === 'expired').length
  };

  res.json({
    kpi: {
      totalCustomers: customers.length,
      activeApplications: applications.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length,
      completedApplications: applications.filter(a => a.status === 'COMPLETED').length,
      totalRevenue,
      totalOutstanding,
      totalBilled,
      totalDocuments: documents.length
    },
    appsByService: appsByServiceData,
    appsByStatus: appsByStatusData,
    monthlyPerformance: Object.values(monthlyData),
    employeeWorkload,
    expiryBreakdown
  });
});

export default router;
