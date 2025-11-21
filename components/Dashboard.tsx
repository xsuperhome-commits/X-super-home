
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  Wallet, 
  BarChart2, 
  Plus, 
  Settings, 
  X, 
  Check,
  ShoppingBag,
  CreditCard,
  Users,
  Truck,
  ClipboardList,
  Package,
  Shield
} from 'lucide-react';
import { DashboardItem, ViewState, Order, Transaction, TransactionType, OrderStatus, KPIStats, User, UserRole } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
  orders: Order[];
  transactions: Transaction[];
  currentUser: User;
}

// Default configuration with Role Permissions
const DEFAULT_WIDGETS: DashboardItem[] = [
  {
    id: 'w-orders',
    title: '订单管理',
    icon: 'ShoppingCart',
    type: 'LINK',
    targetView: 'ORDERS',
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    description: '处理客户订单',
    isVisible: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SALES, UserRole.PRODUCTION]
  },
  {
    id: 'w-finance',
    title: '财务管理',
    icon: 'Wallet',
    type: 'LINK',
    targetView: 'FINANCE',
    bgColor: 'bg-emerald-500',
    textColor: 'text-white',
    description: '查看收支流水',
    isVisible: true,
    allowedRoles: [UserRole.ADMIN, UserRole.FINANCE]
  },
  {
    id: 'w-analytics',
    title: '数据报表',
    icon: 'BarChart2',
    type: 'LINK',
    targetView: 'ANALYTICS',
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
    description: '详细运营数据',
    isVisible: true,
    allowedRoles: [UserRole.ADMIN, UserRole.FINANCE, UserRole.SALES]
  },
  {
    id: 'w-customers',
    title: '客户管理',
    icon: 'Users',
    type: 'LINK',
    targetView: 'CUSTOMERS',
    bgColor: 'bg-indigo-500',
    textColor: 'text-white',
    description: '管理客户档案',
    isVisible: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SALES]
  },
  {
    id: 'w-products',
    title: '产品库',
    icon: 'Package',
    type: 'LINK',
    targetView: 'PRODUCTS',
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    description: '维护产品信息',
    isVisible: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SALES, UserRole.PRODUCTION]
  },
  {
    id: 'w-users',
    title: '用户管理',
    icon: 'Shield',
    type: 'LINK',
    targetView: 'USERS',
    bgColor: 'bg-slate-700',
    textColor: 'text-white',
    description: '员工账号与权限',
    isVisible: true,
    allowedRoles: [UserRole.ADMIN]
  },
  {
    id: 'w-stat-rev',
    title: '本月收入',
    icon: 'CreditCard',
    type: 'STAT',
    statKey: 'totalRevenue',
    bgColor: 'bg-white',
    textColor: 'text-gray-800',
    isVisible: true,
    allowedRoles: [UserRole.ADMIN, UserRole.FINANCE]
  },
  {
    id: 'w-stat-pending',
    title: '待处理订单',
    icon: 'ClipboardList',
    type: 'STAT',
    statKey: 'pendingOrders',
    bgColor: 'bg-white',
    textColor: 'text-gray-800',
    isVisible: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SALES, UserRole.PRODUCTION]
  },
   {
    id: 'w-production',
    title: '生产监控',
    icon: 'Truck',
    type: 'LINK',
    targetView: 'ORDERS',
    bgColor: 'bg-pink-500',
    textColor: 'text-white',
    description: '车间进度看板',
    isVisible: false,
    allowedRoles: [UserRole.ADMIN, UserRole.PRODUCTION]
  }
];

const IconMap: Record<string, any> = {
  ShoppingCart,
  Wallet,
  BarChart2,
  ShoppingBag,
  CreditCard,
  Users,
  Truck,
  ClipboardList,
  Package,
  Shield
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, orders, transactions, currentUser }) => {
  const [widgets, setWidgets] = useState<DashboardItem[]>(() => {
    try {
      const saved = localStorage.getItem(`erp_dashboard_layout_${currentUser.id}`);
      return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
    } catch (e) {
      return DEFAULT_WIDGETS;
    }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Refs for drag and drop
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem(`erp_dashboard_layout_${currentUser.id}`, JSON.stringify(widgets));
  }, [widgets, currentUser.id]);

  // Check permission helper
  const hasPermission = (widget: DashboardItem) => {
    if (!widget.allowedRoles) return true;
    return widget.allowedRoles.includes(currentUser.role);
  };

  // Calculate simple stats for widgets
  const stats: KPIStats = {
    totalRevenue: transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, curr) => acc + curr.amount, 0),
    pendingOrders: orders.filter(o => o.status === OrderStatus.PENDING).length,
    totalOrders: orders.length,
    monthlyExpenses: transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0),
  };

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    // Create a deep copy
    const _widgets = [...widgets];
    // Validation to prevent crash
    if (!_widgets[dragItem.current] || !_widgets[dragOverItem.current]) return;

    const draggedItemContent = _widgets[dragItem.current];
    
    // Remove and insert
    _widgets.splice(dragItem.current, 1);
    _widgets.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    setWidgets(_widgets);
  };

  const toggleWidgetVisibility = (id: string, visible: boolean) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, isVisible: visible } : w));
  };

  // Filter widgets based on Role FIRST, then visibility
  const allowedWidgets = widgets.filter(hasPermission);
  const visibleWidgets = allowedWidgets.filter(w => w.isVisible);
  const hiddenWidgets = allowedWidgets.filter(w => !w.isVisible);

  return (
    <div className="space-y-6 animate-fade-in relative min-h-[80vh]">
      
      {/* Header / Controls */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            下午好，{currentUser.name}
          </h2>
          <p className="text-gray-500 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">{currentUser.role}</span>
            自定义您的专属工作台
          </p>
        </div>
        <div className="flex gap-3">
           {isEditing ? (
             <button 
               onClick={() => setIsEditing(false)}
               className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105"
             >
               <Check size={18}/>
               <span>完成</span>
             </button>
           ) : (
             <button 
               onClick={() => setIsEditing(true)}
               className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-all"
             >
               <Settings size={18}/>
               <span>编辑桌面</span>
             </button>
           )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 select-none">
        {visibleWidgets.map((widget, index) => {
          const Icon = IconMap[widget.icon] || ShoppingCart;
          const isStat = widget.type === 'STAT';
          // @ts-ignore
          const statValue = isStat && widget.statKey ? stats[widget.statKey] : null;

          return (
            <div
              key={widget.id}
              draggable={isEditing}
              onDragStart={() => { dragItem.current = index; }}
              onDragEnter={() => { dragOverItem.current = index; }}
              onDragEnd={handleSort}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => !isEditing && widget.targetView && onNavigate(widget.targetView)}
              className={`
                relative group aspect-square rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer
                ${isEditing ? 'scale-95 ring-2 ring-blue-400 ring-offset-2 cursor-move shadow-xl rotate-1' : 'hover:-translate-y-1 hover:shadow-lg shadow-sm'}
                ${widget.bgColor} ${widget.textColor}
                ${widget.bgColor === 'bg-white' ? 'border border-gray-200' : ''}
              `}
            >
              {/* Remove Button (Edit Mode) */}
              {isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWidgetVisibility(widget.id, false);
                  }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md z-10 hover:bg-red-600 transition-colors"
                >
                  <X size={16} strokeWidth={3}/>
                </button>
              )}

              {/* Icon */}
              <div className={`${widget.bgColor === 'bg-white' ? 'bg-gray-100 text-gray-700' : 'bg-white/20'} w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm`}>
                <Icon size={24} />
              </div>

              {/* Content */}
              <div>
                {isStat ? (
                  <>
                    <p className={`text-sm font-medium opacity-80 mb-1`}>{widget.title}</p>
                    <p className="text-2xl font-bold">
                      {typeof statValue === 'number' && widget.statKey?.includes('Revenue') 
                        ? `¥${statValue.toLocaleString()}` 
                        : statValue}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold leading-tight mb-1">{widget.title}</h3>
                    <p className={`text-xs ${widget.textColor === 'text-white' ? 'text-white/70' : 'text-gray-400'}`}>
                      {widget.description}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Add New Button (Only in Edit Mode or if empty) */}
        {(isEditing || visibleWidgets.length === 0) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="aspect-square rounded-3xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 transition-all gap-2"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
               <Plus size={24} />
            </div>
            <span className="font-medium">添加模块</span>
          </button>
        )}
      </div>

      {/* Add Module Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 transition-all">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">添加功能模块</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {hiddenWidgets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>当前权限下所有模块已添加完毕</p>
                </div>
              ) : (
                hiddenWidgets.map(widget => {
                  const Icon = IconMap[widget.icon];
                  return (
                    <div key={widget.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${widget.bgColor === 'bg-white' ? 'bg-gray-200 text-gray-600' : `${widget.bgColor} text-white`}`}>
                           <Icon size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">{widget.title}</h4>
                          <p className="text-xs text-gray-500">{widget.description || '功能模块'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          toggleWidgetVisibility(widget.id, true);
                        }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity font-medium text-sm"
                      >
                        添加
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
              <button onClick={() => setShowAddModal(false)} className="text-sm text-gray-500 hover:text-gray-800">
                关闭窗口
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
