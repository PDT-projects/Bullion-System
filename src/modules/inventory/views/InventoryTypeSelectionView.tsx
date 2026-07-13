// Inventory Module - View Layer
// InventoryTypeSelectionView — REPLACED with unified single-page entry form
// 
// Mimics the transactions "Add Transaction" screen:
//   1. Ownership toggle (Against Payment / On Credit) at top
//   2. All entry fields inline below — no multi-step wizard
//   3. Brand typed freely → saved to Firestore for next time
//   4. Model typed freely → saved to Firestore under that brand
//   5. No dropdown selectors, no costing screens
//   6. Cost field label changes: "Purchasing Cost" (Owned) / "Supplier Cost" (Credit)
//   7. No sell/dealer price field
//   8. Payment method section (Owned) or credit channel (Credit)
//   9. Saves directly via InventoryFirebaseService.createProduct

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Check, Plus, Trash2, Loader2, Banknote,
  Building2, CreditCard, X, ChevronDown, MapPin,
  Wallet, Users, Tag, ImagePlus,
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { toast } from 'sonner';
import {
  InventoryFirebaseService,
  BrandModelFirebaseService,
  generateInventoryTransactionId,
  uploadInventoryImages,
} from '../models/InventoryFirebaseService';
import { LocationSelector } from './LocationSelector';
import { CATEGORIES } from '../viewModels/useInventoryMultimodelViewModel';
import { useNavigate } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────────────────────
interface BankOption { id: string; name: string; balance: number; }
interface BrandSuggestion { id: string; name: string; }
interface ModelSuggestion { id: string; name: string; }

// ── Style helpers ─────────────────────────────────────────────────────────────
const S = {
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '20px 24px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 13, fontWeight: 700, color: '#0f172a',
    marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8,
  } as React.CSSProperties,
  label: {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5,
  } as React.CSSProperties,
  input: (err?: boolean): React.CSSProperties => ({
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: `1px solid ${err ? '#ef4444' : '#d1d5db'}`,
    backgroundColor: err ? '#fef2f2' : '#fff',
    fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box',
  }),
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 } as React.CSSProperties,
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 } as React.CSSProperties,
};

const PAYMENT_MODES = [
  { value: 'Cash',          label: 'Cash',     icon: Banknote,   color: '#16a34a', bg: '#f0fdf4', border: '#22c55e' },
  { value: 'Bank Transfer', label: 'Bank',     icon: Building2,  color: '#2563eb', bg: '#eff6ff', border: '#3b82f6' },
  { value: 'Cheque',        label: 'Cheque',   icon: CreditCard, color: '#7c3aed', bg: '#f5f3ff', border: '#8b5cf6' },
];

// ── Autocomplete input ─────────────────────────────────────────────────────────
function AutocompleteInput({ label, value, onChange, suggestions, onSelect, placeholder, required, error }: {
  label: string; value: string; onChange: (v: string) => void;
  suggestions: string[]; onSelect: (v: string) => void;
  placeholder?: string; required?: boolean; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = value.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions;

  return (
    <div ref={ref}>
      <label style={S.label}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || `Type ${label.toLowerCase()}…`}
          autoComplete="off"
          style={S.input(!!error)}
        />
        {open && filtered.length > 0 && (
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 99,
            backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 9,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto' }}>
            {filtered.map(s => (
              <div key={s}
                onMouseDown={e => { e.preventDefault(); onSelect(s); setOpen(false); }}
                style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: '#111827',
                  fontWeight: s.toLowerCase() === value.toLowerCase() ? 600 : 400 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export const InventoryTypeSelectionView: React.FC<any> = ({ handleBack }) => {
  const navigate = useNavigate();

  // ── Ownership ────────────────────────────────────────────────────────────
  const [ownership, setOwnership]   = useState<'Owned' | 'Credit'>('Owned');
  const isCredit                    = ownership === 'Credit';

  // ── Brand / Model suggestions ─────────────────────────────────────────────
  const [brandSuggestions, setBrandSuggestions] = useState<BrandSuggestion[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<ModelSuggestion[]>([]);

  useEffect(() => {
    BrandModelFirebaseService.fetchAllBrands()
      .then(b => setBrandSuggestions(b))
      .catch(() => {});
  }, []);

  // ── Form state ────────────────────────────────────────────────────────────
  const [brandName,    setBrandName]    = useState('');
  const [modelName,    setModelName]    = useState('');
  const [category,     setCategory]     = useState('');
  const [description,  setDescription]  = useState('');
  const [location,     setLocation]     = useState('');
  const [status,       setStatus]       = useState('New');
  const [costPrice,    setCostPrice]    = useState<number>(0);
  const [stockInDate,  setStockInDate]  = useState('');

  // Quantity + Serials
  const [quantity,     setQuantity]     = useState(1);
  const [serialInput,  setSerialInput]  = useState('');
  const [serialCity,   setSerialCity]   = useState('');
  const [serials,      setSerials]      = useState<string[]>([]);
  const [serialCities, setSerialCities] = useState<Record<string, string>>({});

  // Images
  const [images,       setImages]       = useState<File[]>([]);
  const imageInputRef                   = React.useRef<HTMLInputElement>(null);
  const [imgDragging,  setImgDragging]  = useState(false);

  // Payment (Owned)
  const [paymentMode,  setPaymentMode]  = useState('Cash');
  const [paidAmount,   setPaidAmount]   = useState<number | ''>('');
  const [banks,        setBanks]        = useState<BankOption[]>([]);
  const [bankId,       setBankId]       = useState('');
  const [banksLoading, setBanksLoading] = useState(false);

  // Credit channel
  const [creditChannel, setCreditChannel] = useState('Cash');
  const [supplierPaid,  setSupplierPaid]  = useState<number | ''>('');

  // Save state
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [txnId,   setTxnId]   = useState('');
  const [txnLoading, setTxnLoading] = useState(false);

  // Load banks when Bank Transfer or Cheque selected
  useEffect(() => {
    const needsBank = paymentMode === 'Bank Transfer' || paymentMode === 'Cheque';
    if (!needsBank || isCredit) return;
    setBanksLoading(true);
    getDocs(query(collection(db, 'banks'), orderBy('name')))
      .then(snap => setBanks(snap.docs.map(d => {
        const b = d.data() as any;
        return { id: d.id, name: b.name || '—', balance: Number(b.balance) || 0 };
      })))
      .catch(() => {})
      .finally(() => setBanksLoading(false));
  }, [paymentMode, isCredit]);

  // Generate transaction ID on mount
  useEffect(() => {
    setTxnLoading(true);
    generateInventoryTransactionId()
      .then(setTxnId)
      .catch(() => setTxnId('TXN-' + Date.now()))
      .finally(() => setTxnLoading(false));
  }, []);

  // Load models when brand changes
  useEffect(() => {
    if (!brandName.trim()) { setModelSuggestions([]); return; }
    const found = brandSuggestions.find(b => b.name.toLowerCase() === brandName.toLowerCase());
    if (found) {
      BrandModelFirebaseService.fetchModelsByBrand(found.id)
        .then(m => setModelSuggestions(m.map(x => ({ id: x.id, name: x.name }))))
        .catch(() => setModelSuggestions([]));
    } else {
      setModelSuggestions([]);
    }
  }, [brandName, brandSuggestions]);

  // ── Add serial ─────────────────────────────────────────────────────────────
  const addSerial = () => {
    const s = serialInput.trim();
    if (!s || serials.includes(s)) return;
    setSerials(prev => [...prev, s]);
    if (serialCity) setSerialCities(prev => ({ ...prev, [s]: serialCity }));
    setSerialInput('');
  };

  const removeSerial = (s: string) => {
    setSerials(prev => prev.filter(x => x !== s));
    setSerialCities(prev => { const n = { ...prev }; delete n[s]; return n; });
  };

  // ── Validate ───────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!brandName.trim())  e.brandName  = 'Brand is required';
    if (!modelName.trim())  e.modelName  = 'Model is required';
    if (!category.trim())   e.category   = 'Category is required';
    if (!location.trim())   e.location   = 'Location is required';
    if (!costPrice || costPrice <= 0) e.costPrice = 'Cost is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // 1. Ensure brand exists in Firestore
      let brandId = brandSuggestions.find(b => b.name.toLowerCase() === brandName.toLowerCase())?.id || '';
      if (!brandId) {
        const created = await BrandModelFirebaseService.createBrand(brandName.trim());
        brandId = created.id;
        setBrandSuggestions(prev => [...prev, { id: created.id, name: created.name }]);
      }

      // 2. Ensure model exists under that brand
      const existingModel = modelSuggestions.find(m => m.name.toLowerCase() === modelName.toLowerCase());
      if (!existingModel) {
        const cm = await BrandModelFirebaseService.createModel(brandId, modelName.trim(), costPrice);
        setModelSuggestions(prev => [...prev, { id: cm.id, name: cm.name }]);
      }

      // 3. Build DTO
      const validSerials = serials.filter(s => s.trim() !== '');
      const stock = validSerials.length > 0 ? validSerials.length : quantity;
      const seededCities2: Record<string, string> = { ...serialCities };
      if (location) validSerials.forEach(s => { if (!seededCities2[s]) seededCities2[s] = location; });
      const manualDateIso = stockInDate ? new Date(stockInDate).toISOString() : undefined;
      const seededCities: Record<string, string> = { ...serialCities };
      if (location) serials.forEach(s => { if (!seededCities[s]) seededCities[s] = location; });

      const dto = {
        brandName:    brandName.trim(),
        modelName:    modelName.trim(),
        category:     category.trim(),
        description:  description.trim(),
        costPrice,
        sellPrice:    costPrice, // default to cost; can be updated later
        buyType:      'Import' as const,
        warrantyYears: 0,
        stock,
        location,
        serialNumbers: validSerials,
        serialCities:  seededCities2,
        status:        status as any,
        isDamaged:     false,
        costingOption: 'without' as const,
        costing:       undefined,
        ownershipType:         ownership,
        supplierCost:          isCredit ? costPrice * stock : undefined,
        supplierPaymentStatus: isCredit ? 'Unpaid' as const : undefined,
        supplierPaidAmount:    isCredit && supplierPaid ? Number(supplierPaid) : undefined,
        supplierPaymentChannel: isCredit ? creditChannel : undefined,
        serialStockInDatesManual: manualDateIso
          ? Object.fromEntries(serials.map(s => [s, manualDateIso]))
          : undefined,
      };

      // 4. Payment info
      const effectivePaid = isCredit ? 0 : (Number(paidAmount) || 0);
      const totalAmount   = costPrice * stock;
      const paymentInfo   = {
        paymentStatus: (isCredit ? 'unpaid' : (effectivePaid >= totalAmount ? 'paid' : effectivePaid > 0 ? 'partial' : 'unpaid')) as any,
        transactionId: txnId,
        paidAmount:    effectivePaid || undefined,
        totalAmount,
      };

      const created = await InventoryFirebaseService.createProduct(dto as any, paymentInfo);
      // Upload images if any
      if (images.length > 0) {
        try {
          const urls = await uploadInventoryImages(images, created.id);
          await InventoryFirebaseService.updateProduct(created.id, { imageUrls: urls } as any);
        } catch { /* non-blocking */ }
      }
      toast.success(`✅ ${brandName} ${modelName} added to inventory`);
      navigate('/inventory');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save inventory');
    } finally {
      setSaving(false);
    }
  };

  const needsBank = !isCredit && (paymentMode === 'Bank Transfer' || paymentMode === 'Cheque');
  const totalCost = costPrice * (serials.length || 1);
  const paid      = isCredit ? Number(supplierPaid || 0) : Number(paidAmount || 0);
  const remaining = Math.max(0, totalCost - paid);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/inventory')}
          style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <ArrowLeft size={17} />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={17} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Add New Inventory</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {txnLoading ? 'Generating ID…' : `TXN: ${txnId}`}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── 1. Ownership Toggle ── */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Ownership Type</div>
          <div style={S.grid2}>
            {[
              { value: 'Owned',  label: 'Against Payment', sub: 'Paying supplier now', Icon: Wallet, color: '#15803d', bg: '#f0fdf4', border: '#22c55e' },
              { value: 'Credit', label: 'On Credit',        sub: 'Pay supplier later',   Icon: Users,  color: '#b45309', bg: '#fffbeb', border: '#f59e0b' },
            ].map(opt => {
              const sel = ownership === opt.value;
              return (
                <button key={opt.value} type="button" onClick={() => setOwnership(opt.value as any)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${sel ? opt.border : '#e5e7eb'}`, backgroundColor: sel ? opt.bg : '#fff',
                    boxShadow: sel ? `0 0 0 3px ${opt.border}25` : 'none', transition: 'all 0.18s' }}>
                  <div style={{ padding: 8, borderRadius: 8, backgroundColor: sel ? `${opt.border}25` : '#f1f5f9', flexShrink: 0 }}><opt.Icon size={20} color={sel ? opt.color : '#94a3b8'} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: sel ? opt.color : '#374151' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: sel ? opt.color : '#9ca3af', marginTop: 2 }}>{opt.sub}</div>
                  </div>
                  {sel && (
                    <span style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={13} color="#fff" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. Product Details ── */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Product Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={S.grid2}>
              {/* Brand */}
              <AutocompleteInput
                label="Brand" required
                value={brandName} onChange={setBrandName}
                suggestions={brandSuggestions.map(b => b.name)}
                onSelect={v => { setBrandName(v); setModelName(''); }}
                placeholder="e.g. Garrett"
                error={errors.brandName}
              />
              {/* Model */}
              <AutocompleteInput
                label="Model" required
                value={modelName} onChange={setModelName}
                suggestions={modelSuggestions.map(m => m.name)}
                onSelect={setModelName}
                placeholder="e.g. Ace 400i"
                error={errors.modelName}
              />
            </div>

            <div style={S.grid3}>
              {/* Category */}
              <div>
                <label style={S.label}>Category <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    style={{ ...S.input(!!errors.category), appearance: 'none', paddingRight: 30, cursor: 'pointer' }}>
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }} />
                </div>
                {errors.category && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.category}</p>}
              </div>
              {/* Status */}
              <div>
                <label style={S.label}>Status</label>
                <div style={{ position: 'relative' }}>
                  <select value={status} onChange={e => setStatus(e.target.value)}
                    style={{ ...S.input(), appearance: 'none', paddingRight: 30, cursor: 'pointer' }}>
                    {['New', 'Used', 'In Transit', 'On-Order', 'Available', 'Damaged', 'Returned'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }} />
                </div>
              </div>
              {/* Stock-In Date */}
              <div>
                <label style={S.label}>Stock-In Date <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                <input type="date" value={stockInDate} onChange={e => setStockInDate(e.target.value)} style={S.input()} />
              </div>
            </div>

            {/* Location */}
            <div>
              <LocationSelector
                value={location}
                onChange={setLocation}
                label="Location *"
                placeholder="Select location"
              />
              {errors.location && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.location}</p>}
            </div>

            {/* Description */}
            <div>
              <label style={S.label}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                placeholder="Optional notes, specs, or details"
                style={{ ...S.input(), resize: 'vertical', lineHeight: 1.5 }} />
            </div>
          </div>
        </div>

        {/* ── 3. Cost ── */}
        <div style={S.card}>
          <div style={S.sectionTitle}>
            {isCredit ? <><Users size={15} color="#b45309" style={{flexShrink:0}}/> Supplier Cost</> : <><Wallet size={15} color="#15803d" style={{flexShrink:0}}/> Purchasing Cost</>}
          </div>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>
                {isCredit ? 'Supplier Cost per Unit (AED)' : 'Purchasing Cost per Unit (AED)'}
                <span style={{ color: '#ef4444' }}> *</span>
              </label>
              <input type="number" min={0} step="any"
                value={costPrice || ''}
                onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                style={S.input(!!errors.costPrice)} />
              {errors.costPrice && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.costPrice}</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              {costPrice > 0 && (
                <div style={{ width: '100%', padding: '10px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Total ({serials.length || 1} unit{(serials.length || 1) !== 1 ? 's' : ''})</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>AED {totalCost.toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 4. Quantity + Serial Numbers ── */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Quantity & Serial Numbers</div>

          {/* Quantity selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Quantity <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: 160 }}>
              <button type="button"
                onClick={() => {
                  const n = Math.max(1, quantity - 1);
                  setQuantity(n);
                  setSerials(prev => prev.slice(0, n));
                }}
                style={{ width: 36, height: 38, borderRadius: '8px 0 0 8px', border: '1px solid #d1d5db', borderRight: 'none', backgroundColor: '#f3f4f6', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                −
              </button>
              <input type="number" min={1} value={quantity}
                onChange={e => {
                  const n = Math.max(1, parseInt(e.target.value) || 1);
                  setQuantity(n);
                  if (n < serials.length) setSerials(prev => prev.slice(0, n));
                }}
                style={{ width: 60, height: 38, border: '1px solid #d1d5db', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111827', outline: 'none', backgroundColor: '#fff' }} />
              <button type="button"
                onClick={() => setQuantity(q => q + 1)}
                style={{ width: 36, height: 38, borderRadius: '0 8px 8px 0', border: '1px solid #d1d5db', borderLeft: 'none', backgroundColor: '#f3f4f6', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                +
              </button>
            </div>
          </div>

          {/* Serial slots — one per unit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {Array.from({ length: quantity }).map((_, idx) => {
              const filled = serials[idx] || '';
              const city   = filled ? (serialCities[filled] || serialCity) : '';
              return (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>
                    #{idx + 1}
                  </div>
                  <input
                    type="text"
                    value={filled}
                    onChange={e => {
                      const val = e.target.value;
                      setSerials(prev => {
                        const next = [...prev];
                        next[idx] = val;
                        return next;
                      });
                    }}
                    placeholder={`Serial #${idx + 1} (optional)`}
                    style={{ ...S.input(), flex: 2 }}
                  />
                  <div style={{ flex: 1 }}>
                    <LocationSelector
                      value={filled ? (serialCities[filled] || '') : ''}
                      onChange={loc => {
                        if (filled) setSerialCities(prev => ({ ...prev, [filled]: loc }));
                      }}
                      label=""
                      placeholder="Location"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: 11, color: '#94a3b8' }}>
            {serials.filter(s => s.trim()).length} of {quantity} serial{quantity !== 1 ? 's' : ''} filled — stock count = {quantity}
          </p>
        </div>


        {/* ── 5. Images ── */}
        <div style={S.card}>
          <div style={S.sectionTitle}><ImagePlus size={15} style={{flexShrink:0}}/> Product Images <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>(optional)</span></div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setImgDragging(true); }}
            onDragLeave={() => setImgDragging(false)}
            onDrop={e => {
              e.preventDefault(); setImgDragging(false);
              const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
              if (files.length) setImages(prev => [...prev, ...files]);
            }}
            onClick={() => imageInputRef.current?.click()}
            style={{ border: `2px dashed ${imgDragging ? '#6366f1' : '#d1d5db'}`, borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer', backgroundColor: imgDragging ? '#f0f4ff' : '#f9fafb', transition: 'all 0.15s', marginBottom: images.length ? 14 : 0 }}>
            <ImagePlus size={22} color={imgDragging ? '#6366f1' : '#94a3b8'} style={{ margin: '0 auto 6px' }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: imgDragging ? '#6366f1' : '#6b7280' }}>
              {imgDragging ? 'Drop images here' : 'Click or drag & drop images'}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9ca3af' }}>JPG, PNG, WEBP</p>
            <input ref={imageInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
              onChange={e => {
                const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
                if (files.length) setImages(prev => [...prev, ...files]);
                e.target.value = '';
              }} />
          </div>

          {images.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {images.map((file, i) => {
                const url = URL.createObjectURL(file);
                return (
                  <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                    <img src={url} alt={file.name} onLoad={() => URL.revokeObjectURL(url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button"
                      onClick={e => { e.stopPropagation(); setImages(prev => prev.filter((_, j) => j !== i)); }}
                      style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      <X size={10} color="#fff" strokeWidth={3} />
                    </button>
                  </div>
                );
              })}
              <button type="button" onClick={() => imageInputRef.current?.click()}
                style={{ width: 72, height: 72, borderRadius: 8, border: '2px dashed #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: '#94a3b8', flexShrink: 0 }}>
                <Plus size={16} />
                <span style={{ fontSize: 9, fontWeight: 700 }}>More</span>
              </button>
            </div>
          )}
        </div>

        {/* ── 6. Payment / Credit ── */}
        {isCredit ? (
          <div style={S.card}>
            <div style={S.sectionTitle}><Users size={15} color="#b45309" style={{flexShrink:0}}/> Supplier Credit Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 12, color: '#b45309', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
                No payment made now — this will appear in <strong>Inventory Payables</strong> once stock sells.
              </p>
              {/* Amount paid so far */}
              <div>
                <label style={S.label}>Amount Paid to Supplier So Far (AED)</label>
                <input type="number" min={0} step="any"
                  value={supplierPaid}
                  onChange={e => setSupplierPaid(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0 if nothing paid yet"
                  style={S.input()} />
              </div>
              {/* Credit channel */}
              <div>
                <label style={S.label}>Payment Channel (for amount paid)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {PAYMENT_MODES.map(m => {
                    const Icon = m.icon;
                    const sel = creditChannel === m.value;
                    return (
                      <button key={m.value} type="button" onClick={() => setCreditChannel(m.value)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
                          border: `2px solid ${sel ? m.border : '#e5e7eb'}`, backgroundColor: sel ? m.bg : '#fff', transition: 'all 0.15s' }}>
                        <Icon size={16} color={sel ? m.color : '#9ca3af'} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: sel ? m.color : '#374151' }}>{m.label}</span>
                        {sel && <Check size={12} color={m.color} style={{ marginLeft: 'auto' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Credit summary */}
              {costPrice > 0 && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 10 }}>Credit Summary</div>
                  {[
                    ['Supplier cost / unit', `AED ${costPrice.toLocaleString()}`],
                    ['Units', String(serials.length || 1)],
                    ['Total owed', `AED ${totalCost.toLocaleString()}`],
                    ...(paid > 0 ? [['Paid so far', `AED ${paid.toLocaleString()}`], ['Still owed', `AED ${remaining.toLocaleString()}`]] : []),
                  ].map(([k, v], i) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13,
                      paddingTop: i === 2 ? 8 : 4, marginTop: i === 2 ? 4 : 0,
                      borderTop: i === 2 ? '1px solid #fde68a' : 'none',
                      fontWeight: i === 2 ? 800 : 500, color: i === 4 ? '#b91c1c' : i === 3 ? '#15803d' : '#92400e' }}>
                      <span>{k}</span><span>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={S.card}>
            <div style={S.sectionTitle}><Wallet size={15} color="#15803d" style={{flexShrink:0}}/> Payment Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Payment method */}
              <div>
                <label style={S.label}>Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {PAYMENT_MODES.map(m => {
                    const Icon = m.icon;
                    const sel = paymentMode === m.value;
                    return (
                      <button key={m.value} type="button" onClick={() => setPaymentMode(m.value)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
                          border: `2px solid ${sel ? m.border : '#e5e7eb'}`, backgroundColor: sel ? m.bg : '#fff', transition: 'all 0.15s' }}>
                        <Icon size={16} color={sel ? m.color : '#9ca3af'} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: sel ? m.color : '#374151' }}>{m.label}</span>
                        {sel && <Check size={12} color={m.color} style={{ marginLeft: 'auto' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Bank selector */}
              {needsBank && (
                <div>
                  <label style={S.label}>{paymentMode === 'Cheque' ? 'Issuing Bank' : 'Bank Account'}</label>
                  {banksLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb' }}>
                      <Loader2 size={14} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Loading banks…</span>
                    </div>
                  ) : banks.length === 0 ? (
                    <div style={{ padding: '10px 14px', border: '1px solid #fde68a', borderRadius: 8, backgroundColor: '#fffbeb', fontSize: 13, color: '#92400e' }}>
                      ⚠ No banks found. Add one in Banking first.
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <select value={bankId} onChange={e => setBankId(e.target.value)}
                        style={{ ...S.input(), appearance: 'none', paddingRight: 30, cursor: 'pointer' }}>
                        <option value="">— Select bank —</option>
                        {banks.map(b => <option key={b.id} value={b.id}>{b.name} — AED {b.balance.toLocaleString()}</option>)}
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }} />
                    </div>
                  )}
                </div>
              )}
              {/* Amount paid */}
              <div>
                <label style={S.label}>Amount Paid (AED)</label>
                <input type="number" min={0} step="any"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="Leave blank if unpaid"
                  style={S.input()} />
              </div>
              {/* Payment summary */}
              {costPrice > 0 && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 10 }}>Payment Summary</div>
                  {[
                    ['Cost / unit', `AED ${costPrice.toLocaleString()}`],
                    ['Units', String(serials.length || 1)],
                    ['Total', `AED ${totalCost.toLocaleString()}`],
                    ...(paid > 0 ? [['Paid', `AED ${paid.toLocaleString()}`], ['Remaining', `AED ${remaining.toLocaleString()}`]] : []),
                  ].map(([k, v], i) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13,
                      paddingTop: i === 2 ? 8 : 4, marginTop: i === 2 ? 4 : 0,
                      borderTop: i === 2 ? '1px solid #bbf7d0' : 'none',
                      fontWeight: i === 2 ? 800 : 500, color: i === 4 ? '#b91c1c' : i === 3 ? '#15803d' : '#166534' }}>
                      <span>{k}</span><span>{v}</span>
                    </div>
                  ))}
                  {paymentMode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 8, paddingTop: 8, borderTop: '1px solid #bbf7d0', color: '#64748b' }}>
                      <span>Method</span><span style={{ fontWeight: 700, color: '#15803d' }}>{paymentMode}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" onClick={() => navigate('/inventory')}
          style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={15} /> Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          style={{ padding: '11px 28px', borderRadius: 8, border: 'none',
            backgroundColor: saving ? '#4ade80' : '#15803d', color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 2px 8px rgba(21,128,61,0.35)', opacity: saving ? 0.8 : 1 }}>
          {saving
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
            : <><Check size={16} /> Save Inventory</>}
        </button>
      </div>
    </div>
  );
};