import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Trash2, Edit2, ChevronDown, ChevronUp, AlertCircle,
  Eye, EyeOff, UserPlus, Users, X, Check, Shield
} from 'lucide-react';
import {
  createUser,
  getAllUsers,
  deleteUser,
  updateUserPermissions,
  updateUserBranch,
  type UserData,
  type Screen,
  ALL_SCREEN_GROUPS
} from '../models/userService';

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

export function UserManagement() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState>({ email: '', password: '', branch: '' });
  const [permissions, setPermissions] = useState<Screen[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getCurrentUserEmail = () => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo).email : 'unknown';
    } catch { return 'unknown'; }
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers.filter(u => u.role === 'user'));
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

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

  const toggleGroupPermissions = (screens: Screen[], currentPermissions: Screen[], setter: (fn: (prev: Screen[]) => Screen[]) => void) => {
    const allSelected = screens.every(s => currentPermissions.includes(s));
    if (allSelected) {
      setter(prev => prev.filter(p => !screens.includes(p)));
    } else {
      setter(prev => [...new Set([...prev, ...screens])]);
    }
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
      toast.success(`User "${formData.email}" created successfully - credentials saved!`);
      setFormData({ email: '', password: '', branch: '' });
      setPermissions([]);
      await fetchUsers();
      // No auto-switch - super admin stays logged in
    } catch (error: any) {
      const msg = error.message || 'Failed to create user';
      setGeneralError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    try {
      await deleteUser(uid);
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
                  className="w-4 h-4 accent-slate-700 cursor-pointer"
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
                      ? 'bg-slate-100 border-slate-400 text-slate-800'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(screen)}
                    onChange={() => onToggle(screen)}
                    className="w-3.5 h-3.5 accent-slate-700 flex-shrink-0"
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
              <Shield size={24} className="text-slate-700" />
              User Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">Create and manage branch users with role-based access control</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Create User Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-100 to-slate-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
              <UserPlus size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Create New User</h2>
              <p className="text-xs text-gray-500">Add a branch user with specific screen access</p>
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
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  disabled={isSubmitting}
                  style={{
                    height: '42px', width: '100%', border: '1.5px solid #e5e7eb',
                    borderRadius: '10px', padding: '0 14px', fontSize: '14px',
                    outline: 'none', backgroundColor: 'white', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#374151')}
                  onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
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
                    onFocus={e => (e.target.style.borderColor = '#374151')}
                    onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
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
                    onFocus={e => (e.target.style.borderColor = '#374151')}
                    onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                  >
                    <option value="" disabled>Select branch</option>
                              {BRANCHES.map(b => (
                                <option key={b} value={b.toLowerCase()} style={{ backgroundColor: '#f3f4f6', color: '#111827' }}>
                                  {b}
                                </option>
                              ))}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>

            {/* Screen Permissions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  Screen Permissions
                  {permissions.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-800 text-xs rounded-full font-medium">
                      {permissions.length} selected
                    </span>
                  )}
                </label>
                {permissions.length > 0 && (
                  <button type="button" onClick={() => setPermissions([])} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                    <X size={12} /> Clear all
                  </button>
                )}
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
                style={{
                  height: '44px', padding: '0 32px',
                  background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #374151, #1f2937)',
                  color: 'white', fontWeight: '600', fontSize: '14px',
                  border: 'none', borderRadius: '10px', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(31,41,55,0.3)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Creating...
                  </>
                ) : (
                  <><UserPlus size={16} /> Create User</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
              <Users size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Manage Users</h2>
              <p className="text-xs text-gray-500">{users.length} user{users.length !== 1 ? 's' : ''} in system</p>
            </div>
          </div>

          <div className="p-6">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
                <div style={{ width: '20px', height: '20px', border: '2px solid #e5e7eb', borderTopColor: '#374151', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users size={20} className="text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No users yet</p>
                <p className="text-gray-400 text-sm">Create your first user above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
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
                          <p className="font-semibold text-gray-900 text-sm">{user.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                              {user.branch}
                            </span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-md">
                              {user.permissions.length} screen{user.permissions.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); setExpandedUser(expandedUser === user.uid ? null : user.uid); setEditingUser({ uid: user.uid, email: user.email, branch: user.branch, permissions: [...user.permissions] }); }}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit user"
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
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1 border border-transparent"
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            <Trash2 size={12} className="text-white" /> Delete
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
                          <h3 className="font-semibold text-gray-800 text-sm">Edit User Access</h3>
                          <span className="text-xs text-gray-500">{editingUser.permissions.length} screens selected</span>
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
                                borderRadius: '10px', padding: '0 36px 0 14px', fontSize: '14px',
                                outline: 'none', backgroundColor: '#f9fafb', color: '#111827',
                                boxSizing: 'border-box', appearance: 'none', cursor: 'pointer',
                              }}
                            >
                              {BRANCHES.map(b => (
                                <option key={b} value={b.toLowerCase()} style={{ backgroundColor: '#f3f4f6', color: '#111827' }}>
                                  {b}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                          </div>
                        </div>

                        {/* Permissions grid */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Screen Permissions</label>
                          <PermissionGrid
                            selectedPermissions={editingUser.permissions}
                            onToggle={toggleEditPermission}
                            onGroupToggle={(screens) => {
                              const allSelected = screens.every(s => editingUser.permissions.includes(s));
                              setEditingUser(prev => prev ? {
                                ...prev,
                                permissions: allSelected
                                  ? prev.permissions.filter(p => !screens.includes(p))
                                  : [...new Set([...prev.permissions, ...screens])]
                              } : null);
                            }}
                          />
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleSaveEdit}
                            style={{
                              height: '38px', padding: '0 20px',
                              background: 'linear-gradient(135deg, #059669, #047857)',
                              color: 'white', fontWeight: '600', fontSize: '13px',
                              border: 'none', borderRadius: '8px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                          >
                            <Check size={14} /> Save Changes
                          </button>
                          <button
                            onClick={() => { setEditingUser(null); setExpandedUser(null); }}
                            style={{
                              height: '38px', padding: '0 20px', background: 'white',
                              color: '#374151', fontWeight: '600', fontSize: '13px',
                              border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expanded View (when not editing) */}
                    {expandedUser === user.uid && editingUser?.uid !== user.uid && (
                      <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 space-y-3">
                        <div className="flex gap-6 text-xs text-gray-500">
                          <span><span className="font-semibold text-gray-700">Created by:</span> {user.createdBy}</span>
                          <span><span className="font-semibold text-gray-700">Date:</span> {new Date(user.createdAt?.toDate?.() || user.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Assigned Screens</p>
                          <div className="flex flex-wrap gap-1.5">
                            {user.permissions.length > 0
                              ? user.permissions.map(s => (
                                <span key={s} className="px-2.5 py-1 bg-slate-200 text-slate-800 text-xs font-medium rounded-lg">{s}</span>
                              ))
                              : <span className="text-gray-400 text-sm italic">No permissions assigned</span>
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}