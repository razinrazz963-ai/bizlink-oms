import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/store.js';
import { JWT_SECRET, authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.status !== 'active') {
    res.status(401).json({ error: 'Invalid email/password or account has been deactivated' });
    return;
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // Update last login
  user.lastLogin = new Date().toISOString();
  db.save();

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      department: user.department
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  db.logActivity(user.id, user.name, user.role, 'LOGIN', 'auth', `${user.name} logged into the portal`);

  res.json({
    token,
    user: {
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      designation: user.designation,
      department: user.department,
      role: user.role,
      customRoleName: user.customRoleName,
      permissions: user.permissions || [],
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = db.getUsers().find(u => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ error: 'User account not found' });
    return;
  }

  res.json({
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    designation: user.designation,
    department: user.department,
    role: user.role,
    customRoleName: user.customRoleName,
    permissions: user.permissions || [],
    avatar: user.avatar,
    status: user.status,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  });
});

// PUT /api/auth/change-password
router.put('/change-password', authenticateToken, (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required' });
    return;
  }

  if (confirmNewPassword && newPassword !== confirmNewPassword) {
    res.status(400).json({ error: 'New password and confirmation do not match' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long' });
    return;
  }

  const user = db.getUsers().find(u => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const matches = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!matches) {
    res.status(400).json({ error: 'Current password entered is incorrect' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);
  db.save();

  db.logActivity(
    user.id,
    user.name,
    user.role,
    'CHANGE_PASSWORD',
    'auth',
    `${user.name} changed their account password`
  );

  res.json({ success: true, message: 'Password updated successfully' });
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  const { name, phone, avatar } = req.body;
  const user = db.getUsers().find(u => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;
  db.save();

  db.logActivity(
    user.id,
    user.name,
    user.role,
    'UPDATE_PROFILE',
    'auth',
    `${user.name} updated their profile information`
  );

  res.json({
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    designation: user.designation,
    department: user.department,
    role: user.role,
    customRoleName: user.customRoleName,
    permissions: user.permissions || [],
    avatar: user.avatar,
    status: user.status
  });
});

export default router;
