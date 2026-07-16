// Inventory Module - View Layer
// Single unified form — add one or multiple products at once
// "+ Add Another Product" adds more brand/model rows inline

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Check, Plus, Trash2, Loader2, Banknote,
  Building2, CreditCard, X, ChevronDown, MapPin,
  Wallet, Users, ImagePlus,
} from 'lucide-react';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
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

interface BankOption { id: string; name: string; balance: number; }
interface BrandSuggestion { id: string; name: string; }
interface ModelSuggestion { id: string; name: string; costPrice?: number; description?: string; }

// ── Product row type ───────────────────────────────────────────────────────
interface ProductRow {
  id: string;
  brandName: string;
  modelName: string;
  category: string;
  description: string;
  quantity: number;
  costPrice: number;
  serials: string[]; // one per slot
}

const S = {
  card: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px' } as React.CSSProperties,
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 } as React.CSSProperties,
  inp: (err?: boolean): React.CSSProperties => ({
    width: '100%', padding: '8px 11px', borderRadius: 8,
    border: `1px solid ${err ? '#ef4444' : '#d1d5db'}`,
    backgroundColor: err ? '#fef2f2' : '#fff',
    fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box',
  }),
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } as React.CSSProperties,
};

const PAYMENT_MODES = [
  { value: 'Cash',          label: 'Cash',   icon: Banknote,   color: '#16a34a', bg: '#f0fdf4', border: '#22c55e' },
  { value: 'Bank Transfer', label: 'Bank',   icon: Building2,  color: '#2563eb', bg: '#eff6ff', border: '#3b82f6' },
  { value: 'Cheque',        label: 'Cheque', icon: CreditCard, color: '#7c3aed', bg: '#f5f3ff', border: '#8b5cf6' },
];

function newRow(): ProductRow {
  return { id: Math.random().toString(36).slice(2), brandName: '', modelName: '', category: '', description: '', quantity: 1, costPrice: 0, serials: [] };
}

// ── Brand/model autocomplete for a single row ──────────────────────────────
function BrandModelInputs({ row, onChange, brandSuggestions, modelSuggestions, onBrandSelect, onModelSelect, error }: {
  row: ProductRow;
  onChange: (field: keyof ProductRow, val: any) => void;
  brandSuggestions: BrandSuggestion[];
  modelSuggestions: ModelSuggestion[];
  onBrandSelect: (name: string) => void;
  onModelSelect: (name: string, model?: ModelSuggestion) => void;
  error?: { brand?: string; model?: string; category?: string; cost?: string };
}) {
  const [openBrand, setOpenBrand] = useState(false);
  const [openModel, setOpenModel] = useState(false);
  const brandRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) setOpenBrand(false);
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setOpenModel(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filteredBrands = row.brandName.trim()
    ? brandSuggestions.filter(b => b.name.toLowerCase().includes(row.brandName.toLowerCase()))
    : brandSuggestions;
  const filteredModels = row.modelName.trim()
    ? modelSuggestions.filter(m => m.name.toLowerCase().includes(row.modelName.toLowerCase()))
    : modelSuggestions;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={S.grid2}>
        {/* Brand */}
        <div ref={brandRef}>
          <label style={S.label}>Brand <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <input type="text" value={row.brandName}
              onChange={e => { onChange('brandName', e.target.value); onChange('modelName', ''); setOpenBrand(true); }}
              onFocus={() => setOpenBrand(true)}
              placeholder="Type brand…" autoComplete="off"
              style={S.inp(!!error?.brand)} />
            {openBrand && filteredBrands.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0, zIndex: 99, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 9, boxShadow: '0 8px 20px rgba(0,0,0,0.12)', maxHeight: 180, overflowY: 'auto' }}>
                {filteredBrands.map(b => (
                  <div key={b.id} onMouseDown={e => { e.preventDefault(); onChange('brandName', b.name); onBrandSelect(b.name); setOpenBrand(false); }}
                    style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: '#111827' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}>{b.name}</div>
                ))}
              </div>
            )}
            {error?.brand && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{error.brand}</p>}
          </div>
        </div>

        {/* Model */}
        <div ref={modelRef}>
          <label style={S.label}>Model <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <input type="text" value={row.modelName}
              onChange={e => { onChange('modelName', e.target.value); setOpenModel(true); }}
              onFocus={() => setOpenModel(true)}
              placeholder="Type model…" autoComplete="off"
              style={S.inp(!!error?.model)} />
            {openModel && filteredModels.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0, zIndex: 99, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 9, boxShadow: '0 8px 20px rgba(0,0,0,0.12)', maxHeight: 180, overflowY: 'auto' }}>
                {filteredModels.map(m => (
                  <div key={m.id} onMouseDown={e => { e.preventDefault(); onChange('modelName', m.name); onModelSelect(m.name, m); setOpenModel(false); }}
                    style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: '#111827' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}>
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    {m.costPrice ? <div style={{ fontSize: 11, color: '#94a3b8' }}>AED {m.costPrice.toLocaleString()}</div> : null}
                  </div>
                ))}
              </div>
            )}
            {error?.model && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{error.model}</p>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 100px', gap: 10 }}>
        {/* Category */}
        <div>
          <label style={S.label}>Category <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <select value={row.category} onChange={e => onChange('category', e.target.value)}
              style={{ ...S.inp(!!error?.category), appearance: 'none', paddingRight: 28, cursor: 'pointer' }}>
              <option value="">Select…</option>
              {(CATEGORIES || []).map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }} />
          </div>
          {error?.category && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{error.category}</p>}
        </div>
        {/* Description */}
        <div>
          <label style={S.label}>Description</label>
          <input type="text" value={row.description} onChange={e => onChange('description', e.target.value)} placeholder="Optional…" style={S.inp()} />
        </div>
        {/* Qty */}
        <div>
          <label style={S.label}>Qty</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button type="button" onClick={() => { const n = Math.max(1, row.quantity - 1); onChange('quantity', n); onChange('serials', row.serials.slice(0, n)); }}
              style={{ width: 30, height: 36, border: '1px solid #d1d5db', borderRight: 'none', borderRadius: '7px 0 0 7px', backgroundColor: '#f3f4f6', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>−</button>
            <input type="number" min={1} value={row.quantity}
              onChange={e => { const n = Math.max(1, parseInt(e.target.value)||1); onChange('quantity', n); if (n < row.serials.length) onChange('serials', row.serials.slice(0, n)); }}
              style={{ width: 40, height: 36, border: '1px solid #d1d5db', textAlign: 'center', fontSize: 13, fontWeight: 700, outline: 'none' }} />
            <button type="button" onClick={() => onChange('quantity', row.quantity + 1)}
              style={{ width: 30, height: 36, border: '1px solid #d1d5db', borderLeft: 'none', borderRadius: '0 7px 7px 0', backgroundColor: '#f3f4f6', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>+</button>
          </div>
        </div>
        {/* Cost */}
        <div>
          <label style={S.label}>Cost (AED) <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="number" min={0} step="any" value={row.costPrice || ''}
            onChange={e => onChange('costPrice', parseFloat(e.target.value) || 0)}
            placeholder="0.00" style={S.inp(!!error?.cost)} />
          {error?.cost && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{error.cost}</p>}
        </div>
      </div>

      {/* Serial slots */}
      <div>
        <label style={S.label}>Serial Numbers</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: row.quantity }).map((_, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#94a3b8', width: 24, textAlign: 'right', flexShrink: 0 }}>#{idx+1}</span>
              <input type="text" value={row.serials[idx] || ''}
                onChange={e => { const next = [...row.serials]; next[idx] = e.target.value; onChange('serials', next); }}
                placeholder={`Serial #${idx+1} (optional)`}
                style={{ ...S.inp(), fontSize: 12, flex: 1 }} />
            </div>
          ))}
        </div>
        {row.costPrice > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
            Subtotal: <strong style={{ color: '#0f172a' }}>AED {(row.costPrice * (row.serials.filter(s=>s.trim()).length || row.quantity)).toLocaleString()}</strong>
            <span style={{ marginLeft: 8, color: '#94a3b8' }}>({row.serials.filter(s=>s.trim()).length || row.quantity} unit{(row.serials.filter(s=>s.trim()).length || row.quantity)!==1?'s':''})</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export const InventoryTypeSelectionView: React.FC<{ handleBack?: () => void; onClose?: () => void }> = ({ onClose }) => {
  const navigate  = useNavigate();
  const afterSave = () => { if (onClose) { onClose(); } else { navigate('/inventory'); } };

  // ── Ownership ─────────────────────────────────────────────────────────────
  const [ownership, setOwnership] = useState<'Owned'|'Credit'>('Owned');
  const isCredit = ownership === 'Credit';

  // ── Product rows ──────────────────────────────────────────────────────────
  const [rows, setRows] = useState<ProductRow[]>([newRow()]);
  const [rowErrors, setRowErrors] = useState<Record<string, any>>({});

  const updateRow = (id: string, field: keyof ProductRow, val: any) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  const addRow = () => setRows(prev => [...prev, newRow()]);
  const removeRow = (id: string) => setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);

  // ── Brand/Model suggestions per row ──────────────────────────────────────
  const [brandSuggestions, setBrandSuggestions] = useState<BrandSuggestion[]>([]);
  const [modelSuggestionsByRow, setModelSuggestionsByRow] = useState<Record<string, ModelSuggestion[]>>({});

  useEffect(() => {
    BrandModelFirebaseService.fetchAllBrands().then(setBrandSuggestions).catch(() => {});
  }, []);

  const loadModels = async (rowId: string, brandName: string) => {
    if (!brandName.trim()) { setModelSuggestionsByRow(prev => ({ ...prev, [rowId]: [] })); return; }
    try {
      const models = await BrandModelFirebaseService.fetchModelsByBrandName(brandName.trim());
      const enriched: ModelSuggestion[] = await Promise.all(models.map(async m => {
        try {
          const snap = await getDocs(query(collection(db, 'products'), where('brandName', '==', brandName.trim()), where('modelName', '==', m.modelName), orderBy('createdAt', 'desc'), limit(1)));
          const desc = snap.empty ? '' : (snap.docs[0].data() as any).description || '';
          return { id: m.id, name: m.modelName, costPrice: m.costPrice, description: desc };
        } catch { return { id: m.id, name: m.modelName, costPrice: m.costPrice, description: '' }; }
      }));
      setModelSuggestionsByRow(prev => ({ ...prev, [rowId]: enriched }));
    } catch { setModelSuggestionsByRow(prev => ({ ...prev, [rowId]: [] })); }
  };

  // ── Shared fields ─────────────────────────────────────────────────────────
  const [location,     setLocation]     = useState('');
  const [status,       setStatus]       = useState('New');
  const [stockInDate,  setStockInDate]  = useState('');
  const [images,       setImages]       = useState<File[]>([]);
  const imageInputRef                   = useRef<HTMLInputElement>(null);
  const [imgDragging,  setImgDragging]  = useState(false);

  // NOTE: Payment collection has been removed from the add-inventory flow.
  // Every new item is saved as `paymentStatus: 'unpaid'` and reconciled later
  // from the Transactions / Payables module. The `Credit` / `Owned` ownership
  // toggle remains because it decides whether the item shows up in Payables.

  const [txnId,    setTxnId]    = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    generateInventoryTransactionId().then(setTxnId).catch(() => setTxnId('TXN-'+Date.now()));
  }, []);

  const grandTotal = rows.reduce((s, r) => s + r.costPrice * (r.serials.filter(x=>x.trim()).length || r.quantity), 0);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    // Validate
    const errs: Record<string, any> = {};
    let hasErr = false;
    rows.forEach((r, i) => {
      const e: any = {};
      if (!r.brandName.trim())  { e.brand    = 'Required'; hasErr = true; }
      if (!r.modelName.trim())  { e.model    = 'Required'; hasErr = true; }
      if (!r.category.trim())   { e.category = 'Required'; hasErr = true; }
      if (!r.costPrice || r.costPrice <= 0) { e.cost = 'Required'; hasErr = true; }

      // Serial numbers are REQUIRED, must match the row's quantity, and no duplicates
      const validSerials = r.serials.filter(s => s.trim() !== '');
      if (!r.quantity || r.quantity <= 0) {
        e.quantity = 'Must be at least 1'; hasErr = true;
      } else if (validSerials.length === 0) {
        e.serials = 'Serial numbers are required'; hasErr = true;
      } else if (validSerials.length !== r.quantity) {
        e.serials = `Provide ${r.quantity} serial${r.quantity === 1 ? '' : 's'} (${validSerials.length} filled)`; hasErr = true;
      } else if (new Set(validSerials).size !== validSerials.length) {
        e.serials = 'Duplicate serial numbers'; hasErr = true;
      }

      if (Object.keys(e).length) errs[r.id] = e;
    });
    if (!location.trim()) { toast.error('Location is required'); hasErr = true; }
    if (hasErr) {
      setRowErrors(errs);
      if (Object.values(errs).some((e: any) => e.serials || e.quantity)) {
        toast.error('Fix serial-number errors before saving');
      }
      return;
    }
    setRowErrors({});
    setSaving(true);
    setSaveError('');

    try {
      const manualDateIso = stockInDate ? new Date(stockInDate).toISOString() : undefined;
      for (const row of rows) {
        // Ensure brand
        let brandId = brandSuggestions.find(b => b.name.toLowerCase() === row.brandName.toLowerCase())?.id || '';
        if (!brandId) {
          const created = await BrandModelFirebaseService.createBrand(row.brandName.trim());
          brandId = created.id;
          setBrandSuggestions(prev => [...prev, { id: created.id, name: created.name }]);
        }
        // Ensure model
        const rowModels = modelSuggestionsByRow[row.id] || [];
        if (!rowModels.find(m => m.name.toLowerCase() === row.modelName.toLowerCase())) {
          await BrandModelFirebaseService.createModel(brandId, row.modelName.trim(), row.costPrice).catch(() => {});
        }

        const validSerials = row.serials.filter(s => s.trim());
        const stock = validSerials.length || row.quantity;
        const seededCities: Record<string, string> = {};
        if (location) validSerials.forEach(s => { seededCities[s] = location; });

        const dto: any = {
          brandName: row.brandName.trim(), modelName: row.modelName.trim(),
          category: row.category, description: row.description.trim(),
          costPrice: row.costPrice, sellPrice: row.costPrice,
          buyType: 'Import', warrantyYears: 0, stock, location,
          serialNumbers: validSerials, serialCities: seededCities,
          status: status as any, isDamaged: false, costingOption: 'without',
          ownershipType: ownership,
          // Payment collection removed — supplier balance is still recorded for
          // Credit-ownership so it shows in Payables, but no amount-paid /
          // payment-channel is captured here. Both are set later from Transactions.
          supplierCost:          isCredit ? row.costPrice * stock : undefined,
          supplierPaymentStatus: isCredit ? 'Unpaid' : undefined,
          supplierPaidAmount:    undefined,
          supplierPaymentChannel:undefined,
          serialStockInDatesManual: manualDateIso
            ? Object.fromEntries(validSerials.map(s => [s, manualDateIso])) : undefined,
        };

        const totalAmount = row.costPrice * stock;
        const payInfo: any = {
          paymentStatus: 'unpaid',
          transactionId: txnId,
          totalAmount,
        };

        console.log('[INV] Calling createProduct...', dto.brandName, dto.modelName, 'serials:', validSerials);
        let created: any;
        try {
          created = await InventoryFirebaseService.createProduct(dto, payInfo);
          console.log('[INV] ✅ Created product:', created?.id);
        } catch (createErr: any) {
          console.error('[INV] ❌ createProduct failed:', createErr?.message, createErr);
          throw createErr;
        }
        if (images.length > 0 && rows.indexOf(row) === 0) {
          try {
            const urls = await uploadInventoryImages(images, created?.id);
            await InventoryFirebaseService.updateProduct(created?.id, { imageUrls: urls } as any);
          } catch (imgErr) { console.warn('[INV] Image upload failed:', imgErr); }
        }
      }

      console.log('[INV] All products saved successfully');
      toast.success(`✅ ${rows.length} product${rows.length > 1 ? 's' : ''} added to inventory`);
      afterSave();
    } catch (err: any) {
      console.error('[INV] Save error:', err);
      const msg = err?.message || 'Failed to save inventory';
      setSaveError(msg);
      toast.error(msg);
      alert(`❌ Save failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => afterSave()} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={17} color="#64748b" />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={17} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Add Inventory</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>TXN: {txnId || '…'}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Ownership ── */}
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Ownership Type</div>
          <div style={S.grid2}>
            {[
              { value: 'Owned',  label: 'Against Payment', sub: 'Paying supplier now',   Icon: Wallet, color: '#15803d', bg: '#f0fdf4', border: '#22c55e' },
              { value: 'Credit', label: 'On Credit',        sub: 'Pay supplier later',    Icon: Users,  color: '#b45309', bg: '#fffbeb', border: '#f59e0b' },
            ].map(opt => {
              const sel = ownership === opt.value;
              return (
                <button key={opt.value} type="button" onClick={() => setOwnership(opt.value as any)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${sel ? opt.border : '#e5e7eb'}`, backgroundColor: sel ? opt.bg : '#fff', transition: 'all 0.15s' }}>
                  <div style={{ padding: 7, borderRadius: 8, backgroundColor: sel ? `${opt.border}25` : '#f1f5f9' }}>
                    <opt.Icon size={19} color={sel ? opt.color : '#94a3b8'} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: sel ? opt.color : '#374151' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: sel ? opt.color : '#9ca3af' }}>{opt.sub}</div>
                  </div>
                  {sel && <span style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', backgroundColor: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={12} color="#fff" /></span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Product rows ── */}
        {rows.map((row, idx) => (
          <div key={row.id} style={{ ...S.card, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                Product {rows.length > 1 ? `#${idx + 1}` : ''}
              </div>
              {rows.length > 1 && (
                <button type="button" onClick={() => removeRow(row.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: '1px solid #fecaca', backgroundColor: '#fef2f2', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#ef4444' }}>
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>
            <BrandModelInputs
              row={row}
              onChange={(field, val) => {
                updateRow(row.id, field, val);
                if (field === 'brandName') loadModels(row.id, val);
              }}
              brandSuggestions={brandSuggestions}
              modelSuggestions={modelSuggestionsByRow[row.id] || []}
              onBrandSelect={name => loadModels(row.id, name)}
              onModelSelect={(name, model) => {
                if (model?.costPrice && model.costPrice > 0) updateRow(row.id, 'costPrice', model.costPrice);
                if (model?.description) updateRow(row.id, 'description', model.description);
              }}
              error={rowErrors[row.id]}
            />
          </div>
        ))}

        {/* ── Add Another Product ── */}
        <button type="button" onClick={addRow}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, border: '2px dashed #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#64748b', transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#0f172a'; (e.currentTarget as HTMLElement).style.color = '#0f172a'; (e.currentTarget as HTMLElement).style.backgroundColor = '#f1f5f9'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1'; (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'; }}>
          <Plus size={16} /> Add Another Product
        </button>

        {/* ── Shared settings ── */}
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Stock Settings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Location <span style={{ color: '#ef4444' }}>*</span></label>
                <LocationSelector value={location} onChange={setLocation} label="" placeholder="Select location" />
              </div>
              <div>
                <label style={S.label}>Condition</label>
                <div style={{ position: 'relative' }}>
                  <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...S.inp(), appearance: 'none', paddingRight: 28, cursor: 'pointer' }}>
                    {['New','Used','In Transit','Returned','Damaged'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }} />
                </div>
              </div>
            </div>
            {/* Stock-in date */}
            <div>
              <label style={S.label}>Stock-In Date</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', backgroundColor: '#f1f5f9', borderRadius: 8, marginBottom: 6, border: '1px solid #e2e8f0' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Auto</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 'auto' }}>recorded on save</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="date" value={stockInDate} onChange={e => setStockInDate(e.target.value)} style={{ ...S.inp(), flex: 1 }} />
                {stockInDate && <button type="button" onClick={() => setStockInDate('')} style={{ padding: '6px 8px', borderRadius: 7, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={12} /></button>}
              </div>
            </div>
          </div>
        </div>

        {/* ── Images ── */}
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ImagePlus size={15} /> Product Images <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
          </div>
          <div onDragOver={e => { e.preventDefault(); setImgDragging(true); }} onDragLeave={() => setImgDragging(false)}
            onDrop={e => { e.preventDefault(); setImgDragging(false); Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).forEach(f => setImages(prev => [...prev, f])); }}
            onClick={() => imageInputRef.current?.click()}
            style={{ border: `2px dashed ${imgDragging ? '#6366f1' : '#d1d5db'}`, borderRadius: 10, padding: '18px', textAlign: 'center', cursor: 'pointer', backgroundColor: imgDragging ? '#f0f4ff' : '#f9fafb', marginBottom: images.length ? 12 : 0 }}>
            <ImagePlus size={20} color={imgDragging ? '#6366f1' : '#94a3b8'} style={{ margin: '0 auto 5px' }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Click or drag & drop images</p>
            <input ref={imageInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => { Array.from(e.target.files||[]).filter(f => f.type.startsWith('image/')).forEach(f => setImages(prev => [...prev, f])); e.target.value = ''; }} />
          </div>
          {images.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {images.map((file, i) => {
                const url = URL.createObjectURL(file);
                return (
                  <div key={i} style={{ position: 'relative', width: 68, height: 68, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <img src={url} alt="" onLoad={() => URL.revokeObjectURL(url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={e => { e.stopPropagation(); setImages(prev => prev.filter((_, j) => j !== i)); }} style={{ position: 'absolute', top: 2, right: 2, width: 17, height: 17, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      <X size={9} color="#fff" strokeWidth={3} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Payment (removed) ──
            Payment collection UI removed from this flow. All new items are
            saved as unpaid and reconciled from the Transactions module.
            The Credit / Owned toggle is kept above so the item shows in
            Payables correctly, but no amounts or channels are captured here. */}
        <div style={{ padding: '12px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Wallet size={16} color="#1d4ed8" />
          <div style={{ fontSize: 12, color: '#1e3a8a', lineHeight: 1.5 }}>
            <b>Payment tracked separately.</b> This inventory will be saved as{' '}
            <b>unpaid</b>{isCredit ? ' and appear in Inventory Payables' : ''}. Record payment later from the Transactions module.
          </div>
        </div>

        {/* Grand total */}
        {grandTotal > 0 && (
          <div style={{ backgroundColor: '#0f172a', borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Grand Total — {rows.length} product{rows.length!==1?'s':''}
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>AED {grandTotal.toLocaleString()}</span>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {saveError && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', marginBottom: 2 }}>Save Failed</div>
              <div style={{ fontSize: 12, color: '#dc2626' }}>{saveError}</div>
            </div>
            <button onClick={() => setSaveError('')} style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, flexShrink: 0 }}>×</button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button type="button" onClick={() => afterSave()} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={15} /> Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            style={{ padding: '11px 28px', borderRadius: 8, border: 'none', backgroundColor: saving ? '#94a3b8' : '#15803d', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: saving ? 'none' : '0 2px 8px rgba(21,128,61,0.35)' }}>
            {saving
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : <><Check size={16} /> Save {rows.length > 1 ? `All ${rows.length} Products` : 'Inventory'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};