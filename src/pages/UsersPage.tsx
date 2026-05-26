import { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Shield,
  Key,
  UserCheck,
  UserX,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { userStorage } from '../lib/storage';
import { createUser, resetPassword } from '../lib/auth';
import { RoleBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import type { User, UserRole, AuthSession } from '../types';

interface UsersPageProps {
  session: AuthSession;
}

export function UsersPage({ session }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>(() => userStorage.getAll());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'staff' as UserRole,
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const refresh = () => setUsers(userStorage.getAll());

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newUser.username.trim() || !newUser.fullName.trim()) {
      setFormError('Username and full name are required.');
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    const result = createUser(newUser.username, newUser.password, newUser.role, newUser.fullName);
    if (!result.success) {
      setFormError(result.error || 'Failed to create user.');
      return;
    }
    refresh();
    setShowAddModal(false);
    setNewUser({ username: '', password: '', confirmPassword: '', fullName: '', role: 'staff' });
  };

  const handleToggleActive = (user: User) => {
    if (user.id === session.userId) return;
    userStorage.update(user.id, { isActive: !user.isActive });
    refresh();
  };

  const handleDelete = () => {
    if (!selectedUser || selectedUser.id === session.userId) return;
    userStorage.delete(selectedUser.id);
    refresh();
    setShowDeleteModal(false);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedUser) return;
    if (newPassword !== confirmNewPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    const result = resetPassword(selectedUser.id, newPassword);
    if (!result.success) {
      setFormError(result.error || 'Failed to reset password.');
      return;
    }
    setFormSuccess('Password reset successfully!');
    setTimeout(() => {
      setShowPasswordModal(false);
      setFormSuccess('');
      setNewPassword('');
      setConfirmNewPassword('');
    }, 1500);
  };

  const handleEditRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    userStorage.update(selectedUser.id, { 
      fullName: selectedUser.fullName,
      role: selectedUser.role 
    });
    refresh();
    setShowEditModal(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500">{users.length} users registered</p>
        </div>
        <button
          onClick={() => { setFormError(''); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className={`bg-white rounded-2xl border shadow-sm p-5 space-y-4 transition-all
              ${user.isActive ? 'border-gray-100' : 'border-red-100 opacity-70'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base
                    ${user.role === 'admin' ? 'bg-purple-500' : user.role === 'staff' ? 'bg-teal-500' : 'bg-gray-400'}`}
                >
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
              </div>
              <RoleBadge role={user.role} />
            </div>

            <div className="space-y-1 text-xs text-gray-500">
              <p>
                <span className="font-medium">Created:</span>{' '}
                {format(parseISO(user.createdAt), 'MMM d, yyyy')}
              </p>
              {user.lastLogin && (
                <p>
                  <span className="font-medium">Last login:</span>{' '}
                  {format(parseISO(user.lastLogin), 'MMM d, HH:mm')}
                </p>
              )}
              <div className="flex items-center gap-1 mt-1">
                {user.isActive ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <UserCheck className="w-3.5 h-3.5" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500">
                    <UserX className="w-3.5 h-3.5" /> Disabled
                  </span>
                )}
              </div>
            </div>

            {user.id !== session.userId && (
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <button
                  onClick={() => { setSelectedUser({ ...user }); setFormError(''); setShowEditModal(true); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setFormError('');
                    setFormSuccess('');
                    setShowPasswordModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors"
                >
                  <Key className="w-3.5 h-3.5" /> Password
                </button>
                <button
                  onClick={() => handleToggleActive(user)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border transition-colors
                    ${user.isActive
                      ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                      : 'text-green-600 border-green-200 hover:bg-green-50'
                    }`}
                >
                  {user.isActive ? (
                    <><UserX className="w-3.5 h-3.5" /> Disable</>
                  ) : (
                    <><UserCheck className="w-3.5 h-3.5" /> Enable</>
                  )}
                </button>
                <button
                  onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {user.id === session.userId && (
              <div className="pt-1 border-t border-gray-100">
                <p className="text-xs text-teal-600 font-medium text-center">Current User</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User" size="md">
        <form onSubmit={handleAddUser} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newUser.fullName}
              onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder="Ahmed Ali"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder="ahmed.ali"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
            <input
              type="password"
              value={newUser.confirmPassword}
              onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder="Repeat password"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">Create User</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User" size="sm">
        {selectedUser && (
          <form onSubmit={handleEditRole} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={selectedUser.fullName}
                onChange={(e) => setSelectedUser({ ...selectedUser, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={selectedUser.role}
                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">Save</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Password Reset Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Reset Password" size="sm">
        {selectedUser && (
          <form onSubmit={handleResetPassword} className="p-6 space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>
            )}
            {formSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{formSuccess}</div>
            )}
            <p className="text-sm text-gray-600">Resetting password for <span className="font-semibold">{selectedUser.fullName}</span></p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                placeholder="Repeat password"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                Reset Password
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete User" size="sm">
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete user <span className="font-semibold">{selectedUser?.fullName}</span>? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
