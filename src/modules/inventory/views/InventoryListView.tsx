// Inventory Module - View Layer
// InventoryListView - Product list with filters and actions

import { Plus, Filter, Package, Eye, ArrowRightLeft, DollarSign } from 'lucide-react';
import { Product, ProductFilters } from '../models/types';
import { InventoryService } from '../models/inventoryService';
import { AddCostingDialog } from '../components/AddCostingDialog';
import { useState } from 'react';

/**
 * Props for InventoryListView
 */
interface InventoryListViewProps {
  products: Product[];
  categories: string[];
  filters: ProductFilters;
  showFilters: boolean;
  activeFilterCount: number;
  viewProduct: Product | null;
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
}

/**
 * InventoryListView - Dumb component for inventory list
 */
export function InventoryListView({
  products,
  categories,
  filters,
  showFilters,
  activeFilterCount,
  viewProduct,
  stats,
  setFilter,
  clearFilters,
  toggleFilters,
  setViewProduct,
  onAddNew,
  onAddToExisting,
  onTransfer
}: InventoryListViewProps) {
  // State for Add Costing dialog
  const [showAddCostingDialog, setShowAddCostingDialog] = useState(false);
  const [selectedProductForCosting, setSelectedProductForCosting] = useState<Product | null>(null);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'New': 'bg-blue-100 text-blue-800',
      'In Transit': 'bg-yellow-100 text-yellow-800',
      'Available': 'bg-green-100 text-green-800',
      'Sold': 'bg-gray-100 text-gray-800',
      'Damaged': 'bg-red-100 text-red-800',
      'Returned': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-sm text-gray-600 mt-1">
            {stats.totalProducts} products • {stats.totalStock} units • {InventoryService.formatCurrency(stats.totalValue)} value
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm ${
              showFilters 
                ? 'bg-[#4f46e5] text-white hover:bg-[#4338ca] hover:shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            <Filter size={20} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <button
            onClick={onAddToExisting}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Add Stock
          </button>
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white px-4 py-2 rounded-lg font-medium hover:from-[#4338ca] hover:to-[#4f46e5] transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Plus size={20} />
            New Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{stats.totalProducts}</div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.totalStock}</div>
          <div className="text-sm text-gray-600">Total Stock</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.inTransit}</div>
          <div className="text-sm text-gray-600">In Transit</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{stats.available}</div>
          <div className="text-sm text-gray-600">Available</div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={filters.brandSearch}
                onChange={(e) => setFilter('brandSearch', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search brand..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                value={filters.modelSearch}
                onChange={(e) => setFilter('modelSearch', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search model..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.categoryFilter}
                onChange={(e) => setFilter('categoryFilter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.statusFilter}
                onChange={(e) => setFilter('statusFilter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="In Transit">In Transit</option>
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
                <option value="Damaged">Damaged</option>
                <option value="Returned">Returned</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sell Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No products found</p>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{product.brandName} {product.modelName}</div>
                    <div className="text-sm text-gray-500">{product.buyType}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {InventoryService.formatCurrency(product.costPrice)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {InventoryService.formatCurrency(product.sellPrice)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewProduct(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onTransfer(product.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Transfer"
                      >
                        <ArrowRightLeft size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold">Product Details</h3>
              <button
                onClick={() => setViewProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Brand</label>
                  <p className="font-medium">{viewProduct.brandName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Model</label>
                  <p className="font-medium">{viewProduct.modelName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Category</label>
                  <p className="font-medium">{viewProduct.category}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p className="font-medium">{viewProduct.status}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Stock</label>
                  <p className="font-medium">{viewProduct.stock} units</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Warranty</label>
                  <p className="font-medium">{viewProduct.warrantyYears} years</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Cost Price</label>
                  <p className="font-medium">{InventoryService.formatCurrency(viewProduct.costPrice)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Sell Price</label>
                  <p className="font-medium">{InventoryService.formatCurrency(viewProduct.sellPrice)}</p>
                </div>
              </div>
              
              {viewProduct.serialNumbers.length > 0 && (
                <div>
                  <label className="text-sm text-gray-500">Serial Numbers ({viewProduct.serialNumbers.length})</label>
                  <div className="mt-2 max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3">
                    {viewProduct.serialNumbers.map((serial, idx) => (
                      <div key={idx} className="text-sm py-1 font-mono">
                        {serial} {viewProduct.serialCities?.[serial] && `(${viewProduct.serialCities[serial]})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {viewProduct.description && (
                <div>
                  <label className="text-sm text-gray-500">Description</label>
                  <p className="mt-1 text-sm">{viewProduct.description}</p>
                </div>
              )}
              
              {/* Costing Information */}
              {(viewProduct.costingOption === 'with' || viewProduct.costingUsdRate) && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3">Costing Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewProduct.costingUsdRate && (
                      <div>
                        <span className="text-blue-700">USD Rate:</span>
                        <span className="ml-2 font-medium">{viewProduct.costingUsdRate}</span>
                      </div>
                    )}
                    {viewProduct.costingTotalCustomsValue !== undefined && viewProduct.costingTotalCustomsValue > 0 && (
                      <div>
                        <span className="text-blue-700">Total Customs:</span>
                        <span className="ml-2 font-medium">{InventoryService.formatCurrency(viewProduct.costingTotalCustomsValue)}</span>
                      </div>
                    )}
                    {viewProduct.costingTotalFreightValue !== undefined && viewProduct.costingTotalFreightValue > 0 && (
                      <div>
                        <span className="text-blue-700">Total Freight:</span>
                        <span className="ml-2 font-medium">{InventoryService.formatCurrency(viewProduct.costingTotalFreightValue)}</span>
                      </div>
                    )}
                    {viewProduct.costingShipmentTotalUSD !== undefined && viewProduct.costingShipmentTotalUSD > 0 && (
                      <div>
                        <span className="text-blue-700">Shipment Total (USD):</span>
                        <span className="ml-2 font-medium">{InventoryService.formatCurrency(viewProduct.costingShipmentTotalUSD)}</span>
                      </div>
                    )}
                    {viewProduct.costingConsignmentValue !== undefined && viewProduct.costingConsignmentValue > 0 && (
                      <div>
                        <span className="text-blue-700">Consignment Value:</span>
                        <span className="ml-2 font-medium">{InventoryService.formatCurrency(viewProduct.costingConsignmentValue)}</span>
                      </div>
                    )}
                    {viewProduct.costingTotalValueOfBrand !== undefined && viewProduct.costingTotalValueOfBrand > 0 && (
                      <div className="col-span-2 border-t border-blue-200 pt-2 mt-2">
                        <span className="text-blue-900 font-bold">Total Brand Value:</span>
                        <span className="ml-2 font-bold text-blue-900">{InventoryService.formatCurrency(viewProduct.costingTotalValueOfBrand)}</span>
                      </div>
                    )}
                    
                    {/* Legacy single-model costing fields */}
                    {viewProduct.costingUnits && (
                      <div>
                        <span className="text-blue-700">Units:</span>
                        <span className="ml-2 font-medium">{viewProduct.costingUnits}</span>
                      </div>
                    )}
                    {viewProduct.costingUnitCostUSD !== undefined && viewProduct.costingUnitCostUSD > 0 && (
                      <div>
                        <span className="text-blue-700">Unit Cost (USD):</span>
                        <span className="ml-2 font-medium">{InventoryService.formatCurrency(viewProduct.costingUnitCostUSD)}</span>
                      </div>
                    )}
                    {viewProduct.costingTotalCostUSD !== undefined && viewProduct.costingTotalCostUSD > 0 && (
                      <div>
                        <span className="text-blue-700">Total Cost (USD):</span>
                        <span className="ml-2 font-medium">{InventoryService.formatCurrency(viewProduct.costingTotalCostUSD)}</span>
                      </div>
                    )}
                    {viewProduct.costingUnitCostPKR !== undefined && viewProduct.costingUnitCostPKR > 0 && (
                      <div>
                        <span className="text-blue-700">Unit Cost (PKR):</span>
                        <span className="ml-2 font-medium">{InventoryService.formatCurrency(viewProduct.costingUnitCostPKR)}</span>
                      </div>
                    )}
                    {viewProduct.costingTotalUnitCost !== undefined && viewProduct.costingTotalUnitCost > 0 && (
                      <div>
                        <span className="text-blue-700">Total Unit Cost:</span>
                        <span className="ml-2 font-medium">{InventoryService.formatCurrency(viewProduct.costingTotalUnitCost)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Multi-Model Costing Display */}
                  {viewProduct.costingModelsJson && (
                    <div className="mt-4">
                      <h5 className="font-medium text-blue-900 mb-2">Model Details</h5>
                      <div className="bg-white rounded-lg overflow-hidden border border-blue-200">
                        <table className="w-full text-sm">
                          <thead className="bg-blue-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-blue-800">Model</th>
                              <th className="px-3 py-2 text-right text-blue-800">Units</th>
                              <th className="px-3 py-2 text-right text-blue-800">Unit USD</th>
                              <th className="px-3 py-2 text-right text-blue-800">Total USD</th>
                              <th className="px-3 py-2 text-right text-blue-800">Customs</th>
                              <th className="px-3 py-2 text-right text-blue-800">Freight</th>
                              <th className="px-3 py-2 text-right text-blue-800">Total PKR</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-blue-100">
                            <tr>
                              <td colSpan={7} className="px-3 py-2 text-center text-gray-500">
                                {viewProduct.modelName} (Primary)
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <div>
                {/* Add Costing Button - Show only if costing is not linked */}
                {(!viewProduct.costingOption || viewProduct.costingOption !== 'with') && !viewProduct.costingUsdRate && (
                  <button
                    onClick={() => {
                      setSelectedProductForCosting(viewProduct);
                      setShowAddCostingDialog(true);
                      setViewProduct(null);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <DollarSign size={18} />
                    Add Costing
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setViewProduct(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewProduct(null);
                    onTransfer(viewProduct.id);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white rounded-lg font-medium hover:from-[#4338ca] hover:to-[#4f46e5] transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Costing Dialog */}
      <AddCostingDialog
        isOpen={showAddCostingDialog}
        onClose={() => {
          setShowAddCostingDialog(false);
          setSelectedProductForCosting(null);
        }}
        onSave={(data) => {
          // Handle saving the costing - this would update the product via props or API
          console.log('Link costing to product:', selectedProductForCosting?.id, data);
          setShowAddCostingDialog(false);
          setSelectedProductForCosting(null);
        }}
        productName={selectedProductForCosting ? `${selectedProductForCosting.brandName} ${selectedProductForCosting.modelName}` : ''}
      />
    </div>
  );
}
