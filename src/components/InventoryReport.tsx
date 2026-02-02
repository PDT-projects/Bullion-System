import { useMemo, useState } from 'react';
import { Product } from '../App';
import { Package, MapPin, Calendar, Filter, Download, BarChart3, Eye, X, Hash, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type InventoryReportProps = {
  products: Product[];
};

const CITIES = ['Karachi', 'Islamabad', 'Lahore'];

export function InventoryReport({ products }: InventoryReportProps) {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showVisualization, setShowVisualization] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  // Get unique brands and categories
  const brands = useMemo(() => {
    const brandSet = new Set<string>();
    products.forEach(p => brandSet.add(p.brandName));
    return Array.from(brandSet).sort();
  }, [products]);

  const categories = useMemo(() => {
    const catSet = new Set<string>();
    products.forEach(p => catSet.add(p.category));
    return Array.from(catSet).sort();
  }, [products]);

  // Calculate city-wise inventory with status breakdown
  const cityInventory = useMemo(() => {
    const inventory = CITIES.map(city => {
      const cityProducts = products.map(product => {
        const serialStatus = product.serialStatus || {};

        // Serial numbers physically in this city and not in transit
        const serialsInCity = product.serialNumbers.filter(serial => {
          const status = serialStatus[serial] || 'Available';
          return product.serialCities[serial] === city && status !== 'In Transit';
        });

        const availableInCity = serialsInCity.filter(serial => {
          const status = serialStatus[serial] || 'Available';
          return status === 'Available';
        });

        const returnedInCity = serialsInCity.filter(serial => {
          const status = serialStatus[serial];
          return status === 'Returned';
        });

        const damagedInCity = serialsInCity.filter(serial => {
          const status = serialStatus[serial];
          return status === 'Damaged';
        });

        const inTransitForProduct = product.serialNumbers.filter(serial => {
          const status = serialStatus[serial];
          return status === 'In Transit';
        });
        
        return {
          ...product,
          cityStock: serialsInCity.length,
          citySerials: serialsInCity,
          cityAvailable: availableInCity.length,
          cityReturned: returnedInCity.length,
          cityDamaged: damagedInCity.length,
          cityInTransit: inTransitForProduct.length,
        };
      }).filter(p => {
        // Apply filters
        if (selectedBrand && p.brandName !== selectedBrand) return false;
        if (selectedCategory && p.category !== selectedCategory) return false;
        // Only show products with stock in this city
        return p.cityStock > 0;
      });

      const totalStock = cityProducts.reduce((sum, p) => sum + p.cityStock, 0);
      const totalValue = cityProducts.reduce((sum, p) => sum + (p.cityStock * p.costPrice), 0);
      const totalInTransit = cityProducts.reduce((sum, p) => sum + p.cityInTransit, 0);

      return {
        city,
        products: cityProducts,
        totalStock,
        totalValue,
        totalInTransit,
      };
    });

    // Apply city filter
    if (selectedCity) {
      return inventory.filter(inv => inv.city === selectedCity);
    }
    return inventory;
  }, [products, selectedCity, selectedBrand, selectedCategory]);

  // Calculate overall totals
  const overallTotals = useMemo(() => {
    return cityInventory.reduce((acc, inv) => ({
      totalStock: acc.totalStock + inv.totalStock,
      totalValue: acc.totalValue + inv.totalValue,
      totalProducts: acc.totalProducts + inv.products.length,
      totalInTransit: acc.totalInTransit + inv.totalInTransit,
    }), { totalStock: 0, totalValue: 0, totalProducts: 0, totalInTransit: 0 });
  }, [cityInventory]);

  // Prepare visualization data
  const visualizationData = useMemo(() => {
    // Stock by city
    const stockByCity = cityInventory.map(inv => ({
      city: inv.city,
      stock: inv.totalStock,
      value: inv.totalValue
    }));

    // Stock by brand
    const stockByBrand = products.reduce((acc, product) => {
      const brand = product.brandName;
      const totalStock = product.serialNumbers.length;
      if (!acc[brand]) acc[brand] = 0;
      acc[brand] += totalStock;
      return acc;
    }, {} as Record<string, number>);
    const brandStockData = Object.entries(stockByBrand)
      .map(([brand, stock]) => ({ brand, stock }))
      .sort((a, b) => b.stock - a.stock);

    // Stock by category
    const stockByCategory = products.reduce((acc, product) => {
      const category = product.category;
      const totalStock = product.serialNumbers.length;
      if (!acc[category]) acc[category] = 0;
      acc[category] += totalStock;
      return acc;
    }, {} as Record<string, number>);
    const categoryStockData = Object.entries(stockByCategory)
      .map(([category, stock]) => ({ category, stock }))
      .sort((a, b) => b.stock - a.stock);

    // Top products by stock
    const topProducts = products
      .map(product => ({
        product: `${product.brandName} ${product.modelName}`,
        stock: product.serialNumbers.length,
        value: product.serialNumbers.length * product.costPrice
      }))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 10);

    // Inventory status distribution
    const statusCounts = products.reduce((acc, product) => {
      const serialStatus = product.serialStatus || {};
      product.serialNumbers.forEach(serial => {
        const status = serialStatus[serial] || 'Available';
        if (!acc[status]) acc[status] = 0;
        acc[status] += 1;
      });
      return acc;
    }, {} as Record<string, number>);
    const statusData = Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }));

    return {
      stockByCity,
      brandStockData,
      categoryStockData,
      topProducts,
      statusData
    };
  }, [cityInventory, products]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleExportCSV = () => {
    const headers = ['City', 'Brand', 'Model', 'Category', 'Stock', 'Cost Price', 'Sell Price', 'Total Value', 'Serial Numbers'];
    const rows: string[] = [];

    cityInventory.forEach(inv => {
      inv.products.forEach(product => {
        rows.push([
          inv.city,
          product.brandName,
          product.modelName,
          product.category,
          product.cityStock.toString(),
          product.costPrice.toString(),
          product.sellPrice.toString(),
          (product.cityStock * product.costPrice).toString(),
          product.citySerials.join('; ')
        ].join(','));
      });
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Report exported successfully');
  };

  const clearFilters = () => {
    setSelectedCity('');
    setSelectedBrand('');
    setSelectedCategory('');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Inventory Report</h2>
            <p className="text-sm text-gray-600 mt-1">City-wise product inventory for Pakistan Detectors Technologies</p>
          </div>
          <button
            onClick={() => setShowVisualization(!showVisualization)}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 flex items-center gap-2"
          >
            <BarChart3 size={16} />
            {showVisualization ? 'Hide' : 'Show'} Visualization
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package size={20} className="text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Total Available/Returned</p>
          </div>
          <p className="text-3xl font-bold text-[#4f46e5]">{overallTotals.totalStock} units</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 size={20} className="text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Total Value</p>
          </div>
          <p className="text-3xl font-bold text-[#10b981]">{formatCurrency(overallTotals.totalValue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin size={20} className="text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Cities / In Transit</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {selectedCity ? 1 : CITIES.length} cities
          </p>
          <p className="text-sm text-gray-500 mt-2">
            In Transit: {overallTotals.totalInTransit} units
          </p>
        </div>
      </div>

      {/* Visualization Section */}
      {showVisualization && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-purple-100 rounded-xl">
              <BarChart3 size={24} className="text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Inventory Analytics</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Stock Distribution by City */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Stock Distribution by City</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visualizationData.stockByCity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} units`, 'Stock']} />
                  <Bar dataKey="stock" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Inventory Value by City */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Inventory Value by City</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visualizationData.stockByCity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${formatCurrency(Number(value))}`, 'Value']} />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Stock by Brand */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Stock by Brand</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visualizationData.brandStockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="brand" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} units`, 'Stock']} />
                  <Bar dataKey="stock" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stock by Category */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Stock by Category</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visualizationData.categoryStockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} units`, 'Stock']} />
                  <Bar dataKey="stock" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 Products by Stock */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Top 10 Products by Stock</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visualizationData.topProducts} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="product" type="category" width={100} />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} units`, 'Stock']} />
                  <Bar dataKey="stock" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Inventory Status Distribution */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Inventory Status Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={visualizationData.statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {visualizationData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Cities</option>
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-sm font-medium text-white bg-[#10b981] rounded-lg hover:bg-[#059669] flex items-center gap-2"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* City-wise Inventory */}
      <div className="space-y-8">
        {cityInventory.map(inv => (
          <div key={inv.city} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* City Header */}
            <div className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <MapPin size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{inv.city}</h3>
                    <p className="text-base text-white/90 mt-1">
                      {inv.products.length} product{inv.products.length !== 1 ? 's' : ''} • {inv.totalStock} units
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/80">Total Value</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(inv.totalValue)}</p>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand / Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock (Status)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Numbers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inv.products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No products in stock for this city
                      </td>
                    </tr>
                  ) : (
                    inv.products.map(product => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setViewProduct(product)}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{product.brandName}</p>
                            <p className="text-sm text-gray-600">{product.modelName}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              <Package size={12} />
                              {product.cityStock} units
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Available: {product.cityAvailable} • Returned: {product.cityReturned} • Damaged: {product.cityDamaged} • In Transit: {product.cityInTransit}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(product.costPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(product.sellPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#4f46e5]">
                          {formatCurrency(product.cityStock * product.costPrice)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 flex items-center justify-between">
                          <div className="max-w-xs">
                            {product.citySerials.slice(0, 3).map(serial => (
                              <span key={serial} className="inline-block mr-2 mb-1 px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                                {serial}
                              </span>
                            ))}
                            {product.citySerials.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{product.citySerials.length - 3} more
                              </span>
                            )}
                          </div>
                          <Eye size={16} className="text-gray-400 ml-2" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {inv.products.length > 0 && (
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={2} className="px-6 py-3 text-sm font-bold text-gray-900">
                        {inv.city} Total
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-[#4f46e5]">
                        {inv.totalStock} units
                      </td>
                      <td colSpan={2}></td>
                      <td className="px-6 py-3 text-sm font-bold text-[#4f46e5]">
                        {formatCurrency(inv.totalValue)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Summary */}
      {cityInventory.length > 1 && (
        <div className="mt-6 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] rounded-lg p-6 text-white">
          <h3 className="text-lg font-bold mb-4">Overall Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-white/80">Total Cities</p>
              <p className="text-2xl font-bold">{cityInventory.length}</p>
            </div>
            <div>
              <p className="text-sm text-white/80">Total Stock</p>
              <p className="text-2xl font-bold">{overallTotals.totalStock} units</p>
            </div>
            <div>
              <p className="text-sm text-white/80">Total Inventory Value</p>
              <p className="text-2xl font-bold">{formatCurrency(overallTotals.totalValue)}</p>
            </div>
          </div>
        </div>
      )}

      {/* View Product Details Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Product Details</h3>
              <button onClick={() => setViewProduct(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Product Header */}
              <div className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-2xl font-bold">{viewProduct.brandName} {viewProduct.modelName}</h4>
                    <p className="text-sm opacity-90 mt-1">{viewProduct.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Total Stock</p>
                    <p className="text-3xl font-bold">{viewProduct.serialNumbers.length} units</p>
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">Pricing Information</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost Price:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(viewProduct.costPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sell Price:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(viewProduct.sellPrice)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Profit Margin:</span>
                      <span className={`font-semibold ${viewProduct.sellPrice > viewProduct.costPrice ? 'text-green-600' : 'text-red-600'}`}>
                        {viewProduct.costPrice > 0 ? (((viewProduct.sellPrice - viewProduct.costPrice) / viewProduct.costPrice) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">Stock Information</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Serial Numbers:</span>
                      <span className="font-semibold text-gray-900">{viewProduct.serialNumbers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Value:</span>
                      <span className="font-semibold text-[#4f46e5]">{formatCurrency(viewProduct.serialNumbers.length * viewProduct.costPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Serial Numbers by City */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-4">Serial Numbers by City</h5>
                <div className="space-y-4">
                  {CITIES.map(city => {
                    const citySerials = viewProduct.serialNumbers.filter(serial => {
                      const status = (viewProduct.serialStatus || {})[serial] || 'Available';
                      return viewProduct.serialCities[serial] === city && status !== 'In Transit';
                    });

                    const available = citySerials.filter(serial => {
                      const status = (viewProduct.serialStatus || {})[serial] || 'Available';
                      return status === 'Available';
                    });

                    const returned = citySerials.filter(serial => {
                      const status = (viewProduct.serialStatus || {})[serial];
                      return status === 'Returned';
                    });

                    const damaged = citySerials.filter(serial => {
                      const status = (viewProduct.serialStatus || {})[serial];
                      return status === 'Damaged';
                    });

                    const inTransit = viewProduct.serialNumbers.filter(serial => {
                      const status = (viewProduct.serialStatus || {})[serial];
                      return status === 'In Transit';
                    });

                    if (citySerials.length === 0 && inTransit.length === 0) return null;

                    return (
                      <div key={city} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="font-medium text-gray-900 flex items-center gap-2">
                            <MapPin size={16} className="text-gray-500" />
                            {city}
                          </h6>
                          <span className="text-sm text-gray-600">
                            {citySerials.length} units in city
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Available</p>
                            <p className="text-lg font-semibold text-green-600">{available.length}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Returned</p>
                            <p className="text-lg font-semibold text-blue-600">{returned.length}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Damaged</p>
                            <p className="text-lg font-semibold text-red-600">{damaged.length}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">In Transit</p>
                            <p className="text-lg font-semibold text-orange-600">{inTransit.length}</p>
                          </div>
                        </div>

                        {citySerials.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Serial Numbers:</p>
                            <div className="flex flex-wrap gap-2">
                              {citySerials.map(serial => {
                                const status = (viewProduct.serialStatus || {})[serial] || 'Available';
                                const statusColor = {
                                  'Available': 'bg-green-100 text-green-800',
                                  'Returned': 'bg-blue-100 text-blue-800',
                                  'Damaged': 'bg-red-100 text-red-800',
                                  'In Transit': 'bg-orange-100 text-orange-800'
                                }[status] || 'bg-gray-100 text-gray-800';

                                return (
                                  <span key={serial} className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                                    {serial}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {inTransit.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm font-medium text-orange-700 mb-2">In Transit Serial Numbers:</p>
                            <div className="flex flex-wrap gap-2">
                              {inTransit.map(serial => (
                                <span key={serial} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                  {serial}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Additional Product Details */}
              {viewProduct.description && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Description</h5>
                  <p className="text-gray-700">{viewProduct.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
