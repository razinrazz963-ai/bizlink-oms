import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../database/schema.js';
import { db } from '../database/store.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'bizlink_secure_secret_dubai_2026';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  department: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = decoded as AuthenticatedUser;
    next();
  });
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      error: `Access restricted. Your role '${req.user.role}' is not authorized for this resource.`
    });
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // System admin has universal access
    if (req.user.role === 'admin') {
      next();
      return;
    }

    const user = db.getUsers().find(u => u.id === req.user!.id);
    if (!user || user.status !== 'active') {
      res.status(403).json({ error: 'User account is inactive or not found' });
      return;
    }

    if (user.permissions && user.permissions.includes(permission)) {
      next();
      return;
    }

    res.status(403).json({
      error: `Forbidden: Missing required permission '${permission}'`
    });
  };
};
