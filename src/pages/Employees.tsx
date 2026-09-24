import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Plus,
  Shield,
  Phone,
  Mail,
  Building,
  CheckCircle,
  XCircle,
  KeyRound,
  ShieldCheck,
  Lock,
  Edit2,
  Eye,
  UserX,
  UserCheck2,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../components/common/Modal.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { api } from '../api/client.js';
import { User, UserRole, ALL_PERMISSIONS } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

const DESIGNATION_PRESETS = [
  'Founder & CEO',
  'Manager',
  'Manager & Accountant',
  'Typist',
  'PRO',
  'Accountant',
  'Operations Executive',
  'Customer Service Executive',
  'Document Specialist',
  'Sales Executive',
  'Other'
];

export const Employees: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<User | null>(null);

  const { hasRole, user } = useAuth();
  const isAdmin = hasRole(['admin']);

  // Add Form
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    designation: 'Typist',
    customDesignation: '',
    department: 'Operations',
    role: 'employee' as UserRole,
    customRoleName: '',
    password: '',
    permissions: [] as string[],
    status: 'active' as 'active' | 'inactive'
  });

  // Edit Form
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    designation: '',
    customDesignation: '',
    department: '',
    role: 'employee' as UserRole,
    customRoleName: '',
    permissions: [] as string[],
    status: 'active' as 'active' | 'inactive'
  });

  // Reset Password Form
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDesignation = addFormData.designation === 'Other'
      ? addFormData.customDesignation.trim() || 'Staff'
      : addFormData.designation;

    try {
      await api.addEmployee({
        name: addFormData.name.trim(),
        email: addFormData.email.trim(),
        phone: addFormData.phone.trim(),
        employeeId: addFormData.employeeId.trim() || undefined,
        designation: finalDesignation,
        department: addFormData.department.trim(),
        role: addFormData.role,
        customRoleName: addFormData.role === 'custom' ? addFormData.customRoleName : undefined,
        password: addFormData.password,
        permissions: addFormData.permissions,
        status: addFormData.status
      });

      setIsAddModalOpen(false);
      setAddFormData({
        name: '',
        email: '',
        phone: '',
        employeeId: '',
        designation: 'Typist',
        customDesignation: '',
        department: 'Operations',
        role: 'employee',
        customRoleName: '',
        password: '',
        permissions: [],
        status: 'active'
      });
      loadEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to add team member');
    }
  };

  const handleOpenEdit = (emp: User) => {
    setSelectedEmp(emp);
    const isPreset = DESIGNATION_PRESETS.includes(emp.designation);
    setEditFormData({
      name: emp.name,
      phone: emp.phone || '',
      designation: isPreset ? emp.designation : 'Other',
      customDesignation: isPreset ? '' : emp.designation,
      department: emp.department || 'Operations',
      role: emp.role,
      customRoleName: emp.customRoleName || '',
      permissions: emp.permissions || [],
      status: emp.status
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    const finalDesignation = editFormData.designation === 'Other'
      ? editFormData.customDesignation.trim() || 'Staff'
      : editFormData.designation;

    try {
      await api.updateEmployee(selectedEmp.id, {
        name: editFormData.name.trim(),
        phone: editFormData.phone.trim(),
        designation: finalDesignation,
        department: editFormData.department.trim(),
        role: editFormData.role,
        customRoleName: editFormData.role === 'custom' ? editFormData.customRoleName : undefined,
        permissions: editFormData.permissions,
        status: editFormData.status
      });

      setIsEditModalOpen(false);
      setSelectedEmp(null);
      loadEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to update employee details');
    }
  };

  const handleOpenResetPassword = (emp: User) => {
    setSelectedEmp(emp);
    setNewPassword('');
    setResetError('');
    setIsResetPwdModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !newPassword) return;

    if (newPassword.length < 6) {
      setResetError('New password must be at least 6 characters');
      return;
    }

    try {
      await api.resetEmployeePassword(selectedEmp.id, newPassword);
      setIsResetPwdModalOpen(false);
      setSelectedEmp(null);
      alert(`Password has been reset successfully for ${selectedEmp.name}`);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    }
  };

  const handleToggleStatus = async (emp: User) => {
    const nextStatus = emp.status === 'active' ? 'inactive' : 'active';
    const confirmMsg = nextStatus === 'inactive'
      ? `Deactivate ${emp.name}? They will no longer be able to log in.`
      : `Reactivate ${emp.name}?`;

    if (window.confirm(confirmMsg)) {
      try {
        await api.updateEmployee(emp.id, { status: nextStatus });
        loadEmployees();
      } catch (err: any) {
        alert(err.message || 'Failed to change status');
      }
    }
  };

  const togglePermission = (perm: string, list: string[], setList: (l: string[]) => void) => {
    if (list.includes(perm)) {
      setList(list.filter(p => p !== perm));
    } else {
      setList([...list, perm]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B2541]">Employee & Staff Directory</h1>
          <p className="text-xs text-slate-500">
            Real company team members, operational roles, and system access permissions
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        )}
      </div>

      {/* Directory Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {employees.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={UserCheck}
              title="No team members added yet"
              description="Register your first BizLink employee or officer to grant authorized operations portal access."
              actionText="Add Team Member"
              onAction={() => setIsAddModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-center">Active Files</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0B2541] text-[#31B8C1] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[#0B2541]">{emp.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{emp.employeeId || 'BL-EMP-XXXX'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {emp.designation || 'Staff'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {emp.department || 'Operations'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        emp.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : emp.role === 'manager'
                          ? 'bg-blue-100 text-blue-800'
                          : emp.role === 'accountant'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {emp.role === 'custom' ? (emp.customRoleName || 'Custom') : emp.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{emp.email}</div>
                      {emp.phone && <div className="text-[10px] text-slate-400">{emp.phone}</div>}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {emp.activeApplicationsCount || 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        emp.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {emp.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          className="p-1.5 text-slate-500 hover:text-[#31B8C1] hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              className="p-1.5 text-slate-500 hover:text-[#0B2541] hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Employee"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenResetPassword(emp)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Reset Password"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(emp)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                emp.status === 'active'
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={emp.status === 'active' ? 'Deactivate Account' : 'Reactivate Account'}
                            >
                              {emp.status === 'active' ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Team Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Team Member"
        subtitle="Create an individual corporate account with designated permissions"
        maxWidth="2xl"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={addFormData.name}
                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                placeholder="e.g. Sabeel JP or Muhammed"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Employee ID (Leave blank to Auto-Generate)
              </label>
              <input
                type="text"
                value={addFormData.employeeId}
                onChange={(e) => setAddFormData({ ...addFormData, employeeId: e.target.value })}
                placeholder="e.g. BL-EMP-0002"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Corporate Email Address *
              </label>
              <input
                type="email"
                required
                value={addFormData.email}
                onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                placeholder="employee@bizlink.ae"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={addFormData.phone}
                onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                placeholder="+971 50 123 4567"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company Designation *
              </label>
              <select
                value={addFormData.designation}
                onChange={(e) => setAddFormData({ ...addFormData, designation: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              >
                {DESIGNATION_PRESETS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <input
                type="text"
                value={addFormData.department}
                onChange={(e) => setAddFormData({ ...addFormData, department: e.target.value })}
                placeholder="e.g. Operations / Finance"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          {addFormData.designation === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Enter Custom Designation *
              </label>
              <input
                type="text"
                required
                value={addFormData.customDesignation}
                onChange={(e) => setAddFormData({ ...addFormData, customDesignation: e.target.value })}
                placeholder="e.g. Senior Document Specialist"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                System Access Role *
              </label>
              <select
                value={addFormData.role}
                onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              >
                <option value="admin">System Administrator (Full Access)</option>
                <option value="manager">Operations Manager</option>
                <option value="employee">Employee / PRO / Typist</option>
                <option value="accountant">Accountant / Finance</option>
                <option value="custom">Custom Role (Select Permissions)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Initial Account Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={addFormData.password}
                onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>
          </div>

          {addFormData.role === 'custom' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Custom Role Name
                </label>
                <input
                  type="text"
                  value={addFormData.customRoleName}
                  onChange={(e) => setAddFormData({ ...addFormData, customRoleName: e.target.value })}
                  placeholder="e.g. Document Supervisor"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
                />
              </div>

              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select Granular Permissions:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                {ALL_PERMISSIONS.map((perm) => (
                  <label key={perm} className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addFormData.permissions.includes(perm)}
                      onChange={() => togglePermission(perm, addFormData.permissions, (p) => setAddFormData({ ...addFormData, permissions: p }))}
                      className="rounded border-slate-300 text-[#31B8C1] focus:ring-[#31B8C1]"
                    />
                    <span>{perm}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#31B8C1] hover:bg-[#279CA4] text-white rounded-xl shadow-xs transition-colors"
            >
              Save Team Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      {selectedEmp && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEmp(null);
          }}
          title={`Edit Details • ${selectedEmp.name}`}
          subtitle={`Account Email: ${selectedEmp.email}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleUpdateEmployee} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Direct Phone Number
                </label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Company Designation
                </label>
                <select
                  value={editFormData.designation}
                  onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
                >
                  {DESIGNATION_PRESETS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
                />
              </div>
            </div>

            {editFormData.designation === 'Other' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Custom Designation
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.customDesignation}
                  onChange={(e) => setEditFormData({ ...editFormData, customDesignation: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  System Access Role
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
                >
                  <option value="admin">System Administrator</option>
                  <option value="manager">Operations Manager</option>
                  <option value="employee">Employee / PRO / Typist</option>
                  <option value="accountant">Accountant / Finance</option>
                  <option value="custom">Custom Role</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Account Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
                >
                  <option value="active">Active (Can log in)</option>
                  <option value="inactive">Inactive (Access suspended)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedEmp(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-[#0B2541] text-white hover:bg-[#102F52] rounded-xl transition-colors"
              >
                Update Record
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {selectedEmp && (
        <Modal
          isOpen={isResetPwdModalOpen}
          onClose={() => {
            setIsResetPwdModalOpen(false);
            setSelectedEmp(null);
          }}
          title={`Reset Password • ${selectedEmp.name}`}
          subtitle={`Assign a new secure login password for ${selectedEmp.email}`}
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            {resetError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 6 characters..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

            <p className="text-[11px] text-slate-400">
              The existing password is encrypted and cannot be viewed. Setting a new password will immediately take effect for the user's next login.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsResetPwdModalOpen(false);
                  setSelectedEmp(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-[#31B8C1] hover:bg-[#279CA4] text-white rounded-xl shadow-xs transition-colors"
              >
                Set New Password
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
