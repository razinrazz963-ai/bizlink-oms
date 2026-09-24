import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/activity-logs
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const logs = db.getActivityLogs();
  res.json(logs);
});

export default router;
