
import React, { useState } from 'react';
import { User } from '../types';
import { Factory, ArrowRight, Lock, User as UserIcon, AlertCircle, Info } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

export const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (user) {
      onLogin(user);
    } else {
      setError('用户名或密码错误');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side - Brand & Info */}
        <div className="md:w-1/2 bg-blue-600 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
             <Factory size={400} className="transform -translate-x-1/2 -translate-y-1/4"/>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Factory size={32} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">智造云 ERP</h1>
            </div>
            <p className="text-blue-100 text-lg mb-4">
              简约高效的工厂管理专家。<br/>集成订单追踪、财务管理与数据分析。
            </p>
          </div>
          
          <div className="relative z-10 bg-blue-700/30 p-4 rounded-lg border border-blue-500/30 backdrop-blur-sm">
            <div className="flex items-start gap-3">
               <Info size={20} className="text-blue-200 shrink-0 mt-0.5"/>
               <div className="text-sm text-blue-100">
                 <p className="font-bold mb-1">初次使用提示</p>
                 <p className="opacity-90">系统已自动初始化默认管理员账号。</p>
                 <p className="mt-1">用户名：<span className="font-mono font-bold bg-blue-800/50 px-1 rounded">admin</span></p>
                 <p>密码：<span className="font-mono font-bold bg-blue-800/50 px-1 rounded">123</span></p>
                 <p className="mt-2 opacity-80 text-xs">登录后请立即在“用户管理”中修改密码。</p>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900">欢迎回来</h2>
            <p className="text-gray-500 mt-1">请登录您的账号以继续</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
              <div className="relative">
                <UserIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="输入用户名"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="输入密码"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              <span>登录系统</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            SmartFactory ERP © 2023 - 2024
          </p>
        </div>
      </div>
    </div>
  );
};
