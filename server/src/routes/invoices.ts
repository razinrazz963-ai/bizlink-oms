import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { Invoice, InvoiceItem } from '../database/schema.js';

const router = Router();

// GET /api/invoices
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  let invoices = db.getInvoices();
  const { status, customerId, applicationId, search } = req.query;

  if (status && typeof status === 'string' && status !== 'all') {
    invoices = invoices.filter(i => i.status === status);
  }

  if (customerId && typeof customerId === 'string') {
    invoices = invoices.filter(i => i.customerId === customerId);
  }

  if (applicationId && typeof applicationId === 'string') {
    invoices = invoices.filter(i => i.applicationId === applicationId);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    invoices = invoices.filter(i =>
      i.invoiceNumber.toLowerCase().includes(q) ||
      i.customerName.toLowerCase().includes(q)
    );
  }

  res.json(invoices);
});

// GET /api/invoices/:id
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const invId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const invoice = db.getInvoices().find(i => i.id === invId);
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  const customer = db.getCustomers().find(c => c.id === invoice.customerId);
  const settings = db.getSettings();
  const payments = db.getPayments().filter(p => p.invoiceId === invoice.id);

  res.json({
    invoice,
    customer,
    company: settings,
    payments
  });
});

// POST /api/invoices
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { customerId, applicationId, items, dueDate, issueDate, notes, paymentTerms, initialPaidAmount } = req.body;

  if (!customerId || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Customer and at least one line item are required' });
    return;
  }

  const customer = db.getCustomers().find(c => c.id === customerId);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  let appTracking = '';
  if (applicationId) {
    const app = db.getApplications().find(a => a.id === applicationId);
    if (app) appTracking = app.trackingNumber;
  }

  const settings = db.getSettings();
  const vatRate = settings.vatEnabled ? (settings.vatRate || 5) : 0;

  let subtotal = 0;
  const processedItems: InvoiceItem[] = items.map((item: any, idx: number) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unitPrice) || 0;
    const tot = qty * price;
    subtotal += tot;
    return {
      id: `item-${idx + 1}`,
      serviceId: item.serviceId || '',
      description: item.description || 'Professional Document Service',
      quantity: qty,
      unitPrice: price,
      total: tot
    };
  });

  const vatAmount = Math.round((subtotal * (vatRate / 100)) * 100) / 100;
  const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;
  const paidAmount = Number(initialPaidAmount) || 0;
  const balance = Math.max(0, totalAmount - paidAmount);

  let status: Invoice['status'] = 'Issued';
  if (paidAmount >= totalAmount && totalAmount > 0) {
    status = 'Paid';
  } else if (paidAmount > 0) {
    status = 'Partially Paid';
  }

  const invoiceNumber = db.generateInvoiceNumber();

  const nowStr = new Date().toISOString().split('T')[0];
  const newInvoice: Invoice = {
    id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    invoiceNumber,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    customerAddress: customer.address,
    applicationId: applicationId || '',
    applicationTrackingNumber: appTracking,
    issueDate: issueDate || nowStr,
    dueDate: dueDate || nowStr,
    items: processedItems,
    subtotal,
    vatRate,
    vatAmount,
    totalAmount,
    paidAmount,
    balance,
    status,
    paymentTerms: paymentTerms || 'Payment due on receipt',
    notes: notes || settings.invoiceFooterNote || '',
    createdBy: req.user!.id,
    createdByName: req.user!.name,
    createdAt: new Date().toISOString()
  };

  db.addInvoice(newInvoice);

  // If initial payment was made, record payment
  if (paidAmount > 0) {
    const receiptNumber = db.generateReceiptNumber();
    db.addPayment({
      id: `pay-${Date.now()}`,
      receiptNumber,
      customerId: customer.id,
      customerName: customer.name,
      applicationId: applicationId || '',
      applicationTrackingNumber: appTracking,
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
      serviceName: processedItems[0]?.description || 'Invoice Payment',
      totalAmount,
      paidAmount,
      balance,
      paymentMethod: 'Bank Transfer',
      paymentDate: nowStr,
      status: balance === 0 ? 'Paid' : 'Partially Paid',
      recordedBy: req.user!.id,
      recordedByName: req.user!.name,
      notes: `Automatic payment on invoice creation (${newInvoice.invoiceNumber})`,
      createdAt: new Date().toISOString()
    });
  }

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'CREATE_INVOICE',
    'invoice',
    `Generated Tax Invoice ${newInvoice.invoiceNumber} for ${customer.name} (AED ${totalAmount.toLocaleString()})`,
    newInvoice.id
  );

  res.status(201).json(newInvoice);
});

// PUT /api/invoices/:id
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const invId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const invoice = db.getInvoices().find(i => i.id === invId);
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  const updated = db.updateInvoice(invoice.id, req.body);

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'UPDATE_INVOICE',
    'invoice',
    `Updated invoice ${invoice.invoiceNumber}`,
    invoice.id
  );

  res.json(updated);
});

// DELETE /api/invoices/:id
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const invId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const invoice = db.getInvoices().find(i => i.id === invId);
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  const prevLen = db.getInvoices().length;
  (db as any).data.invoices = db.getInvoices().filter(i => i.id !== invId);
  db.save();

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'DELETE_INVOICE',
    'invoice',
    `Deleted tax invoice ${invoice.invoiceNumber}`,
    invoice.id
  );

  res.json({ success: true, message: 'Invoice deleted successfully' });
});

export default router;
