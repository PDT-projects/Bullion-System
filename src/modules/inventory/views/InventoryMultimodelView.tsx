// Inventory Module - View Layer
// InventoryMultiModelView
// "Without Costing" path: pick a brand, add N models with all details at once.

import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Package, Plus, Trash2, ChevronDown,
  Hash, Loader2, Check, AlertCircle,
} from 'lucide-react';
import { useInventoryCurrency, CurrencyCode } from '../viewModels/useInventoryCurrency';
import { InventoryCurrencyDropdown, CurrencyPriceInput } from './InventoryCurrencyDropdown';
import {
  UseInventoryMultiModelViewModelReturn,
  CATEGORIES, STOCKING_LOCATIONS, STATUSES, MultiModelEntry,
} from '../viewModels/useInventoryMultiModelViewModel';
import { LocationSelector, SerialLocationSelector } from './LocationSelector';

interface Props extends UseInventoryMultiModelViewModelReturn {}

// ── Stepper ───────────────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: 'Type' }, { n: 2, label: 'Costing' },
  { n: 3, label: 'Models' }, { n: 4, label: 'Payment' },
];
const Stepper = ({ current }: { current: number }) => (
  <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 32px' }}>
    <div style={{ display: 'flex', alignItems: 'center', maxWidth: 600, margin: '0 auto' }}>
      {STEPS.map((step, i) => {
        const active = step.n === current;
        const done   = step.n < current;
        const last   = i === STEPS.length - 1;
        return (
          <React.Fragment key={step.n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13,
                backgroundColor: done || active ? '#0f172a' : '#e5e7eb',
                color: done || active ? '#fff' : '#9ca3af',
                boxShadow: active ? '0 0 0 4px rgba(15,23,42,0.12)' : 'none',
              }}>
                {done ? <Check size={14} strokeWidth={3} /> : step.n}
              </div>
              <span style={{ marginTop: 5, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: done || active ? '#0f172a' : '#94a3b8', whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>
            {!last && <div style={{ flex: 1, height: 2, borderRadius: 99, margin: '0 8px', marginBottom: 20, backgroundColor: done ? '#0f172a' : '#e5e7eb' }} />}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

// ── Input style ───────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8,
  fontSize: 13, outline: 'none', color: '#111827', backgroundColor: '#fff', boxSizing: 'border-box',
};
const inpErr: React.CSSProperties = { ...inp, border: '1px solid #ef4444', backgroundColor: '#fef2f2' };

// ── Serial sub-panel ──────────────────────────────────────────────────────────
function SerialPanel({
  entry, setEntrySerial, setEntrySerialCity,
}: {
  entry: MultiModelEntry;
  setEntrySerial: (entryId: string, idx: number, value: string) => void;
  setEntrySerialCity: (entryId: string, idx: number, city: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const filled = entry.serialNumbers.filter(s => s.trim() !== '').length;

  return (
    <div style={{ marginTop: 10, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 14px', background: '#f8fafc', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Hash size={14} color="#334155" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
            Serial Numbers — {filled}/{entry.stockQty} entered
          </span>
          {filled === entry.stockQty && entry.stockQty > 0 && (
            <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700, backgroundColor: '#dcfce7', color: '#166534' }}>✓ Complete</span>
          )}
        </div>
        <ChevronDown size={14} color="#9ca3af" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflowY: 'auto' }}>
          {Array.from({ length: entry.stockQty }, (_, i) => (
            <div key={i} style={{ backgroundColor: '#f8fafc', borderRadius: 8, padding: '10px 12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Unit {i + 1}
              </label>
              <input
                type="text"
                placeholder={`Serial #${i + 1}`}
                value={entry.serialNumbers[i] || ''}
                onChange={e => setEntrySerial(entry.id, i, e.target.value)}
                style={inp}
              />
              <SerialLocationSelector
                value={entry.serialNumbers[i] ? (entry.serialCities[entry.serialNumbers[i]] || '') : ''}
                onChange={city => setEntrySerialCity(entry.id, i, city)}
                placeholder="Location (optional)"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Model Card ─────────────────────────────────────────────────────────────────
function ModelCard({
  entry, index, modelOptions, modelOptionsLoading, validationErrors,
  updateEntry, removeEntry, setEntrySerial, setEntrySerialCity, canRemove,
  rates, defaultInputCurrency,
}: {
  entry: MultiModelEntry;
  index: number;
  modelOptions: { id: string; modelName: string; costPrice?: number; sellPrice?: number }[];
  modelOptionsLoading: boolean;
  validationErrors: { [k: string]: string };
  updateEntry: (id: string, patch: Partial<MultiModelEntry>) => void;
  removeEntry: (id: string) => void;
  setEntrySerial: (entryId: string, idx: number, value: string) => void;
  setEntrySerialCity: (entryId: string, idx: number, city: string) => void;
  canRemove: boolean;
  rates: Record<CurrencyCode, number>;
  defaultInputCurrency: CurrencyCode;
}) {
  const e = entry;
  const hasErr = (key: string) => !!validationErrors[`${key}_${index}`];

  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
      padding: '18px 20px', position: 'relative',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Row header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, backgroundColor: '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#0f172a',
          }}>
            {index + 1}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
            {e.modelName || `Model ${index + 1}`}
          </span>
        </div>
        {canRemove && (
          <button onClick={() => removeEntry(e.id)}
            style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #fecaca', backgroundColor: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Trash2 size={13} color="#ef4444" />
            <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>Remove</span>
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

        {/* Model Name — dropdown + free text */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Model Name *</label>
          {modelOptionsLoading ? (
            <div style={{ ...inp, display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Loading models…
            </div>
          ) : modelOptions.length > 0 ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={modelOptions.find(m => m.modelName === e.modelName)?.id || ''}
                onChange={ev => {
                  const found = modelOptions.find(m => m.id === ev.target.value);
                  if (found) updateEntry(e.id, {
                    modelName: found.modelName,
                    costPrice: found.costPrice ?? e.costPrice,
                    sellPrice: found.sellPrice ?? e.sellPrice,
                  });
                  else updateEntry(e.id, { modelName: '' });
                }}
                style={{ ...inp, flex: 1 }}
              >
                <option value="">— Select existing model —</option>
                {modelOptions.map(m => <option key={m.id} value={m.id}>{m.modelName}</option>)}
              </select>
              <span style={{ alignSelf: 'center', fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>or type:</span>
              <input
                type="text"
                placeholder="New model name"
                value={modelOptions.find(m => m.modelName === e.modelName) ? '' : e.modelName}
                onChange={ev => updateEntry(e.id, { modelName: ev.target.value })}
                style={{ ...inp, flex: 1 }}
              />
            </div>
          ) : (
            <input
              type="text"
              placeholder="Enter model name"
              value={e.modelName}
              onChange={ev => updateEntry(e.id, { modelName: ev.target.value })}
              style={hasErr('model') ? inpErr : inp}
            />
          )}
          {hasErr('model') && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>{validationErrors[`model_${index}`]}</p>}
        </div>

        {/* Cost Price */}
        <div>
          <CurrencyPriceInput
            label="Cost Price"
            pkrValue={e.costPrice ?? 0}
            onChange={value => updateEntry(e.id, { costPrice: value })}
            rates={rates}
            defaultInputCurrency={defaultInputCurrency}
            placeholder="0"
            required
          />
          {hasErr('cost') && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>{validationErrors[`cost_${index}`]}</p>}
        </div>

        {/* Sell Price */}
        <div>
          <CurrencyPriceInput
            label="Sell Price"
            pkrValue={e.sellPrice ?? 0}
            onChange={value => updateEntry(e.id, { sellPrice: value })}
            rates={rates}
            defaultInputCurrency={defaultInputCurrency}
            placeholder="0"
            required
          />
        </div>

        {/* Stock Qty */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Stock Qty *</label>
          <input
            type="number"
            value={e.stockQty}
            onChange={ev => updateEntry(e.id, { stockQty: Math.max(1, Number(ev.target.value)) })}
            style={hasErr('qty') ? inpErr : inp}
            min={1}
          />
        </div>

        {/* Category */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Category *</label>
          <select value={e.category} onChange={ev => updateEntry(e.id, { category: ev.target.value })} style={hasErr('cat') ? inpErr : inp}>
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {hasErr('cat') && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>{validationErrors[`cat_${index}`]}</p>}
        </div>

        {/* Status */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Status</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => updateEntry(e.id, { status: s })}
                style={{
                  flex: 1, padding: '8px 6px', borderRadius: 7, border: `2px solid ${e.status === s ? '#0f172a' : '#e2e8f0'}`,
                  backgroundColor: e.status === s ? '#f1f5f9' : '#fff', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700, color: e.status === s ? '#0f172a' : '#6b7280',
                  transition: 'all 0.15s',
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Stocking Location */}
        <div>
          <LocationSelector
            value={e.stockingLocation}
            onChange={loc => updateEntry(e.id, { stockingLocation: loc })}
            label="Stocking Location *"
            placeholder="Select location"
          />
          {hasErr('loc') && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>{validationErrors[`loc_${index}`]}</p>}
        </div>

        {/* Dealer Price */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Dealer Price (PKR) <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional)</span></label>
          <input
            type="number"
            value={e.dealerPrice || ''}
            onChange={ev => updateEntry(e.id, { dealerPrice: Number(ev.target.value) })}
            placeholder="Leave blank if N/A"
            style={inp}
            min={0}
          />
        </div>

        {/* Description */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Description</label>
          <textarea
            value={e.description}
            onChange={ev => updateEntry(e.id, { description: ev.target.value })}
            rows={2}
            placeholder="Optional notes, specs, or details..."
            style={{ ...inp, resize: 'vertical' }}
          />
        </div>

        {/* Serial Numbers */}
        <div style={{ gridColumn: '1 / -1' }}>
          <SerialPanel
            entry={e}
            setEntrySerial={setEntrySerial}
            setEntrySerialCity={setEntrySerialCity}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main View ──────────────────────────────────────────────────────────────────
export const InventoryMultiModelView: React.FC<Props> = ({
  inventoryType,
  selectedBrandId, selectedBrandName, setBrand,
  brands, brandsLoading,
  modelOptions, modelOptionsLoading,
  entries, addEntry, removeEntry, updateEntry,
  setEntrySerial, setEntrySerialCity,
  grandTotalCost, grandTotalUnits,
  validationErrors, isValid,
  handleNext, handleBack,
  isSaving, formatCurrency,
}) => {
  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  const {
    primaryCurrency,
    extraCurrencies,
    rates,
    setPrimaryCurrency,
    setExtraCurrencies,
    loading: ratesLoading,
    error: ratesError,
    lastUpdated,
  } = useInventoryCurrency();

  const applyNewBrand = () => {
    const name = newBrandName.trim();
    if (!name) return;
    setBrand(name, name);
    setAddingBrand(false);
    setNewBrandName('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#f8fafc' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={handleBack} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
            <ArrowLeft size={17} />
          </button>
          <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Add Multiple Models</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Step 3 — Select brand and add all models at once</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <InventoryCurrencyDropdown
              primaryCurrency={primaryCurrency}
              extraCurrencies={extraCurrencies}
              setPrimaryCurrency={setPrimaryCurrency}
              setExtraCurrencies={setExtraCurrencies}
              loading={ratesLoading}
              error={ratesError}
              lastUpdated={lastUpdated}
              label="Currency"
              compact
            />
          </div>
        </div>
      </div>

      <Stepper current={3} />

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Brand selector */}
          <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Package size={16} color="#0f172a" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Brand *</span>
              {selectedBrandName && (
                <span style={{ padding: '3px 10px', borderRadius: 99, backgroundColor: '#f1f5f9', color: '#0f172a', fontSize: 12, fontWeight: 700 }}>
                  {selectedBrandName}
                </span>
              )}
            </div>

            {validationErrors.brand && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 12 }}>
                <AlertCircle size={13} color="#ef4444" />
                <span style={{ fontSize: 12, color: '#dc2626' }}>{validationErrors.brand}</span>
              </div>
            )}

            {addingBrand ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={newBrandName}
                  autoFocus
                  onChange={e => setNewBrandName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') applyNewBrand(); if (e.key === 'Escape') setAddingBrand(false); }}
                  placeholder="Type new brand name…"
                  style={{ ...inp, flex: 1, border: '2px solid #334155' }}
                />
                <button onClick={applyNewBrand} style={{ padding: '9px 16px', borderRadius: 8, backgroundColor: '#0f172a', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Use</button>
                <button onClick={() => setAddingBrand(false)} style={{ padding: '9px 14px', borderRadius: 8, backgroundColor: '#fff', color: '#374151', border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                {brandsLoading ? (
                  <div style={{ ...inp, flex: 1, display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading brands…
                  </div>
                ) : (
                  <select
                    value={selectedBrandId}
                    onChange={e => {
                      const b = brands.find(b => b.id === e.target.value);
                      if (b) setBrand(b.id, b.name);
                    }}
                    style={{ ...inp, flex: 1 }}
                  >
                    <option value="">— Select brand —</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}
                <button onClick={() => setAddingBrand(true)}
                  style={{ padding: '9px 14px', borderRadius: 8, border: '1px dashed #334155', backgroundColor: '#f5f3ff', color: '#0f172a', cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                  <Plus size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Add new brand…
                </button>
              </div>
            )}
          </div>

          {/* Model rows */}
          {entries.map((entry, i) => (
            <ModelCard
              key={entry.id}
              entry={entry}
              index={i}
              modelOptions={modelOptions}
              modelOptionsLoading={modelOptionsLoading}
              validationErrors={validationErrors}
              updateEntry={updateEntry}
              removeEntry={removeEntry}
              setEntrySerial={setEntrySerial}
              setEntrySerialCity={setEntrySerialCity}
              canRemove={entries.length > 1}
              rates={rates}
              defaultInputCurrency={primaryCurrency}
            />
          ))}

          {/* Add model button */}
          <button
            onClick={addEntry}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', borderRadius: 12, border: '2px dashed #cbd5e1',
              backgroundColor: '#f5f3ff', cursor: 'pointer', color: '#0f172a',
              fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
            }}
          >
            <Plus size={18} /> Add Another Model
          </button>

          {/* Grand total summary */}
          <div style={{ backgroundColor: '#0f172a', borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 32 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Models</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 2 }}>{entries.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Units</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 2 }}>{grandTotalUnits}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grand Total Cost</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#a5f3fc', marginTop: 2 }}>{formatCurrency(grandTotalCost)}</div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={handleBack}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={isSaving}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '11px 26px',
                borderRadius: 9, border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
                backgroundColor: isSaving ? '#cbd5e1' : '#0f172a',
                color: '#fff', fontWeight: 800, fontSize: 14,
                boxShadow: isSaving ? 'none' : '0 2px 10px rgba(15,23,42,0.25)',
                opacity: isSaving ? 0.7 : 1, transition: 'all 0.2s',
              }}
            >
              {isSaving
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Preparing…</>
                : <>Proceed to Payment <ArrowRight size={16} /></>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};