
import React, { useState } from 'react';
import { Customer } from '../types';
import { Search, Plus, Users, Phone, MapPin, User, X } from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ customers, onAddCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    address: ''
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCustomer(newCustomer);
    setIsModalOpen(false);
    setNewCustomer({ name: '', contactPerson: '', phone: '', address: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索客户名称或联系人..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          <span>新增客户</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
                <Users size={24} />
              </div>
              <span className="text-xs font-mono text-gray-400">{customer.id}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{customer.name}</h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400"/>
                <span>{customer.contactPerson}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gray-400"/>
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400"/>
                <span className="truncate">{customer.address}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            未找到匹配的客户
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-gray-900">新增客户档案</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                 <X size={20}/>
               </button>
            </div>
           
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newCustomer.contactPerson}
                    onChange={e => setNewCustomer({...newCustomer, contactPerson: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newCustomer.address}
                  onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                />
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  保存客户
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
