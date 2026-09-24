import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api/client.js';
import {
  User as UserIcon,
  Shield,
  Phone,
  Mail,
  Lock,
  CheckCircle,
  Save,
  Briefcase,
  Building,
  Key,
  Calendar,
  FileSpreadsheet,
  CheckSquare,
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  Clock
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import { User, Application, TaskRecord, ActivityLog } from '../types/index.js';

export const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser, refreshUser, hasRole } = useAuth();

  // Target user being viewed (either current user or specific employee)
  const isViewingSelf = !id || id === authUser?.id;
  const isAdmin = hasRole(['admin']);

  const [targetUser, setTargetUser] = useState<User | null>(isViewingSelf ? authUser : null);
  const [assignedApps, setAssignedApps] = useState<Application[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<TaskRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit personal profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Change Password state (Self)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Admin Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Admin Edit Employee Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDesignation, setEditDesignation] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'manager' | 'employee' | 'accountant' | 'custom'>('employee');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [savingAdminEdit, setSavingAdminEdit] = useState(false);

  const [activeTab, setActiveTab] = useState<'details' | 'applications' | 'tasks' | 'security'>('details');

  useEffect(() => {
    loadUserData();
  }, [id, authUser?.id]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      if (isViewingSelf) {
        // Load self
        const me = await api.getCurrentUser();
        setTargetUser(me);
        setName(me.name || '');
        setPhone(me.phone || '');

        // Load tasks and apps assigned to me
        const [tasksRes, appsRes] = await Promise.all([
          api.getTasks({ employeeId: me.id }),
          api.getApplications({}),
        ]);
        const myApps = appsRes.filter((a) => a.assignedEmployeeId === me.id);
        setAssignedApps(myApps);
        setAssignedTasks(tasksRes.all || []);
      } else if (id) {
        // Load employee by ID
        const data = await api.getEmployee(id);
        setTargetUser(data.employee);
        setName(data.employee.name || '');
        setPhone(data.employee.phone || '');
        setAssignedApps(data.assignedApplications || []);
        setAssignedTasks(data.assignedTasks || []);
        setActivityLogs(data.activityLogs || []);
        setMetrics(data.metrics || null);
        setEditDesignation(data.employee.designation || '');
        setEditDepartment(data.employee.department || '');
        setEditRole(data.employee.role);
        setEditStatus(data.employee.status || 'active');
      }
    } catch (err: any) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Profile Update (Self)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    setProfileError('');

    try {
      await api.updateProfile({
        name,
        phone,
      });
      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Change Password (Self)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    setPasswordSuccess(false);
    setPasswordError('');

    try {
      await api.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle Admin Reset Password
  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    if (adminNewPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    setResettingPassword(true);
    try {
      await api.resetEmployeePassword(targetUser.id, adminNewPassword);
      setIsResetModalOpen(false);
      setAdminNewPassword('');
      alert(`Password has been reset successfully for ${targetUser.name}`);
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  // Handle Admin Edit Employee Details
  const handleAdminSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setSavingAdminEdit(true);
    try {
      const updated = await api.updateEmployee(targetUser.id, {
        designation: editDesignation,
        department: editDepartment,
        role: editRole,
        status: editStatus,
      });
      setTargetUser(updated);
      setIsEditModalOpen(false);
      alert('Employee credentials updated successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to update employee');
    } finally {
      setSavingAdminEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading verified credentials and operational profile...
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-[#0B2541]">Employee Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested staff profile does not exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/employees')}
          className="mt-4 px-4 py-2 bg-[#0B2541] text-white text-xs font-semibold rounded-xl"
        >
          Return to Employee Directory
        </button>
      </div>
    );
  }

  const initials = targetUser.name
    ? targetUser.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const userPermissions = targetUser.permissions || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back to employees if viewing another employee */}
      {!isViewingSelf && (
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0B2541]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Employee Directory</span>
        </button>
      )}

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#0B2541] text-[#31B8C1] font-bold text-2xl flex items-center justify-center shadow-md">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0B2541]">{targetUser.name}</h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    targetUser.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {targetUser.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#31B8C1] mt-0.5">
                {targetUser.designation || 'Staff Member'}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <strong className="capitalize font-semibold text-slate-700">{targetUser.role}</strong> Access
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{targetUser.department || 'Operations'}</span>
                </span>
                <span>•</span>
                <span className="font-mono text-slate-400">
                  {targetUser.employeeId || 'ID: ' + targetUser.id}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && !isViewingSelf && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Edit Role & Designation
              </button>
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#0B2541] hover:bg-[#102F52] text-white shadow-xs transition-colors"
              >
                <Key className="w-3.5 h-3.5 text-[#31B8C1]" />
                <span>Reset Password</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 mt-4 pt-2 border-b border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-[#31B8C1] text-[#0B2541] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Personal & Account Info
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'applications'
                ? 'border-[#31B8C1] text-[#0B2541] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>Assigned Applications</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
              {assignedApps.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'border-[#31B8C1] text-[#0B2541] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>Operational Tasks</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
              {assignedTasks.length}
            </span>
          </button>
          {isViewingSelf && (
            <button
              onClick={() => setActiveTab('security')}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'border-[#31B8C1] text-[#0B2541] font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab: Details */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information & Account Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
              <h2 className="text-sm font-bold text-[#0B2541] uppercase tracking-wider mb-4 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#31B8C1]" />
                <span>Personal Information</span>
              </h2>

              {profileSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {profileError && (
                <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs">
                  {profileError}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isViewingSelf && !isAdmin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1] disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Employee ID (Read Only)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={targetUser.employeeId || 'BL-EMP-0001'}
                      className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Corporate Email (Read Only)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={targetUser.email}
                      className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Direct Phone Number
                    </label>
                    <input
                      type="text"
                      disabled={!isViewingSelf && !isAdmin}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1] disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      disabled
                      value={targetUser.designation || 'Staff'}
                      className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      disabled
                      value={targetUser.department || 'Operations'}
                      className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {(isViewingSelf || isAdmin) && (
                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#31B8C1] hover:bg-[#279CA4] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingProfile ? 'Updating...' : 'Save Personal Details'}</span>
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Account Information Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
              <h2 className="text-sm font-bold text-[#0B2541] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#31B8C1]" />
                <span>Account Information</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">System Role</span>
                  <span className="font-bold text-[#0B2541] capitalize mt-0.5 block">{targetUser.role}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Account Status</span>
                  <span className={`font-bold mt-0.5 block capitalize ${targetUser.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {targetUser.status || 'Active'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Account Created</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {targetUser.createdAt ? new Date(targetUser.createdAt).toLocaleDateString() : 'Initial'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Last Login</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {targetUser.lastLogin ? new Date(targetUser.lastLogin).toLocaleDateString() : 'Current Session'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Permissions Matrix */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-[#0B2541] uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#31B8C1]" />
                  <span>Authorized Permissions</span>
                </h2>
                <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {userPermissions.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Access privileges granted by System Administrator according to role profile.
              </p>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {userPermissions.map((perm) => (
                  <div
                    key={perm}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="font-medium">{perm.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Applications */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[#0B2541]">Assigned Applications</h2>
            <p className="text-xs text-slate-500">Government files assigned to {targetUser.name}</p>
          </div>

          {assignedApps.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No applications currently assigned to this team member.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Tracking Number</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignedApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-[#0B2541]">
                        {app.trackingNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {app.customerName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{app.serviceName}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3 px-4 capitalize font-medium">{app.priority}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate(`/applications/${app.id}`)}
                          className="text-[#31B8C1] hover:underline font-semibold"
                        >
                          View File →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Tasks */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[#0B2541]">Operational Tasks</h2>
            <p className="text-xs text-slate-500">Scheduled action items and deadlines</p>
          </div>

          {assignedTasks.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No tasks currently assigned to this team member.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignedTasks.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-800 text-xs block">{t.title}</span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="capitalize">{t.status}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      t.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800'
                        : t.priority === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Security / Change Password (Self) */}
      {activeTab === 'security' && isViewingSelf && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#0B2541] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#31B8C1]" />
              <span>Change Account Password</span>
            </h2>
            <p className="text-xs text-slate-500">
              Update your secret login credentials. New password must be at least 6 characters.
            </p>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Password changed successfully! Keep your new credentials secure.</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

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
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B2541] hover:bg-[#102F52] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                <Key className="w-4 h-4 text-[#31B8C1]" />
                <span>{changingPassword ? 'Updating Password...' : 'Save New Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={`Reset Password for ${targetUser.name}`}
        subtitle="Administrator credential override"
        maxWidth="md"
      >
        <form onSubmit={handleAdminResetPassword} className="space-y-4">
          <p className="text-xs text-slate-600">
            Enter a temporary or new password for this staff member. They will use this password to sign in to their portal account.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={adminNewPassword}
              onChange={(e) => setAdminNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resettingPassword}
              className="px-4 py-2 text-xs font-semibold bg-[#0B2541] hover:bg-[#102F52] text-white rounded-xl shadow-xs disabled:opacity-50"
            >
              {resettingPassword ? 'Resetting...' : 'Confirm Reset Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Edit Employee Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Role & Designation — ${targetUser.name}`}
        subtitle="Manage company position and system privileges"
        maxWidth="md"
      >
        <form onSubmit={handleAdminSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Designation *
            </label>
            <input
              type="text"
              required
              value={editDesignation}
              onChange={(e) => setEditDesignation(e.target.value)}
              placeholder="e.g. Manager & Accountant"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Department
            </label>
            <input
              type="text"
              value={editDepartment}
              onChange={(e) => setEditDepartment(e.target.value)}
              placeholder="e.g. Operations"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              System Access Role *
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            >
              <option value="admin">System Administrator</option>
              <option value="manager">Operations Manager</option>
              <option value="employee">Employee</option>
              <option value="accountant">Accountant</option>
              <option value="custom">Custom Role</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Account Status
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#31B8C1]"
            >
              <option value="active">Active (Permitted)</option>
              <option value="inactive">Inactive (Deactivated)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingAdminEdit}
              className="px-4 py-2 text-xs font-semibold bg-[#31B8C1] hover:bg-[#279CA4] text-white rounded-xl shadow-xs disabled:opacity-50"
            >
              {savingAdminEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
