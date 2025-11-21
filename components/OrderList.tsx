
import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { Order, OrderStatus, Customer, Product, Material, OrderItem, User, UserRole, Transaction } from '../types';
import { Plus, Search, FileText, X, Calendar, Printer, Trash2, Edit3, Package, ShoppingCart, Truck, CheckSquare, AlertCircle, CreditCard, History } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  customers: Customer[];
  products: Product[];
  onStatusChange: (id: string, status: OrderStatus) => void;
  onAddOrder: (order: Omit<Order, 'id'> & { id?: string }) => void;
  onUpdateOrder: (order: Order) => void;
  currentUser: User;
  transactions: Transaction[];
}

// Memoized Order Row
const OrderRow = memo(({ order, onClick, onStatusClick }: { order: Order, onClick: () => void, onStatusClick: (e: React.MouseEvent) => void }) => {
  // Helper to display product summary
  const displayProductName = order.items && order.items.length > 1 
    ? `${order.items[0].productName} 等${order.items.length}件商品` 
    : order.productName;

  // Calc Shipped Progress
  const totalQty = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  const totalShipped = order.items?.reduce((sum, i) => sum + (i.shippedQuantity || 0), 0) || 0;
  const progress = totalQty > 0 ? Math.round((totalShipped / totalQty) * 100) : 0;

  // Calc Payment Status
  const paid = order.paidAmount || 0;
  const isFullyPaid = paid >= order.amount;
  const paidPct = order.amount > 0 ? Math.round((paid / order.amount) * 100) : 100;

  return (
    <tr 
      className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <td className="px-6 py-4 font-medium text-blue-600 group-hover:underline underline-offset-2">{order.id}</td>
      <td className="px-6 py-4 text-gray-600">{order.customerName}</td>
      <td className="px-6 py-4 text-gray-600">
        {displayProductName}
        {order.items && order.items.length > 1 && (
             <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
               共{order.quantity}件
             </span>
        )}
        {totalQty > 0 && (
          <div className="w-24 mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
             <div className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-gray-900 font-medium">
        <div>¥{order.amount.toLocaleString()}</div>
        <div className={`text-xs mt-0.5 ${isFullyPaid ? 'text-green-600' : 'text-orange-500'}`}>
            {isFullyPaid ? '已付清' : `已付 ${paidPct}%`}
        </div>
      </td>
      <td className="px-6 py-4 text-gray-600">{order.deliveryDate}</td>
      <td className="px-6 py-4" onClick={onStatusClick}>
        <span 
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
            ${order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' : 
              order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
              order.status === OrderStatus.SHIPPED ? 'bg-blue-100 text-blue-700' :
              order.status === OrderStatus.CANCELLED ? 'bg-gray-100 text-gray-700' :
              'bg-purple-100 text-purple-700'}`}
        >
          {order.status}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <button className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors">
          <Edit3 size={16}/>
        </button>
      </td>
    </tr>
  );
});
OrderRow.displayName = 'OrderRow';

export const OrderList: React.FC<OrderListProps> = ({ orders, customers, products, onStatusChange, onAddOrder, onUpdateOrder, currentUser, transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  
  // Detail State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Print & Shipment State
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [shipmentConfig, setShipmentConfig] = useState<{ [itemIndex: number]: number }>({});
  const [printItems, setPrintItems] = useState<OrderItem[]>([]);

  // Summary Filter State
  const [summaryConfig, setSummaryConfig] = useState({
    customer: '',
    periodType: 'MONTH' as 'MONTH' | 'QUARTER',
    year: new Date().getFullYear(),
    value: new Date().getMonth() + 1
  });

  // --- NEW ORDER FORM STATE ---
  const [newOrderHeader, setNewOrderHeader] = useState({
    id: '', // Optional Custom ID
    customerName: '',
    status: OrderStatus.PENDING,
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: ''
  });

  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
  
  // Temporary state for the item being added
  const [tempItem, setTempItem] = useState({
    productId: '',
    productName: '',
    model: '',
    quantity: 1,
    unitPrice: 0,
    unit: '件'
  });

  // Material State for Details
  const [newMaterial, setNewMaterial] = useState<Omit<Material, 'id'>>({
    name: '',
    quantity: 1,
    unitPrice: 0,
    unit: '个'
  });

  // Calculate totals for New Order
  const newOrderTotalAmount = useMemo(() => newOrderItems.reduce((acc, item) => acc + item.amount, 0), [newOrderItems]);
  const newOrderTotalQty = useMemo(() => newOrderItems.reduce((acc, item) => acc + item.quantity, 0), [newOrderItems]);

  // Permissions
  const canViewCost = currentUser.role !== UserRole.SALES;

  // Optimize filtering
  const filteredOrders = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return orders.filter(order => {
      const matchesSearch = order.customerName.toLowerCase().includes(lowerSearch) ||
                            order.productName.toLowerCase().includes(lowerSearch) ||
                            order.id.toLowerCase().includes(lowerSearch);
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Filter transactions for current order
  const orderTransactions = useMemo(() => {
    if (!editingOrder) return [];
    return transactions.filter(t => t.relatedOrderId === editingOrder.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, editingOrder]);

  const uniqueCustomers = useMemo(() => {
     const orderCustomers = Array.from(new Set(orders.map(o => o.customerName)));
     const listCustomers = customers.map(c => c.name);
     return Array.from(new Set([...orderCustomers, ...listCustomers])).sort();
  }, [orders, customers]);

  const summaryData = useMemo(() => {
    if (!summaryConfig.customer) return null;

    const targetOrders = orders.filter(order => {
      if (order.customerName !== summaryConfig.customer) return false;
      if (order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.COMPLETED) return false;

      const date = new Date(order.deliveryDate || order.orderDate); 
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      if (year !== summaryConfig.year) return false;

      if (summaryConfig.periodType === 'MONTH') {
        return month === summaryConfig.value;
      } else {
        const quarter = Math.ceil(month / 3);
        return quarter === summaryConfig.value;
      }
    });

    const totalQuantity = targetOrders.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalAmount = targetOrders.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      items: targetOrders,
      totalQuantity,
      totalAmount
    };
  }, [orders, summaryConfig]);

  const handleStatusUpdate = (id: string, newStatus: string) => {
    onStatusChange(id, newStatus as OrderStatus);
    if (editingOrder && editingOrder.id === id) {
      setEditingOrder({ ...editingOrder, status: newStatus as OrderStatus });
    }
  };

  // --- NEW ORDER HANDLERS ---
  
  const handleTempProductSelect = (productName: string) => {
    const product = products.find(p => p.name === productName);
    if (product) {
      setTempItem(prev => ({
        ...prev,
        productId: product.id,
        productName: product.name,
        model: product.model,
        unitPrice: product.unitPrice,
        unit: product.unit
      }));
    } else {
        setTempItem(prev => ({ ...prev, productName: '', unitPrice: 0 }));
    }
  };

  const handleAddLineItem = () => {
    if (!tempItem.productName || tempItem.quantity <= 0) return;
    
    const newItem: OrderItem = {
        ...tempItem,
        amount: tempItem.quantity * tempItem.unitPrice,
        shippedQuantity: 0 // Init shipped
    };

    setNewOrderItems([...newOrderItems, newItem]);
    
    setTempItem(prev => ({
        ...prev,
        productName: '',
        productId: '',
        model: '',
        quantity: 1,
        unitPrice: 0
    }));
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = [...newOrderItems];
    updated.splice(index, 1);
    setNewOrderItems(updated);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrderItems.length === 0) {
        alert("请至少添加一个产品");
        return;
    }

    // Check for duplicate ID if provided
    if (newOrderHeader.id && newOrderHeader.id.trim() !== '') {
      if (orders.some(o => o.id === newOrderHeader.id.trim())) {
        alert(`订单号 "${newOrderHeader.id}" 已存在，请使用其他单号或留空自动生成。`);
        return;
      }
    }

    onAddOrder({
      ...newOrderHeader,
      productName: newOrderItems[0].productName + (newOrderItems.length > 1 ? ` 等${newOrderItems.length}种` : ''),
      quantity: newOrderTotalQty,
      amount: newOrderTotalAmount,
      items: newOrderItems,
      materials: [],
      otherCost: 0
    });

    setIsModalOpen(false);
    setNewOrderHeader({
      id: '',
      customerName: '',
      status: OrderStatus.PENDING,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: ''
    });
    setNewOrderItems([]);
  };

  // --- DETAIL HANDLERS ---

  const openDetailModal = (order: Order) => {
    setSelectedOrder(order);
    const items = order.items || [{
        productName: order.productName,
        model: '-',
        quantity: order.quantity,
        shippedQuantity: 0,
        unitPrice: order.quantity ? order.amount / order.quantity : 0,
        unit: '件',
        amount: order.amount
    }];
    
    // Ensure shippedQuantity exists
    const safeItems = items.map(i => ({...i, shippedQuantity: i.shippedQuantity || 0}));

    setEditingOrder({ 
        ...order, 
        items: safeItems,
        materials: order.materials || [], 
        otherCost: order.otherCost || 0 
    });
    setIsDetailModalOpen(true);
  };

  const handleAddMaterial = () => {
    if (!editingOrder || !newMaterial.name) return;
    const material: Material = {
      ...newMaterial,
      id: `MAT-${Date.now()}`
    };
    const updatedMaterials = [...(editingOrder.materials || []), material];
    setEditingOrder({ ...editingOrder, materials: updatedMaterials });
    setNewMaterial({ name: '', quantity: 1, unitPrice: 0, unit: '个' });
  };

  const handleRemoveMaterial = (matId: string) => {
    if (!editingOrder) return;
    const updatedMaterials = editingOrder.materials?.filter(m => m.id !== matId) || [];
    setEditingOrder({ ...editingOrder, materials: updatedMaterials });
  };

  const handleSaveOrderDetails = () => {
    if (editingOrder) {
      onUpdateOrder(editingOrder);
      setIsDetailModalOpen(false);
    }
  };

  // --- SHIPMENT & PRINTING HANDLERS ---

  const openShipmentConfig = () => {
    if (!editingOrder || !editingOrder.items) return;
    // Initialize with remaining quantity
    const initialConfig: { [index: number]: number } = {};
    editingOrder.items.forEach((item, idx) => {
        const remaining = Math.max(0, item.quantity - (item.shippedQuantity || 0));
        initialConfig[idx] = remaining;
    });
    setShipmentConfig(initialConfig);
    setIsShipmentModalOpen(true);
  };

  const handleConfirmShipmentAndPrint = () => {
    if (!editingOrder || !editingOrder.items) return;

    // 1. Prepare Items for Print View (Only items with currentShip > 0)
    const itemsToPrint = editingOrder.items.map((item, idx) => {
        const currentShip = shipmentConfig[idx] || 0;
        if (currentShip <= 0) return null;
        return {
            ...item,
            quantity: currentShip // Override quantity for the print view only
        };
    }).filter(Boolean) as OrderItem[];

    if (itemsToPrint.length === 0) {
        alert("本次发货数量均为0，无法生成送货单。");
        return;
    }

    setPrintItems(itemsToPrint);

    // 2. Update Order Data (Accumulate shippedQuantity)
    const updatedItems = editingOrder.items.map((item, idx) => ({
        ...item,
        shippedQuantity: (item.shippedQuantity || 0) + (shipmentConfig[idx] || 0)
    }));

    // Check completion
    const totalOrdered = updatedItems.reduce((s, i) => s + i.quantity, 0);
    const totalShipped = updatedItems.reduce((s, i) => s + (i.shippedQuantity || 0), 0);
    
    let newStatus = editingOrder.status;
    if (totalShipped >= totalOrdered && totalOrdered > 0) {
        newStatus = OrderStatus.COMPLETED;
    } else if (totalShipped > 0) {
        newStatus = OrderStatus.SHIPPED;
    }

    const updatedOrder = {
        ...editingOrder,
        items: updatedItems,
        status: newStatus
    };

    // Save to DB (State)
    onUpdateOrder(updatedOrder);
    setEditingOrder(updatedOrder); // Update local state to reflect changes immediately

    // 3. Switch Modals
    setIsShipmentModalOpen(false);
    setIsPrintPreviewOpen(true);
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  // Stats
  const totalMaterialCost = useMemo(() => 
    editingOrder?.materials?.reduce((sum, m) => sum + (m.unitPrice * m.quantity), 0) || 0,
  [editingOrder?.materials]);

  const totalCost = totalMaterialCost + (editingOrder?.otherCost || 0);
  const estimatedProfit = (editingOrder?.amount || 0) - totalCost;
  const profitMargin = editingOrder?.amount ? ((estimatedProfit / editingOrder.amount) * 100).toFixed(1) : '0';
  
  // Financial Stats for Detail View
  const paidAmount = editingOrder?.paidAmount || 0;
  const remainingBalance = (editingOrder?.amount || 0) - paidAmount;
  const paymentStatus = paidAmount >= (editingOrder?.amount || 0) ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID';

  return (
    <div className="space-y-6">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
              height: auto;
              overflow: visible;
            }
            #root { display: none; }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: fixed;
              left: 0;
              top: 0;
              width: 100%;
              height: auto;
              background: white;
              z-index: 99999;
              padding: 15mm;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      {/* Header Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="relative w-full xl:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索订单..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <select
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">所有状态</option>
            {Object.values(OrderStatus).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={() => setIsSummaryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <FileText size={18} />
            <span className="hidden sm:inline">订单汇总</span>
          </button>

          {currentUser.role !== UserRole.FINANCE && (
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                <Plus size={18} />
                <span>新建订单</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-600">订单号</th>
                <th className="px-6 py-4 font-medium text-gray-600">客户</th>
                <th className="px-6 py-4 font-medium text-gray-600">产品概要 (进度)</th>
                <th className="px-6 py-4 font-medium text-gray-600">总金额 / 财务</th>
                <th className="px-6 py-4 font-medium text-gray-600">交付日期</th>
                <th className="px-6 py-4 font-medium text-gray-600">状态</th>
                <th className="px-6 py-4 font-medium text-gray-600 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <OrderRow 
                  key={order.id} 
                  order={order} 
                  onClick={() => openDetailModal(order)}
                  onStatusClick={(e) => e.stopPropagation()}
                />
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    暂无订单数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Modal (Cart Style) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
               <h3 className="text-lg font-bold text-gray-900">新建订单</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                 <X size={20}/>
               </button>
            </div>
            
            <form onSubmit={handleSubmitOrder} className="space-y-6 flex-1 overflow-y-auto">
              
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  {/* Custom Order ID Input */}
                  <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 mb-1">订单编号 (选填)</label>
                     <input
                       type="text"
                       className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 placeholder-gray-300"
                       placeholder="如果不填则自动生成"
                       value={newOrderHeader.id}
                       onChange={e => setNewOrderHeader({...newOrderHeader, id: e.target.value})}
                     />
                     <p className="text-xs text-gray-400 mt-1">如果客户指定了订单号，请在此处输入。</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">客户名称</label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={newOrderHeader.customerName}
                      onChange={e => setNewOrderHeader({...newOrderHeader, customerName: e.target.value})}
                    >
                      <option value="">-- 请选择客户 --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">预计交付日期</label>
                    <input
                      required
                      type="date"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newOrderHeader.deliveryDate}
                      onChange={e => setNewOrderHeader({...newOrderHeader, deliveryDate: e.target.value})}
                    />
                  </div>
              </div>

              {/* Add Item Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                   <ShoppingCart size={16} className="text-blue-600"/>
                   添加产品明细
                </label>
                <div className="flex flex-col md:flex-row gap-2 items-end bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                   <div className="flex-1 w-full">
                     <span className="text-xs text-gray-500 mb-1 block">选择产品</span>
                     <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                        value={tempItem.productName}
                        onChange={e => handleTempProductSelect(e.target.value)}
                      >
                         <option value="">-- 选择产品 --</option>
                         {products.map(p => (
                           <option key={p.id} value={p.name}>{p.name} ({p.model})</option>
                         ))}
                      </select>
                   </div>
                   <div className="w-24">
                      <span className="text-xs text-gray-500 mb-1 block">数量</span>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={tempItem.quantity}
                        onChange={e => setTempItem({...tempItem, quantity: parseInt(e.target.value) || 0})}
                      />
                   </div>
                   <div className="w-24">
                      <span className="text-xs text-gray-500 mb-1 block">单价</span>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-100"
                        value={tempItem.unitPrice}
                        readOnly
                      />
                   </div>
                   <button
                     type="button"
                     onClick={handleAddLineItem}
                     disabled={!tempItem.productName || tempItem.quantity <= 0}
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center gap-1 text-sm h-[38px]"
                   >
                     <Plus size={16}/> 添加
                   </button>
                </div>
              </div>

              {/* Items List */}
              <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-2 text-left">产品名称</th>
                        <th className="px-4 py-2 text-left">型号</th>
                        <th className="px-4 py-2 text-right">单价</th>
                        <th className="px-4 py-2 text-right">数量</th>
                        <th className="px-4 py-2 text-right">小计</th>
                        <th className="px-4 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {newOrderItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                            暂无产品，请在上方添加
                          </td>
                        </tr>
                      ) : (
                        newOrderItems.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                             <td className="px-4 py-2">{item.productName}</td>
                             <td className="px-4 py-2 text-gray-500">{item.model}</td>
                             <td className="px-4 py-2 text-right text-gray-500">¥{item.unitPrice}</td>
                             <td className="px-4 py-2 text-right font-medium">{item.quantity}</td>
                             <td className="px-4 py-2 text-right font-bold text-blue-600">¥{item.amount.toLocaleString()}</td>
                             <td className="px-4 py-2 text-center">
                               <button
                                 type="button"
                                 onClick={() => handleRemoveLineItem(index)} 
                                 className="text-red-400 hover:text-red-600"
                               >
                                 <Trash2 size={16}/>
                               </button>
                             </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {newOrderItems.length > 0 && (
                        <tfoot className="bg-gray-50 font-bold text-gray-800">
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-right">总计:</td>
                                <td className="px-4 py-3 text-right">{newOrderTotalQty}</td>
                                <td className="px-4 py-3 text-right text-blue-700 text-lg">¥{newOrderTotalAmount.toLocaleString()}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    )}
                  </table>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  生成订单
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {isDetailModalOpen && editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col">
             {/* Detail Header */}
             <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-xl shrink-0">
               <div>
                 <div className="flex items-center gap-3 mb-1">
                   <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      订单详情 <span className="text-gray-400 text-base font-normal">#{editingOrder.id}</span>
                   </h2>
                 </div>
                 <p className="text-gray-500 flex flex-wrap items-center gap-2 text-sm">
                   <span className="font-medium text-gray-700">{editingOrder.customerName}</span> 
                   <span className="hidden sm:inline">•</span>
                   <span>共 {editingOrder.quantity} 件商品</span>
                   <span className="hidden sm:inline">•</span>
                   <span className="text-blue-600 font-bold">¥{editingOrder.amount.toLocaleString()}</span>
                 </p>
               </div>
               <div className="flex gap-2">
                 <button 
                   onClick={openShipmentConfig}
                   className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white border border-teal-600 rounded-lg hover:bg-teal-700 text-sm shadow-sm"
                 >
                   <Printer size={16}/> <span className="hidden sm:inline">打印送货单/出货</span>
                 </button>
                 <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                   <X size={20}/>
                 </button>
               </div>
             </div>

             <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto">
               {/* Left: Info & Status */}
               <div className="lg:col-span-1 space-y-6">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-blue-800 mb-3 text-sm uppercase">订单状态流转</h3>
                    <div className="space-y-2">
                      {Object.values(OrderStatus).map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(editingOrder.id, status)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex justify-between items-center
                            ${editingOrder.status === status 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'bg-white hover:bg-blue-100 text-gray-600'}`}
                        >
                          <span>{status}</span>
                          {editingOrder.status === status && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase">基本信息</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-500">下单日期</span>
                        <span className="font-medium">{editingOrder.orderDate}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-500">交付日期</span>
                        <input 
                          type="date" 
                          value={editingOrder.deliveryDate}
                          onChange={(e) => setEditingOrder({...editingOrder, deliveryDate: e.target.value})}
                          className="bg-transparent font-medium text-right focus:outline-none focus:text-blue-600 w-32"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Status Card */}
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <h3 className="font-bold text-emerald-800 mb-3 text-sm uppercase flex items-center gap-2">
                          <CreditCard size={16}/> 财务状态
                      </h3>
                      <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-end">
                             <span className="text-gray-600">订单总额</span>
                             <span className="font-bold text-gray-900">¥{editingOrder.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-end">
                             <span className="text-gray-600">已收定金/款项</span>
                             <span className="font-bold text-green-600">¥{paidAmount.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-green-500 h-full" style={{width: `${(paidAmount / (editingOrder.amount || 1)) * 100}%`}}></div>
                          </div>
                          <div className="flex justify-between items-end pt-2 border-t border-emerald-200">
                             <span className="text-gray-600 font-medium">剩余尾款</span>
                             <span className={`font-bold text-lg ${remainingBalance > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                 ¥{remainingBalance.toLocaleString()}
                             </span>
                          </div>
                      </div>
                      
                      {/* Transaction History */}
                      <div className="mt-4 pt-4 border-t border-emerald-200">
                         <h4 className="text-xs font-bold text-emerald-700 mb-2 uppercase flex items-center gap-1">
                            <History size={12}/> 收款记录
                         </h4>
                         {orderTransactions.length > 0 ? (
                             <ul className="space-y-2">
                                 {orderTransactions.map(t => (
                                     <li key={t.id} className="text-xs flex justify-between text-gray-600 bg-white/50 p-1.5 rounded">
                                         <span>{t.date}</span>
                                         <span className="font-medium text-green-600">+¥{t.amount.toLocaleString()}</span>
                                     </li>
                                 ))}
                             </ul>
                         ) : (
                             <p className="text-xs text-gray-400 italic">暂无关联收款记录</p>
                         )}
                      </div>
                  </div>
               </div>

               {/* Right: Items & BOM & Cost */}
               <div className="lg:col-span-2 space-y-8">
                  
                  {/* Order Items List */}
                  <div>
                     <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <ShoppingCart size={20} className="text-blue-600"/>
                      订单内容明细
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                       <table className="w-full text-sm">
                         <thead className="bg-gray-50 text-gray-600">
                           <tr>
                             <th className="px-4 py-2 text-left">产品</th>
                             <th className="px-4 py-2 text-right">单价</th>
                             <th className="px-4 py-2 text-center">发货进度</th>
                             <th className="px-4 py-2 text-right">金额</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                            {editingOrder.items && editingOrder.items.map((item, idx) => {
                                const shipped = item.shippedQuantity || 0;
                                const pct = Math.min(100, Math.round((shipped / item.quantity) * 100));
                                return (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">
                                        <div className="font-medium">{item.productName}</div>
                                        <div className="text-xs text-gray-500">{item.model}</div>
                                    </td>
                                    <td className="px-4 py-2 text-right text-gray-500">¥{item.unitPrice}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
                                                <div className={`h-full ${pct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{width: `${pct}%`}}></div>
                                            </div>
                                            <div className="text-xs whitespace-nowrap font-mono">
                                                {shipped} / {item.quantity} {item.unit}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium">¥{item.amount.toLocaleString()}</td>
                                  </tr>
                                );
                            })}
                         </tbody>
                         <tfoot className="bg-gray-50 font-bold text-gray-700">
                             <tr>
                                 <td colSpan={3} className="px-4 py-2 text-right">合计:</td>
                                 <td className="px-4 py-2 text-right">¥{editingOrder.amount.toLocaleString()}</td>
                             </tr>
                         </tfoot>
                       </table>
                    </div>
                  </div>

                  {/* BOM Section (Only for non-Sales) */}
                  {canViewCost && (
                  <div>
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Package size={20} className="text-purple-600"/>
                      物料清单 (BOM) 与成本核算
                    </h3>
                    
                    <div className="border rounded-lg overflow-x-auto mb-4">
                      <table className="w-full text-sm min-w-[500px]">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-4 py-2 text-left">物料名称</th>
                            <th className="px-4 py-2 text-right">数量/单位</th>
                            <th className="px-4 py-2 text-right">单价</th>
                            <th className="px-4 py-2 text-right">小计</th>
                            <th className="px-4 py-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {editingOrder.materials?.map(mat => (
                            <tr key={mat.id}>
                              <td className="px-4 py-2">{mat.name}</td>
                              <td className="px-4 py-2 text-right">{mat.quantity} {mat.unit}</td>
                              <td className="px-4 py-2 text-right text-gray-500">¥{mat.unitPrice}</td>
                              <td className="px-4 py-2 text-right font-medium">¥{mat.quantity * mat.unitPrice}</td>
                              <td className="px-4 py-2 text-center">
                                <button 
                                  onClick={() => handleRemoveMaterial(mat.id)}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <Trash2 size={14}/>
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50">
                            <td className="px-4 py-2">
                              <input 
                                type="text" 
                                placeholder="新物料名称"
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                                value={newMaterial.name}
                                onChange={e => setNewMaterial({...newMaterial, name: e.target.value})}
                              />
                            </td>
                            <td className="px-4 py-2 flex gap-1">
                              <input 
                                type="number" 
                                placeholder="数量"
                                className="w-16 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-right"
                                value={newMaterial.quantity}
                                onChange={e => setNewMaterial({...newMaterial, quantity: parseFloat(e.target.value)})}
                              />
                              <input 
                                type="text" 
                                placeholder="单位"
                                className="w-12 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-center"
                                value={newMaterial.unit}
                                onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})}
                              />
                            </td>
                            <td className="px-4 py-2">
                               <input 
                                type="number" 
                                placeholder="单价"
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-right"
                                value={newMaterial.unitPrice}
                                onChange={e => setNewMaterial({...newMaterial, unitPrice: parseFloat(e.target.value)})}
                              />
                            </td>
                            <td className="px-4 py-2 text-right text-gray-400 text-xs">
                              ¥{newMaterial.quantity * newMaterial.unitPrice}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button 
                                onClick={handleAddMaterial}
                                className="text-blue-500 hover:text-blue-700"
                                disabled={!newMaterial.name}
                              >
                                <Plus size={16}/>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Cost Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl">
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">其他成本 (人工/运输)</label>
                        <div className="flex items-center mt-1">
                          <span className="text-gray-400 mr-1">¥</span>
                          <input 
                            type="number"
                            value={editingOrder.otherCost}
                            onChange={(e) => setEditingOrder({...editingOrder, otherCost: parseFloat(e.target.value) || 0})}
                            className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full font-medium text-gray-800"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">总成本</label>
                        <p className="text-xl font-bold text-gray-800 mt-1">¥{totalCost.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">预估毛利</label>
                        <div className="flex items-end gap-2">
                          <p className={`text-xl font-bold mt-1 ${estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ¥{estimatedProfit.toLocaleString()}
                          </p>
                          <span className={`text-xs mb-1 font-medium px-2 py-0.5 rounded ${estimatedProfit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {profitMargin}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
               </div>
             </div>

             <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl shrink-0">
               <button 
                 onClick={() => setIsDetailModalOpen(false)}
                 className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
               >
                 取消
               </button>
               <button 
                 onClick={handleSaveOrderDetails}
                 className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform active:scale-95"
               >
                 保存更改
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Shipment Configuration Modal */}
      {isShipmentModalOpen && editingOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[55] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Truck size={20} className="text-teal-600"/>
                            出货配置
                        </h3>
                        <p className="text-sm text-gray-500">请确认本次发货的产品数量，系统将生成相应的送货单。</p>
                    </div>
                    <button onClick={() => setIsShipmentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20}/>
                    </button>
                </div>
                
                <div className="p-6">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-4 py-2 text-left">产品</th>
                                <th className="px-4 py-2 text-center">订单总数</th>
                                <th className="px-4 py-2 text-center">已发数量</th>
                                <th className="px-4 py-2 text-center w-32 text-teal-700 font-bold">本次发货</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {editingOrder.items.map((item, idx) => {
                                const shipped = item.shippedQuantity || 0;
                                const remaining = Math.max(0, item.quantity - shipped);
                                return (
                                    <tr key={idx}>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{item.productName}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-500">{item.quantity}</td>
                                        <td className="px-4 py-3 text-center text-gray-500">{shipped}</td>
                                        <td className="px-4 py-3">
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max={remaining}
                                                value={shipmentConfig[idx] ?? 0}
                                                onChange={(e) => setShipmentConfig({
                                                    ...shipmentConfig, 
                                                    [idx]: parseInt(e.target.value) || 0
                                                })}
                                                className="w-full border-2 border-teal-100 focus:border-teal-500 rounded-md px-2 py-1 text-center font-bold text-gray-800 focus:outline-none"
                                            />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-md mt-4 flex gap-2 items-start">
                        <AlertCircle size={14} className="mt-0.5 shrink-0"/>
                        <p>注意：点击确认后，系统将累加已发货数量并更新订单进度。本次发货数量为0的项目将不会出现在送货单上。</p>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end gap-3 border-t border-gray-100">
                    <button 
                        onClick={() => setIsShipmentModalOpen(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleConfirmShipmentAndPrint}
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-lg transition-colors flex items-center gap-2"
                    >
                        <CheckSquare size={18}/>
                        确认发货并预览
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Delivery Note Print Preview Modal */}
      {isPrintPreviewOpen && editingOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] overflow-auto p-4 backdrop-blur-sm">
          <div className="bg-gray-100 w-full max-w-3xl flex flex-col max-h-full rounded-lg shadow-2xl">
             <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-lg no-print shrink-0">
               <h3 className="font-bold text-gray-800">送货单预览 (本次发货)</h3>
               <div className="flex gap-2">
                 <button onClick={handleBrowserPrint} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
                   <Printer size={16}/> 立即打印
                 </button>
                 <button onClick={() => setIsPrintPreviewOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                   关闭
                 </button>
               </div>
             </div>

             <div className="flex-1 overflow-y-auto p-8 bg-gray-500 no-print">
                <div className="print-area bg-white p-12 mx-auto shadow-lg max-w-[210mm] min-h-[297mm] relative text-black">
                   
                   <div className="text-center border-b-2 border-black pb-4 mb-8">
                     <h1 className="text-3xl font-bold tracking-widest mb-2">送货单</h1>
                     <p className="text-sm text-gray-500">DELIVERY NOTE</p>
                   </div>

                   <div className="flex justify-between mb-8 text-sm">
                     <div className="space-y-2">
                       <p><span className="font-bold">客户名称：</span> {editingOrder.customerName}</p>
                       <p><span className="font-bold">联系人：</span> {customers.find(c => c.name === editingOrder.customerName)?.contactPerson || '---'}</p>
                       <p><span className="font-bold">电话：</span> {customers.find(c => c.name === editingOrder.customerName)?.phone || '---'}</p>
                       <p className="max-w-xs"><span className="font-bold">收货地址：</span> {customers.find(c => c.name === editingOrder.customerName)?.address || '---'}</p>
                     </div>
                     <div className="space-y-2 text-right">
                       <p><span className="font-bold">单号：</span> {editingOrder.id}</p>
                       <p><span className="font-bold">下单日期：</span> {editingOrder.orderDate}</p>
                       <p><span className="font-bold">打印日期：</span> {new Date().toLocaleDateString()}</p>
                     </div>
                   </div>

                   <div className="mb-8">
                     <table className="w-full border-collapse border border-black text-sm">
                       <thead>
                         <tr className="bg-gray-100">
                           <th className="border border-black px-4 py-2 w-12">序号</th>
                           <th className="border border-black px-4 py-2">产品名称</th>
                           <th className="border border-black px-4 py-2">规格/型号</th>
                           <th className="border border-black px-4 py-2 text-right">本次发货数量</th>
                           <th className="border border-black px-4 py-2 text-right">单位</th>
                           <th className="border border-black px-4 py-2 text-right">备注</th>
                         </tr>
                       </thead>
                       <tbody>
                         {printItems.map((item, index) => (
                            <tr key={index}>
                               <td className="border border-black px-4 py-3 text-center">{index + 1}</td>
                               <td className="border border-black px-4 py-3">{item.productName}</td>
                               <td className="border border-black px-4 py-3">{item.model}</td>
                               <td className="border border-black px-4 py-3 text-right font-bold">{item.quantity}</td>
                               <td className="border border-black px-4 py-3 text-right">{item.unit}</td>
                               <td className="border border-black px-4 py-3"></td>
                            </tr>
                         ))}
                         {/* Fill empty rows if few items */}
                         {Array.from({ length: Math.max(0, 5 - printItems.length) }).map((_, i) => (
                           <tr key={`empty-${i}`}>
                             <td className="border border-black px-4 py-3 text-center text-transparent">.</td>
                             <td className="border border-black px-4 py-3"></td>
                             <td className="border border-black px-4 py-3"></td>
                             <td className="border border-black px-4 py-3"></td>
                             <td className="border border-black px-4 py-3"></td>
                             <td className="border border-black px-4 py-3"></td>
                           </tr>
                         ))}
                       </tbody>
                       <tfoot>
                         <tr>
                           <td colSpan={3} className="border border-black px-4 py-2 font-bold text-right">合计数量：</td>
                           <td className="border border-black px-4 py-2 text-right font-bold">
                               {printItems.reduce((acc, i) => acc + i.quantity, 0)}
                           </td>
                           <td colSpan={2} className="border border-black"></td>
                         </tr>
                       </tfoot>
                     </table>
                   </div>

                   <div className="flex justify-between mt-16 pt-8">
                      <div className="w-1/3 border-t border-black pt-2">
                        <p className="font-bold mb-8">发货人签字：</p>
                        <p className="text-xs text-gray-500">智造云工厂ERP</p>
                      </div>
                      <div className="w-1/3 border-t border-black pt-2">
                        <p className="font-bold mb-8">客户签收：</p>
                        <p className="text-xs text-gray-500">请确认货物完好无损</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
      
      {/* Summary Report Modal (Existing Code) */}
       {isSummaryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={24} className="text-teal-600"/>
                  出货订单汇总
                </h3>
                <p className="text-sm text-gray-500 mt-1">查看指定客户在特定周期内的已发货/已完成明细。</p>
              </div>
              <button 
                onClick={() => setIsSummaryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full"
              >
                <X size={20}/>
              </button>
            </div>

            {/* Controls */}
            <div className="p-6 bg-gray-50 grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">客户名称</label>
                <select 
                  className="w-full p-2 border border-gray-200 rounded-md text-sm"
                  value={summaryConfig.customer}
                  onChange={(e) => setSummaryConfig({...summaryConfig, customer: e.target.value})}
                >
                  <option value="">-- 选择客户 --</option>
                  {uniqueCustomers.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">年份</label>
                <select 
                  className="w-full p-2 border border-gray-200 rounded-md text-sm"
                  value={summaryConfig.year}
                  onChange={(e) => setSummaryConfig({...summaryConfig, year: parseInt(e.target.value)})}
                >
                  {[0, 1, 2, 3].map(offset => {
                    const y = new Date().getFullYear() - 1 + offset;
                    return <option key={y} value={y}>{y}年</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">统计周期类型</label>
                <div className="flex rounded-md bg-gray-200 p-1">
                  <button
                    onClick={() => setSummaryConfig({...summaryConfig, periodType: 'MONTH', value: 1})}
                    className={`flex-1 text-xs py-1.5 rounded font-medium ${summaryConfig.periodType === 'MONTH' ? 'bg-white shadow text-teal-700' : 'text-gray-600'}`}
                  >
                    按月
                  </button>
                  <button
                    onClick={() => setSummaryConfig({...summaryConfig, periodType: 'QUARTER', value: 1})}
                    className={`flex-1 text-xs py-1.5 rounded font-medium ${summaryConfig.periodType === 'QUARTER' ? 'bg-white shadow text-teal-700' : 'text-gray-600'}`}
                  >
                    按季
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                  {summaryConfig.periodType === 'MONTH' ? '选择月份' : '选择季度'}
                </label>
                <select 
                  className="w-full p-2 border border-gray-200 rounded-md text-sm"
                  value={summaryConfig.value}
                  onChange={(e) => setSummaryConfig({...summaryConfig, value: parseInt(e.target.value)})}
                >
                  {summaryConfig.periodType === 'MONTH' ? (
                    Array.from({length: 12}, (_, i) => (
                      <option key={i+1} value={i+1}>{i+1}月</option>
                    ))
                  ) : (
                    [1, 2, 3, 4].map(q => (
                      <option key={q} value={q}>第{q}季度</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-6">
              {!summaryConfig.customer ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 min-h-[200px]">
                  <Calendar size={48} className="text-gray-200"/>
                  <p>请选择客户以开始查询</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-teal-50 border border-teal-100 p-4 rounded-lg">
                      <p className="text-xs text-teal-600 mb-1">周期内总出货量</p>
                      <p className="text-2xl font-bold text-teal-800">{summaryData?.totalQuantity || 0} <span className="text-sm font-normal">件</span></p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1">周期内总金额</p>
                      <p className="text-2xl font-bold text-blue-800">¥{(summaryData?.totalAmount || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Detail Table */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                      <span className="w-1 h-4 bg-teal-500 rounded-full"></span>
                      出货明细列表
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                          <tr>
                            <th className="px-4 py-3">交付/发货日期</th>
                            <th className="px-4 py-3">品名摘要</th>
                            <th className="px-4 py-3 text-right">总数量</th>
                            <th className="px-4 py-3 text-right">总金额</th>
                            <th className="px-4 py-3 text-center">状态</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {summaryData?.items.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-400">该周期内无出货记录</td>
                            </tr>
                          ) : (
                            summaryData?.items.map(item => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{item.deliveryDate || item.orderDate}</td>
                                <td className="px-4 py-3 font-medium">
                                    {item.productName}
                                </td>
                                <td className="px-4 py-3 text-right">{item.quantity}</td>
                                <td className="px-4 py-3 text-right">¥{item.amount.toLocaleString()}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${item.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end shrink-0">
              <button 
                onClick={() => setIsSummaryModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
