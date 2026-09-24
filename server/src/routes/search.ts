import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/search?q=...
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const q = ((req.query.q as string) || '').toLowerCase().trim();

  if (!q) {
    res.json({
      customers: [],
      applications: [],
      documents: [],
      invoices: [],
      payments: []
    });
    return;
  }

  const customers = db.getCustomers().filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.phone.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q) ||
    c.passportNumber.toLowerCase().includes(q) ||
    c.emiratesId.toLowerCase().includes(q) ||
    c.customerCode.toLowerCase().includes(q)
  ).slice(0, 5);

  const applications = db.getApplications().filter(a =>
    a.trackingNumber.toLowerCase().includes(q) ||
    a.customerName.toLowerCase().includes(q) ||
    a.serviceName.toLowerCase().includes(q) ||
    (a.governmentReferenceNo && a.governmentReferenceNo.toLowerCase().includes(q))
  ).slice(0, 5);

  const documents = db.getDocuments().filter(d =>
    d.documentName.toLowerCase().includes(q) ||
    d.customerName.toLowerCase().includes(q) ||
    d.documentType.toLowerCase().includes(q)
  ).slice(0, 5);

  const invoices = db.getInvoices().filter(i =>
    i.invoiceNumber.toLowerCase().includes(q) ||
    i.customerName.toLowerCase().includes(q)
  ).slice(0, 5);

  const payments = db.getPayments().filter(p =>
    p.receiptNumber.toLowerCase().includes(q) ||
    p.customerName.toLowerCase().includes(q)
  ).slice(0, 5);

  res.json({
    customers,
    applications,
    documents,
    invoices,
    payments,
    totalMatches: customers.length + applications.length + documents.length + invoices.length + payments.length
  });
});

export default router;
