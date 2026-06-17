// views/InventoryPayableConfigPanel.tsx
// Panel embedded inside PayableToFuturisticView (second tab).
// Lets users pick an inventory item and set its fixed AED payable amount.
// When an invoice is created with that product, the amount auto-appears
// in the Payable to Futuristic module.

import React from 'react';
import {
  Settings, Plus, Trash2, Loader2, AlertCircle,
  CheckCircle2, Package, ChevronRight,
} from 'lucide-react';
import { useInventoryPayableConfigViewModel } from '../viewModels/useInventoryPayableConfigViewModel';
import { aedToAllCurrencies } from '../models/payableToFuturistic';

const S = {
  charcoal: { backgroundColor: '#1e293b', color: '#ffffff' } as React.CSSProperties,
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const InventoryPayableConfigPanel: React.FC = () => {
  const {
    products, productsLoading,
    configs, configsLoading, configsError,
    selectedProductId, fixedAmountAed, notes,
    setSelectedProductId, setFixedAmountAed, setNotes,
    submitConfig, deleteConfig,
    actionLoading, actionError, successMessage,
  } = useInventoryPayableConfigViewModel();

  const previewAmounts = (() => {
    const v = parseFloat(fixedAmountAed);
    if (!isNaN(v) && v > 0) return aedToAllCurrencies(v);
    return null;
  })();

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div style={{ ...S.charcoal, padding: 10, borderRadius: 12 }}>
          <Settings size={18} color="#fff" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800">Configure Inventory Payables</h2>
          <p className="text-xs text-gray-500">
            Set a fixed AED amount per inventory item. When an invoice is created with that
            item, the amount is automatically added to this payable module.
          </p>
        </div>
      </div>

      {/* ── Add / Edit Form ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Add / Update Configuration
        </p>

        {/* Inventory dropdown */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Inventory Item <span className="text-red-400">*</span>
          </label>
          {productsLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <Loader2 size={13} className="animate-spin" /> Loading inventory…
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle size={13} /> No inventory items found. Add inventory first.
            </div>
          ) : (
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
            >
              <option value="">— Select inventory item —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brandName} {p.modelName}
                  {p.location ? ` · ${p.location}` : ''}
                  {p.stock > 0 ? ` (${p.stock} in stock)` : ''}
                </option>
              ))}
            </select>
          )}
          {selectedProduct && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
              <Package size={12} />
              <span>
                <strong>{selectedProduct.brandName} {selectedProduct.modelName}</strong>
                {selectedProduct.location && <> · {selectedProduct.location}</>}
                {' '}&mdash; Status: {selectedProduct.status}
                {' '}&mdash; <code className="text-[10px] bg-blue-100 px-1 rounded">ID: {selectedProduct.id}</code>
              </span>
            </div>
          )}
        </div>

        {/* Fixed AED amount */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Fixed Amount (AED) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">AED</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={fixedAmountAed}
              onChange={(e) => setFixedAmountAed(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-12 pr-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
            />
          </div>
          {previewAmounts && (
            <div className="mt-1.5 flex gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Equivalent:</span>
              {([['PKR', previewAmounts.pkr], ['SAR', previewAmounts.sar], ['USD', previewAmounts.usd]] as [string, number][]).map(([sym, val]) => (
                <span key={sym} className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-0.5">
                  {sym} {fmt(val)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Notes (optional)</label>
          <input
            type="text"
            placeholder="e.g. Half of fixed cost per unit"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
          />
        </div>

        {/* Feedback */}
        {actionError && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={13} /> {actionError}
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <CheckCircle2 size={13} /> {successMessage}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={submitConfig}
          disabled={actionLoading}
          style={S.charcoal}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60"
        >
          {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Save Configuration
        </button>
      </div>

      {/* ── Existing Configs Table ──────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Configured Items ({configs.length})
          </span>
          <span className="text-xs text-gray-400">
            Auto-triggers on invoice creation
          </span>
        </div>

        {configsLoading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : configsError ? (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 m-4 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={13} /> {configsError}
          </div>
        ) : configs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Settings size={36} className="mb-3 opacity-20" />
            <p className="text-sm font-medium text-gray-500">No configurations yet</p>
            <p className="text-xs text-gray-400 mt-1">Add one above to enable auto-payables on invoicing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Inventory Item</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product ID</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fixed Amount (AED)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Equiv. USD</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {configs.map((cfg) => {
                  const equiv = aedToAllCurrencies(cfg.fixedAmountAed);
                  return (
                    <tr key={cfg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Package size={13} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-medium text-gray-800">{cfg.productName}</span>
                            <p className="text-xs text-gray-400">{cfg.brandName} · {cfg.modelName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{cfg.productId}</code>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-gray-800">AED {fmt(cfg.fixedAmountAed)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-gray-500">${fmt(equiv.usd)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{cfg.notes || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => deleteConfig(cfg.id)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border transition text-red-600 border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={11} /> Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <details className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden group">
        <summary className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors list-none flex items-center gap-2 select-none">
          <ChevronRight size={13} className="group-open:rotate-90 transition-transform" />
          How auto-payables work
        </summary>
        <div className="px-5 pb-4 pt-2 space-y-2 text-xs text-gray-500 leading-relaxed">
          <p>
            <strong className="text-gray-700">1. Configure:</strong> Select an inventory item and set its fixed AED payable amount here.
          </p>
          <p>
            <strong className="text-gray-700">2. Invoice:</strong> When any invoice is created that includes this inventory item, the system automatically records the fixed AED amount as a payable entry.
          </p>
          <p>
            <strong className="text-gray-700">3. Track:</strong> The entry appears in the <strong className="text-gray-700">Invoices & Products</strong> tab, linked to the invoice number, with pending status.
          </p>
          <p>
            <strong className="text-gray-700">4. Pay:</strong> Use the <em>Pay</em> button on any entry to record full or partial payment.
          </p>
          <p className="text-gray-400 italic">
            Updating or removing a config only affects future invoices — existing payable entries are not changed.
          </p>
          <p className="text-gray-400 italic">
            Tip: if an invoiced item isn't showing up here, open the browser console (F12) and look for
            <code className="bg-gray-100 px-1 rounded mx-1">[PayableBridge]</code> log lines — they show exactly which
            productId was checked and whether a config was found.
          </p>
        </div>
      </details>

    </div>
  );
};