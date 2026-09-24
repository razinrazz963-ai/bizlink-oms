import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { Customer, CustomerType } from '../database/schema.js';

const router = Router();

// GET /api/customers
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  let customers = db.getCustomers();
  const { search, nationality, status, customerType } = req.query;

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    customers = customers.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.passportNumber && c.passportNumber.toLowerCase().includes(q)) ||
      (c.emiratesId && c.emiratesId.toLowerCase().includes(q)) ||
      (c.customerCode && c.customerCode.toLowerCase().includes(q)) ||
      (c.companyName && c.companyName.toLowerCase().includes(q))
    );
  }

  if (nationality && typeof nationality === 'string' && nationality !== 'all') {
    customers = customers.filter(c => (c.nationality || '').toLowerCase() === nationality.toLowerCase());
  }

  if (status && typeof status === 'string' && status !== 'all') {
    customers = customers.filter(c => c.status === status);
  }

  if (customerType && typeof customerType === 'string' && customerType !== 'all') {
    customers = customers.filter(c => c.customerType?.toLowerCase() === customerType.toLowerCase());
  }

  const allApps = db.getApplications();
  const allPayments = db.getPayments();

  const enriched = customers.map(c => {
    const activeApps = allApps.filter(a => a.customerId === c.id && a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length;
    const custPayments = allPayments.filter(p => p.customerId === c.id);
    const totalBalance = custPayments.reduce((acc, p) => acc + (p.balance || 0), 0);

    return {
      ...c,
      activeApplicationsCount: activeApps,
      outstandingBalance: totalBalance
    };
  });

  res.json(enriched);
});

// GET /api/customers/:id
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const custId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const customer = db.getCustomers().find(c => c.id === custId);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  const applications = db.getApplications().filter(a => a.customerId === customer.id);
  const documents = db.getDocuments().filter(d => d.customerId === customer.id);
  const payments = db.getPayments().filter(p => p.customerId === customer.id);
  const invoices = db.getInvoices().filter(i => i.customerId === customer.id);
  const tasks = db.getTasks().filter(t => t.customerId === customer.id);
  const activityLogs = db.getActivityLogs().filter(l => l.entityType === 'customer' && l.entityId === customer.id);

  const totalPaid = payments.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  const totalOutstanding = payments.reduce((acc, p) => acc + (p.balance || 0), 0);
  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);

  res.json({
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
});

// POST /api/customers
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const {
    name,
    email,
    phone,
    nationality,
    dateOfBirth,
    gender,
    passportNumber,
    passportExpiryDate,
    emiratesId,
    emiratesIdExpiryDate,
    visaNumber,
    visaExpiryDate,
    customerType,
    companyName,
    address,
    notes
  } = req.body;

  if (!name || !phone) {
    res.status(400).json({ error: 'Customer full name and mobile number are required' });
    return;
  }

  const customerCode = db.generateCustomerCode();

  const newCustomer: Customer = {
    id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    customerCode,
    name: name.trim(),
    email: (email || '').trim(),
    phone: phone.trim(),
    nationality: nationality || '',
    dateOfBirth: dateOfBirth || '',
    gender: gender || 'Other',
    passportNumber: (passportNumber || '').trim().toUpperCase(),
    passportExpiryDate: passportExpiryDate || '',
    emiratesId: (emiratesId || '').trim(),
    emiratesIdExpiryDate: emiratesIdExpiryDate || '',
    visaNumber: (visaNumber || '').trim(),
    visaExpiryDate: visaExpiryDate || '',
    customerType: (customerType || 'Individual') as CustomerType,
    companyName: (companyName || '').trim(),
    address: (address || '').trim(),
    status: 'active',
    notes: (notes || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addCustomer(newCustomer);

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'CREATE_CUSTOMER',
    'customer',
    `Created customer ${newCustomer.name} (${newCustomer.customerCode})`,
    newCustomer.id
  );

  res.status(201).json(newCustomer);
});

// PUT /api/customers/:id
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const customer = db.getCustomers().find(c => c.id === customerId);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  const updated = db.updateCustomer(customerId, req.body);

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'UPDATE_CUSTOMER',
    'customer',
    `Updated customer details for ${updated!.name}`,
    updated!.id
  );

  res.json(updated);
});

// DELETE /api/customers/:id
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const customer = db.getCustomers().find(c => c.id === customerId);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  // Check if customer has linked applications, payments, or invoices
  const hasApps = db.getApplications().some(a => a.customerId === customer.id);
  const hasPayments = db.getPayments().some(p => p.customerId === customer.id);
  const hasInvoices = db.getInvoices().some(i => i.customerId === customer.id);

  if (hasApps || hasPayments || hasInvoices) {
    // Preserve accounting and legal records by archiving/deactivating
    customer.status = 'inactive';
    db.save();
    db.logActivity(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'DEACTIVATE_CUSTOMER',
      'customer',
      `Archived customer ${customer.name} (${customer.customerCode}) to preserve historical operational records`,
      customer.id
    );
    res.json({ success: true, message: 'Customer has historical files; record marked Inactive to preserve legal records.' });
    return;
  }

  db.deleteCustomer(customerId);
  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'DELETE_CUSTOMER',
    'customer',
    `Permanently deleted customer record for ${customer.name}`,
    customer.id
  );

  res.json({ success: true, message: 'Customer record deleted successfully' });
});

export default router;
