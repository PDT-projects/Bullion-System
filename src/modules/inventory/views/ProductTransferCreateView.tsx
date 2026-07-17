// Inventory Module - View Layer
// ProductTransferCreateView
//
// CHANGES (v3):
//  • Date field replaced with <input type="datetime-local"> — captures full date+time
//  • Serial selection replaced with a checkbox list — one checkbox per available serial,
//    any number can be selected; quantity is derived automatically from selection count
//  • "Select All" / "Clear" shortcuts added per product line
//  • Summary table shows exact serials + derived quantity
//  • Validation message updated to match new model

import React from 'react';
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Loader2,
  MapPin, Package, Hash, User, Calendar, FileText,
  CheckSquare, Square, DollarSign, List,
} from 'lucide-react';
import { UseProductTransferCreateViewModelReturn } from '../viewModels/useProductTransferCreateViewModel';

// The wrapper passes `onViewTransfers` so this view can offer a "View Transfers"
// button in the header that toggles back to the report tab. When rendered
// standalone (e.g. from a full-page route), the prop is undefined and the
// button is hidden — safe fallback.
interface Props extends UseProductTransferCreateViewModelReturn {
  onViewTransfers?: () => void;
}

export const ProductTransferCreateView: React.FC<Props> = ({
  products, locations, formData, transferItems,
  showSummary, isSubmitting, isLoading, validation,
  costPerUnit,
  setFormField, addTransferItem, removeTransferItem,
  updateTransferItemProduct, toggleSerial,
  toggleSummary, handleSave, onBack,
  getAvailableSerials, getProductStockByLocation, getProductById,
  addNewLocation,
  onViewTransfers,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  const inputCls =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm';

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header. Right padding on the outer flex leaves room for the parent
            popup's × close button (absolute, top:12 right:14 in the popup
            portal) so it doesn't overlap the "View Transfers" toggle below. */}
        <div className="flex items-center justify-between gap-4 mb-6" style={{ paddingRight: 48 }}>
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:bg-gray-100 border border-gray-200 bg-white rounded-lg transition-colors shadow-sm"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">New Product Transfer</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Move products between locations — select serials to transfer
              </p>
            </div>
          </div>

          {/* View Transfers — only rendered when parent (wrapper) passes the
              callback. Toggles to the report view inside the same popup. */}
          {onViewTransfers && (
            <button
              onClick={onViewTransfers}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-md whitespace-nowrap"
              style={{ letterSpacing: '0.01em' }}
              title="View all transfers"
            >
              <List size={16} /> View Transfers
            </button>
          )}
        </div>

        <div className="space-y-6">

          {/* ── Transfer Details Card ── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-500" /> Transfer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Date + Time */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />Date &amp; Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.transferDateTime}
                  onChange={e => setFormField('transferDateTime', e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Transferred By */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  <User className="w-3.5 h-3.5 inline mr-1" />Transferred By *
                </label>
                <input
                  type="text"
                  value={formData.transferredBy}
                  onChange={e => setFormField('transferredBy', e.target.value)}
                  placeholder="e.g. Manager Ahmed"
                  className={inputCls}
                />
              </div>

              {/* Shipment Cost */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  <DollarSign className="w-3.5 h-3.5 inline mr-1 text-amber-500" />Total Shipment Cost (AED)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.shipmentCost || ''}
                  onChange={e => setFormField('shipmentCost', parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 500"
                  className={inputCls}
                />
              </div>

              {/* Cost per unit — live derived display */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  <DollarSign className="w-3.5 h-3.5 inline mr-1 text-green-500" />Cost Per Unit (Auto-calculated)
                </label>
                <div className={`${inputCls} bg-gray-50 text-gray-700 flex items-center justify-between`}>
                  <span className="font-semibold text-green-700">
                    {costPerUnit > 0
                      ? `AED ${costPerUnit.toFixed(2)}`
                      : <span className="text-gray-400 font-normal">Enter cost + select serials</span>}
                  </span>
                  {costPerUnit > 0 && (
                    <span className="text-xs text-gray-400">
                      {formData.shipmentCost} ÷ {transferItems.reduce((s, it) => s + it.selectedSerials.length, 0)} units
                    </span>
                  )}
                </div>
              </div>

              {/* From Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  <MapPin className="w-3.5 h-3.5 inline mr-1 text-red-400" />From Location *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.fromLocation}
                    onChange={async e => {
                      const v = e.target.value;
                      if (v === '__add_new__') {
                        const nv = window.prompt('Add new From location (e.g. Dubai)');
                        if (nv?.trim()) {
                          const added = await addNewLocation(nv.trim());
                          if (added) setFormField('fromLocation', added);
                        } else {
                          setFormField('fromLocation', '');
                        }
                      } else {
                        setFormField('fromLocation', v);
                      }
                    }}
                    className={inputCls}
                  >
                    <option value="">Select source location</option>
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    <option value="__add_new__">➕ Add new location…</option>
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      const v = window.prompt('Add new From location');
                      if (v?.trim()) {
                        const added = await addNewLocation(v.trim());
                        if (added) setFormField('fromLocation', added);
                      }
                    }}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* To Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  <MapPin className="w-3.5 h-3.5 inline mr-1 text-green-500" />To Location *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.toLocation}
                    onChange={async e => {
                      const v = e.target.value;
                      if (v === '__add_new__') {
                        const nv = window.prompt('Add new To location (e.g. Saudia)');
                        if (nv?.trim()) {
                          const added = await addNewLocation(nv.trim());
                          if (added) setFormField('toLocation', added);
                        } else {
                          setFormField('toLocation', '');
                        }
                      } else {
                        setFormField('toLocation', v);
                      }
                    }}
                    className={inputCls}
                  >
                    <option value="">Select destination location</option>
                    {locations
                      .filter(loc => loc !== formData.fromLocation)
                      .map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    <option value="__add_new__">➕ Add new location…</option>
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      const v = window.prompt('Add new To location');
                      if (v?.trim()) {
                        const added = await addNewLocation(v.trim());
                        if (added) setFormField('toLocation', added);
                      }
                    }}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Route arrow banner */}
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

          {/* ── Transfer Lines Card ── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" /> Items to Transfer
              </h3>
              <button
                onClick={addTransferItem}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors font-semibold" style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}
              >
                <Plus size={16} /> Add Another Model
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
                const stockAtLocation  = getProductStockByLocation(line.productId || '', formData.fromLocation || '');
                const selectedCount    = line.selectedSerials.length;
                const allSelected      = availableSerials.length > 0 && selectedCount === availableSerials.length;

                return (
                  <div key={li} className="border border-gray-200 rounded-xl p-4 bg-gray-50">

                    {/* Line header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Item {li + 1}
                      </span>
                      {transferItems.length > 1 && (
                        <button
                          onClick={() => removeTransferItem(li)}
                          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>

                    {/* Product select */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Product *</label>
                      <select
                        value={line.productId}
                        onChange={e => updateTransferItemProduct(li, e.target.value)}
                        className={inputCls}
                        disabled={!formData.fromLocation}
                      >
                        <option value="">
                          {formData.fromLocation ? 'Select product' : 'Select From location first'}
                        </option>
                        {products
                          .filter(p => getProductStockByLocation(p.id, formData.fromLocation) > 0)
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.brandName} {p.modelName}{' '}
                              ({getProductStockByLocation(p.id, formData.fromLocation)} available)
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Serial number checkbox list */}
                    {line.productId && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                            <Hash size={13} />
                            Select Serial Numbers to Transfer
                            <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold text-xs">
                              {selectedCount} selected
                            </span>
                          </label>
                          {availableSerials.length > 0 && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  // Select all: toggle each unselected serial on
                                  availableSerials.forEach(s => {
                                    if (!line.selectedSerials.includes(s)) toggleSerial(li, s);
                                  });
                                }}
                                disabled={allSelected}
                                className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                              >
                                Select All
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                type="button"
                                onClick={() => {
                                  // Clear all: toggle each selected serial off
                                  line.selectedSerials.forEach(s => toggleSerial(li, s));
                                }}
                                disabled={selectedCount === 0}
                                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                              >
                                Clear
                              </button>
                            </div>
                          )}
                        </div>

                        {availableSerials.length === 0 ? (
                          <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                            No serials available at {formData.fromLocation} for this product.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1">
                            {availableSerials.map(serial => {
                              const isChecked = line.selectedSerials.includes(serial);
                              // Disable if checked in another line
                              const usedElsewhere = transferItems.some(
                                (it, idx) => idx !== li && it.selectedSerials.includes(serial)
                              );
                              return (
                                <label
                                  key={serial}
                                  className={`
                                    flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-mono cursor-pointer select-none transition-colors
                                    ${usedElsewhere
                                      ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200'
                                      : isChecked
                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                                        : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-gray-700'
                                    }
                                  `}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={usedElsewhere}
                                    onChange={() => !usedElsewhere && toggleSerial(li, serial)}
                                    className="accent-indigo-600 w-4 h-4 shrink-0"
                                  />
                                  <span className="truncate text-xs">{serial}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* Derived quantity display */}
                        {selectedCount > 0 && (
                          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 mt-2 font-medium">
                            ✓ {selectedCount} unit{selectedCount > 1 ? 's' : ''} will be transferred
                          </p>
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
            <textarea
              value={formData.note}
              onChange={e => setFormField('note', e.target.value)}
              rows={3}
              placeholder="Any notes about this transfer..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* ── Summary (shown after Review) ── */}
          {showSummary && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
              <h3 className="font-semibold text-indigo-900 mb-4">Transfer Summary</h3>

              {/* DateTime */}
              <p className="text-sm text-indigo-700 mb-3">
                <span className="font-semibold">Date &amp; Time:</span>{' '}
                {formData.transferDateTime
                  ? new Date(formData.transferDateTime).toLocaleString('en-AE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '—'}
              </p>

              {/* Route */}
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                  {formData.fromLocation}
                </span>
                <ArrowRight className="w-5 h-5 text-indigo-500" />
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  {formData.toLocation}
                </span>
              </div>

              {/* Shipment cost summary */}
              {formData.shipmentCost > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Total Shipment Cost</p>
                    <p className="text-lg font-bold text-amber-800">AED {formData.shipmentCost.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Cost Per Unit</p>
                    <p className="text-lg font-bold text-green-700">AED {costPerUnit.toFixed(2)}</p>
                  </div>
                </div>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-indigo-200">
                    <th className="text-left py-2 text-indigo-700">Product</th>
                    <th className="text-left py-2 text-indigo-700 w-12">Qty</th>
                    <th className="text-left py-2 text-indigo-700">Serial Numbers</th>
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
                        <td className="py-2 text-indigo-800 font-bold">
                          {it.selectedSerials.length}
                        </td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1">
                            {it.selectedSerials.map(s => (
                              <span
                                key={s}
                                className="px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 rounded text-xs font-mono"
                              >
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
                These serials will be removed from{' '}
                <strong>{formData.fromLocation}</strong> immediately and marked{' '}
                <strong>In Transit</strong> until received at{' '}
                <strong>{formData.toLocation}</strong>.
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
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              {!showSummary ? (
                <button
                  onClick={toggleSummary}
                  disabled={!validation.isValid}
                  className="px-6 py-2.5 bg-gray-100 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Review Transfer
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleSummary}
                    className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ← Edit
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting || !validation.isValid}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    {isSubmitting ? (
                      <><Loader2 size={18} className="animate-spin" /> Creating Transfer...</>
                    ) : (
                      <>Confirm Transfer <ArrowRight size={18} /></>
                    )}
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