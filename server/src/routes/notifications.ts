import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const notifs = db.getNotifications().filter(n => !n.targetUserId || n.targetUserId === req.user?.id);
  const unreadCount = notifs.filter(n => !n.isRead).length;

  res.json({
    notifications: notifs,
    unreadCount
  });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticateToken, (req: AuthRequest, res: Response) => {
  const notifId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  db.markNotificationRead(notifId);
  res.json({ success: true });
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', authenticateToken, (req: AuthRequest, res: Response) => {
  db.markAllNotificationsRead(req.user?.id);
  res.json({ success: true });
});

// DELETE /api/notifications/clear-read
router.delete('/clear-read', authenticateToken, (req: AuthRequest, res: Response) => {
  db.clearReadNotifications(req.user?.id);
  res.json({ success: true, message: 'Read notifications cleared' });
});

export default router;
