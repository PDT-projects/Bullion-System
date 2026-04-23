// Inventory Module - View Layer
// CreateInventoryView - Multi-step wizard for creating and editing products
//
// CHANGES:
//   - Payment step: Cash/Bank toggle replaces plain text dropdown
//   - Bank dropdown fetches live bank list from Firestore when Bank is selected
//   - Cheque option also prompts for bank selection
//   - bankId + bankName passed through setField so ViewModel saves them
//   - All other logic (TXN ID, serials, stepper, confirmation) unchanged

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2, AlertCircle,
  Loader2, Hash, Banknote, Building2, CreditCard, ChevronDown,
} from 'lucide-react';
import {
  ProductFormData,
  ValidationResult,
  InventoryEntryStep,
  INVENTORY_LOCATIONS,
} from '../models/types';
import { InventoryService } from '../models/inventoryService';
import { BrandModelSelector } from '../components/BrandModelSelector';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BankOption { id: string; name: string; balance: number; }

interface CreateInventoryViewProps {
  formData: ProductFormData;
  currentStep: InventoryEntryStep;
  validation: ValidationResult;
  isSubmitting: boolean;
  isEditMode: boolean;
  editingId: string | null;
  isFetchingProduct: boolean;
  isGeneratingTxnId: boolean;
  serialInput: string;
  serialCity: string;
  setField: (field: string, value: any) => void;
  setCurrentStep: (step: InventoryEntryStep) => void;
  setSerialInput: (value: string) => void;
  setSerialCity: (value: string) => void;
  addSerialNumber: () => void;
  removeSerialNumber: (serial: string) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  handleSubmit: () => void;
  handleCancel: () => void;
}

// ── Payment method options ────────────────────────────────────────────────────

const PAYMENT_MODES = [
  { value: 'Cash',          label: 'Cash',          icon: Banknote,  color: '#16a34a', bg: '#f0fdf4', border: '#22c55e', needsBank: false },
  { value: 'Bank Transfer', label: 'Bank Transfer', icon: Building2, color: '#2563eb', bg: '#eff6ff', border: '#3b82f6', needsBank: true  },
  { value: 'Cheque',        label: 'Cheque',        icon: CreditCard, color: '#7c3aed', bg: '#f5f3ff', border: '#8b5cf6', needsBank: true  },
  { value: 'Credit Card',   label: 'Credit Card',   icon: CreditCard, color: '#d97706', bg: '#fffbeb', border: '#f59e0b', needsBank: false },
];

// ── Main component ────────────────────────────────────────────────────────────

export function CreateInventoryView({
  formData,
  currentStep,
  validation,
  isSubmitting,
  isEditMode,
  editingId,
  isFetchingProduct,
  isGeneratingTxnId,
  serialInput,
  serialCity,
  setField,
  setSerialInput,
  setSerialCity,
  addSerialNumber,
  removeSerialNumber,
  goToNextStep,
  goToPreviousStep,
  handleSubmit,
  handleCancel,
}: CreateInventoryViewProps) {

  // ── Banks — fetched once when payment step mounts ─────────────────────────
  const [banks, setBanks]             = useState<BankOption[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);

  useEffect(() => {
    if (currentStep !== 'payment') return;
    setBanksLoading(true);
    getDocs(query(collection(db, 'banks'), orderBy('name')))
      .then(snap => {
        setBanks(snap.docs.map(d => {
          const b = d.data() as any;
          return { id: d.id, name: b.name || '—', balance: Number(b.balance) || 0 };
        }));
      })
      .catch(() => {})
      .finally(() => setBanksLoading(false));
  }, [currentStep]);

  const selectedMode = PAYMENT_MODES.find(m => m.value === formData.paymentMethod) || null;
  const needsBank    = selectedMode?.needsBank ?? false;

  // ── Stepper config ────────────────────────────────────────────────────────
  const steps = [
    { id: 'details',      label: 'Product Details', number: 1 },
    { id: 'payment',      label: 'Payment Info',    number: 2 },
    { id: 'confirmation', label: 'Confirmation',    number: 3 },
  ];
  const currentIdx = steps.findIndex(s => s.id === currentStep);

  const inputCls = (hasError?: boolean) =>
    `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
      hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
    }`;

  const btnAddSerial: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
    backgroundColor: '#4f46e5', color: '#ffffff',
    fontWeight: 600, fontSize: 14, border: 'none', whiteSpace: 'nowrap',
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isFetchingProduct) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Loading product details...</p>
          <p className="text-sm text-gray-400 mt-1">Fetching from Firestore</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Product Details
  // ══════════════════════════════════════════════════════════════════════════
  const renderDetailsStep = () => (
    <div className="space-y-6">

      {validation.fieldErrors?.costPrice && (
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">{validation.fieldErrors.costPrice}</p>
            <p className="text-sm text-amber-700 mt-1">
              Cost price is required for profit calculations and inventory valuation.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Brand & Model ── */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand & Model *</label>
          {isEditMode && formData.brandName && (
            <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <span className="text-blue-600 font-medium">Currently editing: </span>
              <span className="text-blue-900 font-semibold">{formData.brandName} — {formData.modelName}</span>
              <span className="ml-2 text-blue-400 text-xs">(change below if needed)</span>
            </div>
          )}
          <BrandModelSelector
            initialBrandId={isEditMode ? (formData.brandId || undefined) : undefined}
            initialModelId={isEditMode ? (formData.modelId || undefined) : undefined}
            onBrandChange={(brandId, brandName) => {
              setField('brandId', brandId);
              setField('brandName', brandName);
            }}
            onModelChange={(modelId, modelName, costPrice, sellPrice) => {
              setField('modelId', modelId);
              setField('modelName', modelName);
              if (typeof sellPrice === 'number' && sellPrice > 0) setField('sellPrice', sellPrice);
              if (typeof costPrice === 'number' && costPrice > 0 && !(formData.costPrice > 0)) {
                setField('costPrice', costPrice);
              }
            }}
          />
          {(validation.fieldErrors?.brandName || validation.fieldErrors?.modelName) && (
            <p className="text-red-500 text-sm mt-1">Please select a brand and model</p>
          )}
        </div>

        {/* ── Category ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <input
            type="text"
            value={formData.category || ''}
            onChange={e => setField('category', e.target.value)}
            className={inputCls(!!validation.fieldErrors?.category)}
            placeholder="e.g. Metal Detector, Accessory"
          />
          {validation.fieldErrors?.category && (
            <p className="text-red-500 text-sm mt-1">{validation.fieldErrors.category}</p>
          )}
        </div>

        {/* ── Buy Type ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Buy Type</label>
          <select
            value={formData.buyType || 'Import'}
            onChange={e => setField('buyType', e.target.value)}
            className={inputCls()}
          >
            <option value="Import">Import</option>
            <option value="Export">Export</option>
          </select>
        </div>

        {/* ── Cost Price ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cost Price (PKR) *
            {typeof formData.costPrice === 'number' && formData.costPrice > 0 && (
              <span className="ml-2 text-xs font-normal text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                ✓ PKR {formData.costPrice.toLocaleString()}
              </span>
            )}
          </label>
          <input
            type="number"
            value={formData.costPrice === 0 ? '' : (formData.costPrice ?? '')}
            onChange={e => {
              const raw = e.target.value.trim();
              setField('costPrice', raw === '' ? 0 : (parseFloat(raw) || 0));
            }}
            onBlur={e => {
              const parsed = parseFloat(e.target.value);
              setField('costPrice', isNaN(parsed) ? 0 : parsed);
            }}
            className={inputCls(!!validation.fieldErrors?.costPrice) + ' font-semibold'}
            placeholder="Enter cost price in PKR"
            min={0}
            step="any"
          />
          {validation.fieldErrors?.costPrice && (
            <p className="text-red-500 text-sm mt-1">{validation.fieldErrors.costPrice}</p>
          )}
        </div>

        {/* ── Sell Price ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price (PKR) *</label>
          <input
            type="number"
            value={formData.sellPrice === 0 ? '' : (formData.sellPrice ?? '')}
            onChange={e => {
              const raw = e.target.value.trim();
              setField('sellPrice', raw === '' ? 0 : (parseFloat(raw) || 0));
            }}
            className={inputCls(!!validation.fieldErrors?.sellPrice)}
            placeholder="Enter sell price in PKR"
            min={0}
            step="any"
          />
          {validation.fieldErrors?.sellPrice && (
            <p className="text-red-500 text-sm mt-1">{validation.fieldErrors.sellPrice}</p>
          )}
        </div>

        {/* ── Warranty ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Warranty (Years)</label>
          <input
            type="number"
            value={formData.warrantyYears || ''}
            onChange={e => setField('warrantyYears', parseFloat(e.target.value) || 0)}
            className={inputCls()}
            placeholder="e.g. 1"
            min={0}
          />
        </div>

        {/* ── Primary Location ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Location</label>
          <select
            value={formData.location || ''}
            onChange={e => setField('location', e.target.value)}
            className={inputCls()}
          >
            <option value="">Select location</option>
            {INVENTORY_LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* ── Status ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status || 'New'}
            onChange={e => setField('status', e.target.value)}
            className={inputCls()}
          >
            {['New', 'In Transit', 'On-Order', 'Available', 'Sold', 'Damaged', 'Returned', 'Used'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* ── Description ── */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={e => setField('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="Optional product notes, specs, or details"
          />
        </div>
      </div>

      {/* ── Serial Numbers ── */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-1">Serial Numbers</h4>
        {isEditMode && (
          <p className="text-xs text-gray-500 mb-3">
            Serials already saved in Firestore are shown below. Add or remove as needed.
          </p>
        )}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={serialInput}
            onChange={e => setSerialInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSerialNumber(); } }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="Enter serial number"
          />
          <input
            type="text"
            value={serialCity}
            onChange={e => setSerialCity(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSerialNumber(); } }}
            className="w-44 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="City (optional)"
          />
          <button type="button" onClick={addSerialNumber} style={btnAddSerial}>
            <Plus size={18} /> Add
          </button>
        </div>

        {validation.fieldErrors?.serialNumbers && (
          <p className="text-red-500 text-sm mb-3">{validation.fieldErrors.serialNumbers}</p>
        )}

        {formData.serialNumbers.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {formData.serialNumbers.map(serial => (
              <div key={serial} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-mono text-sm font-medium text-gray-900">{serial}</p>
                  {formData.serialCities?.[serial] && (
                    <p className="text-xs text-gray-500 mt-0.5">{formData.serialCities[serial]}</p>
                  )}
                </div>
                <button type="button" onClick={() => removeSerialNumber(serial)}
                  className="p-1.5 hover:bg-red-100 rounded-lg transition-colors" title="Remove">
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic py-2">No serial numbers added yet.</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          {formData.serialNumbers.length} serial{formData.serialNumbers.length !== 1 ? 's' : ''} — stock count syncs automatically
        </p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Payment Info
  // ══════════════════════════════════════════════════════════════════════════
  const renderPaymentStep = () => {
    const totalAmount = (formData.costPrice ?? 0) * (formData.stock || 0);
    const paid        = formData.paidAmount ?? 0;
    const remaining   = Math.max(0, totalAmount - paid);

    return (
      <div className="space-y-6">

        {/* ── Transaction ID — read-only ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 8,
            border: '1px solid #c7d2fe', backgroundColor: '#eef2ff',
          }}>
            {isGeneratingTxnId ? (
              <>
                <Loader2 size={16} color="#6366f1" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 600 }}>Generating transaction ID…</span>
              </>
            ) : (
              <>
                <Hash size={16} color="#6366f1" style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: '#3730a3', letterSpacing: '0.04em' }}>
                  {formData.transactionId || '—'}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Auto-generated
                </span>
              </>
            )}
          </div>
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
            This ID is saved to Firestore and links to all cash / bank activity records.
          </p>
        </div>

        {/* ── Payment Method — icon toggle cards ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {PAYMENT_MODES.map(mode => {
              const Icon = mode.icon;
              const sel  = formData.paymentMethod === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => {
                    setField('paymentMethod', mode.value);
                    // Clear bank if switching to a mode that doesn't need one
                    if (!mode.needsBank) {
                      setField('bankId', undefined);
                      setField('bankName', undefined);
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${sel ? mode.border : '#e5e7eb'}`,
                    backgroundColor: sel ? mode.bg : '#fff',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={20} color={sel ? mode.color : '#9ca3af'} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: sel ? mode.color : '#374151' }}>
                    {mode.label}
                  </span>
                  {sel && (
                    <Check size={14} color={mode.color} style={{ marginLeft: 'auto' }} />
                  )}
                </button>
              );
            })}
          </div>
          {validation.fieldErrors?.paymentMethod && (
            <p className="text-red-500 text-sm mt-2">{validation.fieldErrors.paymentMethod}</p>
          )}
        </div>

        {/* ── Bank Selector — shown for Bank Transfer & Cheque ── */}
        {needsBank && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.paymentMethod === 'Cheque' ? 'Issuing Bank *' : 'Bank Account *'}
            </label>
            {banksLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb' }}>
                <Loader2 size={14} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, color: '#6b7280' }}>Loading bank accounts…</span>
              </div>
            ) : banks.length === 0 ? (
              <div style={{ padding: '10px 14px', border: '1px solid #fde68a', borderRadius: 8, backgroundColor: '#fffbeb', fontSize: 13, color: '#92400e' }}>
                ⚠ No bank accounts found. Add one in Banking → Bank Accounts first.
              </div>
            ) : (
              <>
                <div style={{ position: 'relative' }}>
                  <select
                    value={formData.bankId || ''}
                    onChange={e => {
                      const bank = banks.find(b => b.id === e.target.value);
                      setField('bankId',   bank?.id   || '');
                      setField('bankName', bank?.name || '');
                    }}
                    style={{
                      width: '100%', padding: '10px 36px 10px 12px',
                      border: `1px solid ${validation.fieldErrors?.bankId ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: 8, fontSize: 14, color: '#111827',
                      backgroundColor: '#fff', appearance: 'none', outline: 'none', cursor: 'pointer',
                    }}
                  >
                    <option value="">— Select bank account —</option>
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}{b.balance !== undefined ? ` — PKR ${b.balance.toLocaleString()}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }} />
                </div>
                {/* Selected bank confirmation chip */}
                {formData.bankName && (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', backgroundColor: '#eff6ff', borderRadius: 6, fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>
                    <Building2 size={12} /> {formData.bankName}
                  </div>
                )}
              </>
            )}
            {validation.fieldErrors?.bankId && (
              <p className="text-red-500 text-sm mt-1">{validation.fieldErrors.bankId}</p>
            )}
          </div>
        )}

        {/* ── Amount Paid ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (PKR)</label>
          <input
            type="number"
            value={formData.paidAmount ?? ''}
            onChange={e => {
              const raw = e.target.value;
              setField('paidAmount', raw === '' ? undefined : (parseFloat(raw) || 0));
            }}
            className={inputCls()}
            placeholder="Enter amount paid (leave blank if unpaid)"
            min={0}
            step="any"
          />
        </div>

        {/* ── Payment Summary ── */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">Payment Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Cost Price per unit:</span>
              <span className="font-semibold text-blue-900">{InventoryService.formatCurrency(formData.costPrice ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Quantity:</span>
              <span className="font-semibold text-blue-900">{formData.stock} units</span>
            </div>
            <div style={{ borderTop: '1px solid #bfdbfe', margin: '8px 0' }} />
            <div className="flex justify-between font-bold text-base">
              <span className="text-blue-900">Total Amount:</span>
              <span className="text-blue-900">{InventoryService.formatCurrency(totalAmount)}</span>
            </div>
            {paid > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-blue-700">Paid:</span>
                  <span className="font-semibold text-green-700">{InventoryService.formatCurrency(paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Remaining:</span>
                  <span className={`font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {InventoryService.formatCurrency(remaining)}
                  </span>
                </div>
              </>
            )}
            {/* Payment method summary line */}
            {formData.paymentMethod && (
              <div style={{ borderTop: '1px solid #bfdbfe', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-blue-700">Method:</span>
                <span className="font-semibold text-blue-900">
                  {formData.paymentMethod}
                  {formData.bankName ? ` — ${formData.bankName}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Confirmation
  // ══════════════════════════════════════════════════════════════════════════
  const renderConfirmationStep = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Ready to {isEditMode ? 'Update' : 'Save'} Product
      </h3>
      <p className="text-gray-600 mb-6">
        Review the summary, then click{' '}
        <strong style={{ color: '#15803d' }}>{isEditMode ? 'Update Product' : 'Save Product'}</strong>{' '}
        to write to Firestore.
      </p>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-w-md mx-auto text-left">
        <div className="space-y-3 text-sm">
          {([
            ['Transaction ID', formData.transactionId || '—'],
            ['Product',        `${formData.brandName} ${formData.modelName}`],
            ['Category',       formData.category || '—'],
            ['Location',       formData.location || '—'],
            ['Status',         formData.status   || '—'],
            ['Stock',          `${formData.stock} units`],
            ['Cost Price',     InventoryService.formatCurrency(formData.costPrice ?? 0)],
            ['Sell Price',     InventoryService.formatCurrency(formData.sellPrice  || 0)],
            ['Description',    formData.description || '—'],
            ['Payment Method', formData.paymentMethod
              ? `${formData.paymentMethod}${formData.bankName ? ` — ${formData.bankName}` : ''}`
              : '—'],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="text-gray-500 flex-shrink-0">{label}:</span>
              <span className={`font-semibold text-right truncate max-w-[55%] ${
                label === 'Transaction ID' ? 'font-mono text-indigo-700' : 'text-gray-900'
              }`}>
                {value}
              </span>
            </div>
          ))}
          {formData.paidAmount != null && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Paid:</span>
              <span className="font-semibold text-gray-900">{InventoryService.formatCurrency(formData.paidAmount)}</span>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-gray-200 pt-3 mt-2">
            <span className="text-gray-500">Serials:</span>
            <span className="font-semibold text-gray-900">{formData.serialNumbers.length} entered</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">

        {/* Page header */}
        <div className="flex items-center gap-4 mb-4">
          <button type="button" onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Inventory Item' : 'Create New Inventory'}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditMode
                ? 'Update fields below and save changes to Firestore'
                : 'Fill in the details to add a new product'}
              {!isEditMode && formData.transactionId && !isGeneratingTxnId && (
                <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono">
                  {formData.transactionId}
                </span>
              )}
              {editingId && isEditMode && (
                <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono">
                  #{editingId.slice(-8)}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: 'rgba(255,255,255,0.97)', borderBottom: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', maxWidth: 560, margin: '0 auto', padding: '16px 16px' }}>
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isDone   = currentIdx > index;
              const isLast   = index === steps.length - 1;
              return (
                <React.Fragment key={step.id}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: 110 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 17,
                      backgroundColor: isDone ? '#4f46e5' : isActive ? '#818cf8' : '#f3f4f6',
                      color: (isDone || isActive) ? '#fff' : '#6b7280',
                      boxShadow: isActive ? '0 0 0 4px #e0e7ff' : 'none',
                      transform: isActive ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.2s',
                    }}>
                      {isDone ? <Check size={20} /> : step.number}
                    </div>
                    <span style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: (isDone || isActive) ? '#4338ca' : '#9ca3af', textAlign: 'center' }}>
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div style={{ flex: 1, height: 4, borderRadius: 9999, margin: '0 8px', backgroundColor: isDone ? '#4f46e5' : '#e5e7eb', transition: 'background-color 0.3s' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {currentStep === 'details'      && renderDetailsStep()}
          {currentStep === 'payment'      && renderPaymentStep()}
          {currentStep === 'confirmation' && renderConfirmationStep()}

          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>

            <button
              type="button"
              onClick={currentStep === 'details' ? handleCancel : goToPreviousStep}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, cursor: 'pointer', backgroundColor: '#f3f4f6', color: '#111827', fontWeight: 600, fontSize: 14, border: '1px solid #d1d5db' }}
            >
              <ArrowLeft size={18} />
              {currentStep === 'details' ? 'Cancel' : 'Back'}
            </button>

            {currentStep !== 'confirmation' ? (
              <button
                type="button"
                onClick={goToNextStep}
                disabled={isGeneratingTxnId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 8,
                  cursor: isGeneratingTxnId ? 'not-allowed' : 'pointer',
                  backgroundColor: isGeneratingTxnId ? '#e0e7ff' : '#4f46e5',
                  color: isGeneratingTxnId ? '#6366f1' : '#ffffff',
                  fontWeight: 700, fontSize: 14, border: 'none',
                  boxShadow: isGeneratingTxnId ? 'none' : '0 2px 6px rgba(79,70,229,0.35)',
                  opacity: isGeneratingTxnId ? 0.7 : 1,
                }}
              >
                {isGeneratingTxnId
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Preparing ID…</>
                  : <>Next <ArrowRight size={18} /></>
                }
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || isGeneratingTxnId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '11px 30px', borderRadius: 8, border: 'none',
                  backgroundColor: (isSubmitting || isGeneratingTxnId) ? '#4ade80' : '#15803d',
                  color: '#ffffff', fontWeight: 700, fontSize: 15,
                  cursor: (isSubmitting || isGeneratingTxnId) ? 'not-allowed' : 'pointer',
                  opacity: (isSubmitting || isGeneratingTxnId) ? 0.8 : 1,
                  boxShadow: '0 2px 10px rgba(21,128,61,0.4)', letterSpacing: '0.01em',
                }}
              >
                {isSubmitting ? (
                  <><Loader2 size={18} className="animate-spin" />{isEditMode ? 'Updating...' : 'Saving...'}</>
                ) : (
                  <><Check size={18} />{isEditMode ? 'Update Product' : 'Save Product'}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}