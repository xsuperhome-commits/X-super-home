
import { Order, OrderStatus, Transaction, TransactionType, Customer, Product, User, UserRole } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    username: 'admin',
    password: '123',
    name: '超级管理员',
    role: UserRole.ADMIN
  },
  {
    id: 'USR-002',
    username: 'sales',
    password: '123',
    name: '李销售',
    role: UserRole.SALES
  },
  {
    id: 'USR-003',
    username: 'finance',
    password: '123',
    name: '王财务',
    role: UserRole.FINANCE
  },
  {
    id: 'USR-004',
    username: 'prod',
    password: '123',
    name: '赵生产',
    role: UserRole.PRODUCTION
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-001',
    name: '尚品家居有限公司',
    contactPerson: '张经理',
    phone: '13800138000',
    address: '上海市浦东新区康桥工业园'
  },
  {
    id: 'CUST-002',
    name: '蓝天贸易',
    contactPerson: '李总',
    phone: '13912345678',
    address: '杭州市滨江区科技大厦'
  },
  {
    id: 'CUST-003',
    name: '极速物流中心',
    contactPerson: '王主管',
    phone: '13777778888',
    address: '苏州市工业园区'
  },
  {
    id: 'CUST-004',
    name: '美好生活馆',
    contactPerson: '赵店长',
    phone: '13666669999',
    address: '南京市鼓楼区商业街'
  },
  {
    id: 'CUST-005',
    name: '科技园采购部',
    contactPerson: '刘主任',
    phone: '025-88889999',
    address: '无锡市新吴区科技园'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PROD-001',
    name: '实木餐桌 A型',
    model: 'DT-A01',
    unitPrice: 500,
    unit: '张'
  },
  {
    id: 'PROD-002',
    name: '办公椅 X200',
    model: 'OC-X200',
    unitPrice: 300,
    unit: '把'
  },
  {
    id: 'PROD-003',
    name: '重型货架',
    model: 'SR-H01',
    unitPrice: 2250,
    unit: '组'
  },
  {
    id: 'PROD-004',
    name: '简约茶几',
    model: 'CT-S05',
    unitPrice: 90,
    unit: '个'
  },
  {
    id: 'PROD-005',
    name: '升降办公桌',
    model: 'OD-L02',
    unitPrice: 1500,
    unit: '张'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-2023-001',
    customerName: '尚品家居有限公司',
    productName: '实木餐桌 A型',
    quantity: 50,
    amount: 25000,
    status: OrderStatus.COMPLETED,
    orderDate: '2023-10-01',
    deliveryDate: '2023-10-15',
    items: [
      { productName: '实木餐桌 A型', model: 'DT-A01', quantity: 50, unitPrice: 500, unit: '张', amount: 25000 }
    ],
    materials: [
      { id: 'm1', name: '橡木板材', quantity: 100, unitPrice: 120, unit: '块' },
      { id: 'm2', name: '环保清漆', quantity: 10, unitPrice: 300, unit: '桶' }
    ],
    otherCost: 2000
  },
  {
    id: 'ORD-2023-002',
    customerName: '蓝天贸易',
    productName: '办公椅 X200',
    quantity: 120,
    amount: 36000,
    status: OrderStatus.SHIPPED,
    orderDate: '2023-10-10',
    deliveryDate: '2023-10-25',
    items: [
      { productName: '办公椅 X200', model: 'OC-X200', quantity: 120, unitPrice: 300, unit: '把', amount: 36000 }
    ],
    materials: [],
    otherCost: 0
  },
  {
    id: 'ORD-2023-003',
    customerName: '极速物流中心',
    productName: '重型货架',
    quantity: 20,
    amount: 45000,
    status: OrderStatus.PRODUCTION,
    orderDate: '2023-10-20',
    deliveryDate: '2023-11-05',
    items: [
      { productName: '重型货架', model: 'SR-H01', quantity: 20, unitPrice: 2250, unit: '组', amount: 45000 }
    ],
    materials: [],
    otherCost: 0
  },
  {
    id: 'ORD-2023-004',
    customerName: '美好生活馆',
    productName: '简约茶几',
    quantity: 200,
    amount: 18000,
    status: OrderStatus.PENDING,
    orderDate: '2023-10-26',
    deliveryDate: '2023-11-15',
    items: [
      { productName: '简约茶几', model: 'CT-S05', quantity: 200, unitPrice: 90, unit: '个', amount: 18000 }
    ],
    materials: [],
    otherCost: 0
  },
  {
    id: 'ORD-2023-005',
    customerName: '科技园采购部',
    productName: '升降办公桌',
    quantity: 15,
    amount: 22500,
    status: OrderStatus.PENDING,
    orderDate: '2023-10-27',
    deliveryDate: '2023-11-10',
    items: [
      { productName: '升降办公桌', model: 'OD-L02', quantity: 15, unitPrice: 1500, unit: '张', amount: 22500 }
    ],
    materials: [],
    otherCost: 0
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TRX-001',
    date: '2023-10-01',
    description: '尚品家居订单首款',
    amount: 10000,
    type: TransactionType.INCOME,
    category: '销售回款'
  },
  {
    id: 'TRX-002',
    date: '2023-10-02',
    description: '原材料采购 (木材)',
    amount: 8500,
    type: TransactionType.EXPENSE,
    category: '原材料'
  },
  {
    id: 'TRX-003',
    date: '2023-10-05',
    description: '工厂水电费 (9月)',
    amount: 3200,
    type: TransactionType.EXPENSE,
    category: '运营成本'
  },
  {
    id: 'TRX-004',
    date: '2023-10-15',
    description: '尚品家居订单尾款',
    amount: 15000,
    type: TransactionType.INCOME,
    category: '销售回款'
  },
  {
    id: 'TRX-005',
    date: '2023-10-20',
    description: '设备维护费',
    amount: 1200,
    type: TransactionType.EXPENSE,
    category: '维修保养'
  },
  {
    id: 'TRX-006',
    date: '2023-10-22',
    description: '蓝天贸易全款',
    amount: 36000,
    type: TransactionType.INCOME,
    category: '销售回款'
  }
];
