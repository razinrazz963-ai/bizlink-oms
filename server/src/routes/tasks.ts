import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { TaskRecord, PriorityLevel } from '../database/schema.js';

const router = Router();

// GET /api/tasks
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  let tasks = db.getTasks();
  const { status, priority, employeeId, myTasksOnly } = req.query;

  if (myTasksOnly === 'true' && req.user) {
    tasks = tasks.filter(t => t.assignedEmployeeId === req.user?.id);
  } else if (employeeId && typeof employeeId === 'string' && employeeId !== 'all') {
    tasks = tasks.filter(t => t.assignedEmployeeId === employeeId);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    tasks = tasks.filter(t => t.status === status);
  }

  if (priority && typeof priority === 'string' && priority !== 'all') {
    tasks = tasks.filter(t => t.priority === priority);
  }

  // Split into categories: overdue, today, upcoming
  const todayStr = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter(t => t.status !== 'Completed' && t.dueDate < todayStr);
  const dueToday = tasks.filter(t => t.status !== 'Completed' && t.dueDate === todayStr);
  const upcoming = tasks.filter(t => t.status !== 'Completed' && t.dueDate > todayStr);
  const completed = tasks.filter(t => t.status === 'Completed');

  res.json({
    all: tasks,
    summary: {
      total: tasks.length,
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      upcomingCount: upcoming.length,
      completedCount: completed.length
    },
    sections: {
      overdue,
      dueToday,
      upcoming,
      completed
    }
  });
});

// POST /api/tasks
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { title, description, customerId, applicationId, assignedEmployeeId, priority, dueDate } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Task title is required' });
    return;
  }

  let customerName = '';
  if (customerId) {
    const cust = db.getCustomers().find(c => c.id === customerId);
    if (cust) customerName = cust.name;
  }

  let appTracking = '';
  if (applicationId) {
    const app = db.getApplications().find(a => a.id === applicationId);
    if (app) appTracking = app.trackingNumber;
  }

  let empId = assignedEmployeeId || req.user!.id;
  let empName = req.user!.name;
  const emp = db.getUsers().find(u => u.id === empId);
  if (emp) empName = emp.name;

  const today = new Date();
  const nextThreeDays = new Date();
  nextThreeDays.setDate(today.getDate() + 3);

  const newTask: TaskRecord = {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title,
    description: description || '',
    customerId: customerId || undefined,
    customerName: customerName || undefined,
    applicationId: applicationId || undefined,
    applicationTrackingNumber: appTracking || undefined,
    assignedEmployeeId: empId,
    assignedEmployeeName: empName,
    priority: (priority as PriorityLevel) || 'medium',
    dueDate: dueDate || nextThreeDays.toISOString().split('T')[0],
    status: 'To Do',
    createdBy: req.user!.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addTask(newTask);

  if (empId !== req.user!.id) {
    db.addNotification({
      id: `notif-${Date.now()}`,
      title: 'New Task Assigned',
      message: `You were assigned: "${newTask.title}" by ${req.user!.name}`,
      type: 'task',
      link: '/tasks',
      isRead: false,
      targetUserId: empId,
      createdAt: new Date().toISOString()
    });
  }

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'CREATE_TASK',
    'task',
    `Created task "${newTask.title}" assigned to ${empName}`,
    newTask.id
  );

  res.status(201).json(newTask);
});

// PUT /api/tasks/:id
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const task = db.getTasks().find(t => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const { status, title, description, priority, dueDate, assignedEmployeeId } = req.body;
  const updates: Partial<TaskRecord> = {};

  if (status) updates.status = status;
  if (title) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (priority) updates.priority = priority;
  if (dueDate) updates.dueDate = dueDate;
  if (assignedEmployeeId) {
    const emp = db.getUsers().find(u => u.id === assignedEmployeeId);
    if (emp) {
      updates.assignedEmployeeId = emp.id;
      updates.assignedEmployeeName = emp.name;
    }
  }

  const updated = db.updateTask(task.id, updates);

  db.logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'UPDATE_TASK',
    'task',
    `Updated task "${task.title}" (Status: ${updated!.status})`,
    task.id
  );

  res.json(updated);
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const task = db.getTasks().find(t => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  db.deleteTask(task.id);
  res.json({ success: true, message: 'Task deleted successfully' });
});

export default router;
