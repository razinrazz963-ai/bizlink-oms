import { Router, Response } from 'express';
import path from 'path';
import multer from 'multer';
import { db } from '../database/store.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { DocumentRecord, DocumentType } from '../database/schema.js';

const router = Router();

// Multer storage configuration
const uploadsDir = path.resolve(process.cwd(), 'server/uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    cb(null, `${safeBase}-${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed.'));
    }
  }
});

// Format byte size
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// POST /api/documents/upload
router.post('/upload', authenticateToken, upload.single('file'), (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file was uploaded' });
    return;
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    fileUrl,
    fileName: req.file.originalname,
    fileSize: formatBytes(req.file.size),
    fileType: req.file.mimetype
  });
});

// GET /api/documents
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  let documents = db.getDocuments();
  const { documentType, status, customerId, applicationId, search, expiryRange } = req.query;

  if (documentType && typeof documentType === 'string' && documentType !== 'all') {
    documents = documents.filter(d => d.documentType === documentType);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    documents = documents.filter(d => d.status === status);
  }

  if (customerId && typeof customerId === 'string') {
    documents = documents.filter(d => d.customerId === customerId);
  }

  if (applicationId && typeof applicationId === 'string') {
    documents = documents.filter(d => d.applicationId === applicationId);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    documents = documents.filter(d =>
      d.documentName.toLowerCase().includes(q) ||
      d.customerName.toLowerCase().includes(q) ||
      d.documentType.toLowerCase().includes(q) ||
      (d.applicationTrackingNumber && d.applicationTrackingNumber.toLowerCase().includes(q))
    );
  }

  if (expiryRange && typeof expiryRange === 'string') {
    const days = parseInt(expiryRange, 10);
    if (!isNaN(days)) {
      const now = new Date();
      const target = new Date();
      target.setDate(target.getDate() + days);

      documents = documents.filter(d => {
        if (!d.expiryDate) return false;
        const exp = new Date(d.expiryDate);
        return exp >= now && exp <= target;
      });
    }
  }

  res.json(documents);
});

// GET /api/documents/expiring
router.get('/expiring', authenticateToken, (req: AuthRequest, res: Response) => {
  const documents = db.getDocuments().filter(d => !!d.expiryDate);
  const now = new Date();

  const getExpiringInDays = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    return documents.filter(d => {
      const exp = new Date(d.expiryDate!);
      return exp >= now && exp <= target;
    });
  };

  const calculateDaysRemaining = (expDate: string) => {
    const exp = new Date(expDate);
    const diff = exp.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const formatList = (docs: DocumentRecord[]) => {
    return docs.map(d => ({
      ...d,
      daysRemaining: calculateDaysRemaining(d.expiryDate!)
    })).sort((a, b) => a.daysRemaining - b.daysRemaining);
  };

  res.json({
    next7Days: formatList(getExpiringInDays(7)),
    next15Days: formatList(getExpiringInDays(15)),
    next30Days: formatList(getExpiringInDays(30)),
    next60Days: formatList(getExpiringInDays(60)),
    expired: formatList(documents.filter(d => new Date(d.expiryDate!) < now))
  });
});

// POST /api/documents
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const {
    documentName,
    documentType,
    customerId,
    applicationId,
    expiryDate,
    issueDate,
    notes,
    fileUrl,
    fileName,
    fileSize,
    fileType
  } = req.body;

  if (!documentName || !documentType || !customerId) {
    res.status(400).json({ error: 'Document name, document type, and Customer are required' });
    return;
  }

  const customer = db.getCustomers().find(c => c.id === customerId);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  let appTrackingNumber = '';
  if (applicationId) {
    const app = db.getApplications().find(a => a.id === applicationId);
    if (app) appTrackingNumber = app.trackingNumber;
  }

  let docStatus: DocumentRecord['status'] = 'valid';
  if (expiryDate) {
    const exp = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) {
      docStatus = 'expired';
    } else if (diffDays <= 30) {
      docStatus = 'expiring_soon';
    }
  }

  const newDoc: DocumentRecord = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    documentName: documentName.trim(),
    documentType: documentType as DocumentType,
    customerId: customer.id,
    customerName: customer.name,
    applicationId: applicationId || '',
    applicationTrackingNumber: appTrackingNumber,
    fileName: fileName || 'document',
    fileUrl: fileUrl || '',
    fileSize: fileSize || '',
    fileType: fileType || '',
    issueDate: issueDate || '',
    expiryDate: expiryDate || '',
    status: docStatus,
    uploadedBy: req.user!.id,
    uploadedByName: req.user!.name,
    uploadedAt: new Date().toISOString(),
    notes: notes || ''
  };

  db.addDocument(newDoc);

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'UPLOAD_DOCUMENT',
    'document',
    `Uploaded document ${newDoc.documentName} for ${newDoc.customerName}`,
    newDoc.id
  );

  res.status(201).json(newDoc);
});

// DELETE /api/documents/:id
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const docId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const doc = db.getDocuments().find(d => d.id === docId);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  db.deleteDocument(docId);
  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'DELETE_DOCUMENT',
    'document',
    `Deleted document ${doc.documentName} for ${doc.customerName}`,
    doc.id
  );

  res.json({ success: true, message: 'Document deleted successfully' });
});

export default router;
