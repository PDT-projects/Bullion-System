import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Trash2, Edit2, ChevronDown, ChevronUp, AlertCircle,
  Eye, EyeOff, UserPlus, Users, X, Check, Shield,
  Clock, CheckCircle, XCircle, UserCheck
} from 'lucide-react';
import {
  createUser,
  getAllUsers,
  deleteUser,
  approveUser,
  rejectUser,
  updateUserPermissions,
  updateUserBranch,
  type UserData,
  type Screen,
  ALL_SCREEN_GROUPS,
  VIEW_ONLY_SCREENS
} from '../models/userService';

import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';

const BRANCHES = ['Saudia', 'Dubai', 'Chad', 'Sudan'] as const;

interface FormState {
  email: string;
  password: string;
  branch: string;
}

interface EditingUser {
  uid: string;
  email: string;
  branch: string;
  permissions: Screen[];
}

interface ApprovingUser {
  uid: string;
  email: string;
  fullName?: string;
  branch: string;
  permissions: Screen[];
}

export function UserManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'create'>('active');
  const [formData, setFormData] = useState<FormState>({ email: '', password: '', branch: '' });
  const [permissions, setPermissions] = useState<Screen[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [approvingUser, setApprovingUser] = useState<ApprovingUser | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getCurrentUserEmail = () => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo).email : 'bullion@gmail.com';
    } catch { return 'bullion@gmail.com'; }
  };

  const clearPendingUserNotifications = async (userId: string) => {
    try {
      const q = query(
        collection(db, 'appNotifications'),
        where('type', '==', 'user_registration_pending'),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (err) {
      console.error('Failed to clear user registration notification:', err);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const allUsers = await getAllUsers();
      // Filter non-admin users
      const normalUsers = allUsers.filter(u => u.role === 'user');
      setUsers(normalUsers);

      // Auto-switch to pending tab if there are pending users
      const pendingCount = normalUsers.filter(u => u.status === 'pending').length;
      if (pendingCount > 0) {
        setActiveTab('pending');
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status === 'approved' || !u.status);
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  const togglePermission = (screen: Screen) => {
    setPermissions(prev =>
      prev.includes(screen) ? prev.filter(p => p !== screen) : [...prev, screen]
    );
  };

  const toggleEditPermission = (screen: Screen) => {
    if (!editingUser) return;
    setEditingUser(prev => prev ? {
      ...prev,
      permissions: prev.permissions.includes(screen)
        ? prev.permissions.filter(p => p !== screen)
        : [...prev.permissions, screen]
    } : null);
  };

  const toggleApprovePermission = (screen: Screen) => {
    if (!approvingUser) return;
    setApprovingUser(prev => prev ? {
      ...prev,
      permissions: prev.permissions.includes(screen)
        ? prev.permissions.filter(p => p !== screen)
        : [...prev.permissions, screen]
    } : null);
  };

  const toggleGroupPermissions = (screens: Screen[], currentPermissions: Screen[], setter: (fn: (prev: Screen[]) => Screen[]) => void) => {
    const allSelected = screens.every(s => currentPermissions.includes(s));
    if (allSelected) {
      setter(prev => prev.filter(p => !screens.includes(p)));
    } else {
      setter(prev => [...new Set([...prev, ...screens])]);
    }
  };

  const handleSelectViewOnly = () => {
    setPermissions([...VIEW_ONLY_SCREENS]);
    toast.info('View-only screens selected');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setGeneralError('Please enter a valid email address'); return;
    }
    if (!formData.password || formData.password.length < 6) {
      setGeneralError('Password must be at least 6 characters'); return;
    }
    if (!formData.branch) {
      setGeneralError('Please select a branch'); return;
    }
    if (permissions.length === 0) {
      setGeneralError('Please select at least one screen permission'); return;
    }

    setIsSubmitting(true);
    try {
      await createUser(formData.email, formData.password, formData.branch, permissions, getCurrentUserEmail());
      toast.success(`User "${formData.email}" created successfully!`);
      setFormData({ email: '', password: '', branch: '' });
      setPermissions([]);
      setActiveTab('active');
      await fetchUsers();
    } catch (error: any) {
      const msg = error.message || 'Failed to create user';
      setGeneralError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickApproveViewOnly = async (user: UserData) => {
    try {
      const branch = user.branch || 'Saudia';
      await approveUser(user.uid, branch, VIEW_ONLY_SCREENS, getCurrentUserEmail());
      await clearPendingUserNotifications(user.uid);
      toast.success(`User "${user.email}" approved with View-Only permissions!`);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve user');
    }
  };

  const handleOpenApproveModal = (user: UserData) => {
    setApprovingUser({
      uid: user.uid,
      email: user.email,
      fullName: user.fullName,
      branch: user.branch || 'Saudia',
      permissions: user.permissions && user.permissions.length > 0 ? [...user.permissions] : [...VIEW_ONLY_SCREENS],
    });
  };

  const handleSaveApproval = async () => {
    if (!approvingUser) return;
    if (approvingUser.permissions.length === 0) {
      toast.error('User must have at least one screen permission');
      return;
    }
    try {
      await approveUser(approvingUser.uid, approvingUser.branch, approvingUser.permissions, getCurrentUserEmail());
      await clearPendingUserNotifications(approvingUser.uid);
      toast.success(`User "${approvingUser.email}" approved successfully!`);
      setApprovingUser(null);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve user');
    }
  };

  const handleRejectUser = async (uid: string, email: string) => {
    try {
      await rejectUser(uid, getCurrentUserEmail());
      await clearPendingUserNotifications(uid);
      toast.success(`User "${email}" registration rejected`);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject user');
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    try {
      await deleteUser(uid);
      await clearPendingUserNotifications(uid);
      toast.success(`User "${email}" deleted`);
      setUsers(prev => prev.filter(u => u.uid !== uid));
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    if (editingUser.permissions.length === 0) {
      toast.error('User must have at least one screen permission'); return;
    }
    try {
      const email = getCurrentUserEmail();
      await updateUserPermissions(editingUser.uid, editingUser.permissions, email);
      const original = users.find(u => u.uid === editingUser.uid);
      if (original && original.branch !== editingUser.branch) {
        await updateUserBranch(editingUser.uid, editingUser.branch, email);
      }
      toast.success('User updated successfully');
      setEditingUser(null);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  const PermissionGrid = ({
    selectedPermissions,
    onToggle,
    onGroupToggle,
  }: {
    selectedPermissions: Screen[];
    onToggle: (s: Screen) => void;
    onGroupToggle: (screens: Screen[]) => void;
  }) => (
    <div className="space-y-4">
      {ALL_SCREEN_GROUPS.map((group, gi) => {
        const allSelected = group.screens.every(s => selectedPermissions.includes(s));
        const someSelected = group.screens.some(s => selectedPermissions.includes(s));
        return (
          <div key={gi} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Group Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={() => onGroupToggle(group.screens)}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
                <span className="font-semibold text-gray-800 text-sm">{group.title}</span>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                  {group.screens.filter(s => selectedPermissions.includes(s)).length}/{group.screens.length}
                </span>
              </div>
            </div>
            {/* Screens Grid */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {group.screens.map((screen) => (
                <label
                  key={screen}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all text-sm ${
                    selectedPermissions.includes(screen)
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-medium'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(screen)}
                    onChange={() => onToggle(screen)}
                    className="w-3.5 h-3.5 accent-amber-600 flex-shrink-0"
                  />
                  <span className="leading-tight">{screen}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield size={24} className="text-amber-600" />
              User Management & Approvals
            </h1>
            <p className="text-gray-500 text-sm mt-1">Approve registered users, manage branch access, and control read/write permissions</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-3 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Clock size={16} />
            Pending Approvals
            {pendingUsers.length > 0 && (
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-extrabold animate-pulse">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'active'
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Users size={16} />
            Active Users ({activeUsers.length})
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'create'
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <UserPlus size={16} />
            Add New User
          </button>
        </div>

        {/* ── TAB 1: PENDING APPROVALS ── */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                  <Clock size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Pending User Registrations</h2>
                  <p className="text-xs text-gray-600">Approve or reject users who signed up through the Registration portal</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-full">
                {pendingUsers.length} Waiting for Review
              </span>
            </div>

            <div className="p-6">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-amber-600 rounded-full animate-spin" />
                  Loading pending requests...
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={28} />
                  </div>
                  <p className="text-gray-800 font-bold">No Pending Approvals</p>
                  <p className="text-gray-400 text-sm mt-1">All registered users have been processed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div key={user.uid} className="border border-amber-200 bg-amber-50/40 rounded-xl p-5 hover:border-amber-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-extrabold text-lg flex-shrink-0">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 text-base">{user.fullName || 'User'}</p>
                            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-xs font-bold rounded-md">
                              Pending Approval
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 font-medium">{user.email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Registered: {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Recently'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleQuickApproveViewOnly(user)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                          title="Grant view-only access to all dashboards and reports"
                        >
                          <Check size={14} /> Quick Approve (View-Only)
                        </button>
                        <button
                          onClick={() => handleOpenApproveModal(user)}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <UserCheck size={14} /> Custom Approve & Branch
                        </button>
                        <button
                          onClick={() => handleRejectUser(user.uid, user.email)}
                          className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: ACTIVE USERS ── */}
        {activeTab === 'active' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                  <Users size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Active Branch Users</h2>
                  <p className="text-xs text-gray-500">{activeUsers.length} user{activeUsers.length !== 1 ? 's' : ''} with active access</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-slate-700 rounded-full animate-spin" />
                  Loading users...
                </div>
              ) : activeUsers.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users size={20} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No active users yet</p>
                  <p className="text-gray-400 text-sm">Approve pending users or add a new user manually</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeUsers.map((user) => (
                    <div key={user.uid} className="border border-gray-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors">
                      {/* User Row */}
                      <div
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedUser(expandedUser === user.uid ? null : user.uid)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-800 font-semibold text-sm flex-shrink-0">
                            {user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 text-sm">{user.email}</p>
                              {user.fullName && (
                                <span className="text-xs text-gray-500">({user.fullName})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md uppercase">
                                Branch: {user.branch || 'None'}
                              </span>
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-md">
                                {user.permissions.length} screen{user.permissions.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setExpandedUser(user.uid);
                              setEditingUser({
                                uid: user.uid,
                                email: user.email,
                                branch: user.branch || 'Saudia',
                                permissions: [...user.permissions],
                              });
                            }}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit user access"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteConfirm(user.uid); }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 size={15} />
                          </button>
                          {expandedUser === user.uid
                            ? <ChevronUp size={16} className="text-gray-400" />
                            : <ChevronDown size={16} className="text-gray-400" />}
                        </div>
                      </div>

                      {/* Delete Confirm */}
                      {deleteConfirm === user.uid && (
                        <div className="px-4 py-3 bg-red-50 border-t border-red-200 flex items-center justify-between gap-3">
                          <p className="text-sm text-red-700 font-medium">Delete "{user.email}"? This cannot be undone.</p>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleDeleteUser(user.uid, user.email)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1.5 bg-white text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expanded Edit Panel */}
                      {expandedUser === user.uid && editingUser?.uid === user.uid && (
                        <div className="p-5 border-t border-gray-200 bg-gray-50 space-y-5">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800 text-sm">Edit Screen Access & Permissions</h3>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingUser({ ...editingUser, permissions: [...VIEW_ONLY_SCREENS] })}
                                className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg hover:bg-amber-200 transition-colors"
                              >
                                Set View-Only Access
                              </button>
                              <span className="text-xs text-gray-500">{editingUser.permissions.length} screens selected</span>
                            </div>
                          </div>

                          {/* Branch selector in edit */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Branch</label>
                            <div style={{ position: 'relative', maxWidth: '280px' }}>
                              <select
                                value={editingUser.branch}
                                onChange={e => setEditingUser({ ...editingUser, branch: e.target.value })}
                                style={{
                                  height: '40px', width: '100%', border: '1.5px solid #e5e7eb',
                                  borderRadius: '8px', padding: '0 32px 0 12px', fontSize: '13px',
                                  outline: 'none', backgroundColor: 'white', color: '#111827',
                                  boxSizing: 'border-box', appearance: 'none', cursor: 'pointer',
                                }}
                              >
                                {BRANCHES.map(b => (
                                  <option key={b} value={b.toLowerCase()}>{b}</option>
                                ))}
                              </select>
                              <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                            </div>
                          </div>

                          {/* Permissions grid */}
                          <PermissionGrid
                            selectedPermissions={editingUser.permissions}
                            onToggle={toggleEditPermission}
                            onGroupToggle={(screens) => toggleGroupPermissions(
                              screens,
                              editingUser.permissions,
                              (fn) => setEditingUser(prev => prev ? { ...prev, permissions: fn(prev.permissions) } : null)
                            )}
                          />

                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setEditingUser(null)}
                              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="px-5 py-2 text-sm font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-900 shadow-sm flex items-center gap-1.5"
                            >
                              <Check size={15} /> Save Access
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: CREATE USER ── */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-100 to-slate-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                <UserPlus size={16} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Create New Branch User</h2>
                <p className="text-xs text-gray-500">Create credentials and configure exact screen access</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {generalError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{generalError}</span>
                  <button type="button" onClick={() => setGeneralError('')} className="ml-auto">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Email / Password / Branch row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="user@bullion.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    disabled={isSubmitting}
                    style={{
                      height: '42px', width: '100%', border: '1.5px solid #e5e7eb',
                      borderRadius: '10px', padding: '0 14px', fontSize: '14px',
                      outline: 'none', backgroundColor: 'white', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      disabled={isSubmitting}
                      style={{
                        height: '42px', width: '100%', border: '1.5px solid #e5e7eb',
                        borderRadius: '10px', paddingLeft: '14px', paddingRight: '42px',
                        fontSize: '14px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)', background: 'none', border: 'none',
                        cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Branch */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Branch</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={formData.branch}
                      onChange={e => setFormData({ ...formData, branch: e.target.value })}
                      disabled={isSubmitting}
                      style={{
                        height: '42px', width: '100%', border: '1.5px solid #e5e7eb',
                        borderRadius: '10px', padding: '0 36px 0 14px', fontSize: '14px',
                        outline: 'none', backgroundColor: '#f9fafb', color: formData.branch ? '#111827' : '#6b7280',
                        boxSizing: 'border-box', appearance: 'none', cursor: 'pointer',
                      }}
                    >
                      <option value="" disabled>Select branch</option>
                      {BRANCHES.map(b => (
                        <option key={b} value={b.toLowerCase()}>{b}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>

              {/* Screen Permissions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Screen Permissions
                    </label>
                    {permissions.length > 0 && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-bold">
                        {permissions.length} selected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectViewOnly}
                      className="text-xs px-3 py-1.5 bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold rounded-lg transition-colors"
                    >
                      Select View-Only Screens
                    </button>
                    {permissions.length > 0 && (
                      <button type="button" onClick={() => setPermissions([])} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                        <X size={12} /> Clear all
                      </button>
                    )}
                  </div>
                </div>
                <PermissionGrid
                  selectedPermissions={permissions}
                  onToggle={togglePermission}
                  onGroupToggle={(screens) => toggleGroupPermissions(screens, permissions, setPermissions)}
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : <><UserPlus size={16} /> Create User</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── APPROVAL MODAL ── */}
        {approvingUser && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <UserCheck size={20} className="text-amber-600" />
                    Approve Registration: {approvingUser.email}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Assign branch and screen permissions for this user</p>
                </div>
                <button
                  onClick={() => setApprovingUser(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Assign Branch</label>
                <div style={{ position: 'relative', maxWidth: '300px' }}>
                  <select
                    value={approvingUser.branch}
                    onChange={e => setApprovingUser({ ...approvingUser, branch: e.target.value })}
                    style={{
                      height: '42px', width: '100%', border: '1.5px solid #e5e7eb',
                      borderRadius: '10px', padding: '0 36px 0 14px', fontSize: '14px',
                      outline: 'none', backgroundColor: '#f9fafb', color: '#111827',
                      appearance: 'none', cursor: 'pointer',
                    }}
                  >
                    {BRANCHES.map(b => (
                      <option key={b} value={b.toLowerCase()}>{b}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    Screen Access Permissions ({approvingUser.permissions.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => setApprovingUser({ ...approvingUser, permissions: [...VIEW_ONLY_SCREENS] })}
                    className="text-xs px-3 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg hover:bg-amber-200"
                  >
                    Reset to View-Only Screens
                  </button>
                </div>
                <PermissionGrid
                  selectedPermissions={approvingUser.permissions}
                  onToggle={toggleApprovePermission}
                  onGroupToggle={(screens) => toggleGroupPermissions(
                    screens,
                    approvingUser.permissions,
                    (fn) => setApprovingUser(prev => prev ? { ...prev, permissions: fn(prev.permissions) } : null)
                  )}
                />
              </div>

              {/* Modal buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setApprovingUser(null)}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveApproval}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center gap-2"
                >
                  <Check size={16} /> Approve & Grant Access
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}