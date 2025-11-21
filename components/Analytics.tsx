import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Order, Transaction, TransactionType, OrderStatus } from '../types';
import { DollarSign, Package, Clock, Activity } from 'lucide-react';

interface AnalyticsProps {
  orders: Order[];
  transactions: Transaction[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export const Analytics: React.FC<AnalyticsProps> = ({ orders, transactions }) => {
  
  // Calculate KPIs
  const totalRevenue = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netProfit = totalRevenue - totalExpenses;
  const pendingOrdersCount = orders.filter(o => o.status === OrderStatus.PENDING).length;
  const inProductionCount = orders.filter(o => o.status === OrderStatus.PRODUCTION).length;

  // Prepare Chart Data
  const orderStatusData = [
    { name: '待处理', value: orders.filter(o => o.status === OrderStatus.PENDING).length },
    { name: '生产中', value: orders.filter(o => o.status === OrderStatus.PRODUCTION).length },
    { name: '已发货', value: orders.filter(o => o.status === OrderStatus.SHIPPED).length },
    { name: '已完成', value: orders.filter(o => o.status === OrderStatus.COMPLETED).length },
  ].filter(d => d.value > 0);

  // Recent Transactions for Chart
  const last7Transactions = transactions.slice(-7);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">总收入</p>
            <h3 className="text-2xl font-bold text-gray-800">¥{totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">净利润</p>
            <h3 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ¥{netProfit.toLocaleString()}
            </h3>
          </div>
          <div className={`p-3 rounded-full ${netProfit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            <Activity size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">待处理订单</p>
            <h3 className="text-2xl font-bold text-gray-800">{pendingOrdersCount}</h3>
          </div>
          <div className="p-3 bg-yellow-50 rounded-full text-yellow-600">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">生产中</p>
            <h3 className="text-2xl font-bold text-gray-800">{inProductionCount}</h3>
          </div>
          <div className="p-3 bg-purple-50 rounded-full text-purple-600">
            <Package size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">近期资金流向</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Transactions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} tickFormatter={(val) => val.slice(5)} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [`¥${value}`, '金额']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">订单状态分布</h4>
          <div className="h-64 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};