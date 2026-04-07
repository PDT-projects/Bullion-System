// Inventory Module - View Layer
// InventoryAddExistingView
// Changes:
//   - Serial number inputs shown when addQty > 0
//   - City/location selector per serial
//   - Updated sell price / cost price fields shown

import React from 'react';
import { Search, Package, ArrowLeft, Loader2, Plus, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UseInventoryAddExistingViewModelReturn } from '../viewModels/useInventoryAddExistingViewModel';

interface Props extends UseInventoryAddExistingViewModelReturn {}

export const InventoryAddExistingView: React.FC<Props> = ({
  isLoading, error,
  searchTerm, setSearchTerm, filteredProducts,
  selectedProduct, selectProduct,
  entry, setAddQty, setNewSerial, setNewSerialCity, setNewSellPrice, setNewCostPrice,
  handleSave, isSaving,
  cities, formatCurrency,
}) => {
  const navigate = useNavigate();

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

  const inputCls =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none text-sm';

  return (
    <div className="h-full overflow-y-auto p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/inventory')}
          className="flex items-center justify-center w-10 h-10 bg-white border-2 border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all text-gray-700 flex-shrink-0"
          title="Back to Inventory Entry"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add to Existing Inventory</h2>
          <p className="text-gray-500 text-sm mt-1">
            Select a product to add more units, update prices, or add serial numbers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT: product list ── */}
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by brand, model, category..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:outline-none"
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
                <div key={brand} className="bg-white rounded-xl border shadow-sm overflow-hidden">
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
                        className={`w-full text-left transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 border-l-4 border-indigo-500 px-4 py-3'
                            : 'hover:bg-gray-50 px-5 py-3'
                        }`}
                      >
                        <p className="font-medium text-gray-900">{product.modelName}</p>
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                          {product.location && (
                            <span className="text-xs text-indigo-500">📍 {product.location}</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatCurrency(product.sellPrice)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: edit panel ── */}
        <div>
          {!selectedProduct || !entry ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-white border rounded-xl gap-3">
              <Package className="w-10 h-10 text-gray-200" />
              <p className="text-gray-400 font-medium">Select a product to continue</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="p-5 space-y-5">

                {/* Product info banner */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
                  <p className="text-sm font-semibold text-indigo-800">
                    {entry.brandName} — {entry.modelName}
                  </p>
                  <p className="text-xs text-indigo-500 mt-0.5">
                    Current stock: {entry.currentStock} units
                  </p>
                </div>

                {/* Units to add */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                    Units to Add *
                  </label>
                  <input
                    type="number"
                    value={entry.addQty}
                    onChange={e => setAddQty(Number(e.target.value))}
                    className={inputCls}
                    min={1}
                  />
                </div>

                {/* Sell price */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                    Updated Sell Price (PKR)
                  </label>
                  <input
                    type="number"
                    value={entry.newSellPrice || ''}
                    onChange={e => setNewSellPrice(Number(e.target.value))}
                    className={inputCls}
                    min={0}
                    placeholder="0"
                  />
                </div>

                {/* Cost price */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                    Updated Cost Price (PKR)
                  </label>
                  <input
                    type="number"
                    value={entry.newCostPrice || ''}
                    onChange={e => setNewCostPrice(Number(e.target.value))}
                    className={inputCls}
                    min={0}
                    placeholder="0"
                  />
                </div>

                {/* Serial numbers — one input per unit */}
                {entry.addQty > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Hash className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-semibold text-gray-700">
                        Serial Numbers ({entry.addQty} required)
                      </span>
                    </div>
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {Array.from({ length: entry.addQty }, (_, i) => (
                        <div
                          key={i}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-2"
                        >
                          <label className="block text-xs font-semibold text-gray-500">
                            Unit {i + 1}
                          </label>
                          <input
                            type="text"
                            value={entry.newSerials[i] || ''}
                            onChange={e => setNewSerial(i, e.target.value)}
                            placeholder={`Serial #${i + 1}`}
                            className={inputCls}
                          />
                          <select
                            value={
                              entry.newSerials[i]
                                ? entry.newSerialCities[entry.newSerials[i]] || ''
                                : ''
                            }
                            onChange={e => setNewSerialCity(i, e.target.value)}
                            className={inputCls}
                          >
                            <option value="">Select location (optional)</option>
                            {cities.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
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