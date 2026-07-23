// Product Transfer — New form
//
// Flow (redesigned per user request):
//   1. Date & Time  (auto-filled to now, editable)
//   2. Transferred By
//   3. From Location (source)  ← asked FIRST
//   4. To Location   (destination)  ← asked SECOND
//   5. One or more Product items — each with:
//        • Brand dropdown       (brands available at the source location)
//        • Model dropdown       (models of that brand at source)
//        • Serial checkboxes    (available serials of that model at source)
//   6. + Add Another Product   button to append another item
//   7. Save button
//
// Removed: shipment cost / note / cost-per-unit UI (still exist in the VM
// as zero defaults so downstream code paths stay stable).
//
// Save creates the transfer record only — inventory list stays unchanged
// until the transfer is marked Received (which prompts for a receiver name
// and then updates serialCities + stockInDate).

import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Calendar, MapPin, User, Loader2, Plus, Package,
  CheckSquare, Square, X, Check, Trash2, Layers,
} from 'lucide-react';
import {
  UseProductTransferCreateViewModelReturn,
} from '../viewModels/useProductTransferCreateViewModel';

interface Props extends UseProductTransferCreateViewModelReturn {
  onViewTransfers?: () => void;
}

export const ProductTransferCreateView: React.FC<Props> = ({
  products, locations, formData, transferItems,
  isSubmitting, isLoading, validation,
  setFormField, addTransferItem, removeTransferItem,
  updateTransferItemProduct, toggleSerial,
  handleSave, addNewLocation, onBack,
}) => {
  // Ensure at least one item exists on mount
  useEffect(() => {
    if (transferItems.length === 0) addTransferItem();
  }, [transferItems.length, addTransferItem]);

  // ── Add-location modal — reused for both From and To fields ───────────
  const [addLoc, setAddLoc] = useState<{
    target: 'from' | 'to' | null;
    value: string;
    saving: boolean;
  }>({ target: null, value: '', saving: false });

  const submitAddLoc = async () => {
    const name = addLoc.value.trim();
    if (!name || addLoc.saving) return;
    setAddLoc(s => ({ ...s, saving: true }));
    try {
      const added = await addNewLocation(name);
      if (added) setFormField(addLoc.target === 'from' ? 'fromLocation' : 'toLocation', added);
      setAddLoc({ target: null, value: '', saving: false });
    } catch {
      setAddLoc(s => ({ ...s, saving: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  const canAddProduct = !!formData.fromLocation && !!formData.toLocation;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      <div className="max-w-4xl mx-auto pt-6 px-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm"
              title="Back"
            >
              <ArrowLeft size={16} className="text-slate-700" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">New Product Transfer</h1>
            <p className="text-xs text-slate-500 mt-0.5">Move serials between branches — pick source, destination, and items</p>
          </div>
        </div>

        {/* Card 1: Transfer Details */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
          <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <MapPin size={15} className="text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Transfer Details</h2>
          </header>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <Field label="Date & Time" required icon={<Calendar size={13} />}>
              <input
                type="datetime-local"
                value={formData.transferDateTime}
                onChange={e => setFormField('transferDateTime', e.target.value)}
                className={inputCls}
              />
            </Field>

            {/* Transferred By */}
            <Field label="Transferred By" required icon={<User size={13} />}>
              <input
                type="text"
                value={formData.transferredBy}
                onChange={e => setFormField('transferredBy', e.target.value)}
                placeholder="e.g. Manager Ahmed"
                className={inputCls}
              />
            </Field>

            {/* From Location — SOURCE (asked first) */}
            <Field label="From Location (Source)" required icon={<MapPin size={13} />}>
              <div className="flex gap-2">
                <select
                  value={formData.fromLocation}
                  onChange={e => {
                    if (e.target.value === '__add_new__') {
                      setAddLoc({ target: 'from', value: '', saving: false });
                    } else {
                      setFormField('fromLocation', e.target.value);
                    }
                  }}
                  className={inputCls}
                >
                  <option value="">Select source…</option>
                  {locations.map(l => <option key={l} value={l}>{l}</option>)}
                  <option value="__add_new__">➕ Add new location…</option>
                </select>
                <button
                  type="button"
                  onClick={() => setAddLoc({ target: 'from', value: '', saving: false })}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  title="Add a new location"
                >
                  <Plus size={14} />
                </button>
              </div>
            </Field>

            {/* To Location — DESTINATION */}
            <Field label="To Location (Destination)" required icon={<MapPin size={13} />}>
              <div className="flex gap-2">
                <select
                  value={formData.toLocation}
                  onChange={e => {
                    if (e.target.value === '__add_new__') {
                      setAddLoc({ target: 'to', value: '', saving: false });
                    } else {
                      setFormField('toLocation', e.target.value);
                    }
                  }}
                  disabled={!formData.fromLocation}
                  className={inputCls + (formData.fromLocation ? '' : ' opacity-50 cursor-not-allowed')}
                >
                  <option value="">
                    {formData.fromLocation ? 'Select destination…' : 'Pick source first'}
                  </option>
                  {locations
                    .filter(l => l !== formData.fromLocation)
                    .map(l => <option key={l} value={l}>{l}</option>)}
                  <option value="__add_new__">➕ Add new location…</option>
                </select>
                <button
                  type="button"
                  onClick={() => setAddLoc({ target: 'to', value: '', saving: false })}
                  disabled={!formData.fromLocation}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add a new location"
                >
                  <Plus size={14} />
                </button>
              </div>
            </Field>
          </div>
        </section>

        {/* Card 2: Products (multi-item) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
          <header className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Package size={15} className="text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">Products to Transfer</h2>
              <span className="text-[11px] text-slate-500">
                · {transferItems.length} item{transferItems.length === 1 ? '' : 's'}
              </span>
            </div>
            <button
              type="button"
              onClick={addTransferItem}
              disabled={!canAddProduct}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              title={canAddProduct ? 'Add another product' : 'Pick source & destination first'}
            >
              <Plus size={12} /> Add Another Product
            </button>
          </header>

          {!canAddProduct ? (
            <div className="p-8 text-center text-slate-400 text-sm italic bg-slate-50/40">
              Fill in the source and destination locations above to start picking products.
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {transferItems.map((it, idx) => (
                <ItemPicker
                  key={it.id}
                  index={idx}
                  productId={it.productId}
                  selectedSerials={it.selectedSerials}
                  products={products}
                  fromLocation={formData.fromLocation}
                  canRemove={transferItems.length > 1}
                  onPickProduct={pid => updateTransferItemProduct(idx, pid)}
                  onToggleSerial={s => toggleSerial(idx, s)}
                  onRemove={() => removeTransferItem(idx)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Sticky save bar */}
        <div className="sticky bottom-0 pb-4 pt-2">
          <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-lg p-3 flex items-center gap-3">
            <div className="text-xs text-slate-500 flex-1">
              {(() => {
                const totalSerials = transferItems.reduce((s, i) => s + i.selectedSerials.length, 0);
                if (!formData.fromLocation || !formData.toLocation)
                  return 'Pick source & destination to start.';
                if (totalSerials === 0)
                  return 'Select at least one serial to transfer.';
                return <>Ready — transferring <b className="text-slate-900">{totalSerials}</b> serial{totalSerials === 1 ? '' : 's'} from <b className="text-slate-900">{formData.fromLocation}</b> to <b className="text-slate-900">{formData.toLocation}</b></>;
              })()}
            </div>
            <button
              onClick={handleSave}
              disabled={isSubmitting || !validation.isValid}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 12, border: 'none',
                fontSize: 13, fontWeight: 800,
                backgroundColor: (isSubmitting || !validation.isValid) ? '#e2e8f0' : '#0f172a',
                color:           (isSubmitting || !validation.isValid) ? '#64748b' : '#ffffff',
                cursor:          (isSubmitting || !validation.isValid) ? 'not-allowed' : 'pointer',
                boxShadow:       (isSubmitting || !validation.isValid) ? 'none' : '0 4px 12px rgba(15,23,42,0.25)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (isSubmitting || !validation.isValid) return;
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e293b';
              }}
              onMouseLeave={e => {
                if (isSubmitting || !validation.isValid) return;
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0f172a';
              }}
            >
              {isSubmitting
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : <><Check size={14} /> Save Transfer</>}
            </button>
          </div>
        </div>

      </div>

      {/* Add-location modal */}
      {addLoc.target && createPortal(
        <div
          onClick={() => !addLoc.saving && setAddLoc({ target: null, value: '', saving: false })}
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ backgroundColor: 'rgba(15,23,42,0.55)' }}
        >
          <div onClick={e => e.stopPropagation()}
               className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className={
                'w-9 h-9 rounded-lg flex items-center justify-center ' +
                (addLoc.target === 'from' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600')
              }>
                <MapPin size={15} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Add {addLoc.target === 'from' ? 'source' : 'destination'} location
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Saved for future transfers</div>
              </div>
            </div>
            <div className="px-5 py-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Location Name
              </label>
              <input
                autoFocus
                value={addLoc.value}
                onChange={e => setAddLoc(s => ({ ...s, value: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') submitAddLoc();
                  else if (e.key === 'Escape' && !addLoc.saving) setAddLoc({ target: null, value: '', saving: false });
                }}
                disabled={addLoc.saving}
                placeholder="e.g. Canada"
                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setAddLoc({ target: null, value: '', saving: false })}
                disabled={addLoc.saving}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg disabled:opacity-50 inline-flex items-center gap-1"
              ><X size={11} /> Cancel</button>
              <button
                onClick={submitAddLoc}
                disabled={addLoc.saving || !addLoc.value.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg disabled:opacity-50 inline-flex items-center gap-1"
              >
                {addLoc.saving
                  ? <><Loader2 size={11} className="animate-spin" /> Saving…</>
                  : <><Check size={11} /> Add Location</>}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Per-item Brand → Model → Serials picker
// ─────────────────────────────────────────────────────────────────────────
const ItemPicker: React.FC<{
  index: number;
  productId: string;
  selectedSerials: string[];
  products: any[];
  fromLocation: string;
  canRemove: boolean;
  onPickProduct: (productId: string) => void;
  onToggleSerial: (serial: string) => void;
  onRemove: () => void;
}> = ({ index, productId, selectedSerials, products, fromLocation, canRemove, onPickProduct, onToggleSerial, onRemove }) => {

  // Derive brand/model from the picked product (source of truth). Local
  // state only matters when the user is mid-picking (no productId yet).
  const currentProduct = productId ? products.find(p => p.id === productId) : null;
  const [selectedBrand, setSelectedBrand] = useState<string>(currentProduct?.brandName || '');
  const [selectedModel, setSelectedModel] = useState<string>(currentProduct?.modelName || '');

  // Serials that actually sit at the source location for a given product.
  const availableAtSource = (p: any): string[] => {
    const serials = (p.serialNumbers || []) as string[];
    return serials.filter(s => {
      const st = p.serialStatus?.[s] || 'Available';
      if (st !== 'Available' && st !== 'Returned') return false;
      const city = p.serialCities?.[s] || p.location || '';
      return city === fromLocation;
    });
  };

  // Brands with at least one serial available at the source
  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (!p.brandName) continue;
      if (availableAtSource(p).length > 0) set.add(p.brandName);
    }
    return Array.from(set).sort();
  }, [products, fromLocation]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Models for the picked brand that have available stock at source
  const models = useMemo(() => {
    if (!selectedBrand) return [] as { modelName: string; productId: string; availableCount: number }[];
    const rows: { modelName: string; productId: string; availableCount: number }[] = [];
    for (const p of products) {
      if (p.brandName !== selectedBrand) continue;
      const avail = availableAtSource(p).length;
      if (avail > 0) rows.push({ modelName: p.modelName || '(no model)', productId: p.id, availableCount: avail });
    }
    // De-dupe on model name — keep the entry with the most stock
    const byModel: Record<string, typeof rows[number]> = {};
    for (const r of rows) {
      const cur = byModel[r.modelName];
      if (!cur || r.availableCount > cur.availableCount) byModel[r.modelName] = r;
    }
    return Object.values(byModel).sort((a, b) => a.modelName.localeCompare(b.modelName));
  }, [products, selectedBrand, fromLocation]);   // eslint-disable-line react-hooks/exhaustive-deps

  // When brand changes, reset model + clear the VM's product for this item
  const changeBrand = (b: string) => {
    setSelectedBrand(b);
    setSelectedModel('');
    if (productId) onPickProduct('');
  };
  // When model changes, resolve to product id
  const changeModel = (m: string) => {
    setSelectedModel(m);
    const found = models.find(x => x.modelName === m);
    if (found) onPickProduct(found.productId);
  };

  // Serial rows for the picked model at the source
  const serials = useMemo(() => {
    if (!currentProduct) return [] as { serial: string; checked: boolean }[];
    return availableAtSource(currentProduct).map(s => ({
      serial: s,
      checked: selectedSerials.includes(s),
    }));
  }, [currentProduct, selectedSerials, fromLocation]);   // eslint-disable-line react-hooks/exhaustive-deps

  const allChecked = serials.length > 0 && serials.every(r => r.checked);
  const toggleAll = () => {
    if (allChecked) {
      for (const r of serials) if (r.checked) onToggleSerial(r.serial);
    } else {
      for (const r of serials) if (!r.checked) onToggleSerial(r.serial);
    }
  };

  return (
    <div className="border-2 border-slate-200 rounded-xl bg-white overflow-hidden">
      {/* Item header */}
      <div className="px-4 py-2.5 bg-slate-100/60 border-b border-slate-200 flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Item {index + 1}
        </div>
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-1 rounded-md text-red-500 hover:bg-red-50"
            title="Remove this item"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Brand + Model row */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Brand <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedBrand}
            onChange={e => changeBrand(e.target.value)}
            className={inputCls}
          >
            <option value="">
              {brands.length === 0 ? 'No stock at source' : 'Select brand…'}
            </option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Model <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedModel}
            onChange={e => changeModel(e.target.value)}
            disabled={!selectedBrand}
            className={inputCls + (selectedBrand ? '' : ' opacity-50 cursor-not-allowed')}
          >
            <option value="">
              {selectedBrand ? (models.length === 0 ? 'No available models' : 'Select model…') : 'Pick a brand first'}
            </option>
            {models.map(m => (
              <option key={m.productId} value={m.modelName}>
                {m.modelName} · {m.availableCount} in stock
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Serials */}
      {selectedModel && (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Layers size={12} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Serials at source
              </span>
              <span className="text-[10px] text-slate-400">
                · Tick the ones you're transferring
              </span>
            </div>
            {serials.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
              >
                {allChecked ? <CheckSquare size={12} /> : <Square size={12} />}
                {allChecked ? 'Unselect all' : 'Select all'}
              </button>
            )}
          </div>

          {serials.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-4 italic">
              No serials available at source for this model.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {serials.map(row => (
                <label
                  key={row.serial}
                  onClick={() => onToggleSerial(row.serial)}
                  className={
                    'cursor-pointer select-none flex items-center gap-2 px-2.5 py-2 rounded-lg border-2 transition-all ' +
                    (row.checked
                      ? 'bg-indigo-50 border-indigo-500'
                      : 'bg-white border-slate-200 hover:border-slate-300')
                  }
                >
                  <span
                    className={
                      'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ' +
                      (row.checked ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-300')
                    }
                  >
                    {row.checked && <Check size={10} strokeWidth={3} />}
                  </span>
                  <div className="text-xs font-mono font-semibold text-slate-900 truncate">
                    {row.serial}
                  </div>
                </label>
              ))}
            </div>
          )}

          {selectedSerials.length > 0 && (
            <div className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-800 text-[11px] font-semibold text-center">
              {selectedSerials.length} serial{selectedSerials.length === 1 ? '' : 's'} selected for this item
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Shared styles ──────────────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors';

const Field: React.FC<{
  label: string; required?: boolean; icon?: React.ReactNode; children: React.ReactNode;
}> = ({ label, required, icon, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
      {icon}
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);