import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/settings
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json(db.getSettings());
});

// PUT /api/settings (Admin only)
router.put('/', authenticateToken, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const updated = db.updateSettings(req.body);

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'UPDATE_SETTINGS',
    'settings',
    'Updated company settings and portal configuration'
  );

  res.json(updated);
});

// POST /api/settings/reset-database (Admin only)
router.post('/reset-database', authenticateToken, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  db.resetToCleanState();

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'RESET_DATABASE',
    'settings',
    'Database reset to clean state with 0 records'
  );

  res.json({ message: 'Database reset successfully to clean production state', counts: db.getCounts() });
});

export default router;
