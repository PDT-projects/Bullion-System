import { useState, useMemo } from 'react';
import { Product } from '../App';
import { Plus, Eye, Edit, Trash2, X, Hash, MapPin, Maximize2, Minimize2, Filter } from 'lucide-react';
import { toast } from 'sonner';

type ProductsProps = {
  products: Product[];
  setProducts: (products: Product[]) => void;
  productCosting: any[];
};

const categories = [
  'Detection Equipment',
  'Security Equipment',
  'Imaging Equipment',
  'Surveillance Systems',
  'Access Control',
  'Other'
];

const cities = ['Karachi', 'Lahore', 'Islamabad', 'Bullion RND/SITE'];



export function Products({ products, setProducts, productCosting }: ProductsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Filter states
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);


  
  const [formData, setFormData] = useState<Partial<Product>>({
    brandName: '',
    modelName: '',
    category: '',
    costPrice: 0,
    sellPrice: 0,
    buyType: 'Import',
    warrantyYears: 0,
    stock: 0,
    serialNumbers: [],
    serialCities: {},
    description: '',
    status: 'New'
  });

  // Serial number management
  const [serialInputs, setSerialInputs] = useState<string[]>([]);
  const [serialCities, setSerialCities] = useState<{[key: string]: string}>({});

  // Get unique brands and models from Product Costing
  const getUniqueBrands = () => {
    return Array.from(new Set(productCosting.map(p => p.brandName).filter(Boolean))).sort();
  };

  const getUniqueModels = (brand?: string) => {
    if (brand) {
      return Array.from(new Set(
        productCosting.filter(p => p.brandName === brand).map(p => p.modelName).filter(Boolean)
      )).sort();
    }
    return Array.from(new Set(productCosting.map(p => p.modelName).filter(Boolean))).sort();
  };

  // Get costing data for selected brand and model
  const getCostingData = (brand: string, model: string) => {
    return productCosting.find(p => p.brandName === brand && p.modelName === model);
  };

  // Filtered products based on selected brands, models and cities
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brandName)) {
        return false;
      }
      if (selectedModels.length > 0 && !selectedModels.includes(product.modelName)) {
        return false;
      }
      if (selectedCities.length > 0) {
        const productCities = Object.values(product.serialCities || {});
        if (!productCities.some(city => selectedCities.includes(city))) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedBrands, selectedModels, selectedCities]);

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      brandName: '',
      modelName: '',
      category: '',
      costPrice: 0,
      sellPrice: 0,
      buyType: 'Import',
      warrantyYears: 0,
      stock: 0,
      serialNumbers: [],
      serialCities: {},
      description: '',
      status: 'New'
    });
    setSerialInputs([]);
    setSerialCities({});
    // Open add product modal in full screen by default
    setIsFullScreen(true);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setSerialInputs(product.serialNumbers || []);
    setSerialCities(product.serialCities || {});
    setIsFullScreen(false);
    setIsModalOpen(true);
  };



  // Update serial inputs when stock quantity changes
  const handleStockChange = (newStock: number) => {
    setFormData({ ...formData, stock: newStock });
    
    // Adjust serial inputs array
    const currentSerials = [...serialInputs];
    if (newStock > currentSerials.length) {
      // Add empty strings for new units
      const toAdd = newStock - currentSerials.length;
      setSerialInputs([...currentSerials, ...Array(toAdd).fill('')]);
    } else if (newStock < currentSerials.length) {
      // Remove excess serials and clean up city mappings for removed serials
      const removedSerials = currentSerials.slice(newStock);
      const keptSerials = currentSerials.slice(0, newStock);
      const updatedCities: { [key: string]: string } = {};
      Object.entries(serialCities).forEach(([serial, city]) => {
        if (!removedSerials.includes(serial)) {
          updatedCities[serial] = city;
        }
      });
      setSerialInputs(keptSerials);
      setSerialCities(updatedCities);
    }
  };

  const updateSerialNumber = (index: number, value: string) => {
    const updatedSerials = [...serialInputs];
    const oldSerial = updatedSerials[index];
    updatedSerials[index] = value;
    setSerialInputs(updatedSerials);

    // Keep serialCities mapping in sync with serial values
    if (oldSerial && serialCities[oldSerial]) {
      const updatedCities = { ...serialCities };
      const city = updatedCities[oldSerial];
      delete updatedCities[oldSerial];
      if (value) {
        updatedCities[value] = city;
      }
      setSerialCities(updatedCities);
    }
  };

  const updateSerialCity = (index: number, value: string) => {
    const serialKey = serialInputs[index];
    if (!serialKey) return;
    const updated = { ...serialCities };
    updated[serialKey] = value;
    setSerialCities(updated);
  };

  const handleSave = () => {
    // Check if brand exists in Product Costing
    const brandExists = productCosting.some(p => p.brandName === formData.brandName);
    if (!brandExists) {
      toast.error('Selected brand does not exist in Product Costing. Please add it to Product Costing first.');
      return;
    }

    // Check if model exists for the selected brand in Product Costing
    const modelExists = productCosting.some(p => p.brandName === formData.brandName && p.modelName === formData.modelName);
    if (!modelExists) {
      toast.error('Selected model does not exist for this brand in Product Costing. Please add it to Product Costing first.');
      return;
    }

    if (!formData.brandName || !formData.modelName || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate serial numbers (all should be unique and filled)
    const validSerials = serialInputs.filter(s => s.trim() !== '');
    if (validSerials.length !== (formData.stock || 0)) {
      toast.error(`Please provide ${formData.stock} unique serial numbers`);
      return;
    }

    // Check for duplicate serial numbers
    const uniqueSerials = new Set(validSerials);
    if (uniqueSerials.size !== validSerials.length) {
      toast.error('Serial numbers must be unique');
      return;
    }

    // Check if serial numbers already exist in other products
    const existingSerials = products
      .filter(p => p.id !== editingProduct?.id)
      .flatMap(p => p.serialNumbers || []);
    
    const duplicates = validSerials.filter(s => existingSerials.includes(s));
    if (duplicates.length > 0) {
      toast.error(`Serial numbers already exist: ${duplicates.join(', ')}`);
      return;
    }

    const nextSerialStatus: { [serialNumber: string]: 'Available' | 'In Transit' | 'Damaged' | 'Returned' } = {
      ...(editingProduct?.serialStatus || {}),
    };
    validSerials.forEach((serial) => {
      if (!nextSerialStatus[serial]) {
        nextSerialStatus[serial] = 'Available';
      }
    });

    const productData = {
      ...formData,
      serialNumbers: validSerials,
      serialCities: serialCities,
      serialStatus: nextSerialStatus,
    };

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...productData, id: p.id } as Product : p));
      toast.success('Product updated successfully');
    } else {
      const newProduct: Product = {
        ...productData,
        id: Date.now().toString(),
        createdDate: new Date().toISOString().split('T')[0] // Auto-capture creation date
      } as Product;
      setProducts([...products, newProduct]);
      toast.success('Product added successfully');
    }

    setIsModalOpen(false);
    setFormData({});
    setSerialInputs([]);
    setSerialCities({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-green-100 text-green-800';
      case 'Used':
        return 'bg-yellow-100 text-yellow-800';
      case 'Returned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const brands = getUniqueBrands();
  const models = getUniqueModels(formData.brandName);
  const allBrands = getUniqueBrands();
  const allModels = getUniqueModels();

  // Toggle brand filter
  const toggleBrandFilter = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  // Toggle model filter
  const toggleModelFilter = (model: string) => {
    setSelectedModels(prev => 
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedModels([]);
    setSelectedCities([]);
  };

  // Toggle city filter
  const toggleCityFilter = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Products / Inventory</h2>
          <p className="text-sm text-gray-600 mt-1">Manage products with serial number tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-[#4f46e5] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={20} />
            Filters {(selectedBrands.length + selectedModels.length + selectedCities.length) > 0 && `(${selectedBrands.length + selectedModels.length + selectedCities.length})`}
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {(selectedBrands.length + selectedModels.length + selectedCities.length) > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-[#4f46e5] hover:text-[#4338ca]"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            {/* Brand Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Brand ({selectedBrands.length} selected)</h4>
              <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                {allBrands.map(brand => (
                  <label key={brand} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrandFilter(brand)}
                      className="w-4 h-4 text-[#4f46e5] border-gray-300 rounded focus:ring-[#4f46e5]"
                    />
                    <span className="text-sm text-gray-700">{brand}</span>
                  </label>
                ))}
                {allBrands.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No brands available</p>
                )}
              </div>
            </div>

            {/* Model Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Model ({selectedModels.length} selected)</h4>
              <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                {allModels.map(model => (
                  <label key={model} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedModels.includes(model)}
                      onChange={() => toggleModelFilter(model)}
                      className="w-4 h-4 text-[#4f46e5] border-gray-300 rounded focus:ring-[#4f46e5]"
                    />
                    <span className="text-sm text-gray-700">{model}</span>
                  </label>
                ))}
                {allModels.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No models available</p>
                )}
              </div>
            </div>

            {/* City Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">City ({selectedCities.length} selected)</h4>
              <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                {['Karachi', 'Islamabad', 'Lahore'].map(city => (
                  <label key={city} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedCities.includes(city)}
                      onChange={() => toggleCityFilter(city)}
                      className="w-4 h-4 text-[#4f46e5] border-gray-300 rounded focus:ring-[#4f46e5]"
                    />
                    <span className="text-sm text-gray-700">{city}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial #s</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.brandName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.modelName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.createdDate ? new Date(product.createdDate).toLocaleDateString('en-PK') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.sellPrice)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      (product.serialNumbers || []).filter(s => (product.serialStatus?.[s] || 'Available') !== 'In Transit').length > 10 
                        ? 'bg-green-100 text-green-800' 
                        : (product.serialNumbers || []).filter(s => (product.serialStatus?.[s] || 'Available') !== 'In Transit').length > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(product.serialNumbers || []).filter(s => (product.serialStatus?.[s] || 'Available') !== 'In Transit').length} units
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                      <Hash size={12} />
                      {product.serialNumbers?.length || 0} serials
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewProduct(product)}
                        className="p-2 text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    {(selectedBrands.length + selectedModels.length) > 0 
                      ? 'No products match the selected filters' 
                      : 'No products available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal with Full Screen */}
      {isModalOpen && (
        <div className={`fixed inset-0 z-50 ${isFullScreen ? 'bg-white' : 'bg-black/50 flex items-center justify-center p-4'}`}>
          <div className={`bg-white ${isFullScreen ? 'w-full h-full flex flex-col' : 'rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col'}`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsFullScreen(!isFullScreen)} 
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                >
                  {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className={`${isFullScreen ? 'flex-1 overflow-y-auto' : 'overflow-y-auto'} p-6 space-y-6`}>
              {/* Section 1: Product Details */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-900 mb-4">📦 Product Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                    <select
                      value={formData.brandName || ''}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value, modelName: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    >
                      <option value="">Select brand...</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name *</label>
                    <select
                      value={formData.modelName || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const costingData = getCostingData(formData.brandName || '', value);
                        setFormData({
                          ...formData,
                          modelName: value,
                          category: costingData?.category || '',
                          costPrice: costingData?.unitCostPKR || 0
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      disabled={!formData.brandName}
                    >
                      <option value="">Select model...</option>
                      {models.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <input
                      type="text"
                      value={formData.category || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      placeholder="Auto-filled from Product Costing"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      value={formData.status || 'New'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'New' | 'Used' | 'Returned' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    >
                      <option value="New">New</option>
                      <option value="Used">Used</option>
                      <option value="Returned">Returned</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buy Type *</label>
                    <select
                      value={formData.buyType || 'Import'}
                      onChange={(e) => setFormData({ ...formData, buyType: e.target.value as 'Import' | 'Export' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    >
                      <option value="Import">Import</option>
                      <option value="Export">Export</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Years *</label>
                    <input
                      type="number"
                      value={formData.warrantyYears || ''}
                      onChange={(e) => setFormData({ ...formData, warrantyYears: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] resize-none"
                    placeholder="Enter product description..."
                  />
                </div>
              </div>

              {/* Section 2: Serial Numbers */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-900 mb-4"># Serial Numbers & Locations</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    value={formData.stock || ''}
                    onChange={(e) => handleStockChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Serial number fields will be generated based on quantity</p>
                </div>

                {/* Serial Numbers Section */}
                {(formData.stock || 0) > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Hash size={18} className="text-[#4f46e5]" />
                      <label className="text-sm font-medium text-gray-700">Serial Numbers * ({formData.stock} units)</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {serialInputs.map((serial, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Unit {index + 1}</label>
                          <input
                            type="text"
                            value={serial}
                            onChange={(e) => updateSerialNumber(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm mb-2"
                            placeholder={`e.g., ${formData.brandName?.substring(0, 3).toUpperCase() || 'PRD'}-${String(index + 1).padStart(3, '0')}`}
                          />
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-gray-500" />
                            <select
                              value={serialCities[serial] || ''}
                              onChange={(e) => updateSerialCity(index, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                            >
                              <option value="">Select city/location</option>
                              {cities.map(city => (
                                <option key={city} value={city}>{city}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">💡 Each serial number must be unique across all products</p>
                  </div>
                )}
              </div>

              {/* Section 3: Pricing */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">💰 Pricing</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price *</label>
                    <input
                      type="number"
                      value={formData.costPrice || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      placeholder="Auto-filled from Product Costing"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price *</label>
                    <input
                      type="number"
                      value={formData.sellPrice || ''}
                      onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="0"
                    />
                  </div>
                </div>

                {formData.costPrice && formData.costPrice > 0 && formData.sellPrice && formData.sellPrice > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Profit Margin:</span>
                      <span className="font-semibold text-green-700">
                        {formatCurrency(formData.sellPrice - formData.costPrice)}
                        <span className="text-xs ml-1">
                          ({((formData.sellPrice - formData.costPrice) / formData.costPrice * 100).toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Product Details</h3>
              <button onClick={() => setViewProduct(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Brand Name</p>
                  <p className="font-medium text-gray-900">{viewProduct.brandName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Model Name</p>
                  <p className="font-medium text-gray-900">{viewProduct.modelName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="font-medium text-gray-900">{viewProduct.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Buy Type</p>
                  <p className="font-medium text-gray-900">{viewProduct.buyType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cost Price</p>
                  <p className="font-medium text-gray-900">{formatCurrency(viewProduct.costPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sell Price</p>
                  <p className="font-medium text-gray-900">{formatCurrency(viewProduct.sellPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Warranty Years</p>
                  <p className="font-medium text-gray-900">{viewProduct.warrantyYears} year(s)</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Stock Quantity</p>
                  <p className="font-medium text-gray-900">{viewProduct.stock} units</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(viewProduct.status)}`}>
                    {viewProduct.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
                  <p className="font-medium text-green-700">
                    {formatCurrency(viewProduct.sellPrice - viewProduct.costPrice)}
                    <span className="text-sm ml-2 text-gray-600">
                      ({((viewProduct.sellPrice - viewProduct.costPrice) / viewProduct.costPrice * 100).toFixed(1)}%)
                    </span>
                  </p>
                </div>
              </div>

              {viewProduct.description && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-gray-900">{viewProduct.description}</p>
                </div>
              )}

              {/* Serial Numbers with Locations */}
              {viewProduct.serialNumbers && viewProduct.serialNumbers.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                    <Hash size={16} />
                    Serial Numbers ({viewProduct.serialNumbers.length})
                  </p>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {viewProduct.serialNumbers.map((serial, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{serial}</span>
                        </div>
                        {viewProduct.serialCities && viewProduct.serialCities[serial] && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                            <MapPin size={12} />
                            {viewProduct.serialCities[serial]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
