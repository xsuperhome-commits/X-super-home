
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Search, Plus, Shield, Trash2, Edit3, Save, X, Key } from 'lucide-react';

interface UserListProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  currentUser: User;
}

export const UserList: React.FC<UserListProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: UserRole.SALES
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode && editingUser) {
      // Update existing
      onUpdateUser({
        ...editingUser,
        name: formData.name,
        username: formData.username,
        role: formData.role,
        // Only update password if provided, else keep old
        password: formData.password ? formData.password : editingUser.password
      });
    } else {
      // Create new
      if (!formData.password) {
        alert("创建新用户必须设置密码");
        return;
      }
      // Check username uniqueness
      if (users.some(u => u.username === formData.username)) {
        alert("用户名已存在");
        return;
      }
      onAddUser(formData);
    }
    closeModal();
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      role: UserRole.SALES
    });
    setEditingUser(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setFormData({
      name: user.name,
      username: user.username,
      password: '', // Don't show existing password
      role: user.role
    });
    setEditingUser(user);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setIsEditMode(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">用户与权限管理</h2>
          <p className="text-sm text-gray-500">管理系统账号及角色分配</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>新建账号</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md
                ${user.role === UserRole.ADMIN ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 
                  user.role === UserRole.FINANCE ? 'bg-gradient-to-br from-emerald-400 to-teal-600' :
                  'bg-gradient-to-br from-blue-400 to-blue-600'}`}
              >
                {user.name.charAt(0)}
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}
              >
                {user.role}
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
            <p className="text-gray-500 text-sm mb-4">@{user.username}</p>

            <div className="border-t border-gray-100 pt-4 flex justify-end gap-2">
              <button 
                onClick={() => openEditModal(user)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                title="编辑/重置密码"
              >
                <Edit3 size={18}/>
              </button>
              {/* Prevent deleting self */}
              {user.id !== currentUser.id && (
                <button 
                  onClick={() => {
                    if(window.confirm(`确定要删除用户 ${user.name} 吗?`)) {
                      onDeleteUser(user.id);
                    }
                  }}
                  className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                  title="删除用户"
                >
                  <Trash2 size={18}/>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
               <h3 className="text-lg font-bold text-gray-900">
                 {isEditMode ? '编辑用户' : '新建用户'}
               </h3>
               <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                 <X size={20}/>
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 (显示名)</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="例如：张三"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">登录用户名</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  placeholder="例如：zhangsan"
                  disabled={isEditMode} // Prevent changing username in edit mode
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEditMode ? '重置密码 (留空则不修改)' : '登录密码'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type={isEditMode ? "text" : "password"} // Show text in edit mode for easier reset
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder={isEditMode ? "输入新密码以重置" : "设置密码"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色权限</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                >
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.role === UserRole.ADMIN && "拥有系统所有权限，可管理用户。"}
                  {formData.role === UserRole.SALES && "可管理订单、客户、产品，不可见敏感财务数据。"}
                  {formData.role === UserRole.FINANCE && "可查看财务流水、所有报表。"}
                  {formData.role === UserRole.PRODUCTION && "仅关注生产订单与产品库。"}
                </p>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
