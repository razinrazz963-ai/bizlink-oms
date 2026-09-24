import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { Application, ApplicationStatus, ApplicationStatusHistory, ApplicationAssignmentHistory } from '../database/schema.js';

const router = Router();

// GET /api/applications
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  let applications = db.getApplications();
  const { status, priority, serviceId, customerId, assignedEmployeeId, search } = req.query;

  if (status && typeof status === 'string' && status !== 'all') {
    applications = applications.filter(a => a.status === status);
  }

  if (priority && typeof priority === 'string' && priority !== 'all') {
    applications = applications.filter(a => a.priority === priority);
  }

  if (serviceId && typeof serviceId === 'string' && serviceId !== 'all') {
    applications = applications.filter(a => a.serviceId === serviceId);
  }

  if (customerId && typeof customerId === 'string') {
    applications = applications.filter(a => a.customerId === customerId);
  }

  if (assignedEmployeeId && typeof assignedEmployeeId === 'string' && assignedEmployeeId !== 'all') {
    applications = applications.filter(a => a.assignedEmployeeId === assignedEmployeeId);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    applications = applications.filter(a =>
      a.trackingNumber.toLowerCase().includes(q) ||
      a.customerName.toLowerCase().includes(q) ||
      a.serviceName.toLowerCase().includes(q) ||
      (a.assignedEmployeeName && a.assignedEmployeeName.toLowerCase().includes(q)) ||
      (a.governmentReferenceNo && a.governmentReferenceNo.toLowerCase().includes(q))
    );
  }

  const allPayments = db.getPayments();
  const enriched = applications.map(app => {
    const appPayments = allPayments.filter(p => p.applicationId === app.id);
    const totalPaid = appPayments.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
    const totalDue = appPayments.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    let paymentStatus = 'Unpaid';
    if (totalPaid > 0 && totalPaid >= totalDue && totalDue > 0) {
      paymentStatus = 'Paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'Partially Paid';
    }

    return {
      ...app,
      paymentStatus,
      totalPaid,
      totalDue
    };
  });

  res.json(enriched);
});

// GET /api/applications/:id
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const appId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const application = db.getApplications().find(a => a.id === appId);
  if (!application) {
    res.status(404).json({ error: 'Application file not found' });
    return;
  }

  const customer = db.getCustomers().find(c => c.id === application.customerId);
  const documents = db.getDocuments().filter(d => d.applicationId === application.id || (d.customerId === application.customerId && !d.applicationId));
  const payments = db.getPayments().filter(p => p.applicationId === application.id);
  const tasks = db.getTasks().filter(t => t.applicationId === application.id);
  const service = db.getServices().find(s => s.id === application.serviceId);

  res.json({
    application,
    customer,
    service,
    documents,
    payments,
    tasks
  });
});

// POST /api/applications
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const {
    customerId,
    serviceId,
    assignedEmployeeId,
    priority,
    notes,
    governmentReferenceNo,
    applicationDate,
    targetCompletionDate
  } = req.body;

  if (!customerId || !serviceId) {
    res.status(400).json({ error: 'Customer and Service selection are required' });
    return;
  }

  const customer = db.getCustomers().find(c => c.id === customerId);
  if (!customer) {
    res.status(404).json({ error: 'Selected customer not found' });
    return;
  }

  const service = db.getServices().find(s => s.id === serviceId);
  if (!service) {
    res.status(404).json({ error: 'Selected service not found' });
    return;
  }

  let employeeName = '';
  let empId = assignedEmployeeId || '';
  if (empId) {
    const emp = db.getUsers().find(u => u.id === empId);
    if (emp) employeeName = emp.name;
  }

  const trackingNumber = db.generateTrackingNumber();

  const initialHistory: ApplicationStatusHistory = {
    id: `hist-${Date.now()}`,
    oldStatus: undefined,
    status: 'NEW',
    note: notes || 'Application initiated in system.',
    changedBy: req.user!.id,
    changedByName: req.user!.name,
    timestamp: new Date().toISOString()
  };

  const assignmentHistory: ApplicationAssignmentHistory[] = empId ? [{
    id: `asgn-${Date.now()}`,
    assignedEmployeeId: empId,
    assignedEmployeeName: employeeName,
    assignedBy: req.user!.id,
    assignedByName: req.user!.name,
    timestamp: new Date().toISOString()
  }] : [];

  const newApp: Application = {
    id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    trackingNumber,
    customerId: customer.id,
    customerName: customer.name,
    serviceId: service.id,
    serviceName: service.name,
    assignedEmployeeId: empId || undefined,
    assignedEmployeeName: employeeName || undefined,
    status: 'NEW',
    priority: priority || 'medium',
    applicationDate: applicationDate || new Date().toISOString().split('T')[0],
    targetCompletionDate: targetCompletionDate || '',
    notes: notes || '',
    governmentReferenceNo: governmentReferenceNo || '',
    statusHistory: [initialHistory],
    assignmentHistory,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addApplication(newApp);

  // Notify assigned employee if assigned
  if (empId && empId !== req.user!.id) {
    db.addNotification({
      id: `notif-${Date.now()}`,
      title: 'Application Assigned',
      message: `Application ${newApp.trackingNumber} for ${customer.name} has been assigned to you.`,
      type: 'application',
      link: `/applications/${newApp.id}`,
      isRead: false,
      targetUserId: empId,
      createdAt: new Date().toISOString()
    });
  }

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'CREATE_APPLICATION',
    'application',
    `Created application ${newApp.trackingNumber} for ${customer.name} (${service.name})`,
    newApp.id
  );

  res.status(201).json(newApp);
});

// PUT /api/applications/:id/status
router.put('/:id/status', authenticateToken, (req: AuthRequest, res: Response) => {
  const appId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { status, note } = req.body;

  if (!status) {
    res.status(400).json({ error: 'Status is required' });
    return;
  }

  const app = db.getApplications().find(a => a.id === appId);
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const oldStatus = app.status;
  const historyItem: ApplicationStatusHistory = {
    id: `hist-${Date.now()}`,
    oldStatus,
    status: status as ApplicationStatus,
    note: note || `Status updated from ${oldStatus} to ${status}`,
    changedBy: req.user!.id,
    changedByName: req.user!.name,
    timestamp: new Date().toISOString()
  };

  const updates: Partial<Application> = {
    status: status as ApplicationStatus,
    statusHistory: [...app.statusHistory, historyItem],
    updatedAt: new Date().toISOString()
  };

  if (status === 'COMPLETED') {
    updates.completedDate = new Date().toISOString().split('T')[0];
  }

  const updated = db.updateApplication(app.id, updates);

  // Notify assigned staff
  if (app.assignedEmployeeId && app.assignedEmployeeId !== req.user!.id) {
    db.addNotification({
      id: `notif-${Date.now()}`,
      title: 'Status Updated',
      message: `${app.trackingNumber} status changed to ${status}`,
      type: 'application',
      link: `/applications/${app.id}`,
      isRead: false,
      targetUserId: app.assignedEmployeeId,
      createdAt: new Date().toISOString()
    });
  }

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'UPDATE_STATUS',
    'application',
    `Updated application ${app.trackingNumber} status: ${oldStatus} → ${status}`,
    app.id
  );

  res.json(updated);
});

// PUT /api/applications/:id/assign
router.put('/:id/assign', authenticateToken, (req: AuthRequest, res: Response) => {
  const appId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { assignedEmployeeId } = req.body;

  const app = db.getApplications().find(a => a.id === appId);
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  let empName = 'Unassigned';
  if (assignedEmployeeId) {
    const emp = db.getUsers().find(u => u.id === assignedEmployeeId);
    if (emp) empName = emp.name;
  }

  const asgnItem: ApplicationAssignmentHistory = {
    id: `asgn-${Date.now()}`,
    previousEmployeeId: app.assignedEmployeeId,
    previousEmployeeName: app.assignedEmployeeName,
    assignedEmployeeId,
    assignedEmployeeName: empName,
    assignedBy: req.user!.id,
    assignedByName: req.user!.name,
    timestamp: new Date().toISOString()
  };

  const updated = db.updateApplication(app.id, {
    assignedEmployeeId,
    assignedEmployeeName: empName,
    assignmentHistory: [...(app.assignmentHistory || []), asgnItem],
    updatedAt: new Date().toISOString()
  });

  if (assignedEmployeeId && assignedEmployeeId !== req.user!.id) {
    db.addNotification({
      id: `notif-${Date.now()}`,
      title: 'Application Reassigned',
      message: `Application ${app.trackingNumber} has been assigned to you by ${req.user!.name}`,
      type: 'application',
      link: `/applications/${app.id}`,
      isRead: false,
      targetUserId: assignedEmployeeId,
      createdAt: new Date().toISOString()
    });
  }

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'ASSIGN_APPLICATION',
    'application',
    `Assigned application ${app.trackingNumber} to ${empName}`,
    app.id
  );

  res.json(updated);
});

// PUT /api/applications/:id
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const appId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const app = db.getApplications().find(a => a.id === appId);
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const updated = db.updateApplication(app.id, req.body);

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'UPDATE_APPLICATION',
    'application',
    `Updated application ${app.trackingNumber}`,
    app.id
  );

  res.json(updated);
});

// DELETE /api/applications/:id
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const appId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const app = db.getApplications().find(a => a.id === appId);
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  db.deleteApplication(app.id);

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'DELETE_APPLICATION',
    'application',
    `Deleted application file ${app.trackingNumber}`,
    app.id
  );

  res.json({ success: true, message: 'Application deleted successfully' });
});

export default router;
