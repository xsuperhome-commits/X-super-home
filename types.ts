
export enum OrderStatus {
  PENDING = '待处理',
  PRODUCTION = '生产中',
  SHIPPED = '已发货',
  COMPLETED = '已完成',
  CANCELLED = '已取消'
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

export interface OrderItem {
  productId?: string; // Optional for flexibility
  productName: string;
  model: string;
  quantity: number; // Total Ordered Quantity
  shippedQuantity?: number; // Total Shipped Quantity so far
  unitPrice: number;
  unit: string;
  amount: number; // quantity * unitPrice
}

export interface Order {
  id: string;
  customerName: string;
  // Legacy fields for list view summary (optional, but good to keep populated)
  productName: string; 
  quantity: number;
  amount: number;
  
  status: OrderStatus;
  orderDate: string;
  deliveryDate: string;
  
  items: OrderItem[]; // New: Multiple products
  materials?: Material[];
  otherCost?: number;
  
  paidAmount?: number; // Track payments made
}

export interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
}

export interface Product {
  id: string;
  name: string;
  model: string; // SKU or Model
  unitPrice: number;
  unit: string;
}

export enum TransactionType {
  INCOME = '收入',
  EXPENSE = '支出'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  relatedOrderId?: string; // Link to an order
}

export type ViewState = 'DASHBOARD' | 'ORDERS' | 'FINANCE' | 'ANALYTICS' | 'CUSTOMERS' | 'PRODUCTS' | 'USERS';

export interface KPIStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  monthlyExpenses: number;
}

export type WidgetType = 'LINK' | 'STAT' | 'ACTION';

// New Auth Types
export enum UserRole {
  ADMIN = '管理员',
  SALES = '销售经理',
  FINANCE = '财务主管',
  PRODUCTION = '生产主管'
}

export interface User {
  id: string;
  username: string;
  password?: string; // In a real app, this would be hashed or handled by backend
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface DashboardItem {
  id: string;
  title: string;
  icon: string; // Name of the Lucide icon
  type: WidgetType;
  targetView?: ViewState; // For navigation
  bgColor: string;
  textColor: string;
  description?: string;
  isVisible: boolean;
  statKey?: keyof KPIStats; // If it's a stat widget
  allowedRoles?: UserRole[]; // RBAC: If undefined, allowed for all
}
