import { Router, Request, Response } from 'express';
import { db } from '../database/store.js';

const router = Router();

// GET /api/track/:trackingNumber
router.get('/:trackingNumber', (req: Request, res: Response) => {
  const rawParam = Array.isArray(req.params.trackingNumber) ? req.params.trackingNumber[0] : req.params.trackingNumber;
  const param = (rawParam || '').trim().toUpperCase();
  const applications = db.getApplications();

  const app = applications.find(a => 
    a.trackingNumber.toUpperCase() === param ||
    a.trackingNumber.toUpperCase().endsWith(param)
  );

  if (!app) {
    res.status(404).json({
      error: 'No application found with this tracking number. Please verify your reference number and try again.'
    });
    return;
  }

  // Sanitized status pipeline for customer
  const steps = [
    { key: 'NEW', label: 'Application Received', description: 'Application initiated and assigned for initial verification.' },
    { key: 'DOCUMENTS RECEIVED', label: 'Documents Verified', description: 'Required applicant documentation uploaded and verified.' },
    { key: 'SUBMITTED', label: 'Government Submission', description: 'Application officially lodged with the relevant UAE government department.' },
    { key: 'UNDER PROCESSING', label: 'Under Processing', description: 'Under official government review and biometric / clearance processing.' },
    { key: 'COMPLETED', label: 'Completed & Issued', description: 'Official documents cleared, issued, and ready for handover.' }
  ];

  const statusOrder: Record<string, number> = {
    'NEW': 1,
    'DOCUMENTS PENDING': 1,
    'DOCUMENTS RECEIVED': 2,
    'SUBMITTED': 3,
    'UNDER PROCESSING': 4,
    'COMPLETED': 5,
    'CANCELLED': -1
  };

  const currentLevel = statusOrder[app.status] || 1;

  const publicTimeline = steps.map((step, idx) => {
    const stepNum = idx + 1;
    let state: 'completed' | 'current' | 'upcoming' = 'upcoming';
    if (app.status === 'CANCELLED') {
      state = 'upcoming';
    } else if (currentLevel > stepNum) {
      state = 'completed';
    } else if (currentLevel === stepNum) {
      state = 'current';
    }

    return {
      ...step,
      state
    };
  });

  // Masked customer name (e.g. "Ah*** Al M***")
  const maskName = (name: string) => {
    return name.split(' ').map(w => w.length > 2 ? `${w[0]}***${w[w.length - 1]}` : w).join(' ');
  };

  res.json({
    trackingNumber: app.trackingNumber,
    serviceName: app.serviceName,
    applicant: maskName(app.customerName),
    status: app.status,
    applicationDate: app.applicationDate,
    updatedAt: app.updatedAt,
    targetCompletionDate: app.targetCompletionDate,
    completedDate: app.completedDate,
    timeline: publicTimeline,
    company: {
      name: 'BizLink Services',
      contactPhone: '+971 4 355 6789',
      supportEmail: 'operations@bizlink.ae'
    }
  });
});

export default router;
