import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Clock,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Modal } from '../components/common/Modal.js';
import { api } from '../api/client.js';
import { TaskRecord, PriorityLevel, User as EmployeeUser, Customer, Application } from '../types/index.js';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Add Task Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerId: '',
    applicationId: '',
    assignedEmployeeId: '',
    priority: 'medium' as PriorityLevel,
    dueDate: '',
  });

  useEffect(() => {
    loadTasks();
    loadDependencies();
  }, [statusFilter, priorityFilter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.getTasks({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      });
      setTasks(res.all);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [emps, custs, apps] = await Promise.all([
        api.getEmployees(),
        api.getCustomers(),
        api.getApplications(),
      ]);
      setEmployees(emps);
      setCustomers(custs);
      setApplications(apps);
    } catch (err) {
      console.error('Failed to load task dependencies:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    try {
      await api.createTask({
        ...formData,
        customerId: formData.customerId || undefined,
        applicationId: formData.applicationId || undefined,
        assignedEmployeeId: formData.assignedEmployeeId || undefined,
      });

      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        customerId: '',
        applicationId: '',
        assignedEmployeeId: '',
        priority: 'medium',
        dueDate: '',
      });
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: TaskRecord['status']) => {
    try {
      await api.updateTask(id, { status: newStatus });
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const todoTasks = tasks.filter((t) => t.status === 'To Do');
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress');
  const completedTasks = tasks.filter((t) => t.status === 'Completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B2541]">Task Operations & Follow-ups</h1>
          <p className="text-xs text-slate-500">
            Internal government submissions, biometrics scheduling, and document checks
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Kanban Board Columns: To Do | In Progress | Completed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column: To Do */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">To Do</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {todoTasks.length}
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {todoTasks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No pending tasks</p>
            ) : (
              todoTasks.map((t) => (
                <div key={t.id} className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2 text-xs hover:border-[#31B8C1] transition-all">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-[#0B2541] leading-tight">{t.title}</h4>
                    <StatusBadge status={t.priority} type="priority" />
                  </div>
                  {t.description && <p className="text-slate-500">{t.description}</p>}
                  <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-100">
                    <div>Officer: <strong className="text-slate-700">{t.assignedEmployeeName}</strong></div>
                    <div>Due: {t.dueDate}</div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'In Progress')}
                      className="text-[11px] font-semibold text-[#31B8C1] hover:underline"
                    >
                      Start Task →
                    </button>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column: In Progress */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">In Progress</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
              {inProgressTasks.length}
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {inProgressTasks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No tasks currently in progress</p>
            ) : (
              inProgressTasks.map((t) => (
                <div key={t.id} className="p-3.5 bg-blue-50/30 border border-blue-200/60 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-[#0B2541] leading-tight">{t.title}</h4>
                    <StatusBadge status={t.priority} type="priority" />
                  </div>
                  {t.description && <p className="text-slate-600">{t.description}</p>}
                  <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-blue-100">
                    <div>Officer: <strong className="text-slate-800">{t.assignedEmployeeName}</strong></div>
                    <div>Target Date: {t.dueDate}</div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'Completed')}
                      className="text-[11px] font-semibold text-emerald-600 hover:underline"
                    >
                      Mark Completed ✓
                    </button>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column: Completed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Completed</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
              {completedTasks.length}
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {completedTasks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No completed tasks recorded</p>
            ) : (
              completedTasks.map((t) => (
                <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs opacity-80">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-slate-600 line-through">{t.title}</h4>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-[10px] text-slate-400">Completed by {t.assignedEmployeeName}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Internal Operational Task"
        subtitle="Assign action items, typing tasks, or biometric appointments"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Schedule ICP Biometrics appointment for applicant"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Assignee Employee
            </label>
            <select
              value={formData.assignedEmployeeId}
              onChange={(e) => setFormData({ ...formData, assignedEmployeeId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            >
              <option value="">Myself (Current User)</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Task Notes / Instructions
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide context or link references..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#31B8C1] hover:bg-[#279CA4] text-white rounded-xl shadow-xs"
            >
              Add Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
