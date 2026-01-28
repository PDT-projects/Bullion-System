import { useMemo, useState } from 'react';
import { Product } from '../App';
import { Package, MapPin, Calendar, Filter, Download, BarChart3 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type InventoryReportProps = {
  products: Product[];
};

const CITIES = ['Karachi', 'Islamabad', 'Lahore'];

export function InventoryReport({ products }: InventoryReportProps) {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

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
        <h2 className="text-2xl font-bold text-gray-900">Inventory Report</h2>
        <p className="text-sm text-gray-600 mt-1">City-wise product inventory for Pakistan Detectors Technologies</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={18} className="text-blue-600" />
            <p className="text-sm text-gray-600">Total Available/Returned</p>
          </div>
          <p className="text-2xl font-bold text-[#4f46e5]">{overallTotals.totalStock} units</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Total Value</p>
          </div>
          <p className="text-2xl font-bold text-[#10b981]">{formatCurrency(overallTotals.totalValue)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={18} className="text-purple-600" />
            <p className="text-sm text-gray-600">Cities / In Transit</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {selectedCity ? 1 : CITIES.length} cities
          </p>
          <p className="text-xs text-gray-500 mt-1">
            In Transit: {overallTotals.totalInTransit} units
          </p>
        </div>
      </div>

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
      <div className="space-y-6">
        {cityInventory.map(inv => (
          <div key={inv.city} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* City Header */}
            <div className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin size={24} className="text-white" />
                  <div>
                    <h3 className="text-xl font-bold text-white">{inv.city}</h3>
                    <p className="text-sm text-white/80 mt-1">
                      {inv.products.length} product{inv.products.length !== 1 ? 's' : ''} • {inv.totalStock} units
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/80">Total Value</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(inv.totalValue)}</p>
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
                      <tr key={product.id} className="hover:bg-gray-50">
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
                        <td className="px-6 py-4 text-sm text-gray-600">
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
    </div>
  );
}