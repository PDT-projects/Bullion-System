import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2, Edit2, HardDrive, Plus, X, Check, User, Phone, Calendar, DollarSign, Package } from 'lucide-react';
import type { Asset } from '../models/types';
import { AssetsServiceClass as AssetsService } from '../models/assetsService';

// ── Currency helpers ──────────────────────────────────────────────────────────
type DisplayCurrency = 'PKR' | 'AED';
const AED_TO_PKR = 76.03;

function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency', currency: 'PKR', minimumFractionDigits: 0,
  }).format(amount);
}

function formatAED(amount: number): string {
  const aed = amount / AED_TO_PKR;
  return `د.إ ${new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(aed)} AED`;
}

function formatPrice(pkrAmount: number, currency: DisplayCurrency): string {
  return currency === 'AED' ? formatAED(pkrAmount) : formatPKR(pkrAmount);
}
// ─────────────────────────────────────────────────────────────────────────────

interface FormData {
  assetName: string;
  price: string;
  purchaseDate: string;
  employee: { name: string; contact: string };
}

const CHARCOAL = '#374151';

const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none bg-white transition-all placeholder:text-gray-400';
const lbl = 'block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide';

export function AssetsManagement() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    assetName: '', price: '', purchaseDate: '',
    employee: { name: '', contact: '' }
  });
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [assets, setAssets]                   = useState<Asset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [editingAsset, setEditingAsset]       = useState<Asset | null>(null);
  const [expandedId, setExpandedId]           = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('PKR');

  useEffect(() => { loadAssets(); }, []);

  const loadAssets = useCallback(async () => {
    try {
      setIsLoadingAssets(true);
      setAssets(await AssetsService.fetchAllAssets());
    } catch { toast.error('Failed to load assets'); }
    finally { setIsLoadingAssets(false); }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(formData.price);
    if (!formData.assetName.trim() || !formData.purchaseDate || priceNum <= 0 ||
        !formData.employee.name.trim() || !formData.employee.contact.trim()) {
      toast.error('Please fill all fields correctly'); return;
    }
    setIsSubmitting(true);
    try {
      await AssetsService.createAsset({
        assetName: formData.assetName.trim(), price: priceNum,
        purchaseDate: formData.purchaseDate,
        employee: { name: formData.employee.name.trim(), contact: formData.employee.contact.trim() },
        updatedAt: new Date(),
      });
      setFormData({ assetName: '', price: '', purchaseDate: '', employee: { name: '', contact: '' } });
      loadAssets();
    } catch (err: any) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  const handleEdit = (asset: Asset) => { setEditingAsset({ ...asset }); setExpandedId(asset.id); };

  const handleSaveEdit = async () => {
    if (!editingAsset) return;
    if (Number(editingAsset.price) <= 0) { toast.error('Price must be greater than 0'); return; }
    try {
      await AssetsService.updateAsset(editingAsset.id, {
        assetName: editingAsset.assetName.trim(), price: Number(editingAsset.price),
        purchaseDate: editingAsset.purchaseDate, employee: editingAsset.employee,
      });
      setEditingAsset(null); loadAssets();
    } catch (err: any) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try { await AssetsService.deleteAsset(id); loadAssets(); }
    catch (err: any) { console.error(err); }
    setDeleteConfirmId(null);
  };

  const totalValue = assets.reduce((s, a) => s + a.price, 0);

  if (isLoadingAssets) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-3"
            style={{ borderColor: CHARCOAL }}
          />
          <p className="text-sm text-gray-500">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: CHARCOAL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <HardDrive size={20} color="#ffffff" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Assets Management</h1>
              <p className="text-xs text-gray-500 mt-0.5">Track office equipment assigned to employees</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
              {(['PKR', 'AED'] as DisplayCurrency[]).map(cur => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setDisplayCurrency(cur)}
                  style={displayCurrency === cur ? { backgroundColor: CHARCOAL, color: '#ffffff' } : {}}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    displayCurrency === cur ? 'shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {cur === 'PKR' ? '₨ PKR' : 'د.إ AED'}
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* ── Add Asset Form ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Form header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Plus size={16} className="text-gray-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Add New Asset</h2>
              <p className="text-xs text-gray-500">Record new office equipment assigned to employees</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">

              {/* Asset Name */}
              <div>
                <label className={lbl}>
                  <span className="flex items-center gap-1"><Package size={10} /> Asset Name</span>
                </label>
                <input type="text" className={inp} placeholder="Dell XPS Laptop, iPhone 15…"
                  value={formData.assetName}
                  onChange={e => setFormData({ ...formData, assetName: e.target.value })} />
              </div>

              {/* Price */}
              <div>
                <label className={lbl}>
                  <span className="flex items-center gap-1">
                    <DollarSign size={10} /> Price
                  </span>
                </label>
                <input type="number" className={inp} placeholder="150000" min="0"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })} />
                {formData.price && Number(formData.price) > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    ≈ {formatAED(Number(formData.price))} · 1 AED = {AED_TO_PKR} PKR
                  </p>
                )}
              </div>

              {/* Purchase Date */}
              <div>
                <label className={lbl}>
                  <span className="flex items-center gap-1"><Calendar size={10} /> Purchase Date</span>
                </label>
                <input type="date" className={inp}
                  value={formData.purchaseDate}
                  onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
              </div>

              {/* Employee Name */}
              <div>
                <label className={lbl}>
                  <span className="flex items-center gap-1"><User size={10} /> Employee Name</span>
                </label>
                <input type="text" className={inp} placeholder="John Doe"
                  value={formData.employee.name}
                  onChange={e => setFormData({ ...formData, employee: { ...formData.employee, name: e.target.value } })} />
              </div>

              {/* Employee Contact */}
              <div className="lg:col-span-2">
                <label className={lbl}>
                  <span className="flex items-center gap-1"><Phone size={10} /> Employee Contact</span>
                </label>
                <input type="tel" className={inp} placeholder="+92 300 1234567"
                  value={formData.employee.contact}
                  onChange={e => setFormData({ ...formData, employee: { ...formData.employee, contact: e.target.value } })} />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 8, border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  backgroundColor: isSubmitting ? '#9ca3af' : CHARCOAL,
                  color: '#ffffff', fontSize: 14, fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(55,65,81,0.35)',
                  transition: 'background-color 0.2s',
                }}
              >
                {isSubmitting
                  ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Adding…</>
                  : <><Plus size={15} color="#fff" /> Add Asset</>
                }
              </button>
            </div>
          </form>
        </div>

        {/* ── Assets List ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* List header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <HardDrive size={15} className="text-gray-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  All Assets
                  <span
                    className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full"
                    style={{ backgroundColor: '#f3f4f6', color: CHARCOAL }}
                  >
                    {assets.length}
                  </span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">All recorded equipment</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {assets.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <HardDrive size={28} className="text-gray-300" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">No Assets Yet</h3>
                <p className="text-xs text-gray-400">Add your first asset using the form above</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group relative border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white"
                    style={{ borderColor: undefined }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#d1d5db')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
                  >
                    {/* Card top */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: '#f3f4f6' }}
                        >
                          <HardDrive size={16} style={{ color: CHARCOAL }} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{asset.assetName}</h3>
                          <span className="text-xs font-semibold" style={{ color: CHARCOAL }}>
                            {formatPrice(asset.price, displayCurrency)}
                          </span>
                          {/* Secondary currency hint */}
                          <p className="text-xs text-gray-400 mt-0.5">
                            ≈ {displayCurrency === 'PKR' ? formatAED(asset.price) : formatPKR(asset.price)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                        <button onClick={() => handleEdit(asset)}
                          className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                          style={{ backgroundColor: '#f3f4f6', color: CHARCOAL }}
                          title="Edit">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => setDeleteConfirmId(asset.id)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors" title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Employee info */}
                    <div className="flex flex-col gap-1.5 mb-3">
                      <div className="flex items-center gap-2">
                        <User size={11} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-700 font-medium">{asset.employee.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={11} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500">{asset.employee.contact}</span>
                      </div>
                    </div>

                    {/* Purchase date */}
                    <div className="flex items-center gap-1.5 pt-2.5 border-t border-gray-100">
                      <Calendar size={11} className="text-gray-300" />
                      <span className="text-xs text-gray-400">
                        {new Date(asset.purchaseDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Inline edit form */}
                    {expandedId === asset.id && editingAsset?.id === asset.id && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        {[
                          { value: editingAsset.assetName, placeholder: 'Asset name', type: 'text',
                            onChange: (v: string) => setEditingAsset({ ...editingAsset, assetName: v }) },
                          { value: String(editingAsset.price), placeholder: 'Price (PKR)', type: 'number',
                            onChange: (v: string) => setEditingAsset({ ...editingAsset, price: Number(v) }) },
                          { value: editingAsset.purchaseDate, placeholder: '', type: 'date',
                            onChange: (v: string) => setEditingAsset({ ...editingAsset, purchaseDate: v }) },
                          { value: editingAsset.employee.name, placeholder: 'Employee name', type: 'text',
                            onChange: (v: string) => setEditingAsset({ ...editingAsset, employee: { ...editingAsset.employee, name: v } }) },
                          { value: editingAsset.employee.contact, placeholder: 'Contact', type: 'tel',
                            onChange: (v: string) => setEditingAsset({ ...editingAsset, employee: { ...editingAsset.employee, contact: v } }) },
                        ].map(({ value, placeholder, type, onChange }, i) => (
                          <input key={i} type={type}
                            value={value as string} placeholder={placeholder}
                            onChange={e => onChange(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 outline-none" />
                        ))}
                        <div className="flex gap-2 pt-1">
                          <button onClick={handleSaveEdit}
                            style={{ backgroundColor: CHARCOAL }}
                            className="flex-1 flex items-center justify-center gap-1 text-white py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity">
                            <Check size={12} /> Save
                          </button>
                          <button onClick={() => { setEditingAsset(null); setExpandedId(null); }}
                            className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                            <X size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delete confirm */}
                    {deleteConfirmId === asset.id && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-xs text-red-700 font-semibold mb-2.5">Delete "{asset.assetName}"?</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleDelete(asset.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg text-xs font-semibold transition-colors">
                            Delete
                          </button>
                          <button onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {assets.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{assets.length}</span> asset{assets.length !== 1 ? 's' : ''}
              </span>
              <div className="text-right">
                <span className="text-xs text-gray-400">
                  Total value:{' '}
                  <span className="font-semibold" style={{ color: CHARCOAL }}>
                    {formatPrice(totalValue, displayCurrency)}
                  </span>
                </span>
                <p className="text-xs text-gray-400 mt-0.5">
                  ≈ {displayCurrency === 'PKR' ? formatAED(totalValue) : formatPKR(totalValue)}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}