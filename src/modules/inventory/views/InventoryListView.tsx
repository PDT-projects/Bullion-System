// Inventory Module - View Layer
// InventoryListView - Product list with filters, location column, and location-grouped serial modal

import React from 'react';
import { Plus, Filter, Package, Eye, ArrowRightLeft, DollarSign, MapPin, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product, ProductFilters } from '../models/types';
import { InventoryService } from '../models/inventoryService';

interface InventoryListViewProps {
  products: Product[];
  categories: string[];
  uniqueLocations: string[];
  filters: ProductFilters;
  showFilters: boolean;
  activeFilterCount: number;
  viewProduct: Product | null;
  isLoading?: boolean;
  stats: {
    totalProducts: number;
    totalStock: number;
    totalValue: number;
    newProducts: number;
    inTransit: number;
    available: number;
  };
  setFilter: (key: keyof ProductFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setViewProduct: (product: Product | null) => void;
  onAddNew: () => void;
  onAddToExisting: () => void;
  onTransfer: (id: string) => void;
  onReceiveProduct?: (id: string) => void;
  onBack?: () => void;
}

function getDisplayLocation(product: Product): string {
  if (product.location) return product.location;
  const cities = Object.values(product.serialCities || {}).filter(Boolean);
  if (cities.length === 0) return '—';
  const freq: Record<string, number> = {};
  cities.forEach(c => { freq[c] = (freq[c] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'New':        'bg-blue-100 text-blue-800',
    'In Transit': 'bg-yellow-100 text-yellow-800',
    'Available':  'bg-green-100 text-green-800',
    'Sold':       'bg-gray-100 text-gray-800',
    'Damaged':    'bg-red-100 text-red-800',
    'Returned':   'bg-purple-100 text-purple-800',
    'On-Order':   'bg-orange-100 text-orange-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function InventoryListView({
  products, categories, uniqueLocations, filters, showFilters, activeFilterCount,
  viewProduct, isLoading, stats,
  setFilter, clearFilters, toggleFilters, setViewProduct,
  onAddNew, onAddToExisting, onTransfer, onReceiveProduct,
  onBack,
}: InventoryListViewProps) {
  const fmt = InventoryService.formatCurrency;
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate('/inventory');

  return (
    <div className="p-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">

          {/* BACK BUTTON */}
          <button
            onClick={handleBack}
            style={{ minWidth: 36, minHeight: 36 }}
            className="flex items-center justify-center rounded-lg border border-gray-300 bg-white shadow-sm hover:bg-gray-100 text-gray-700"
            title="Back to Inventory Entry"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h2 className="text-2xl font-bold">Inventory</h2>
            <p className="text-sm text-gray-600 mt-1">
              {stats.totalProducts} products · {stats.totalStock} units · {fmt(stats.totalValue)} value
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
              showFilters ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            <Filter size={20} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <button onClick={onAddToExisting}
            className="flex items-center gap-2 bg-gray-100 text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all shadow-sm border border-gray-200">
            <Plus size={20} /> Add Stock
          </button>
          <button onClick={onAddNew}
            className="flex items-center gap-2 bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white px-4 py-2 rounded-lg font-medium hover:from-[#4338ca] hover:to-[#4f46e5] transition-all shadow-md">
            <Plus size={20} /> New Product
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Products', value: stats.totalProducts, color: 'text-blue-600' },
          { label: 'Total Stock',    value: stats.totalStock,    color: 'text-green-600' },
          { label: 'In Transit',     value: stats.inTransit,     color: 'text-yellow-600' },
          { label: 'Available',      value: stats.available,     color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input type="text" value={filters.brandSearch}
                onChange={e => setFilter('brandSearch', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search brand..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input type="text" value={filters.modelSearch}
                onChange={e => setFilter('modelSearch', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search model..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={filters.categoryFilter}
                onChange={e => setFilter('categoryFilter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={filters.statusFilter}
                onChange={e => setFilter('statusFilter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Statuses</option>
                {['New', 'In Transit', 'Available', 'Sold', 'Damaged', 'Returned'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select value={filters.locationFilter}
                onChange={e => setFilter('locationFilter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Locations</option>
                {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={clearFilters}
              className="text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-1.5 rounded-lg font-medium transition-colors">
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4f46e5] mx-auto mb-3" />
            <p className="text-gray-600">Loading inventory...</p>
          </div>
        ) : (
          /*
            KEY FIX: table-fixed + colgroup percentages summing to 100%
            eliminates all empty space after the Actions column.
          */
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: '22%' }} /> {/* Product */}
              <col style={{ width: '15%' }} /> {/* Category */}
              <col style={{ width: '13%' }} /> {/* Location */}
              <col style={{ width: '10%' }} /> {/* Stock */}
              <col style={{ width: '11%' }} /> {/* Cost Price */}
              <col style={{ width: '11%' }} /> {/* Sell Price */}
              <col style={{ width: '10%' }} /> {/* Status */}
              <col style={{ width: '8%'  }} /> {/* Actions */}
            </colgroup>

            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Product', 'Category', 'Location', 'Stock', 'Cost Price', 'Sell Price', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No products found</p>
                  </td>
                </tr>
              ) : products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">

                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 truncate">{product.brandName} {product.modelName}</div>
                    <div className="text-xs text-gray-500">{product.buyType}</div>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600 truncate">{product.category}</td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {getDisplayLocation(product)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock} units
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">{fmt(product.costPrice)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{fmt(product.sellPrice)}</td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewProduct(product)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => onTransfer(product.id)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Transfer">
                        <ArrowRightLeft size={16} />
                      </button>
                      {onReceiveProduct && (
                        <button onClick={() => onReceiveProduct(product.id)}
                          className="px-2 py-1 text-black bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold border border-gray-200 whitespace-nowrap"
                          title="Move to Stock">
                          → Stock
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── View Modal ── */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold">Product Details</h3>
              <button onClick={() => setViewProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">✕</button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Brand',      viewProduct.brandName],
                  ['Model',      viewProduct.modelName],
                  ['Category',   viewProduct.category],
                  ['Status',     viewProduct.status],
                  ['Stock',      `${viewProduct.stock} units`],
                  ['Warranty',   `${viewProduct.warrantyYears} year${viewProduct.warrantyYears !== 1 ? 's' : ''}`],
                  ['Cost Price', fmt(viewProduct.costPrice)],
                  ['Sell Price', fmt(viewProduct.sellPrice)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="font-medium text-gray-900">{value}</p>
                  </div>
                ))}
                <div className="col-span-2 flex items-center gap-2 pt-2 border-t border-gray-100">
                  <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Primary Location</p>
                    <p className="font-semibold text-indigo-700">{getDisplayLocation(viewProduct)}</p>
                  </div>
                </div>
              </div>

              {viewProduct.serialNumbers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Serial Numbers ({viewProduct.serialNumbers.length}) — by Location
                  </p>
                  <div className="space-y-3">
                    {(() => {
                      const groups = InventoryService.groupSerialsByLocation(viewProduct);
                      return Object.entries(groups)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([city, serials]) => (
                          <div key={city} className="rounded-lg border border-gray-200 overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border-b border-indigo-100">
                              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="text-xs font-semibold text-indigo-700">{city}</span>
                              <span className="ml-auto text-xs text-indigo-400">
                                {serials.length} unit{serials.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="p-3 flex flex-wrap gap-2">
                              {serials.map((serial, idx) => (
                                <span key={idx}
                                  className="text-xs font-mono bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-700">
                                  {serial}
                                </span>
                              ))}
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </div>
              )}

              {viewProduct.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-800">{viewProduct.description}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <div>
                {(!viewProduct.costingOption || viewProduct.costingOption !== 'with') && !viewProduct.costingUsdRate && (
                  <button onClick={() => setViewProduct(null)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2">
                    <DollarSign size={18} /> Add Costing
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setViewProduct(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Close
                </button>
                <button onClick={() => { setViewProduct(null); onTransfer(viewProduct.id); }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                  Transfer
                </button>
                {onReceiveProduct && (
                  <button onClick={() => { setViewProduct(null); onReceiveProduct(viewProduct.id); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                    Move to Stock
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}