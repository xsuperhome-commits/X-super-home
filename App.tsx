
import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  ShoppingCart, 
  Wallet, 
  Menu, 
  Factory,
  BarChart2,
  Home,
  Users,
  Package,
  LogOut,
  Shield
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { OrderList } from './components/OrderList';
import { FinanceList } from './components/FinanceList';
import { Analytics } from './components/Analytics';
import { CustomerList } from './components/CustomerList';
import { ProductList } from './components/ProductList';
import { UserList } from './components/UserList';
import { Login } from './components/Login';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useERPData } from './hooks/useERPData';
import { ViewState, User, UserRole } from './types';

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Use the custom hook for data management
  const {
    orders,
    transactions,
    customers,
    products,
    users, // Get users data
    handleAddOrder,
    handleUpdateOrder,
    handleStatusChange,
    handleAddTransaction,
    handleAddCustomer,
    handleAddProduct,
    handleAddUser,
    handleUpdateUser,
    handleDeleteUser
  } = useERPData();

  // Load user session from localStorage if available (Simple Persistence)
  useEffect(() => {
    const savedUser = localStorage.getItem('erp_current_user');
    if (savedUser) {
      try {
        // Verify the user still exists in the system (in case they were deleted)
        const parsedUser = JSON.parse(savedUser);
        const validUser = users.find(u => u.id === parsedUser.id);
        if (validUser) {
           setCurrentUser(validUser);
        } else {
           localStorage.removeItem('erp_current_user');
           setCurrentUser(null);
        }
      } catch (e) {
        localStorage.removeItem('erp_current_user');
      }
    }
  }, [users]); // Re-run check if users list changes

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('erp_current_user', JSON.stringify(user));
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('erp_current_user');
    setCurrentView('DASHBOARD');
  };

  // Close sidebar on view change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [currentView]);

  // Permission Logic
  const hasAccess = (view: ViewState): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;

    switch (view) {
      case 'DASHBOARD': return true;
      case 'ORDERS': return [UserRole.SALES, UserRole.PRODUCTION].includes(currentUser.role);
      case 'CUSTOMERS': return [UserRole.SALES].includes(currentUser.role);
      case 'PRODUCTS': return [UserRole.SALES, UserRole.PRODUCTION].includes(currentUser.role);
      case 'FINANCE': return [UserRole.FINANCE].includes(currentUser.role);
      case 'ANALYTICS': return [UserRole.FINANCE, UserRole.SALES].includes(currentUser.role);
      case 'USERS': return false; // Only Admin (handled by first if)
      default: return false;
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => {
    if (!hasAccess(view)) return null;

    return (
      <button
        onClick={() => setCurrentView(view)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          currentView === view 
            ? 'bg-blue-50 text-blue-700 font-medium' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Icon size={20} />
        <span>{label}</span>
      </button>
    );
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) shadow-xl lg:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-gray-100">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-blue-200 shadow-md">
              <Factory size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-800">智造云 ERP</h1>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">应用</div>
            <NavItem view="DASHBOARD" icon={LayoutGrid} label="工作台" />
            <NavItem view="ANALYTICS" icon={BarChart2} label="数据报表" />
            
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">业务</div>
            <NavItem view="ORDERS" icon={ShoppingCart} label="订单管理" />
            <NavItem view="FINANCE" icon={Wallet} label="财务管理" />

            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">资料</div>
            <NavItem view="CUSTOMERS" icon={Users} label="客户管理" />
            <NavItem view="PRODUCTS" icon={Package} label="产品库" />

            {/* Admin Section */}
            {currentUser.role === UserRole.ADMIN && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">系统</div>
                <NavItem view="USERS" icon={Shield} label="用户管理" />
              </>
            )}
          </nav>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-sm font-bold text-blue-600 shadow-sm border border-gray-200">
                {currentUser.name.charAt(0)}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold text-gray-800 truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium border border-transparent hover:border-red-100"
            >
              <LogOut size={16} />
              退出登录
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8fafc]">
        {/* Topbar (Mobile Only) */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:hidden flex-shrink-0 z-10">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg active:bg-gray-200"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-gray-800 text-lg">
             智造云
          </span>
          <div className="w-10"></div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative scroll-smooth">
          <div className="max-w-7xl mx-auto pb-12">
            {currentView !== 'DASHBOARD' && (
              <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 animate-fade-in">
                <button onClick={() => setCurrentView('DASHBOARD')} className="hover:text-blue-600 flex items-center gap-1 transition-colors">
                  <Home size={14} /> 首页
                </button>
                <span>/</span>
                <span className="text-gray-800 font-medium">
                  {currentView === 'ANALYTICS' && '数据报表'}
                  {currentView === 'ORDERS' && '订单管理'}
                  {currentView === 'FINANCE' && '财务管理'}
                  {currentView === 'CUSTOMERS' && '客户管理'}
                  {currentView === 'PRODUCTS' && '产品库'}
                  {currentView === 'USERS' && '用户管理'}
                </span>
              </div>
            )}

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {currentView === 'DASHBOARD' && (
                <Dashboard 
                  onNavigate={setCurrentView}
                  orders={orders} 
                  transactions={transactions}
                  currentUser={currentUser}
                />
              )}
              
              {currentView === 'ANALYTICS' && hasAccess('ANALYTICS') && (
                 <Analytics orders={orders} transactions={transactions} />
              )}
              
              {currentView === 'ORDERS' && hasAccess('ORDERS') && (
                <OrderList 
                  orders={orders} 
                  customers={customers}
                  products={products}
                  onStatusChange={handleStatusChange}
                  onAddOrder={handleAddOrder}
                  onUpdateOrder={handleUpdateOrder}
                  currentUser={currentUser}
                  transactions={transactions} // Pass transactions for history
                />
              )}

              {currentView === 'FINANCE' && hasAccess('FINANCE') && (
                <FinanceList 
                  transactions={transactions}
                  onAddTransaction={handleAddTransaction}
                  orders={orders} // Pass orders for linking
                />
              )}

              {currentView === 'CUSTOMERS' && hasAccess('CUSTOMERS') && (
                <CustomerList 
                  customers={customers}
                  onAddCustomer={handleAddCustomer}
                />
              )}

              {currentView === 'PRODUCTS' && hasAccess('PRODUCTS') && (
                <ProductList 
                  products={products}
                  onAddProduct={handleAddProduct}
                />
              )}

              {currentView === 'USERS' && hasAccess('USERS') && (
                <UserList 
                  users={users}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  currentUser={currentUser}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;
