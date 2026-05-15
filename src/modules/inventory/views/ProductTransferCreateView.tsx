// Inventory Module - View Layer
// ProductTransferCreateView - Create a new product transfer
//
// Fix: "Add Item" button now has blue background + white text matching theme

import React from 'react';
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Loader2,
  MapPin, Package, Hash, User, Calendar, FileText,
} from 'lucide-react';
import { UseProductTransferCreateViewModelReturn } from '../viewModels/useProductTransferCreateViewModel';

interface Props extends UseProductTransferCreateViewModelReturn {}

export const ProductTransferCreateView: React.FC<Props> = ({
  products, locations, formData, transferItems,
  showSummary, isSubmitting, isLoading, validation,
  setFormField, addTransferItem, removeTransferItem,
  updateTransferItemProduct, updateTransferItemQuantity, updateTransferItemSerial,
  toggleSummary, handleSave, onBack,
  getAvailableSerials, getProductStockByLocation, getProductById,
  addNewLocation,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm';

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 text-gray-600 hover:bg-gray-100 border border-gray-200 bg-white rounded-lg transition-colors shadow-sm">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">New Product Transfer</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Move products between locations — serials are removed from source immediately
          </p>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── Header info ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-500" /> Transfer Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />Date *
              </label>
              <input type="date" value={formData.date}
                onChange={e => setFormField('date', e.target.value)}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                <User className="w-3.5 h-3.5 inline mr-1" />Transferred By *
              </label>
              <input type="text" value={formData.transferredBy}
                onChange={e => setFormField('transferredBy', e.target.value)}
                placeholder="e.g. Manager Ahmed"
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-red-400" />From Location *
              </label>
              <div className="flex gap-2">
                <select value={formData.fromLocation}
                  onChange={e => setFormField('fromLocation', e.target.value)}
                  className={inputCls}>
                  <option value="">Select source location</option>
                  {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <button type="button" onClick={async () => {
                  const v = window.prompt('Add new From location (e.g. Dubai)');
                  if (v && v.trim()) {
                    const added = await addNewLocation(v.trim());
                    if (added) setFormField('fromLocation', added);
                  }
                }}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-green-500" />To Location *
              </label>
              <div className="flex gap-2">
                <select value={formData.toLocation}
                  onChange={e => setFormField('toLocation', e.target.value)}
                  className={inputCls}>
                  <option value="">Select destination location</option>
                  {locations
                    .filter(loc => loc !== formData.fromLocation)
                    .map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <button type="button" onClick={async () => {
                  const v = window.prompt('Add new To location (e.g. Saudia)');
                  if (v && v.trim()) {
                    const added = await addNewLocation(v.trim());
                    if (added) setFormField('toLocation', added);
                  }
                }}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Route arrow */}
          {formData.fromLocation && formData.toLocation && (
            <div className="flex items-center gap-3 mt-4 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-lg">
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                {formData.fromLocation}
              </span>
              <ArrowRight className="w-5 h-5 text-indigo-500 shrink-0" />
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                {formData.toLocation}
              </span>
            </div>
          )}
        </div>

        {/* ── Transfer lines ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" /> Items to Transfer
            </h3>
            {/* ── FIX: blue background + white text, matches theme ── */}
            <button
              onClick={addTransferItem}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors font-semibold border border-gray-300"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>

          {!formData.fromLocation && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 mb-4">
              Select a From location first to see available stock.
            </div>
          )}

          <div className="space-y-4">
            {transferItems.map((line, li) => {
              const availableSerials = getAvailableSerials(line.productId, formData.fromLocation);
              const stockAtLocation  = getProductStockByLocation(line.productId, formData.fromLocation || '');
              const selectedProduct  = getProductById(line.productId);

              return (
                <div key={li} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Item {li + 1}
                    </span>
                    {transferItems.length > 1 && (
                      <button onClick={() => removeTransferItem(li)}
                        className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                  </div>

                  {/* Product select */}
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Product *</label>
                    <select value={line.productId}
                      onChange={e => updateTransferItemProduct(li, e.target.value)}
                      className={inputCls}
                      disabled={!formData.fromLocation}>
                      <option value="">
                        {formData.fromLocation ? 'Select product' : 'Select From location first'}
                      </option>
                      {products
                        .filter(p => getProductStockByLocation(p.id, formData.fromLocation) > 0)
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.brandName} {p.modelName}
                            {' '}({getProductStockByLocation(p.id, formData.fromLocation)} available)
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  {line.productId && (
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Quantity *</label>
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={e => updateTransferItemQuantity(li, Number(e.target.value))}
                        min={1}
                        max={stockAtLocation}
                        className={`${inputCls} w-28`} />
                      {line.quantity > stockAtLocation && stockAtLocation > 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          Only {stockAtLocation} available at {formData.fromLocation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Serial number selects */}
                  {line.productId && line.quantity > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <Hash size={13} /> Select Serials to Transfer
                        <span className="text-gray-400 font-normal">
                          ({line.selectedSerials.filter(s => s).length}/{line.quantity} selected)
                        </span>
                      </label>
                      {availableSerials.length === 0 ? (
                        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                          No serials available at {formData.fromLocation} for this product.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Array.from({ length: line.quantity }, (_, si) => (
                            <select key={si} value={line.selectedSerials[si] || ''}
                              onChange={e => updateTransferItemSerial(li, si, e.target.value)}
                              className={inputCls}>
                              <option value="">Serial {si + 1}</option>
                              {availableSerials.map(serial => (
                                <option
                                  key={serial}
                                  value={serial}
                                  disabled={
                                    line.selectedSerials.some((s, idx) => idx !== si && s === serial) ||
                                    transferItems.some((it, idx) => idx !== li && it.selectedSerials.includes(serial))
                                  }>
                                  {serial}
                                </option>
                              ))}
                            </select>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Notes ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            <FileText className="w-3.5 h-3.5 inline mr-1" />Notes (optional)
          </label>
          <textarea value={formData.note} onChange={e => setFormField('note', e.target.value)}
            rows={3} placeholder="Any notes about this transfer..."
            className={`${inputCls} resize-none`} />
        </div>

        {/* ── Summary (shown after Review) ── */}
        {showSummary && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
            <h3 className="font-semibold text-indigo-900 mb-4">Transfer Summary</h3>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">{formData.fromLocation}</span>
              <ArrowRight className="w-5 h-5 text-indigo-500" />
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">{formData.toLocation}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-indigo-200">
                  <th className="text-left py-2 text-indigo-700">Product</th>
                  <th className="text-left py-2 text-indigo-700">Qty</th>
                  <th className="text-left py-2 text-indigo-700">Serials</th>
                </tr>
              </thead>
              <tbody>
                {transferItems.map((it, idx) => {
                  const p = getProductById(it.productId);
                  return (
                    <tr key={idx} className="border-b border-indigo-100">
                      <td className="py-2 text-indigo-900 font-medium">
                        {p ? `${p.brandName} ${p.modelName}` : '—'}
                      </td>
                      <td className="py-2 text-indigo-800">{it.quantity}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {it.selectedSerials.filter(Boolean).map(s => (
                            <span key={s} className="px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 rounded text-xs font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-indigo-600 mt-3">
              These serials will be removed from <strong>{formData.fromLocation}</strong> immediately
              and marked <strong>In Transit</strong> until received at <strong>{formData.toLocation}</strong>.
            </p>
          </div>
        )}

        {/* Validation error */}
        {!validation.isValid && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {validation.error}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center justify-between pb-6">
          <button onClick={onBack} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {!showSummary ? (
              <button
                onClick={toggleSummary}
                disabled={!validation.isValid}
                className="px-6 py-2.5 bg-gray-100 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
                Review Transfer
              </button>
            ) : (
              <>
                <button onClick={toggleSummary}
                  className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  ← Edit
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting || !validation.isValid}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold">
                  {isSubmitting
                    ? <><Loader2 size={18} className="animate-spin" /> Creating Transfer...</>
                    : <>Confirm Transfer <ArrowRight size={18} /></>
                  }
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};