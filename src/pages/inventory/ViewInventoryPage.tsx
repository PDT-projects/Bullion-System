import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Eye, Edit, Trash2, X, Filter, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../../providers/context/DataContext';
import { Product } from '../../App';

export function ViewInventoryPage() {
  const navigate = useNavigate();
  const { data, setData } = useData();
  
  // Use products from global data context
  const [products, setProducts] = useState<Product[]>(data.products);

  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  
  // Filters
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Get unique values for filters
  const uniqueBrands = Array.from(new Set(products.map(p => p.brandName))).sort();
  const uniqueCategories = Array.from(new Set(products.map(p => p.category))).sort();

  // Apply filters
  const filteredProducts = products.filter(product => {
    if (brandFilter && !product.brandName.toLowerCase().includes(brandFilter.toLowerCase())) {
      return false;
    }
    if (categoryFilter && product.category !== categoryFilter) {
      return false;
    }
    if (statusFilter && product.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const updatedProducts = products.filter(p => p.id !== id);
      setProducts(updatedProducts);
      // Update global data
      setData((prev: typeof data) => ({ ...prev, products: updatedProducts }));
      toast.success('Product deleted successfully');
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const clearFilters = () => {
    setBrandFilter('');
    setCategoryFilter('');
    setStatusFilter('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="inventory-entry-container max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/inventory')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>
            <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-2">
                View Inventory
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Manage and view all your inventory items
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg"
          >
            <Plus size={20} />
            Add New Item
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                placeholder="Search brand..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Returned">Returned</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Inventory Items</h4>
            <p className="text-gray-600 mb-4">Start by adding your first inventory item.</p>
            <button
              onClick={() => navigate('/inventory')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Add Inventory
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{product.brandName}</h3>
                      <p className="text-sm text-gray-600">{product.modelName}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      product.status === 'New' ? 'bg-green-100 text-green-800' :
                      product.status === 'Used' ? 'bg-blue-100 text-blue-800' :
                      product.status === 'Returned' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-gray-900">{product.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span className="font-medium text-gray-900">{product.stock} units</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cost Price:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(product.costPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sell Price:</span>
                      <span className="font-medium text-green-600">{formatCurrency(product.sellPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Warranty:</span>
                      <span className="font-medium text-gray-900">{product.warrantyYears} years</span>
                    </div>

                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewProduct(product)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      <Eye size={16} />
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/inventory/${product.id}/edit`)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Product Modal */}
        {viewProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold">Product Details</h3>
                <button onClick={() => setViewProduct(null)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Brand</p>
                    <p className="font-medium text-gray-900">{viewProduct.brandName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Model</p>
                    <p className="font-medium text-gray-900">{viewProduct.modelName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium text-gray-900">{viewProduct.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium text-gray-900">{viewProduct.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Stock</p>
                    <p className="font-medium text-gray-900">{viewProduct.stock} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Warranty</p>
                    <p className="font-medium text-gray-900">{viewProduct.warrantyYears} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cost Price</p>
                    <p className="font-medium text-gray-900">{formatCurrency(viewProduct.costPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sell Price</p>
                    <p className="font-medium text-green-600">{formatCurrency(viewProduct.sellPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Buy Type</p>
                    <p className="font-medium text-gray-900">{viewProduct.buyType}</p>
                  </div>
                  {viewProduct.createdDate && (
                    <div>
                      <p className="text-sm text-gray-600">Created Date</p>
                      <p className="font-medium text-gray-900">{viewProduct.createdDate}</p>
                    </div>
                  )}
                </div>
                
                {viewProduct.description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                    <p className="text-gray-900">{viewProduct.description}</p>
                  </div>
                )}

                {viewProduct.serialNumbers.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Serial Numbers ({viewProduct.serialNumbers.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {viewProduct.serialNumbers.map(serial => (
                        <span key={serial} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {serial}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
