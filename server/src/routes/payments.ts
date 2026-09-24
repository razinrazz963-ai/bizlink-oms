import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { PaymentRecord, PaymentMethod, PaymentStatus } from '../database/schema.js';

const router = Router();

// GET /api/payments
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  let payments = db.getPayments();
  const { status, paymentMethod, customerId, applicationId, search } = req.query;

  if (status && typeof status === 'string' && status !== 'all') {
    payments = payments.filter(p => p.status === status);
  }

  if (paymentMethod && typeof paymentMethod === 'string' && paymentMethod !== 'all') {
    payments = payments.filter(p => p.paymentMethod === paymentMethod);
  }

  if (customerId && typeof customerId === 'string') {
    payments = payments.filter(p => p.customerId === customerId);
  }

  if (applicationId && typeof applicationId === 'string') {
    payments = payments.filter(p => p.applicationId === applicationId);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    payments = payments.filter(p =>
      p.receiptNumber.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.serviceName.toLowerCase().includes(q) ||
      (p.referenceNo && p.referenceNo.toLowerCase().includes(q))
    );
  }

  res.json(payments);
});

// GET /api/payments/summary
router.get('/summary', authenticateToken, (req: AuthRequest, res: Response) => {
  const payments = db.getPayments();
  const totalRevenue = payments.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  const totalOutstanding = payments.reduce((acc, p) => acc + (p.balance || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRevenue = payments
    .filter(p => p.paymentDate === todayStr)
    .reduce((acc, p) => acc + (p.paidAmount || 0), 0);

  res.json({
    totalRevenue,
    totalOutstanding,
    todayRevenue,
    totalTransactions: payments.length
  });
});

// POST /api/payments
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { customerId, applicationId, invoiceId, serviceName, paymentMethod, referenceNo, notes, paymentDate } = req.body;
  const rawTotal = req.body.totalAmount !== undefined ? req.body.totalAmount : req.body.amount;
  const rawPaid = req.body.paidAmount !== undefined ? req.body.paidAmount : req.body.amount;
  const totalAmount = rawTotal !== undefined ? parseFloat(rawTotal) : undefined;
  const paidAmount = rawPaid !== undefined ? parseFloat(rawPaid) : undefined;

  if (!customerId || totalAmount === undefined || isNaN(totalAmount) || paidAmount === undefined || isNaN(paidAmount)) {
    res.status(400).json({ error: 'Customer, Total Amount, and Paid Amount are required' });
    return;
  }

  const customer = db.getCustomers().find(c => c.id === customerId);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  let appTracking = '';
  let finalServiceName = serviceName || 'General Service Processing';
  if (applicationId) {
    const app = db.getApplications().find(a => a.id === applicationId);
    if (app) {
      appTracking = app.trackingNumber;
      if (!serviceName) finalServiceName = app.serviceName;
    }
  }

  let invNumber = '';
  if (invoiceId) {
    const inv = db.getInvoices().find(i => i.id === invoiceId);
    if (inv) invNumber = inv.invoiceNumber;
  }

  const tot = Number(totalAmount) || 0;
  const pd = Number(paidAmount) || 0;
  const balance = Math.max(0, tot - pd);

  let status: PaymentStatus = 'Paid';
  if (pd === 0) {
    status = 'Pending';
  } else if (balance > 0) {
    status = 'Partially Paid';
  }

  const receiptNumber = db.generateReceiptNumber();

  const newPayment: PaymentRecord = {
    id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    receiptNumber,
    customerId: customer.id,
    customerName: customer.name,
    applicationId: applicationId || '',
    applicationTrackingNumber: appTracking,
    invoiceId: invoiceId || '',
    invoiceNumber: invNumber,
    serviceName: finalServiceName,
    totalAmount: tot,
    paidAmount: pd,
    balance,
    paymentMethod: (paymentMethod || 'Bank Transfer') as PaymentMethod,
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    status,
    referenceNo: referenceNo || '',
    recordedBy: req.user!.id,
    recordedByName: req.user!.name,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  db.addPayment(newPayment);

  // If connected to an invoice, update invoice paidAmount and balance
  if (invoiceId) {
    const invoice = db.getInvoices().find(i => i.id === invoiceId);
    if (invoice) {
      const newPaid = invoice.paidAmount + pd;
      const newBal = Math.max(0, invoice.totalAmount - newPaid);
      let invStatus: any = 'Paid';
      if (newPaid === 0) invStatus = 'Unpaid';
      else if (newBal > 0) invStatus = 'Partially Paid';

      db.updateInvoice(invoice.id, {
        paidAmount: newPaid,
        balance: newBal,
        status: invStatus
      });
    }
  }

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'RECORD_PAYMENT',
    'payment',
    `Recorded payment of AED ${pd.toLocaleString()} for ${customer.name} (${newPayment.receiptNumber})`,
    newPayment.id
  );

  res.status(201).json(newPayment);
});

// DELETE /api/payments/:id
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const payId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payment = db.getPayments().find(p => p.id === payId);
  if (!payment) {
    res.status(404).json({ error: 'Payment record not found' });
    return;
  }

  const prevLen = db.getPayments().length;
  const filtered = db.getPayments().filter(p => p.id !== payId);
  (db as any).data.payments = filtered;
  db.save();

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'DELETE_PAYMENT',
    'payment',
    `Removed payment record ${payment.receiptNumber} (AED ${payment.paidAmount})`,
    payment.id
  );

  res.json({ success: true, message: 'Payment record removed' });
});

export default router;
