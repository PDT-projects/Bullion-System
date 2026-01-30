import { useState } from 'react';
import { Plus, Edit, Trash2, X, Maximize2, Minimize2, Filter } from 'lucide-react';
import { toast } from 'sonner';

type ProductCostingType = {
  id: string;
  brandName: string;
  modelName: string;
  category: string;
  units: number;
  unitCostUSD: number;
  totalCostUSD: number;
  percentage: number;
  customPerModel: number;
  customPerUnit: number;
  freightPerModel: number;
  freightPerUnit: number;
  unitCostPKR: number;
  totalUnitCost: number;
  totalShipmentValuePKR: number;
};

type ProductCostingProps = {
  products: any[];
  productCosting: ProductCostingType[];
  setProductCosting: (productCosting: ProductCostingType[]) => void;
};

export function ProductCosting({ products, productCosting, setProductCosting }: ProductCostingProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editingCosting, setEditingCosting] = useState<ProductCostingType | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState<Partial<ProductCostingType>>({
    brandName: '',
    modelName: '',
    category: '',
    units: 0,
    unitCostUSD: 0,
    totalCostUSD: 0,
    percentage: 0,
    customPerModel: 0,
    customPerUnit: 0,
    freightPerModel: 0,
    freightPerUnit: 0,
    unitCostPKR: 0,
    totalUnitCost: 0,
    totalShipmentValuePKR: 0,
  });

  // Filter states
  const [brandNameSearch, setBrandNameSearch] = useState('');
  const [modelNameSearch, setModelNameSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minUnits, setMinUnits] = useState('');
  const [maxUnits, setMaxUnits] = useState('');
  const [minUnitCostUSD, setMinUnitCostUSD] = useState('');
  const [maxUnitCostUSD, setMaxUnitCostUSD] = useState('');
  const [minTotalCostUSD, setMinTotalCostUSD] = useState('');
  const [maxTotalCostUSD, setMaxTotalCostUSD] = useState('');
  const [minPercentage, setMinPercentage] = useState('');
  const [maxPercentage, setMaxPercentage] = useState('');
  const [minUnitCostPKR, setMinUnitCostPKR] = useState('');
  const [maxUnitCostPKR, setMaxUnitCostPKR] = useState('');
  const [minShipmentValuePKR, setMinShipmentValuePKR] = useState('');
  const [maxShipmentValuePKR, setMaxShipmentValuePKR] = useState('');

  // Get unique categories for dropdown
  const uniqueCategories = Array.from(new Set(productCosting.map(item => item.category))).sort();

  // Apply filters to product costing data
  const filteredProductCosting = productCosting.filter(item => {
    // Brand name search (case-insensitive, partial match)
    if (brandNameSearch && !item.brandName.toLowerCase().includes(brandNameSearch.toLowerCase())) {
      return false;
    }

    // Model name search (case-insensitive, partial match)
    if (modelNameSearch && !item.modelName.toLowerCase().includes(modelNameSearch.toLowerCase())) {
      return false;
    }

    // Category filter
    if (categoryFilter && item.category !== categoryFilter) {
      return false;
    }

    // Units range filter
    const units = item.units;
    const minU = minUnits ? parseFloat(minUnits) : 0;
    const maxU = maxUnits ? parseFloat(maxUnits) : Infinity;
    if (units < minU || units > maxU) {
      return false;
    }

    // Unit Cost USD range filter
    const unitCostUSD = item.unitCostUSD;
    const minUCUSD = minUnitCostUSD ? parseFloat(minUnitCostUSD) : 0;
    const maxUCUSD = maxUnitCostUSD ? parseFloat(maxUnitCostUSD) : Infinity;
    if (unitCostUSD < minUCUSD || unitCostUSD > maxUCUSD) {
      return false;
    }

    // Total Cost USD range filter
    const totalCostUSD = item.totalCostUSD;
    const minTCUSD = minTotalCostUSD ? parseFloat(minTotalCostUSD) : 0;
    const maxTCUSD = maxTotalCostUSD ? parseFloat(maxTotalCostUSD) : Infinity;
    if (totalCostUSD < minTCUSD || totalCostUSD > maxTCUSD) {
      return false;
    }

    // Percentage range filter
    const percentage = item.percentage;
    const minP = minPercentage ? parseFloat(minPercentage) : 0;
    const maxP = maxPercentage ? parseFloat(maxPercentage) : Infinity;
    if (percentage < minP || percentage > maxP) {
      return false;
    }

    // Unit Cost PKR range filter
    const unitCostPKR = item.unitCostPKR;
    const minUCPKR = minUnitCostPKR ? parseFloat(minUnitCostPKR) : 0;
    const maxUCPKR = maxUnitCostPKR ? parseFloat(maxUnitCostPKR) : Infinity;
    if (unitCostPKR < minUCPKR || unitCostPKR > maxUCPKR) {
      return false;
    }

    // Total Shipment Value PKR range filter
    const shipmentValuePKR = item.totalShipmentValuePKR;
    const minSVPKR = minShipmentValuePKR ? parseFloat(minShipmentValuePKR) : 0;
    const maxSVPKR = maxShipmentValuePKR ? parseFloat(maxShipmentValuePKR) : Infinity;
    if (shipmentValuePKR < minSVPKR || shipmentValuePKR > maxSVPKR) {
      return false;
    }

    return true;
  });

  // Clear all filters
  const clearFilters = () => {
    setBrandNameSearch('');
    setModelNameSearch('');
    setCategoryFilter('');
    setMinUnits('');
    setMaxUnits('');
    setMinUnitCostUSD('');
    setMaxUnitCostUSD('');
    setMinTotalCostUSD('');
    setMaxTotalCostUSD('');
    setMinPercentage('');
    setMaxPercentage('');
    setMinUnitCostPKR('');
    setMaxUnitCostPKR('');
    setMinShipmentValuePKR('');
    setMaxShipmentValuePKR('');
  };

  // Calculate totals
  const totals = productCosting.reduce(
    (acc, item) => ({
      totalUnits: acc.totalUnits + item.units,
      totalUnitCostUSD: acc.totalUnitCostUSD + item.unitCostUSD,
      totalShipmentValuePKR: acc.totalShipmentValuePKR + item.totalShipmentValuePKR,
    }),
    {
      totalUnits: 0,
      totalUnitCostUSD: 0,
      totalShipmentValuePKR: 0,
    }
  );

  const handleAdd = () => {
    setEditingCosting(null);
    setFormData({
      brandName: '',
      modelName: '',
      category: '',
      units: 0,
      unitCostUSD: 0,
      totalCostUSD: 0,
      percentage: 0,
      customPerModel: 0,
      customPerUnit: 0,
      freightPerModel: 0,
      freightPerUnit: 0,
      unitCostPKR: 0,
      totalUnitCost: 0,
      totalShipmentValuePKR: 0,
    });
    setIsFullScreen(false);
    setIsModalOpen(true);
  };

  const handleEdit = (costing: ProductCostingType) => {
    setEditingCosting(costing);
    setFormData(costing);
    setIsFullScreen(false);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product costing record?')) {
      setProductCosting(productCosting.filter(item => item.id !== id));
      toast.success('Product costing record deleted successfully');
    }
  };

  const handleSave = () => {
    if (!formData.brandName || !formData.modelName || !formData.category) {
      toast.error('Please fill in Brand Name, Model Name, and Category');
      return;
    }

    const costingRecord = {
      ...formData,
      id: editingCosting?.id || Date.now().toString(),
    } as ProductCostingType;

    if (editingCosting) {
      setProductCosting(productCosting.map(item =>
        item.id === editingCosting.id ? costingRecord : item
      ));
      toast.success('Product costing updated successfully');
    } else {
      setProductCosting([...productCosting, costingRecord]);
      toast.success('Product costing added successfully');
    }

    setIsModalOpen(false);
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'PKR' = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Product Costing</h2>
          <p className="text-sm text-gray-600 mt-1">Manage product costing records</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-[#4f46e5] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={20} />
            Filters {(brandNameSearch || modelNameSearch || categoryFilter || minUnits || maxUnits || minUnitCostUSD || maxUnitCostUSD || minTotalCostUSD || maxTotalCostUSD || minPercentage || maxPercentage || minUnitCostPKR || maxUnitCostPKR || minShipmentValuePKR || maxShipmentValuePKR) && `(${(brandNameSearch ? 1 : 0) + (modelNameSearch ? 1 : 0) + (categoryFilter ? 1 : 0) + (minUnits ? 1 : 0) + (maxUnits ? 1 : 0) + (minUnitCostUSD ? 1 : 0) + (maxUnitCostUSD ? 1 : 0) + (minTotalCostUSD ? 1 : 0) + (maxTotalCostUSD ? 1 : 0) + (minPercentage ? 1 : 0) + (maxPercentage ? 1 : 0) + (minUnitCostPKR ? 1 : 0) + (maxUnitCostPKR ? 1 : 0) + (minShipmentValuePKR ? 1 : 0) + (maxShipmentValuePKR ? 1 : 0)})`}
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
          >
            <Plus size={20} />
            Add Product Costing
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
          {/* Brand Name Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by Brand Name</label>
            <input
              type="text"
              value={brandNameSearch}
              onChange={(e) => setBrandNameSearch(e.target.value)}
              placeholder="Enter brand name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            />
          </div>

          {/* Model Name Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by Model Name</label>
            <input
              type="text"
              value={modelNameSearch}
              onChange={(e) => setModelNameSearch(e.target.value)}
              placeholder="Enter model name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Units Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Units</label>
              <input
                type="number"
                value={minUnits}
                onChange={(e) => setMinUnits(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Units</label>
              <input
                type="number"
                value={maxUnits}
                onChange={(e) => setMaxUnits(e.target.value)}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
          </div>

          {/* Unit Cost USD Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Unit Cost (USD)</label>
              <input
                type="number"
                step="0.01"
                value={minUnitCostUSD}
                onChange={(e) => setMinUnitCostUSD(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Unit Cost (USD)</label>
              <input
                type="number"
                step="0.01"
                value={maxUnitCostUSD}
                onChange={(e) => setMaxUnitCostUSD(e.target.value)}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
          </div>

          {/* Total Cost USD Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Total Cost (USD)</label>
              <input
                type="number"
                step="0.01"
                value={minTotalCostUSD}
                onChange={(e) => setMinTotalCostUSD(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Total Cost (USD)</label>
              <input
                type="number"
                step="0.01"
                value={maxTotalCostUSD}
                onChange={(e) => setMaxTotalCostUSD(e.target.value)}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
          </div>

          {/* Percentage Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Percentage (%)</label>
              <input
                type="number"
                step="0.01"
                value={minPercentage}
                onChange={(e) => setMinPercentage(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Percentage (%)</label>
              <input
                type="number"
                step="0.01"
                value={maxPercentage}
                onChange={(e) => setMaxPercentage(e.target.value)}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
          </div>

          {/* Unit Cost PKR Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Unit Cost (PKR)</label>
              <input
                type="number"
                step="0.01"
                value={minUnitCostPKR}
                onChange={(e) => setMinUnitCostPKR(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Unit Cost (PKR)</label>
              <input
                type="number"
                step="0.01"
                value={maxUnitCostPKR}
                onChange={(e) => setMaxUnitCostPKR(e.target.value)}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
          </div>

          {/* Shipment Value PKR Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Shipment Value (PKR)</label>
              <input
                type="number"
                step="0.01"
                value={minShipmentValuePKR}
                onChange={(e) => setMinShipmentValuePKR(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Shipment Value (PKR)</label>
              <input
                type="number"
                step="0.01"
                value={maxShipmentValuePKR}
                onChange={(e) => setMaxShipmentValuePKR(e.target.value)}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-end gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Product Costing Records ({filteredProductCosting.length})</h3>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Brand Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Model Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Units</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Unit Cost (USD)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Total Cost (USD)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Percentage (%)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Custom per Model</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Custom per Unit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Freight per Model</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Freight per Unit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Unit Cost (PKR)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Total Unit Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Total Shipment Value (PKR)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProductCosting.length > 0 ? (
                filteredProductCosting.map((costing) => (
                  <tr key={costing.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{costing.brandName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{costing.modelName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{costing.category}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{costing.units}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(costing.unitCostUSD)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(costing.totalCostUSD)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{costing.percentage}%</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(costing.customPerModel)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(costing.customPerUnit)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(costing.freightPerModel)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(costing.freightPerUnit)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(costing.unitCostPKR, 'PKR')}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(costing.totalUnitCost, 'PKR')}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(costing.totalShipmentValuePKR, 'PKR')}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(costing)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(costing.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={15} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-lg font-medium mb-2">No product costing records found</div>
                      <div className="text-sm">Try adjusting your filters or clearing them to see all records.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className={`fixed inset-0 z-50 ${isFullScreen ? 'bg-white' : 'bg-black/50 flex items-center justify-center p-4'}`}>
          <div className={`bg-white ${isFullScreen ? 'w-full h-full flex flex-col' : 'rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col'}`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold">{editingCosting ? 'Edit Product Costing' : 'Add Product Costing'}</h3>
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

            <div className={`${isFullScreen ? 'flex-1 overflow-y-auto' : 'overflow-y-auto'} p-6`}>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={formData.brandName || ''}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="Enter brand name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model Name *</label>
                  <input
                    type="text"
                    value={formData.modelName || ''}
                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="Enter model name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="Enter category"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.units || ''}
                    onChange={(e) => setFormData({ ...formData, units: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitCostUSD || ''}
                    onChange={(e) => setFormData({ ...formData, unitCostUSD: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalCostUSD || ''}
                    onChange={(e) => setFormData({ ...formData, totalCostUSD: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.percentage || ''}
                    onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom per Model</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.customPerModel || ''}
                    onChange={(e) => setFormData({ ...formData, customPerModel: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom per Unit</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.customPerUnit || ''}
                    onChange={(e) => setFormData({ ...formData, customPerUnit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Freight per Model</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.freightPerModel || ''}
                    onChange={(e) => setFormData({ ...formData, freightPerModel: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Freight per Unit</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.freightPerUnit || ''}
                    onChange={(e) => setFormData({ ...formData, freightPerUnit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitCostPKR || ''}
                    onChange={(e) => setFormData({ ...formData, unitCostPKR: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Unit Cost</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalUnitCost || ''}
                    onChange={(e) => setFormData({ ...formData, totalUnitCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Shipment Value (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalShipmentValuePKR || ''}
                    onChange={(e) => setFormData({ ...formData, totalShipmentValuePKR: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="0.00"
                  />
                </div>
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
                {editingCosting ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
