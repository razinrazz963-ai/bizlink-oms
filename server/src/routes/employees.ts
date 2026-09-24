import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database/store.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';
import { User, UserRole, ROLE_DEFAULT_PERMISSIONS } from '../database/schema.js';

const router = Router();

// GET /api/employees
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const users = db.getUsers().map(u => ({
    id: u.id,
    employeeId: u.employeeId,
    name: u.name,
    email: u.email,
    phone: u.phone,
    designation: u.designation,
    department: u.department,
    role: u.role,
    customRoleName: u.customRoleName,
    permissions: u.permissions || [],
    avatar: u.avatar,
    status: u.status,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin
  }));

  const allApps = db.getApplications();
  const allTasks = db.getTasks();

  const enriched = users.map(u => ({
    ...u,
    activeApplicationsCount: allApps.filter(a => a.assignedEmployeeId === u.id && a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length,
    activeTasksCount: allTasks.filter(t => t.assignedEmployeeId === u.id && t.status !== 'Completed').length
  }));

  res.json(enriched);
});

// GET /api/employees/:id
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const empId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = db.getUsers().find(u => u.id === empId);
  if (!user) {
    res.status(404).json({ error: 'Team member record not found' });
    return;
  }

  // Non-admins can only view their own profile unless they have employees.view permission
  if (req.user?.role !== 'admin' && req.user?.id !== empId) {
    const caller = db.getUsers().find(u => u.id === req.user?.id);
    if (!caller?.permissions?.includes('employees.view')) {
      res.status(403).json({ error: 'You are not authorized to view this employee profile.' });
      return;
    }
  }

  const allApps = db.getApplications();
  const allTasks = db.getTasks();
  const allLogs = db.getActivityLogs();

  const assignedApps = allApps.filter(a => a.assignedEmployeeId === user.id);
  const assignedTasks = allTasks.filter(t => t.assignedEmployeeId === user.id);
  const recentLogs = allLogs.filter(l => l.userId === user.id).slice(0, 15);

  res.json({
    employee: {
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
    },
    assignedApplications: assignedApps,
    assignedTasks: assignedTasks,
    activityLogs: recentLogs,
    metrics: {
      totalApplications: assignedApps.length,
      activeApplications: assignedApps.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length,
      completedApplications: assignedApps.filter(a => a.status === 'COMPLETED').length,
      pendingTasks: assignedTasks.filter(t => t.status !== 'Completed').length
    }
  });
});

// POST /api/employees (Admin & Managers with employees.create)
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const caller = db.getUsers().find(u => u.id === req.user?.id);
  if (req.user?.role !== 'admin' && !caller?.permissions?.includes('employees.create')) {
    res.status(403).json({ error: 'Unauthorized to add team members' });
    return;
  }

  const {
    name,
    email,
    password,
    role,
    customRoleName,
    designation,
    department,
    phone,
    employeeId,
    permissions,
    avatar,
    status
  } = req.body;

  if (!name || !email || !password || !role || !designation) {
    res.status(400).json({ error: 'Full name, corporate email, designation, role, and password are required' });
    return;
  }

  const existing = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ error: 'An employee with this corporate email already exists in the system' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const empId = employeeId && employeeId.trim() ? employeeId.trim() : db.generateEmployeeId();

  // Determine permissions
  let finalPermissions: string[] = [];
  if (Array.isArray(permissions) && permissions.length > 0) {
    finalPermissions = permissions;
  } else if (ROLE_DEFAULT_PERMISSIONS[role as UserRole]) {
    finalPermissions = ROLE_DEFAULT_PERMISSIONS[role as UserRole];
  }

  const newUser: User = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    employeeId: empId,
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    phone: phone || '',
    designation,
    department: department || 'Operations',
    role: role as UserRole,
    customRoleName: customRoleName || '',
    permissions: finalPermissions,
    avatar: avatar || '',
    status: status || 'active',
    createdAt: new Date().toISOString()
  };

  db.addEmployee(newUser);

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'CREATE_EMPLOYEE',
    'employee',
    `Added new team member ${newUser.name} (${newUser.designation} • ${newUser.role})`,
    newUser.id
  );

  res.status(201).json({
    id: newUser.id,
    employeeId: newUser.employeeId,
    name: newUser.name,
    email: newUser.email,
    phone: newUser.phone,
    designation: newUser.designation,
    department: newUser.department,
    role: newUser.role,
    customRoleName: newUser.customRoleName,
    permissions: newUser.permissions,
    avatar: newUser.avatar,
    status: newUser.status,
    createdAt: newUser.createdAt
  });
});

// PUT /api/employees/:id (Admin & Managers with employees.edit)
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const empId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const caller = db.getUsers().find(u => u.id === req.user?.id);
  if (req.user?.role !== 'admin' && !caller?.permissions?.includes('employees.edit')) {
    res.status(403).json({ error: 'Unauthorized to edit team member' });
    return;
  }

  const user = db.getUsers().find(u => u.id === empId);
  if (!user) {
    res.status(404).json({ error: 'Employee not found' });
    return;
  }

  const {
    name,
    phone,
    designation,
    department,
    role,
    customRoleName,
    permissions,
    status,
    avatar,
    password
  } = req.body;

  const updates: Partial<User> = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (designation) updates.designation = designation;
  if (department !== undefined) updates.department = department;
  if (role) updates.role = role as UserRole;
  if (customRoleName !== undefined) updates.customRoleName = customRoleName;
  if (Array.isArray(permissions)) updates.permissions = permissions;
  if (status) updates.status = status;
  if (avatar !== undefined) updates.avatar = avatar;

  if (password && password.trim().length >= 6) {
    const salt = bcrypt.genSaltSync(10);
    updates.passwordHash = bcrypt.hashSync(password.trim(), salt);
  }

  const updated = db.updateEmployee(user.id, updates);

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'UPDATE_EMPLOYEE',
    'employee',
    `Updated details for ${user.name}`,
    user.id
  );

  res.json({
    id: updated!.id,
    employeeId: updated!.employeeId,
    name: updated!.name,
    email: updated!.email,
    phone: updated!.phone,
    designation: updated!.designation,
    department: updated!.department,
    role: updated!.role,
    customRoleName: updated!.customRoleName,
    permissions: updated!.permissions,
    avatar: updated!.avatar,
    status: updated!.status
  });
});

// POST /api/employees/:id/reset-password (Admin only)
router.post('/:id/reset-password', authenticateToken, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const empId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters' });
    return;
  }

  const user = db.getUsers().find(u => u.id === empId);
  if (!user) {
    res.status(404).json({ error: 'Employee not found' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);
  db.save();

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'RESET_PASSWORD',
    'employee',
    `Administrator reset password for team member ${user.name}`,
    user.id
  );

  res.json({ success: true, message: `Password reset successfully for ${user.name}` });
});

// DELETE /api/employees/:id
router.delete('/:id', authenticateToken, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const empId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = db.getUsers().find(u => u.id === empId);
  if (!user) {
    res.status(404).json({ error: 'Employee not found' });
    return;
  }

  if (user.id === req.user?.id) {
    res.status(400).json({ error: 'You cannot delete your own active administrator account' });
    return;
  }

  // Check historical records
  const hasApps = db.getApplications().some(a => a.assignedEmployeeId === user.id);
  const hasTasks = db.getTasks().some(t => t.assignedEmployeeId === user.id);

  if (hasApps || hasTasks) {
    // Preserve history by setting inactive
    user.status = 'inactive';
    db.save();
    db.logActivity(
      req.user!.id,
      req.user!.name,
      req.user!.role,
      'DEACTIVATE_EMPLOYEE',
      'employee',
      `Deactivated account for ${user.name} to preserve historical assignment integrity`,
      user.id
    );
    res.json({ success: true, message: 'Employee has historical assignments; account has been set to Inactive to preserve audit integrity.' });
    return;
  }

  db.deleteEmployee(user.id);
  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'DELETE_EMPLOYEE',
    'employee',
    `Permanently removed employee record for ${user.name}`,
    user.id
  );

  res.json({ success: true, message: 'Employee record removed successfully' });
});

export default router;
