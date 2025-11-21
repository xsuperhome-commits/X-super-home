
import React, { useState } from 'react';
import { Product } from '../types';
import { Search, Plus, Package, Tag, Box, X } from 'lucide-react';

interface ProductListProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    model: '',
    unitPrice: 0,
    unit: '件'
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProduct(newProduct);
    setIsModalOpen(false);
    setNewProduct({ name: '', model: '', unitPrice: 0, unit: '件' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索产品名称或型号..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={18} />
          <span>新增产品</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-600">产品型号</th>
              <th className="px-6 py-4 font-medium text-gray-600">产品名称</th>
              <th className="px-6 py-4 font-medium text-gray-600">单位</th>
              <th className="px-6 py-4 font-medium text-gray-600 text-right">单价</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-gray-500 font-mono">{product.model}</td>
                <td className="px-6 py-4 text-gray-900 font-medium flex items-center gap-2">
                   <Package size={16} className="text-orange-400"/>
                   {product.name}
                </td>
                <td className="px-6 py-4 text-gray-600">{product.unit}</td>
                <td className="px-6 py-4 text-gray-900 font-bold text-right">¥{product.unitPrice.toLocaleString()}</td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                  未找到匹配的产品
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-gray-900">新增产品信息</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                 <X size={20}/>
               </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品型号/SKU</label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    value={newProduct.model}
                    onChange={e => setNewProduct({...newProduct, model: e.target.value})}
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">单价 (¥)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    value={newProduct.unitPrice}
                    onChange={e => setNewProduct({...newProduct, unitPrice: parseFloat(e.target.value)})}
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    value={newProduct.unit}
                    onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                    placeholder="个/件/套"
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
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  保存产品
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
