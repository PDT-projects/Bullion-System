// Inventory Module - View Layer
// InventoryAddExistingView

import React from 'react';
import {
  Search, Package, ArrowLeft, Hash, ChevronRight,
  Check, Loader2, Plus, X
} from 'lucide-react';
import { UseInventoryAddExistingViewModelReturn } from '../viewModels/useInventoryAddExistingViewModel';

interface Props extends UseInventoryAddExistingViewModelReturn {}

export const InventoryAddExistingView: React.FC<Props> = ({
  isLoading, error,
  searchTerm, setSearchTerm, filteredProducts,
  selectedProduct, selectProduct, clearSelection,
  entry, setAddQty, setNewSerial, setNewSerialCity, setNewSellPrice, setNewCostPrice,
  handleSave, isSaving,
  cities, formatCurrency,
}) => {

  const grouped = filteredProducts.reduce<Record<string, typeof filteredProducts>>((acc, p) => {
    const key = p.brandName || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add to Existing Inventory</h2>
          <p className="text-gray-500 text-sm mt-1">
            Select a product to add more units, update prices, or add serial numbers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT SIDE */}
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {Object.entries(grouped).map(([brand, prods]) => (
                <div key={brand} className="bg-white rounded-xl border shadow-sm">
                  <div className="px-4 py-3 bg-indigo-50 border-b flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span className="font-semibold text-indigo-800 text-sm">{brand}</span>
                  </div>

                  {prods.map(product => {
                    const isSelected = selectedProduct?.id === product.id;

                    return (
                      <button
                        key={product.id}
                        onClick={() => selectProduct(product)}
                        className={`w-full px-4 py-3 text-left ${
                          isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-medium text-gray-900">{product.modelName}</p>
                        <p className="text-xs text-gray-500">
                          Stock: {product.stock}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div>
          {!selectedProduct || !entry ? (
            <div className="flex items-center justify-center h-full bg-white border rounded-xl">
              <p className="text-gray-400">Select a product</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm">

              <div className="p-5 space-y-6">

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Units to Add</label>
                  <input
                    type="number"
                    value={entry.addQty}
                    onChange={e => setAddQty(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                {/* ✅ FINAL FIXED BUTTON */}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 
                             bg-indigo-600 
                             rounded-xl font-semibold 
                             hover:bg-indigo-700 
                             transition
                             disabled:opacity-60"
                  style={{ color: 'black' }}   // 🔥 FORCE BLACK TEXT
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Add {entry.addQty} Unit{entry.addQty > 1 ? 's' : ''} to Stock
                    </>
                  )}
                </button>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};