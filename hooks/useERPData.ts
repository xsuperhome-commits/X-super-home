
import { useState, useEffect, useCallback } from 'react';
import { Order, Transaction, Customer, Product, OrderStatus, User, UserRole, TransactionType } from '../types';
import { INITIAL_ORDERS, INITIAL_TRANSACTIONS, INITIAL_CUSTOMERS, INITIAL_PRODUCTS } from '../constants';

// Helper to safely parse JSON from localStorage
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Failed to load ${key} from storage, using fallback.`);
    return fallback;
  }
};

// Helper to migrate old order format to new format with items array
const migrateOrders = (orders: any[]): Order[] => {
  return orders.map(o => {
    let migrated = { ...o };

    // 1. Migrate Items Array
    if (!migrated.items || !Array.isArray(migrated.items)) {
         migrated.items = [{
            productName: o.productName,
            model: 'N/A', 
            quantity: o.quantity,
            shippedQuantity: o.status === OrderStatus.COMPLETED || o.status === OrderStatus.SHIPPED ? o.quantity : 0,
            unitPrice: o.quantity > 0 ? (o.amount / o.quantity) : 0,
            unit: '件',
            amount: o.amount
        }];
    } else {
        // Ensure shippedQuantity exists on existing items
        migrated.items = migrated.items.map((item: any) => ({
            ...item,
            shippedQuantity: item.shippedQuantity || 0
        }));
    }

    // 2. Migrate Paid Amount
    if (typeof migrated.paidAmount === 'undefined') {
        migrated.paidAmount = 0;
    }

    return migrated as Order;
  });
};

// Default Admin User if no users exist
const DEFAULT_ADMIN: User = {
  id: 'USR-ADMIN',
  username: 'admin',
  password: '123', // In a real app, force change on first login
  name: '超级管理员',
  role: UserRole.ADMIN
};

export const useERPData = () => {
  // --- Initialize State ---
  
  const [orders, setOrders] = useState<Order[]>(() => {
    const loaded = loadFromStorage('erp_orders', INITIAL_ORDERS);
    return migrateOrders(loaded);
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    loadFromStorage('erp_transactions', INITIAL_TRANSACTIONS)
  );
  
  const [customers, setCustomers] = useState<Customer[]>(() => 
    loadFromStorage('erp_customers', INITIAL_CUSTOMERS)
  );
  
  const [products, setProducts] = useState<Product[]>(() => 
    loadFromStorage('erp_products', INITIAL_PRODUCTS)
  );

  const [users, setUsers] = useState<User[]>(() => {
    // Special logic for users: if empty, seed with Default Admin
    const loaded = loadFromStorage<User[]>('erp_users', []);
    if (loaded.length === 0) {
      return [DEFAULT_ADMIN];
    }
    return loaded;
  });

  // --- Persistence Effects ---
  
  useEffect(() => {
    localStorage.setItem('erp_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('erp_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('erp_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('erp_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('erp_users', JSON.stringify(users));
  }, [users]);

  // --- Handlers ---

  const handleAddOrder = useCallback((newOrder: Omit<Order, 'id'> & { id?: string }) => {
    // Check if custom ID is provided and not empty, otherwise generate one
    const id = (newOrder.id && newOrder.id.trim() !== '') 
      ? newOrder.id.trim()
      : `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
    setOrders(prev => [{ 
        ...newOrder, 
        id, 
        materials: newOrder.materials || [], 
        otherCost: newOrder.otherCost || 0,
        paidAmount: 0 // Initialize paid amount
    }, ...prev]);
  }, []);

  const handleUpdateOrder = useCallback((updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  }, []);

  const handleStatusChange = useCallback((id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }, []);

  const handleAddTransaction = useCallback((newTx: Omit<Transaction, 'id'>) => {
    const id = `TRX-${Math.floor(Math.random() * 100000)}`;
    setTransactions(prev => [{ ...newTx, id }, ...prev]);

    // If this is an INCOME transaction linked to an order, update the order's paidAmount
    if (newTx.relatedOrderId && newTx.type === TransactionType.INCOME) {
        setOrders(prevOrders => prevOrders.map(order => {
            if (order.id === newTx.relatedOrderId) {
                const currentPaid = order.paidAmount || 0;
                return { ...order, paidAmount: currentPaid + newTx.amount };
            }
            return order;
        }));
    }
  }, []);

  const handleAddCustomer = useCallback((newCustomer: Omit<Customer, 'id'>) => {
    const id = `CUST-${Math.floor(Math.random() * 100000).toString().padStart(3, '0')}`;
    setCustomers(prev => [{ ...newCustomer, id }, ...prev]);
  }, []);

  const handleAddProduct = useCallback((newProduct: Omit<Product, 'id'>) => {
    const id = `PROD-${Math.floor(Math.random() * 100000).toString().padStart(3, '0')}`;
    setProducts(prev => [{ ...newProduct, id }, ...prev]);
  }, []);

  // User Management Handlers
  const handleAddUser = useCallback((newUser: Omit<User, 'id'>) => {
    const id = `USR-${Date.now()}`;
    setUsers(prev => [...prev, { ...newUser, id }]);
  }, []);

  const handleUpdateUser = useCallback((updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  }, []);

  const handleDeleteUser = useCallback((userId: string) => {
    setUsers(prev => {
      // Prevent deleting the last admin
      const remainingAdmins = prev.filter(u => u.role === UserRole.ADMIN && u.id !== userId);
      if (remainingAdmins.length === 0 && prev.find(u => u.id === userId)?.role === UserRole.ADMIN) {
        alert("无法删除系统中唯一的管理员账号。");
        return prev;
      }
      return prev.filter(u => u.id !== userId);
    });
  }, []);

  return {
    orders,
    transactions,
    customers,
    products,
    users,
    handleAddOrder,
    handleUpdateOrder,
    handleStatusChange,
    handleAddTransaction,
    handleAddCustomer,
    handleAddProduct,
    handleAddUser,
    handleUpdateUser,
    handleDeleteUser
  };
};
