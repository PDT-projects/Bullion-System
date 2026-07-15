// Inventory Module - View Layer
// InventoryTypeSelectionView — unified single-page entry form with Bulk mode

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Check, Plus, Trash2, Loader2, Banknote,
  Building2, CreditCard, X, ChevronDown, MapPin,
  Wallet, Users, Tag, ImagePlus, Layers,
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

const S = {
  card: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px' } as React.CSSProperties,
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 } as React.CSSProperties,
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
  { value: 'Cash', label: 'Cash', icon: Banknote, color: '#16a34a', bg: '#f0fdf4', border: '#22c55e' },
  { value: 'Bank Transfer', label: 'Bank', icon: Building2, color: '#2563eb', bg: '#eff6ff', border: '#3b82f6' },
  { value: 'Cheque', label: 'Cheque', icon: CreditCard, color: '#7c3aed', bg: '#f5f3ff', border: '#8b5cf6' },
];

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
  const filtered = value.trim() ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())) : suggestions;
  return (
    <div ref={ref}>
      <label style={S.label}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      <div style={{ position: 'relative' }}>
        <input type="text" value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || `Type ${label.toLowerCase()}…`}
          autoComplete="off" style={S.input(!!error)} />
        {open && filtered.length > 0 && (
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 99, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto' }}>
            {filtered.map(s => (
              <div key={s} onMouseDown={e => { e.preventDefault(); onSelect(s); setOpen(false); }}
                style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: '#111827', fontWeight: s.toLowerCase() === value.toLowerCase() ? 600 : 400 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}>
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

export const InventoryTypeSelectionView: React.FC<any> = ({ handleBack }) => {
  const navigate = useNavigate();

  // ── Mode ────────────────────────────────────────────────────────────────
  const [bulkMode, setBulkMode] = useState(false);

  // ── Ownership ───────────────────────────────────────────────────────────
  const [ownership, setOwnership] = useState<'Owned' | 'Credit'>('Owned');
  const isCredit = ownership === 'Credit';

  // ── Brand/Model suggestions ─────────────────────────────────────────────
  const [brandSuggestions, setBrandSuggestions] = useState<BrandSuggestion[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<ModelSuggestion[]>([]);

  useEffect(() => {
    BrandModelFirebaseService.fetchAllBrands().then(b => setBrandSuggestions(b)).catch(() => {});
  }, []);

  // ── Single form state ───────────────────────────────────────────────────
  const [brandName, setBrandName] = useState('');
  const [modelName, setModelName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('New');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [stockInDate, setStockInDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [serials, setSerials] = useState<string[]>([]);
  const [serialCities, setSerialCities] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imgDragging, setImgDragging] = useState(false);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [bankId, setBankId] = useState('');
  const [banksLoading, setBanksLoading] = useState(false);
  const [creditChannel, setCreditChannel] = useState('Cash');
  const [supplierPaid, setSupplierPaid] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [txnId, setTxnId] = useState('');
  const [txnLoading, setTxnLoading] = useState(false);
  const [serialCity, setSerialCity] = useState('');

  // ── Bulk form state ─────────────────────────────────────────────────────
  type BulkRow = { id: string; brandName: string; modelName: string; category: string; quantity: number; costPrice: number; location: string; serials: string[]; };
  const newBulkRow = (): BulkRow => ({ id: Math.random().toString(36).slice(2), brandName: '', modelName: '', category: '', quantity: 1, costPrice: 0, location: '', serials: [] });
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([newBulkRow(), newBulkRow()]);
  const [bulkSaving, setBulkSaving] = useState(false);

  const updateBulkRow = (id: string, field: keyof BulkRow, val: any) =>
    setBulkRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  const addBulkRow = () => setBulkRows(prev => [...prev, newBulkRow()]);
  const removeBulkRow = (id: string) => setBulkRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);

  // Load banks
  useEffect(() => {
    const needsBank = paymentMode === 'Bank Transfer' || paymentMode === 'Cheque';
    if (!needsBank || isCredit) return;
    setBanksLoading(true);
    getDocs(query(collection(db, 'banks'), orderBy('name')))
      .then(snap => setBanks(snap.docs.map(d => { const b = d.data() as any; return { id: d.id, name: b.name || '—', balance: Number(b.balance) || 0 }; })))
      .catch(() => {})
      .finally(() => setBanksLoading(false));
  }, [paymentMode, isCredit]);

  // Generate TXN ID
  useEffect(() => {
    setTxnLoading(true);
    generateInventoryTransactionId().then(setTxnId).catch(() => setTxnId('TXN-' + Date.now())).finally(() => setTxnLoading(false));
  }, []);

  // Load models when brand changes
  useEffect(() => {
    if (!brandName.trim()) { setModelSuggestions([]); return; }
    BrandModelFirebaseService.fetchModelsByBrandName(brandName.trim())
      .then(async models => {
        const enriched: ModelSuggestion[] = await Promise.all(models.map(async m => {
          try {
            const snap = await getDocs(query(collection(db, 'products'), where('brandName', '==', brandName.trim()), where('modelName', '==', m.modelName), orderBy('createdAt', 'desc'), limit(1)));
            const desc = snap.empty ? '' : (snap.docs[0].data() as any).description || '';
            return { id: m.id, name: m.modelName, costPrice: m.costPrice, description: desc };
          } catch { return { id: m.id, name: m.modelName, costPrice: m.costPrice, description: '' }; }
        }));
        setModelSuggestions(enriched);
      })
      .catch(() => setModelSuggestions([]));
  }, [brandName]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!brandName.trim()) e.brandName = 'Brand is required';
    if (!modelName.trim()) e.modelName = 'Model is required';
    if (!category.trim()) e.category = 'Category is required';
    if (!location.trim()) e.location = 'Location is required';
    if (!costPrice || costPrice <= 0) e.costPrice = 'Cost is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let brandId = brandSuggestions.find(b => b.name.toLowerCase() === brandName.toLowerCase())?.id || '';
      if (!brandId) {
        const created = await BrandModelFirebaseService.createBrand(brandName.trim());
        brandId = created.id;
        setBrandSuggestions(prev => [...prev, { id: created.id, name: created.name }]);
      }
      const existingModel = modelSuggestions.find(m => m.name.toLowerCase() === modelName.toLowerCase());
      if (!existingModel) {
        const cm = await BrandModelFirebaseService.createModel(brandId, modelName.trim(), costPrice);
        setModelSuggestions(prev => [...prev, { id: cm.id, name: cm.name }]);
      }
      const validSerials = serials.filter(s => s.trim() !== '');
      const stock = validSerials.length > 0 ? validSerials.length : quantity;
      const manualDateIso = stockInDate ? new Date(stockInDate).toISOString() : undefined;
      const seededCities: Record<string, string> = { ...serialCities };
      if (location) validSerials.forEach(s => { if (!seededCities[s]) seededCities[s] = location; });
      const dto: any = {
        brandName: brandName.trim(), modelName: modelName.trim(), category: category.trim(),
        description: description.trim(), costPrice, sellPrice: costPrice,
        buyType: 'Import', warrantyYears: 0, stock, location,
        serialNumbers: validSerials, serialCities: seededCities,
        status: status as any, isDamaged: false, costingOption: 'without', costing: undefined,
        ownershipType: ownership,
        supplierCost: isCredit ? costPrice * stock : undefined,
        supplierPaymentStatus: isCredit ? 'Unpaid' : undefined,
        supplierPaidAmount: isCredit && supplierPaid ? Number(supplierPaid) : undefined,
        supplierPaymentChannel: isCredit ? creditChannel : undefined,
        serialStockInDatesManual: manualDateIso ? Object.fromEntries(validSerials.map(s => [s, manualDateIso])) : undefined,
      };
      const effectivePaid = isCredit ? 0 : (Number(paidAmount) || 0);
      const totalAmount = costPrice * stock;
      const paymentInfo: any = {
        paymentStatus: (isCredit ? 'unpaid' : (effectivePaid >= totalAmount ? 'paid' : effectivePaid > 0 ? 'partial' : 'unpaid')) as any,
        transactionId: txnId, paidAmount: effectivePaid || undefined, totalAmount,
      };
      const created = await InventoryFirebaseService.createProduct(dto, paymentInfo);
      if (images.length > 0) {
        try {
          const urls = await uploadInventoryImages(images, (created as any).id);
          await InventoryFirebaseService.updateProduct((created as any).id, { imageUrls: urls } as any);
        } catch { }
      }
      toast.success(`✅ ${brandName} ${modelName} added to inventory`);
      navigate('/inventory');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save inventory');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSave = async () => {
    const valid = bulkRows.filter(r => r.brandName.trim() && r.modelName.trim() && r.costPrice > 0);
    if (valid.length === 0) { toast.error('Fill at least one complete row'); return; }
    setBulkSaving(true);
    let saved = 0;
    try {
      for (const row of valid) {
        let brandId = brandSuggestions.find(b => b.name.toLowerCase() === row.brandName.toLowerCase())?.id || '';
        if (!brandId) {
          const created = await BrandModelFirebaseService.createBrand(row.brandName.trim());
          brandId = created.id;
          setBrandSuggestions(prev => [...prev, { id: created.id, name: created.name }]);
        }
        await BrandModelFirebaseService.createModel(brandId, row.modelName.trim(), row.costPrice).catch(() => {});
        const validSerials = row.serials.filter(s => s.trim());
        const stock = validSerials.length || row.quantity;
        const dto: any = {
          brandName: row.brandName.trim(), modelName: row.modelName.trim(),
          category: row.category || 'Finished Goods', description: '',
          costPrice: row.costPrice, sellPrice: row.costPrice,
          buyType: 'Import', warrantyYears: 0, stock,
          location: row.location || location, serialNumbers: validSerials, serialCities: {},
          status: status as any, isDamaged: false, costingOption: 'without',
          ownershipType: ownership,
          supplierCost: isCredit ? row.costPrice * stock : undefined,
          supplierPaymentStatus: isCredit ? 'Unpaid' : undefined,
        };
        const payInfo: any = {
          paymentStatus: 'unpaid',
          transactionId: await generateInventoryTransactionId().catch(() => 'TXN-' + Date.now()),
          totalAmount: row.costPrice * stock,
        };
        await InventoryFirebaseService.createProduct(dto, payInfo);
        saved++;
      }
      toast.success(`✅ ${saved} product${saved > 1 ? 's' : ''} added`);
      navigate('/inventory');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save');
    } finally {
      setBulkSaving(false);
    }
  };

  const needsBank = !isCredit && (paymentMode === 'Bank Transfer' || paymentMode === 'Cheque');
  const totalCost = costPrice * (serials.filter(s => s.trim()).length || quantity);
  const paid = isCredit ? Number(supplierPaid || 0) : Number(paidAmount || 0);
  const remaining = Math.max(0, totalCost - paid);
  const fmtAED = (n: number) => `AED ${n.toLocaleString()}`;

  const OwnershipToggle = () => (
    <div style={S.card}>
      <div style={S.sectionTitle}>Ownership Type</div>
      <div style={S.grid2}>
        {[
          { value: 'Owned', label: 'Against Payment', sub: 'Paying supplier now', Icon: Wallet, color: '#15803d', bg: '#f0fdf4', border: '#22c55e' },
          { value: 'Credit', label: 'On Credit', sub: 'Pay supplier later', Icon: Users, color: '#b45309', bg: '#fffbeb', border: '#f59e0b' },
        ].map(opt => {
          const sel = ownership === opt.value;
          return (
            <button key={opt.value} type="button" onClick={() => setOwnership(opt.value as any)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${sel ? opt.border : '#e5e7eb'}`, backgroundColor: sel ? opt.bg : '#fff', transition: 'all 0.15s' }}>
              <div style={{ padding: 8, borderRadius: 8, backgroundColor: sel ? `${opt.border}25` : '#f1f5f9' }}>
                <opt.Icon size={20} color={sel ? opt.color : '#94a3b8'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: sel ? opt.color : '#374151' }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: sel ? opt.color : '#9ca3af', marginTop: 2 }}>{opt.sub}</div>
              </div>
              {sel && <span style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={13} color="#fff" strokeWidth={3} /></span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/inventory')} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <ArrowLeft size={17} />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={17} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Add New Inventory</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{txnLoading ? 'Generating ID…' : `TXN: ${txnId}`}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setBulkMode(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${!bulkMode ? '#0f172a' : '#e2e8f0'}`, backgroundColor: !bulkMode ? '#0f172a' : '#fff', color: !bulkMode ? '#fff' : '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={13} /> Single
          </button>
          <button type="button" onClick={() => setBulkMode(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${bulkMode ? '#0f172a' : '#e2e8f0'}`, backgroundColor: bulkMode ? '#0f172a' : '#fff', color: bulkMode ? '#fff' : '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Layers size={13} /> Bulk / Multiple
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {bulkMode ? (
          /* ─── BULK MODE ─── */
          <>
            <OwnershipToggle />

            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Products — {bulkRows.filter(r => r.brandName && r.modelName).length} of {bulkRows.length} ready</div>
                <button type="button" onClick={addBulkRow}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', backgroundColor: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <Plus size={13} /> Add Row
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1fr 70px 90px 170px 32px', gap: 8, padding: '8px 16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e2e8f0' }}>
                {['Brand', 'Model', 'Category', 'Qty', 'Cost (AED)', 'Serials (comma-sep)', ''].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</div>
                ))}
              </div>

              {bulkRows.map((row, i) => (
                <div key={row.id} style={{ borderBottom: i < bulkRows.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1fr 70px 90px 170px 32px', gap: 8, padding: '10px 16px', alignItems: 'center' }}>
                    <input type="text" value={row.brandName} onChange={e => updateBulkRow(row.id, 'brandName', e.target.value)} placeholder="Brand" style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 10px', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
                    <input type="text" value={row.modelName} onChange={e => updateBulkRow(row.id, 'modelName', e.target.value)} placeholder="Model" style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 10px', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
                    <select value={row.category} onChange={e => updateBulkRow(row.id, 'category', e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 8px', fontSize: 12, outline: 'none', width: '100%', backgroundColor: '#fff' }}>
                      <option value="">Select…</option>
                      {(CATEGORIES || ['Finished Goods', 'Accessories']).map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input type="number" min={1} value={row.quantity} onChange={e => updateBulkRow(row.id, 'quantity', parseInt(e.target.value) || 1)} style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 6px', fontSize: 12, outline: 'none', width: '100%', textAlign: 'center' as const }} />
                    <input type="number" min={0} step="any" value={row.costPrice || ''} onChange={e => updateBulkRow(row.id, 'costPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 6px', fontSize: 12, outline: 'none', width: '100%', textAlign: 'right' as const }} />
                    <input type="text" value={row.serials.join(', ')} onChange={e => updateBulkRow(row.id, 'serials', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="SN1, SN2…" style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 8px', fontSize: 11, outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
                    <button type="button" onClick={() => removeBulkRow(row.id)} disabled={bulkRows.length === 1} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #fecaca', backgroundColor: '#fef2f2', cursor: bulkRows.length === 1 ? 'not-allowed' : 'pointer', opacity: bulkRows.length === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>
                  {row.costPrice > 0 && (
                    <div style={{ padding: '0 16px 8px', fontSize: 11, color: '#64748b' }}>
                      Subtotal: <strong style={{ color: '#0f172a' }}>AED {(row.costPrice * (row.serials.filter(s => s).length || row.quantity)).toLocaleString()}</strong>
                    </div>
                  )}
                </div>
              ))}

              <div style={{ padding: '12px 16px', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Grand Total</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>AED {bulkRows.reduce((s, r) => s + r.costPrice * (r.serials.filter(x => x).length || r.quantity), 0).toLocaleString()}</span>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.sectionTitle}>Default Settings</div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Location</label>
                  <LocationSelector value={location} onChange={setLocation} label="" placeholder="Select location" />
                </div>
                <div>
                  <label style={S.label}>Condition</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...S.input(), appearance: 'none' }}>
                    {['New', 'Used', 'In Transit', 'Returned', 'Damaged'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ─── SINGLE MODE ─── */
          <>
            <OwnershipToggle />

            {/* Product Details */}
            <div style={S.card}>
              <div style={S.sectionTitle}>Product Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={S.grid2}>
                  <AutocompleteInput label="Brand" required value={brandName} onChange={setBrandName}
                    suggestions={brandSuggestions.map(b => b.name)}
                    onSelect={v => { setBrandName(v); setModelName(''); }}
                    placeholder="e.g. Garrett" error={errors.brandName} />
                  <AutocompleteInput label="Model" required value={modelName} onChange={setModelName}
                    suggestions={modelSuggestions.map(m => m.name)}
                    onSelect={v => {
                      setModelName(v);
                      const found = modelSuggestions.find(m => m.name === v);
                      if (found?.costPrice && found.costPrice > 0) setCostPrice(found.costPrice);
                      if (found?.description) setDescription(found.description);
                    }}
                    placeholder="e.g. Ace 400i" error={errors.modelName} />
                </div>

                {modelName && modelSuggestions.find(m => m.name === modelName) && (() => {
                  const m = modelSuggestions.find(x => x.name === modelName)!;
                  return (
                    <div style={{ display: 'flex', gap: 8, padding: '8px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12 }}>
                      <Check size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ color: '#15803d' }}>
                        <span style={{ fontWeight: 700 }}>{modelName}</span> found.
                        {m.costPrice ? <span> Cost: <strong>AED {m.costPrice.toLocaleString()}</strong>.</span> : null}
                        {m.description ? <span> Description auto-filled.</span> : null}
                      </div>
                    </div>
                  );
                })()}

                <div style={S.grid3}>
                  <div>
                    <label style={S.label}>Category <span style={{ color: '#ef4444' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...S.input(!!errors.category), appearance: 'none', paddingRight: 30, cursor: 'pointer' }}>
                        <option value="">Select…</option>
                        {(CATEGORIES || []).map((c: string) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }} />
                    </div>
                    {errors.category && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.category}</p>}
                  </div>
                  <div>
                    <label style={S.label}>Status</label>
                    <div style={{ position: 'relative' }}>
                      <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...S.input(), appearance: 'none', paddingRight: 30, cursor: 'pointer' }}>
                        {['New', 'Used', 'In Transit', 'On-Order', 'Available', 'Damaged', 'Returned'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }} />
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>Stock-In Date</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: 8, marginBottom: 6, border: '1px solid #e2e8f0' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Auto</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input type="date" value={stockInDate} onChange={e => setStockInDate(e.target.value)} style={{ ...S.input(), flex: 1, fontSize: 12 }} />
                      {stockInDate && <button type="button" onClick={() => setStockInDate('')} style={{ padding: '6px 8px', borderRadius: 7, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={12} /></button>}
                    </div>
                    {stockInDate && (
                      <div style={{ marginTop: 4, padding: '6px 10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 7, fontSize: 11 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#92400e' }}>
                          <span>Manual</span><span style={{ fontWeight: 700 }}>{new Date(stockInDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <LocationSelector value={location} onChange={setLocation} label="Location *" placeholder="Select location" />
                  {errors.location && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.location}</p>}
                </div>

                <div>
                  <label style={S.label}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ ...S.input(), resize: 'vertical', lineHeight: 1.5 }} />
                </div>
              </div>
            </div>

            {/* Cost */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                {isCredit ? <><Users size={15} color="#b45309" /> Supplier Cost</> : <><Wallet size={15} color="#15803d" /> Purchasing Cost</>}
              </div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>{isCredit ? 'Supplier Cost per Unit (AED)' : 'Purchasing Cost per Unit (AED)'} <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="number" min={0} step="any" value={costPrice || ''} onChange={e => setCostPrice(parseFloat(e.target.value) || 0)} placeholder="0.00" style={S.input(!!errors.costPrice)} />
                  {errors.costPrice && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.costPrice}</p>}
                </div>
                {costPrice > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', padding: '10px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Total ({serials.filter(s => s.trim()).length || quantity} unit{((serials.filter(s => s.trim()).length || quantity)) !== 1 ? 's' : ''})</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>AED {totalCost.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity + Serials */}
            <div style={S.card}>
              <div style={S.sectionTitle}>Quantity & Serial Numbers</div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Quantity <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: 160 }}>
                  <button type="button" onClick={() => { const n = Math.max(1, quantity - 1); setQuantity(n); setSerials(prev => prev.slice(0, n)); }} style={{ width: 36, height: 38, borderRadius: '8px 0 0 8px', border: '1px solid #d1d5db', borderRight: 'none', backgroundColor: '#f3f4f6', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <input type="number" min={1} value={quantity} onChange={e => { const n = Math.max(1, parseInt(e.target.value) || 1); setQuantity(n); if (n < serials.length) setSerials(prev => prev.slice(0, n)); }} style={{ width: 60, height: 38, border: '1px solid #d1d5db', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111827', outline: 'none', backgroundColor: '#fff' }} />
                  <button type="button" onClick={() => setQuantity(q => q + 1)} style={{ width: 36, height: 38, borderRadius: '0 8px 8px 0', border: '1px solid #d1d5db', borderLeft: 'none', backgroundColor: '#f3f4f6', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {Array.from({ length: quantity }).map((_, idx) => {
                  const filled = serials[idx] || '';
                  return (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ width: 28, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>#{idx + 1}</div>
                      <input type="text" value={filled}
                        onChange={e => { const val = e.target.value; setSerials(prev => { const next = [...prev]; next[idx] = val; return next; }); }}
                        placeholder={`Serial #${idx + 1} (optional)`} style={{ ...S.input(), flex: 2, fontSize: 12 }} />
                      <div style={{ flex: 1 }}>
                        <LocationSelector value={filled ? (serialCities[filled] || '') : ''} onChange={loc => { if (filled) setSerialCities(prev => ({ ...prev, [filled]: loc })); }} label="" placeholder="Location" />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8' }}>{serials.filter(s => s.trim()).length} of {quantity} serials filled</p>
            </div>

            {/* Images */}
            <div style={S.card}>
              <div style={S.sectionTitle}><ImagePlus size={15} /> Product Images <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>(optional)</span></div>
              <div onDragOver={e => { e.preventDefault(); setImgDragging(true); }} onDragLeave={() => setImgDragging(false)}
                onDrop={e => { e.preventDefault(); setImgDragging(false); const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')); if (files.length) setImages(prev => [...prev, ...files]); }}
                onClick={() => imageInputRef.current?.click()}
                style={{ border: `2px dashed ${imgDragging ? '#6366f1' : '#d1d5db'}`, borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer', backgroundColor: imgDragging ? '#f0f4ff' : '#f9fafb', marginBottom: images.length ? 14 : 0 }}>
                <ImagePlus size={22} color={imgDragging ? '#6366f1' : '#94a3b8'} style={{ margin: '0 auto 6px' }} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#6b7280' }}>{imgDragging ? 'Drop images here' : 'Click or drag & drop images'}</p>
                <input ref={imageInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => { const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/')); if (files.length) setImages(prev => [...prev, ...files]); e.target.value = ''; }} />
              </div>
              {images.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {images.map((file, i) => {
                    const url = URL.createObjectURL(file);
                    return (
                      <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <img src={url} alt={file.name} onLoad={() => URL.revokeObjectURL(url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={e => { e.stopPropagation(); setImages(prev => prev.filter((_, j) => j !== i)); }} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <X size={10} color="#fff" strokeWidth={3} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment */}
            {isCredit ? (
              <div style={S.card}>
                <div style={S.sectionTitle}><Users size={15} color="#b45309" /> Supplier Credit Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 12, color: '#b45309', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
                    No payment made now — will appear in <strong>Inventory Payables</strong>.
                  </p>
                  <div>
                    <label style={S.label}>Amount Paid So Far (AED)</label>
                    <input type="number" min={0} step="any" value={supplierPaid} onChange={e => setSupplierPaid(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} placeholder="0 if nothing paid yet" style={S.input()} />
                  </div>
                  <div>
                    <label style={S.label}>Payment Channel</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {PAYMENT_MODES.map(m => {
                        const Icon = m.icon; const sel = creditChannel === m.value;
                        return (
                          <button key={m.value} type="button" onClick={() => setCreditChannel(m.value)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, cursor: 'pointer', border: `2px solid ${sel ? m.border : '#e5e7eb'}`, backgroundColor: sel ? m.bg : '#fff', transition: 'all 0.15s' }}>
                            <Icon size={16} color={sel ? m.color : '#9ca3af'} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: sel ? m.color : '#374151' }}>{m.label}</span>
                            {sel && <Check size={12} color={m.color} style={{ marginLeft: 'auto' }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {costPrice > 0 && (
                    <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 10 }}>Credit Summary</div>
                      {[['Supplier cost / unit', fmtAED(costPrice)], ['Units', String(serials.filter(s=>s.trim()).length || quantity)], ['Total owed', fmtAED(totalCost)], ...(paid > 0 ? [['Paid so far', fmtAED(paid)], ['Still owed', fmtAED(remaining)]] : [])].map(([k, v], i) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingTop: i === 2 ? 8 : 4, marginTop: i === 2 ? 4 : 0, borderTop: i === 2 ? '1px solid #fde68a' : 'none', fontWeight: i === 2 ? 800 : 500, color: i === 4 ? '#b91c1c' : i === 3 ? '#15803d' : '#92400e' }}>
                          <span>{k}</span><span>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={S.card}>
                <div style={S.sectionTitle}><Wallet size={15} color="#15803d" /> Payment Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={S.label}>Payment Method</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {PAYMENT_MODES.map(m => {
                        const Icon = m.icon; const sel = paymentMode === m.value;
                        return (
                          <button key={m.value} type="button" onClick={() => setPaymentMode(m.value)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, cursor: 'pointer', border: `2px solid ${sel ? m.border : '#e5e7eb'}`, backgroundColor: sel ? m.bg : '#fff', transition: 'all 0.15s' }}>
                            <Icon size={16} color={sel ? m.color : '#9ca3af'} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: sel ? m.color : '#374151' }}>{m.label}</span>
                            {sel && <Check size={12} color={m.color} style={{ marginLeft: 'auto' }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {needsBank && (
                    <div>
                      <label style={S.label}>{paymentMode === 'Cheque' ? 'Issuing Bank' : 'Bank Account'}</label>
                      {banksLoading ? <div style={{ padding: '10px', color: '#64748b', fontSize: 13 }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</div>
                        : banks.length === 0 ? <div style={{ padding: '10px 14px', border: '1px solid #fde68a', borderRadius: 8, backgroundColor: '#fffbeb', fontSize: 13, color: '#92400e' }}>⚠ No banks found. Add one in Banking first.</div>
                        : <select value={bankId} onChange={e => setBankId(e.target.value)} style={{ ...S.input(), appearance: 'none' }}>
                            <option value="">— Select bank —</option>
                            {banks.map(b => <option key={b.id} value={b.id}>{b.name} — AED {b.balance.toLocaleString()}</option>)}
                          </select>}
                    </div>
                  )}
                  <div>
                    <label style={S.label}>Amount Paid (AED)</label>
                    <input type="number" min={0} step="any" value={paidAmount} onChange={e => setPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} placeholder="Leave blank if unpaid" style={S.input()} />
                  </div>
                  {costPrice > 0 && (
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 10 }}>Payment Summary</div>
                      {[['Cost / unit', fmtAED(costPrice)], ['Units', String(serials.filter(s=>s.trim()).length || quantity)], ['Total', fmtAED(totalCost)], ...(paid > 0 ? [['Paid', fmtAED(paid)], ['Remaining', fmtAED(remaining)]] : [])].map(([k, v], i) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingTop: i === 2 ? 8 : 4, marginTop: i === 2 ? 4 : 0, borderTop: i === 2 ? '1px solid #bbf7d0' : 'none', fontWeight: i === 2 ? 800 : 500, color: i === 4 ? '#b91c1c' : i === 3 ? '#15803d' : '#166534' }}>
                          <span>{k}</span><span>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" onClick={() => navigate('/inventory')} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={15} /> Cancel
        </button>
        {bulkMode ? (
          <button type="button" onClick={handleBulkSave} disabled={bulkSaving}
            style={{ padding: '11px 28px', borderRadius: 8, border: 'none', backgroundColor: bulkSaving ? '#94a3b8' : '#0f172a', color: '#fff', fontWeight: 700, fontSize: 14, cursor: bulkSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            {bulkSaving
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : <><Layers size={16} /> Save All ({bulkRows.filter(r => r.brandName && r.modelName && r.costPrice > 0).length} products)</>}
          </button>
        ) : (
          <button type="button" onClick={handleSave} disabled={saving}
            style={{ padding: '11px 28px', borderRadius: 8, border: 'none', backgroundColor: saving ? '#4ade80' : '#15803d', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(21,128,61,0.35)' }}>
            {saving
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : <><Check size={16} /> Save Inventory</>}
          </button>
        )}
      </div>
    </div>
  );
};