// Inventory Module - View Layer
// InventoryAddExistingView
// Displays all existing products in a searchable list grouped by brand.
// User selects a product, sets how many units to add, enters serial numbers
// for those new units, and optionally updates the sell/cost price.

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
  // Group products by brand for display
  const grouped = filteredProducts.reduce<Record<string, typeof filteredProducts>>((acc, p) => {
    const key = p.brandName || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  // ── Loading / error states ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-gray-500">Loading products from Firestore...</p>
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
    <div className="p-6 max-w-6xl mx-auto">
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

        {/* ── Left: Product list ────────────────────────────────────────────── */}
        <div>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by brand, model or category..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([brand, prods]) => (
                <div key={brand} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* Brand header */}
                  <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span className="font-semibold text-indigo-800 text-sm">{brand}</span>
                    <span className="ml-auto text-xs text-indigo-400">{prods.length} model{prods.length > 1 ? 's' : ''}</span>
                  </div>
                  {/* Models */}
                  {prods.map(product => {
                    const isSelected = selectedProduct?.id === product.id;
                    return (
                      <button
                        key={product.id}
                        onClick={() => selectProduct(product)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-b-0 ${
                          isSelected
                            ? 'bg-indigo-50 border-l-4 border-l-indigo-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{product.modelName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {product.category} · Stock: <span className="font-semibold text-gray-700">{product.stock}</span> units · {formatCurrency(product.sellPrice)}
                          </p>
                        </div>
                        <div className="ml-3 flex items-center gap-2">
                          {isSelected
                            ? <Check className="w-5 h-5 text-indigo-600" />
                            : <ChevronRight className="w-4 h-4 text-gray-400" />
                          }
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Edit panel ─────────────────────────────────────────────── */}
        <div>
          {!selectedProduct || !entry ? (
            <div className="flex items-center justify-center h-full min-h-[300px] bg-white rounded-xl border-2 border-dashed border-gray-200">
              <div className="text-center text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Select a product on the left</p>
                <p className="text-sm mt-1">to add stock, serials, or update pricing</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
                <div>
                  <p className="font-bold text-gray-900">{entry.brandName} — {entry.modelName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Current stock: <span className="font-semibold">{entry.currentStock}</span> units
                  </p>
                </div>
                <button onClick={clearSelection} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              <div className="p-5 space-y-6">

                {/* ── Quantity to add ── */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Units to Add *
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAddQty(entry.addQty - 1)}
                      disabled={entry.addQty <= 1}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-50 disabled:opacity-40 transition-colors">
                      −
                    </button>
                    <input
                      type="number" min="1" value={entry.addQty}
                      onChange={e => setAddQty(Number(e.target.value))}
                      className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 font-semibold text-lg"
                    />
                    <button
                      onClick={() => setAddQty(entry.addQty + 1)}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-50 transition-colors">
                      +
                    </button>
                    <span className="text-sm text-gray-500">
                      → New total: <strong>{entry.currentStock + entry.addQty}</strong>
                    </span>
                  </div>
                </div>

                {/* ── Serial numbers for new units ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-4 h-4 text-indigo-500" />
                    <label className="text-sm font-semibold text-gray-700">
                      Serial Numbers for New Units
                    </label>
                    <span className="text-xs text-gray-400">
                      ({entry.newSerials.filter(s => s.trim()).length}/{entry.addQty} filled)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                    {Array.from({ length: entry.addQty }, (_, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                          New Unit {idx + 1}
                        </label>
                        <input
                          type="text"
                          value={entry.newSerials[idx] || ''}
                          onChange={e => setNewSerial(idx, e.target.value)}
                          placeholder={`Serial #${idx + 1}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 bg-white mb-2"
                        />
                        <select
                          value={entry.newSerialCities[entry.newSerials[idx]] || ''}
                          onChange={e => setNewSerialCity(idx, e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-600">
                          <option value="">Location (optional)</option>
                          {cities.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Update prices ── */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Update Prices (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Cost Price (PKR)</label>
                      <input
                        type="number" min="0" value={entry.newCostPrice}
                        onChange={e => setNewCostPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Sell Price (PKR)</label>
                      <input
                        type="number" min="0" value={entry.newSellPrice}
                        onChange={e => setNewSellPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    These prices will apply to all units of this product going forward.
                  </p>
                </div>

                {/* ── Summary ── */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                  <p className="text-sm font-semibold text-indigo-900 mb-2">Summary</p>
                  <div className="space-y-1 text-sm text-indigo-800">
                    <div className="flex justify-between"><span>Adding:</span><span className="font-medium">{entry.addQty} unit{entry.addQty > 1 ? 's' : ''}</span></div>
                    <div className="flex justify-between"><span>New total stock:</span><span className="font-medium">{entry.currentStock + entry.addQty}</span></div>
                    <div className="flex justify-between"><span>New cost price:</span><span className="font-medium">{formatCurrency(entry.newCostPrice)}</span></div>
                    <div className="flex justify-between"><span>New sell price:</span><span className="font-medium">{formatCurrency(entry.newSellPrice)}</span></div>
                  </div>
                </div>

                {/* ── Save button ── */}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-base hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md">
                  {isSaving
                    ? <><Loader2 size={20} className="animate-spin" /> Saving...</>
                    : <><Plus size={20} /> Add {entry.addQty} Unit{entry.addQty > 1 ? 's' : ''} to Stock</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};