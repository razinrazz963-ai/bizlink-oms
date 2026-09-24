import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';
import { ServiceItem } from '../database/schema.js';

const router = Router();

// GET /api/services
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  let services = db.getServices();
  const { category, activeOnly, search } = req.query;

  if (category && typeof category === 'string' && category !== 'all') {
    services = services.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }

  if (activeOnly === 'true') {
    services = services.filter(s => s.isActive);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    services = services.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }

  res.json(services);
});

// POST /api/services (Admin & Manager)
router.post('/', authenticateToken, requireRole(['admin', 'manager']), (req: AuthRequest, res: Response) => {
  const {
    name,
    code,
    category,
    description,
    basePrice,
    governmentFee,
    serviceFee,
    vatApplicable,
    requiredDocuments,
    estimatedDays
  } = req.body;

  if (!name || !category) {
    res.status(400).json({ error: 'Service name and category are required' });
    return;
  }

  const bp = Number(basePrice) || 0;
  const gf = Number(governmentFee) || 0;
  const sf = Number(serviceFee) || 0;
  const total = bp + gf + sf;

  const newService: ServiceItem = {
    id: `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    code: (code || `SRV-${Date.now().toString().slice(-4)}`).trim().toUpperCase(),
    category: category.trim(),
    description: (description || '').trim(),
    basePrice: bp,
    governmentFee: gf,
    serviceFee: sf,
    totalFee: total,
    vatApplicable: vatApplicable !== undefined ? Boolean(vatApplicable) : true,
    isActive: true,
    requiredDocuments: Array.isArray(requiredDocuments) ? requiredDocuments : [],
    estimatedDays: Number(estimatedDays) || 3,
    createdAt: new Date().toISOString()
  };

  db.addService(newService);

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'CREATE_SERVICE',
    'service',
    `Added service '${newService.name}' (${newService.code})`,
    newService.id
  );

  res.status(201).json(newService);
});

// PUT /api/services/:id
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), (req: AuthRequest, res: Response) => {
  const srvId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const service = db.getServices().find(s => s.id === srvId);
  if (!service) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }

  const updates = { ...req.body };
  const bp = updates.basePrice !== undefined ? Number(updates.basePrice) : service.basePrice;
  const gf = updates.governmentFee !== undefined ? Number(updates.governmentFee) : service.governmentFee;
  const sf = updates.serviceFee !== undefined ? Number(updates.serviceFee) : service.serviceFee;
  updates.totalFee = bp + gf + sf;

  const updated = db.updateService(service.id, updates);

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'UPDATE_SERVICE',
    'service',
    `Updated service '${service.name}' configuration`,
    service.id
  );

  res.json(updated);
});

// PUT /api/services/:id/toggle
router.put('/:id/toggle', authenticateToken, requireRole(['admin', 'manager']), (req: AuthRequest, res: Response) => {
  const srvId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const service = db.getServices().find(s => s.id === srvId);
  if (!service) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }

  const updated = db.updateService(service.id, { isActive: !service.isActive });

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'TOGGLE_SERVICE',
    'service',
    `Service '${service.name}' set to ${updated!.isActive ? 'Active' : 'Inactive'}`,
    service.id
  );

  res.json(updated);
});

// DELETE /api/services/:id
router.delete('/:id', authenticateToken, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const srvId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const service = db.getServices().find(s => s.id === srvId);
  if (!service) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }

  const hasApps = db.getApplications().some(a => a.serviceId === service.id);
  if (hasApps) {
    service.isActive = false;
    db.save();
    res.json({ success: true, message: 'Service has historical applications; deactivated instead of deleted.' });
    return;
  }

  db.deleteService(service.id);
  res.json({ success: true, message: 'Service deleted successfully' });
});

export default router;
