import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../components/ui/accordion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2, Edit2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { 
  createUser, 
  getAllUsers, 
  deleteUser, 
  updateUserPermissions,
  updateUserBranch,
  type UserData,
  type Screen,
  type ScreenGroup,
  ALL_SCREEN_GROUPS
} from '../models/userService';

const BRANCHES = ['Lahore', 'Karachi', 'Islamabad', 'Bullion', 'R&D'] as const;

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
  const [formData, setFormData] = useState<FormState>({
    email: '',
    password: '',
    branch: '',
  });
  const [permissions, setPermissions] = useState<Screen[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string>('');

  const getCurrentUserEmail = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        return parsed.email;
      } catch {
        return 'unknown';
      }
    }
    return 'unknown';
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const allUsers = await getAllUsers();
      const regularUsers = allUsers.filter(u => u.role === 'user');
      setUsers(regularUsers);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCheckboxChange = (screen: Screen) => {
    setPermissions(prev => 
      prev.includes(screen)
        ? prev.filter(p => p !== screen)
        : [...prev, screen]
    );
  };

  const handleEditCheckboxChange = (screen: Screen) => {
    if (!editingUser) return;
    setEditingUser(prev => 
      prev ? {
        ...prev,
        permissions: prev.permissions.includes(screen)
          ? prev.permissions.filter(p => p !== screen)
          : [...prev.permissions, screen]
      } : null
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!formData.email.trim()) {
      setGeneralError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setGeneralError('Please enter a valid email address');
      return;
    }
    if (!formData.password) {
      setGeneralError('Password is required');
      return;
    }
    if (formData.password.length < 6) {
      setGeneralError('Password must be at least 6 characters');
      return;
    }
    if (!formData.branch) {
      setGeneralError('Branch is required');
      return;
    }
    if (permissions.length === 0) {
      setGeneralError('Please select at least one screen permission');
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUserEmail = getCurrentUserEmail();
      await createUser(
        formData.email, 
        formData.password, 
        formData.branch, 
        permissions,
        currentUserEmail
      );
      
      toast.success(`User "${formData.email}" created successfully!`);
      
      setFormData({ email: '', password: '', branch: '' });
      setPermissions([]);
      
      await fetchUsers();
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to create user';
      setGeneralError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(uid);
      toast.success(`User "${email}" deleted successfully`);
      setUsers(prev => prev.filter(u => u.uid !== uid));
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to delete user';
      toast.error(errorMsg);
    }
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser({
      uid: user.uid,
      email: user.email,
      branch: user.branch,
      permissions: [...user.permissions],
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setGeneralError('');

    if (editingUser.permissions.length === 0) {
      setGeneralError('User must have at least one screen permission');
      return;
    }

    try {
      const currentUserEmail = getCurrentUserEmail();
      
      if (editingUser.permissions.length > 0) {
        await updateUserPermissions(editingUser.uid, editingUser.permissions, currentUserEmail);
      }
      
      const originalUser = users.find(u => u.uid === editingUser.uid);
      if (originalUser && originalUser.branch !== editingUser.branch) {
        await updateUserBranch(editingUser.uid, editingUser.branch, currentUserEmail);
      }

      toast.success('User updated successfully');
      setEditingUser(null);
      await fetchUsers();
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to update user';
      setGeneralError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Create and manage users with role-based access control</p>
        </div>
        <Button onClick={() => navigate('/dashboard')} variant="outline">Back to Dashboard</Button>
      </div>

      {/* Create User Card */}
      <Card className="border-2 border-blue-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="text-xl">Create New User</CardTitle>
          <CardDescription>Add new branch user with screen permissions</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {generalError && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-lg">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error</p>
                <p>{generalError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={isSubmitting}
                  className="h-10 border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  disabled={isSubmitting}
                  className="h-10 border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch" className="font-semibold">Branch</Label>
                            <Select value={formData.branch} onValueChange={(value) => setFormData({...formData, branch: value})}>
                  <SelectTrigger className="h-10 border-gray-300">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map(branch => (
                      <SelectItem key={branch} value={branch.toLowerCase()}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissions Accordion */}
            <div className="space-y-3">
              <Label className="font-semibold block">Screen Permissions ({permissions.length} selected)</Label>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Accordion type="multiple" defaultValue={['dashboard', 'transactions'] } className="w-full">
                  {ALL_SCREEN_GROUPS.map((group, groupIndex) => (
                    <AccordionItem key={groupIndex} value={`group-${groupIndex}`}>
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="font-semibold">{group.title}</span>
                          <span className="text-sm text-gray-500 ml-auto">({group.screens.length})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {group.screens.map((screen) => (
                            <div key={screen} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg">
                              <Checkbox 
                                id={`create-${screen}`}
                                checked={permissions.includes(screen)}
                                onCheckedChange={() => handleCheckboxChange(screen)}
                                disabled={isSubmitting}
                              />
                              <Label htmlFor={`create-${screen}`} className="text-sm font-medium cursor-pointer flex-1">
                                {screen}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
              {permissions.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded">
                  ⚠ Please select at least one screen permission
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating User...
                </div>
              ) : (
                'Create User'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users List Card */}
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-xl">Manage Users</CardTitle>
          <CardDescription>{users.length} user{users.length !== 1 ? 's' : ''} in system</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">👥 No users yet</p>
              <p className="text-sm">Create your first user above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.uid} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* User Header */}
                  <div
                    className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedUser(expandedUser === user.uid ? null : user.uid)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {user.branch}
                            </span>
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                              {user.permissions.length} screen{user.permissions.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedUser === user.uid ? (
                        <ChevronUp size={20} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedUser === user.uid && (
                    <div className="p-4 border-t border-gray-200 bg-white space-y-4">
                      {editingUser?.uid === user.uid ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="font-semibold">Branch</Label>
                            <Select value={editingUser.branch} onValueChange={(value) => setEditingUser({...editingUser, branch: value})}>
                              <SelectTrigger className="h-10 border-gray-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BRANCHES.map(branch => (
                                  <SelectItem key={branch} value={branch.toLowerCase()}>{branch}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3">
                            <Label className="font-semibold block">Update Permissions</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                              {ALL_SCREEN_GROUPS.flatMap(group => group.screens).map((screen) => (
                                <div key={screen} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`edit-${screen}`}
                                    checked={editingUser!.permissions.includes(screen)}
                                    onCheckedChange={() => handleEditCheckboxChange(screen)}
                                  />
                                  <Label htmlFor={`edit-${screen}`} className="text-sm font-medium cursor-pointer">
                                    {screen}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {generalError && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
                              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                              <span>{generalError}</span>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveEdit}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              Save Changes
                            </Button>
                            <Button
                              onClick={() => setEditingUser(null)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-semibold">Created by:</span> {user.createdBy}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Created at:</span> {new Date(user.createdAt?.toDate?.() || user.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Assigned Screens:</p>
                            <div className="flex flex-wrap gap-2">
                              {user.permissions.length > 0 ? (
                                user.permissions.map(screen => (
                                  <span key={screen} className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                                    {screen}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-gray-500 italic">No permissions assigned</span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => handleEditUser(user)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                              size="sm"
                            >
                              <Edit2 size={16} /> Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteUser(user.uid, user.email)}
                              variant="destructive"
                              size="sm"
                              className="flex-1 flex items-center justify-center gap-2"
                            >
                              <Trash2 size={16} /> Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}