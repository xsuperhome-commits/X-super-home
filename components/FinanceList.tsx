
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Order } from '../types';
import { Plus, ArrowUpCircle, ArrowDownCircle, Link as LinkIcon } from 'lucide-react';

interface FinanceListProps {
  transactions: Transaction[];
  orders: Order[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export const FinanceList: React.FC<FinanceListProps> = ({ transactions, orders, onAddTransaction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');

  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: 0,
    type: TransactionType.EXPENSE,
    category: '',
    date: new Date().toISOString().split('T')[0],
    relatedOrderId: ''
  });

  // Compute unpaid orders for the dropdown
  const unpaidOrders = useMemo(() => {
    return orders.filter(o => {
      const paid = o.paidAmount || 0;
      // Show orders where paid < amount (and not cancelled)
      return paid < o.amount && o.status !== '已取消';
    });
  }, [orders]);

  const filteredTransactions = transactions
    .filter(t => filterType === 'ALL' || t.type === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTransaction(newTransaction);
    setIsModalOpen(false);
    setNewTransaction({
      description: '',
      amount: 0,
      type: TransactionType.EXPENSE,
      category: '',
      date: new Date().toISOString().split('T')[0],
      relatedOrderId: ''
    });
  };

  // Find order helper
  const getOrderInfo = (orderId?: string) => {
    if (!orderId) return null;
    return orders.find(o => o.id === orderId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-gray-200 p-1 rounded-lg">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filterType === 'ALL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setFilterType('ALL')}
          >
            全部
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filterType === TransactionType.INCOME ? 'bg-white shadow-sm text-green-700' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setFilterType(TransactionType.INCOME)}
          >
            收入
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filterType === TransactionType.EXPENSE ? 'bg-white shadow-sm text-red-700' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setFilterType(TransactionType.EXPENSE)}
          >
            支出
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>记一笔</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {filteredTransactions.map((t) => {
            const linkedOrder = getOrderInfo(t.relatedOrderId);
            return (
              <li key={t.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${t.type === TransactionType.INCOME ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {t.type === TransactionType.INCOME ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{t.date} · {t.category}</span>
                        {linkedOrder && (
                             <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] border border-blue-100">
                               <LinkIcon size={10}/> 关联: {linkedOrder.customerName}
                             </span>
                        )}
                    </div>
                  </div>
                </div>
                <div className={`font-bold text-lg ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}¥{t.amount.toLocaleString()}
                </div>
              </li>
            );
          })}
          {filteredTransactions.length === 0 && (
             <li className="p-8 text-center text-gray-400">暂无记录</li>
          )}
        </ul>
      </div>

       {/* Add Transaction Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">新增收支记录</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                   <div className="flex rounded-lg bg-gray-100 p-1">
                     <button
                       type="button"
                       onClick={() => setNewTransaction({...newTransaction, type: TransactionType.INCOME, relatedOrderId: ''})}
                       className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-all ${newTransaction.type === TransactionType.INCOME ? 'bg-white shadow text-green-700' : 'text-gray-500'}`}
                     >
                       收入
                     </button>
                     <button
                       type="button"
                       onClick={() => setNewTransaction({...newTransaction, type: TransactionType.EXPENSE, relatedOrderId: ''})}
                       className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-all ${newTransaction.type === TransactionType.EXPENSE ? 'bg-white shadow text-red-700' : 'text-gray-500'}`}
                     >
                       支出
                     </button>
                   </div>
                 </div>
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-gray-700 mb-1">金额</label>
                   <input
                    required
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newTransaction.amount}
                    onChange={e => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value)})}
                  />
                 </div>
              </div>

              {/* Linked Order Dropdown (Only for Income) */}
              {newTransaction.type === TransactionType.INCOME && (
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <LinkIcon size={14}/> 关联订单 (选填)
                     </label>
                     <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                        value={newTransaction.relatedOrderId}
                        onChange={e => setNewTransaction({...newTransaction, relatedOrderId: e.target.value})}
                     >
                        <option value="">-- 不关联 --</option>
                        {unpaidOrders.map(o => (
                            <option key={o.id} value={o.id}>
                                {o.id} - {o.customerName} (欠: ¥{(o.amount - (o.paidAmount || 0)).toLocaleString()})
                            </option>
                        ))}
                     </select>
                     <p className="text-xs text-gray-400 mt-1">关联后，该笔金额将计入订单的“已付金额”。</p>
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newTransaction.description}
                  onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                  placeholder="例如：支付原材料款 / 客户定金"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newTransaction.category}
                    onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
                    placeholder="例如：采购 / 销售回款"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                  <input
                    required
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newTransaction.date}
                    onChange={e => setNewTransaction({...newTransaction, date: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
