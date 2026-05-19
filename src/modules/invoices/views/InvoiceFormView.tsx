import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Trash2, X, Hash, Truck, User, CreditCard,
  Loader2, FileDown, Stamp, Package, Globe, ChevronDown,
} from 'lucide-react';
import { Invoice, InvoiceProduct, ProductInfo } from '../models/types';
import { makeBranchValue, branchFromValue } from '../viewModels/useInvoiceFormViewModel';
import { TxCompany } from '../../transactions/models/TransactionBridgeService';
import { InvoiceCurrency, INVOICE_CURRENCIES, convertCurrency } from '../models/invoiceService';

interface Employee { id: string; name: string; position: string; status: 'active' | 'inactive'; }
interface Bank    { id: string; name: string; accountNumber: string; }

interface Props {
  formData: Partial<Invoice>;
  selectedProducts: InvoiceProduct[];
  customerSuggestions: Invoice[];
  showSuggestions: boolean;
  isEditing: boolean;
  isLoading: boolean;
  isSaving: boolean;
  pdfGenerating: boolean;
  isDownloadingPdf: boolean;
  savedCountries: string[];
  savedCitiesForCountry: (country: string) => string[];
  handleAddCountryCity: (country: string, city: string) => Promise<void>;
  salespersonLocations: string[];
  deliveryStatuses: string[];
  collectionMethods: string[];
  availableProducts: ProductInfo[];
  activeEmployees: Employee[];
  banks: Bank[];
  setFormData: (data: Partial<Invoice>) => void;
  handleCustomerSearch: (value: string, field: 'customerName' | 'customerPhone') => void;
  handleCustomerSelect: (customer: Invoice) => void;
  addProduct: () => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, field: string, value: any) => void;
  updateSerial: (productId: string, index: number, value: string) => void;
  getAvailableSerialsForProduct: (productId: string, rowId: string) => string[];
  handleSave: () => void;
  handleCancel: () => void;
  handleDownloadPdf: () => void;
  calculateTotal: () => number;
  formatCurrency: (amount: number) => string;
  invoiceCompany: TxCompany;
  setInvoiceCompany: (v: TxCompany) => void;
  branches: string[];
  handleAddBranch: (name: string) => Promise<void>;
  salespersonLocationsList?: string[];
  handleAddSalespersonLocation?: (name: string) => Promise<void>;
  handleAddDeliveryStatus?: (name: string) => Promise<void>;
  handleAddCollectionMethod?: (name: string) => Promise<void>;
  selectedCurrencies?: InvoiceCurrency[];
  toggleCurrency?: (c: InvoiceCurrency) => void;
  currencyRates: Record<InvoiceCurrency, number>;
}

// ── Design tokens ────────────────────────────────────────────────────────────
const GOLD   = '#D4A017';
const GOLD_L = '#F5E6A3';
const BLACK  = '#111111';
const YELLOW = '#FFC107';

const inp = `w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm h-8 bg-white`;
const lbl = 'block text-xs font-medium text-gray-700 mb-0.5';

// ── Branch / Company selector ────────────────────────────────────────────────
function BranchSelector({
  branches, invoiceCompany, setInvoiceCompany, handleAddBranch,
}: {
  branches: string[];
  invoiceCompany: TxCompany;
  setInvoiceCompany: (v: TxCompany) => void;
  handleAddBranch: (name: string) => Promise<void>;
}) {
  const [addingBranch, setAddingBranch] = React.useState(false);
  const [newBranch,    setNewBranch]    = React.useState('');
  const [saving,       setSaving]       = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (addingBranch) inputRef.current?.focus(); }, [addingBranch]);

  const save = async () => {
    if (!newBranch.trim()) return;
    setSaving(true);
    await handleAddBranch(newBranch.trim());
    setNewBranch(''); setAddingBranch(false); setSaving(false);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Branch / Company</label>
      <div className="flex flex-wrap gap-1.5">
        {branches.map(branch => {
          const val = makeBranchValue(branch);
          const sel = invoiceCompany === val;
          return (
            <button key={branch} type="button" onClick={() => setInvoiceCompany(val)}
              style={sel ? { backgroundColor: BLACK, color: GOLD, borderColor: GOLD } : {}}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1 ${
                sel
                  ? 'shadow-sm ring-2 ring-yellow-400'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-yellow-400 hover:bg-yellow-50'
              }`}>
              {sel && <span className="text-xs" style={{ color: GOLD }}>✓</span>}
              {branch}
            </button>
          );
        })}
        {addingBranch ? (
          <div className="flex items-center gap-1.5">
            <input ref={inputRef} type="text" value={newBranch}
              onChange={e => setNewBranch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setAddingBranch(false); }}
              className="px-2 py-1 border-2 border-yellow-500 rounded-lg text-xs outline-none w-28"
              placeholder="Branch name…" />
            <button type="button" onClick={save} disabled={saving || !newBranch.trim()}
              style={{ backgroundColor: BLACK, color: GOLD }} className="px-2 py-1 rounded text-xs font-semibold disabled:opacity-50">
              {saving ? '…' : 'Save'}
            </button>
            <button type="button" onClick={() => setAddingBranch(false)}
              className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600">✕</button>
          </div>
        ) : (
          <button type="button" onClick={() => setAddingBranch(true)}
            className="px-3 py-1.5 rounded-lg border border-dashed border-yellow-400 text-xs font-semibold text-yellow-700 hover:bg-yellow-50 transition-all">
            ➕ Add New
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">
        PDF header: <span className="text-gray-600 font-medium">Pakistan Detector Technologies Pvt. Ltd — {branchFromValue(invoiceCompany)}</span>
      </p>
    </div>
  );
}

// ── Country / City selector ───────────────────────────────────────────────────
function CountryCitySelector({
  country, city, savedCountries, savedCitiesForCountry, setFormData, handleAddCountryCity,
}: {
  country: string;
  city: string;
  savedCountries: string[];
  savedCitiesForCountry: (c: string) => string[];
  setFormData: (d: Partial<Invoice>) => void;
  handleAddCountryCity: (country: string, city: string) => Promise<void>;
}) {
  const [addingCountry, setAddingCountry] = useState(false);
  const [newCountry,    setNewCountry]    = useState('');
  const [newCity,       setNewCity]       = useState('');
  const [savingCountry, setSavingCountry] = useState(false);

  React.useEffect(() => { setNewCity(city); }, [city]);

  const citiesForCountry = savedCitiesForCountry(country).filter(c => c !== '');

  const saveCountry = async () => {
    const c = newCountry.trim();
    if (!c) return;
    setSavingCountry(true);
    try {
      await handleAddCountryCity(c, '__COUNTRY_ONLY__');
    } catch { /* non-blocking */ }
    setFormData({ customerProvince: c, customerCity: '' });
    setNewCountry(''); setAddingCountry(false); setSavingCountry(false);
  };

  return (
    <>
      <div>
        <label className={lbl}>Country</label>
        {addingCountry ? (
          <div className="flex gap-1">
            <input type="text" value={newCountry} onChange={e => setNewCountry(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveCountry(); if (e.key === 'Escape') { setAddingCountry(false); setNewCountry(''); } }}
              placeholder="e.g. UAE" autoFocus className={`${inp} flex-1`} />
            <button onClick={saveCountry} disabled={savingCountry} style={{ backgroundColor: BLACK, color: GOLD }} className="px-2 py-1 rounded-md text-xs disabled:opacity-50">{savingCountry ? '…' : 'Save'}</button>
            <button onClick={() => { setAddingCountry(false); setNewCountry(''); }}
              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"><X size={12} /></button>
          </div>
        ) : (
          <div className="flex gap-1">
            <select value={country}
              onChange={e => setFormData({ customerProvince: e.target.value, customerCity: '' })}
              className={`${inp} flex-1`}>
              <option value="">Select country</option>
              {savedCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => setAddingCountry(true)} title="Add new country"
              className="flex items-center gap-0.5 px-2 py-1 border border-dashed border-yellow-400 text-yellow-700 rounded-md text-xs hover:bg-yellow-50 whitespace-nowrap">
              <Plus size={11} /> Add
            </button>
          </div>
        )}
      </div>

      <div>
        <label className={lbl}>City</label>
        <div className="flex gap-1">
          <input list={country ? `cities-${country}` : undefined} value={newCity}
            onChange={e => { setNewCity(e.target.value); setFormData({ customerCity: e.target.value }); }}
            onKeyDown={e => { if (e.key === 'Escape') { setNewCity(''); setFormData({ customerCity: '' }); } }}
            placeholder="e.g. Dubai" className={`${inp} flex-1`} disabled={!country} />
          <datalist id={country ? `cities-${country}` : undefined}>
            {citiesForCountry.map(c => <option key={c} value={c}>{c}</option>)}
          </datalist>
        </div>
      </div>
    </>
  );
}

// ── Customer history dropdown ─────────────────────────────────────────────────
function CustomerHistoryDropdown({
  suggestions, onSelect, visible, onClose,
}: {
  suggestions: Invoice[];
  onSelect: (inv: Invoice) => void;
  visible: boolean;
  onClose: () => void;
}) {
  if (!visible || suggestions.length === 0) return null;
  return (
    <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-yellow-300 rounded-xl shadow-xl max-h-52 overflow-y-auto">
      <div className="px-3 py-1.5 border-b border-yellow-100 bg-yellow-50 flex items-center justify-between">
        <span className="text-xs font-semibold text-yellow-800">Previous Customers</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
      </div>
      {suggestions.map(s => (
        <div key={s.id} onClick={() => { onSelect(s); onClose(); }}
          className="px-3 py-2 cursor-pointer hover:bg-yellow-50 transition-colors border-b border-gray-50 last:border-0">
          <div className="text-xs font-semibold text-gray-900">{s.customerName}</div>
          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
            <span>{s.customerPhone}</span>
            {s.customerCity && <span>· {s.customerCity}</span>}
            {s.customerCNIC && <span>· CNIC: {s.customerCNIC}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function InvoiceFormView({
  formData, selectedProducts, customerSuggestions, showSuggestions,
  isEditing, isLoading, isSaving, pdfGenerating, isDownloadingPdf,
  savedCountries, savedCitiesForCountry, handleAddCountryCity,
  salespersonLocations, deliveryStatuses, collectionMethods,
  availableProducts, activeEmployees, banks,
  setFormData, handleCustomerSearch, handleCustomerSelect,
  addProduct, removeProduct, updateProduct, updateSerial,
  getAvailableSerialsForProduct,
  handleSave, handleCancel, handleDownloadPdf,
  calculateTotal, formatCurrency,
  invoiceCompany, setInvoiceCompany,
  branches, handleAddBranch,
  salespersonLocationsList = salespersonLocations ?? [],
  handleAddSalespersonLocation = async () => {},
  handleAddDeliveryStatus = async () => {},
  handleAddCollectionMethod = async () => {},
  selectedCurrencies = ['PKR'],
  toggleCurrency = () => {},
  currencyRates,
}: Props) {
  const total = calculateTotal();

  const [addingSpLoc, setAddingSpLoc] = useState(false);
  const [newSpLoc,    setNewSpLoc]    = useState('');
  const [addingDelivery, setAddingDelivery] = useState(false);
  const [newDelivery,    setNewDelivery]    = useState('');
  const [addingCollection, setAddingCollection] = useState(false);
  const [newCollection,    setNewCollection]    = useState('');
  const [showNameSuggestions, setShowNameSuggestions]  = useState(false);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const nameRef  = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (nameRef.current  && !nameRef.current.contains(e.target as Node))  setShowNameSuggestions(false);
      if (phoneRef.current && !phoneRef.current.contains(e.target as Node)) setShowPhoneSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onSelectCustomer = (inv: Invoice) => {
    handleCustomerSelect(inv);
    setShowNameSuggestions(false);
    setShowPhoneSuggestions(false);
  };

  if (isLoading) {
    return (
      // Slide-in panel placeholder while loading
      <div className="h-full flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  return (
    // ── Slide-in panel (not full-screen; parent controls positioning) ──────
    // The parent should render this inside a right-side drawer panel.
    // We occupy full height of that container and scroll internally.
    <div className="flex flex-col h-full bg-white overflow-hidden">

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b"
        style={{ background: BLACK, borderColor: GOLD + '44' }}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: GOLD }} />
          <h3 className="text-sm font-bold" style={{ color: GOLD }}>
            {isEditing ? 'Edit Invoice' : 'New Invoice'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {pdfGenerating && (
            <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
              style={{ background: GOLD + '22', color: GOLD }}>
              <Loader2 size={11} className="animate-spin" /> Saving PDF…
            </div>
          )}
          <button onClick={handleDownloadPdf} disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50"
            style={{ borderColor: GOLD + '66', color: GOLD, background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = GOLD + '22')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {isDownloadingPdf
              ? <><Loader2 size={11} className="animate-spin" /> Generating…</>
              : <><FileDown size={12} /> PDF</>}
          </button>
          <button onClick={handleCancel}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: '#aaa' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* ── Customer Information ── */}
        <section className="border border-yellow-200 rounded-xl overflow-hidden">
          <div className="px-3 py-1.5 flex items-center gap-2"
            style={{ background: `linear-gradient(90deg, ${BLACK} 0%, #2a2a2a 100%)` }}>
            <User size={12} style={{ color: GOLD }} />
            <h4 className="text-xs font-bold" style={{ color: GOLD }}>Customer Information</h4>
          </div>
          <div className="p-3 space-y-2">

            {/* Row 1: Invoice # | Date | Customer Name | Identity Number */}
            <div className="grid grid-cols-4 gap-2">
              {/* Invoice Number */}
              <div>
                <label className={lbl}>Invoice Number</label>
                {(() => {
                  const full    = formData.invoiceNumber || '';
                  const dashIdx = full.lastIndexOf('-');
                  const prefix  = dashIdx >= 0 ? full.slice(0, dashIdx + 1) : '';
                  const suffix  = dashIdx >= 0 ? full.slice(dashIdx + 1) : full;
                  const fixedPart    = suffix.length > 3 ? suffix.slice(0, suffix.length - 3) : '';
                  const editablePart = suffix.slice(-3);
                  return (
                    <div className="flex items-center h-8 border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-yellow-500 bg-white">
                      <span className="px-2 text-xs text-gray-500 bg-gray-50 whitespace-nowrap border-r border-gray-200 select-none h-full flex items-center">
                        {prefix}{fixedPart}
                      </span>
                      <input type="text" value={editablePart} maxLength={3}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setFormData({ invoiceNumber: `${prefix}${fixedPart}${val}` });
                        }}
                        className="flex-1 px-1 text-sm font-semibold text-gray-900 bg-white focus:outline-none text-center min-w-0" />
                    </div>
                  );
                })()}
              </div>

              {/* Date */}
              <div>
                <label className={lbl}>Date</label>
                {isEditing ? (
                  <input type="date" value={formData.date || ''}
                    onChange={e => setFormData({ date: e.target.value })} className={inp} />
                ) : (
                  <div className={`${inp} flex items-center gap-1.5 bg-gray-50 text-gray-600 cursor-not-allowed select-none`}>
                    <span className="text-xs">🔒</span>
                    <span className="text-xs">{formData.date || new Date().toISOString().split('T')[0]}</span>
                  </div>
                )}
              </div>

              {/* Customer Name — with history dropdown */}
              <div className="relative" ref={nameRef}>
                <label className={lbl}>Customer Name *</label>
                <div className="relative">
                  <input type="text" value={formData.customerName || ''}
                    onChange={e => {
                      handleCustomerSearch(e.target.value, 'customerName');
                      setShowNameSuggestions(true);
                    }}
                    onFocus={() => setShowNameSuggestions(true)}
                    placeholder="Enter customer name" className={inp} />
                  {customerSuggestions.length > 0 && (
                    <button type="button"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-yellow-500"
                      onClick={() => setShowNameSuggestions(v => !v)}>
                      <ChevronDown size={14} />
                    </button>
                  )}
                </div>
                <CustomerHistoryDropdown
                  suggestions={customerSuggestions}
                  onSelect={onSelectCustomer}
                  visible={showNameSuggestions && showSuggestions}
                  onClose={() => setShowNameSuggestions(false)}
                />
              </div>

              {/* Identity Number (optional) — replaces CNIC conceptually but shown always */}
              <div>
                <label className={lbl}>
                  Identity Number
                  <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
                </label>
                <input type="text" value={formData.customerCNIC || ''}
                  onChange={e => setFormData({ customerCNIC: e.target.value })}
                  placeholder="e.g. 42101-1234567-1" className={inp} />
              </div>
            </div>

            {/* Row 2: Phone | Second Phone | Country | City */}
            <div className="grid grid-cols-4 gap-2">
              <div className="relative" ref={phoneRef}>
                <label className={lbl}>Phone Number *</label>
                <input type="tel" value={formData.customerPhone || ''}
                  onChange={e => {
                    handleCustomerSearch(e.target.value, 'customerPhone');
                    setShowPhoneSuggestions(true);
                  }}
                  onFocus={() => setShowPhoneSuggestions(true)}
                  placeholder="+92 300 1234567" className={inp} />
                <CustomerHistoryDropdown
                  suggestions={customerSuggestions}
                  onSelect={onSelectCustomer}
                  visible={showPhoneSuggestions && showSuggestions}
                  onClose={() => setShowPhoneSuggestions(false)}
                />
              </div>
              <div>
                <label className={lbl}>Second Phone</label>
                <input type="tel" value={formData.customerPhone2 || ''}
                  onChange={e => setFormData({ customerPhone2: e.target.value })} className={inp} />
              </div>
              <CountryCitySelector
                country={formData.customerProvince || ''}
                city={formData.customerCity || ''}
                savedCountries={savedCountries}
                savedCitiesForCountry={savedCitiesForCountry}
                setFormData={setFormData}
                handleAddCountryCity={handleAddCountryCity}
              />
            </div>

            {/* Row 3: Address only (warranty removed) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>Address</label>
                <input type="text" value={formData.customerAddress || ''}
                  onChange={e => setFormData({ customerAddress: e.target.value })} className={inp} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Products ── */}
        <section className="border border-yellow-200 rounded-xl overflow-hidden">
          <div className="px-3 py-1.5 flex items-center justify-between"
            style={{ background: `linear-gradient(90deg, ${BLACK} 0%, #2a2a2a 100%)` }}>
            <div className="flex items-center gap-2">
              <Package size={12} style={{ color: GOLD }} />
              <h4 className="text-xs font-bold" style={{ color: GOLD }}>Products</h4>
            </div>
            <button onClick={addProduct}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors"
              style={{ background: GOLD, color: BLACK }}>
              <Plus size={12} /> Add Product
            </button>
          </div>
          <div className="p-3">
            {selectedProducts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4 bg-yellow-50 rounded-lg border border-dashed border-yellow-200">
                No products added yet
              </p>
            ) : (
              <div className="space-y-2">
                {selectedProducts.map((product, index) => {
                  const serials      = product.productId ? getAvailableSerialsForProduct(product.productId, product.id) : [];
                  const ownSelected  = (product.serialNumbers || []).filter(s => s.trim() !== '');
                  const totalChoices = serials.length + ownSelected.length;
                  const maxQty       = Math.max(totalChoices, product.quantity);
                  return (
                    <div key={product.id} className="border border-yellow-100 rounded-lg p-2 bg-yellow-50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-gray-700">Product {index + 1}</span>
                        <button onClick={() => removeProduct(product.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-1.5">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-0.5">Product *</label>
                          <select value={product.productId}
                            onChange={e => updateProduct(product.id, 'productId', e.target.value)} className={inp}>
                            <option value="">— Select product —</option>
                            {availableProducts.map(p => {
                              const availCount = getAvailableSerialsForProduct(p.id, product.id).length;
                              const label = [p.brandName, p.modelName, p.category ? `[${p.category}]` : '', `(${availCount} avail)`].filter(Boolean).join(' ');
                              return <option key={p.id} value={p.id} disabled={availCount === 0}>{label}</option>;
                            })}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-0.5">
                            Qty * {product.productId && <span className="text-gray-400 font-normal">(max {maxQty})</span>}
                          </label>
                          <input type="number" min="1" max={maxQty || undefined} value={product.quantity}
                            onChange={e => {
                              const v = Math.max(1, Math.min(Number(e.target.value), maxQty || 9999));
                              updateProduct(product.id, 'quantity', v);
                            }} className={inp} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-0.5">Unit Price (PKR)</label>
                          <input type="number" min="0" value={product.price}
                            onChange={e => updateProduct(product.id, 'price', Number(e.target.value))} className={inp} />
                        </div>
                      </div>
                      {product.productId && (
                        <div className="mb-2 flex flex-wrap gap-1 text-xs">
                          {product.brandName   && <span className="px-2 py-0.5 bg-white border border-yellow-200 text-gray-700 rounded-full font-medium">{product.brandName}</span>}
                          {product.modelName   && <span className="px-2 py-0.5 bg-white border border-yellow-200 text-gray-700 rounded-full font-medium">{product.modelName}</span>}
                          {product.category    && <span className="px-2 py-0.5 bg-white border border-yellow-100 text-gray-600 rounded-full">{product.category}</span>}
                          {product.description && <span className="px-2 py-0.5 bg-white border border-yellow-100 text-gray-500 rounded-full truncate max-w-xs">{product.description}</span>}
                        </div>
                      )}
                      {product.productId && product.quantity > 0 && (
                        <div className="border-t border-yellow-200 pt-2">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Hash size={11} className="text-gray-600" />
                            <span className="text-xs font-semibold text-gray-700">Serial Numbers ({product.quantity} required)</span>
                            {serials.length === 0 && ownSelected.length === 0 && (
                              <span className="ml-2 text-xs text-red-500">No available serials</span>
                            )}
                          </div>
                          {(serials.length > 0 || ownSelected.length > 0) ? (
                            <div className="grid grid-cols-3 gap-1.5">
                              {Array.from({ length: product.quantity }, (_, i) => {
                                const currentVal = product.serialNumbers?.[i] || '';
                                const options = currentVal && !serials.includes(currentVal) ? [currentVal, ...serials] : serials;
                                return (
                                  <select key={i} value={currentVal}
                                    onChange={e => updateSerial(product.id, i, e.target.value)} className={inp}>
                                    <option value="">— Serial #{i + 1} —</option>
                                    {options.map(s => (
                                      <option key={s} value={s} disabled={s !== currentVal && (product.serialNumbers || []).includes(s)}>{s}</option>
                                    ))}
                                  </select>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-red-500">No available serial numbers. Please check inventory.</p>
                          )}
                        </div>
                      )}
                      <div className="mt-2 text-right text-xs font-bold" style={{ color: BLACK }}>
                        Total: <span style={{ color: GOLD }}>{formatCurrency(product.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── Delivery & Information ── */}
        <section className="border border-yellow-200 rounded-xl overflow-hidden">
          <div className="px-3 py-1.5 flex items-center gap-2"
            style={{ background: `linear-gradient(90deg, ${BLACK} 0%, #2a2a2a 100%)` }}>
            <Truck size={12} style={{ color: GOLD }} />
            <h4 className="text-xs font-bold" style={{ color: GOLD }}>Delivery & Information</h4>
          </div>
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className={lbl}>Delivery Status</label>
                {addingDelivery ? (
                  <div className="flex gap-1">
                    <input type="text" value={newDelivery} onChange={e => setNewDelivery(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === 'Enter' && newDelivery.trim()) {
                          await handleAddDeliveryStatus(newDelivery.trim());
                          setFormData({ deliveryStatus: newDelivery.trim() as any });
                          setNewDelivery(''); setAddingDelivery(false);
                        }
                        if (e.key === 'Escape') { setAddingDelivery(false); setNewDelivery(''); }
                      }}
                      placeholder="New status" autoFocus className={`${inp} flex-1`} />
                    <button onClick={async () => {
                      if (newDelivery.trim()) {
                        await handleAddDeliveryStatus(newDelivery.trim());
                        setFormData({ deliveryStatus: newDelivery.trim() as any });
                        setNewDelivery(''); setAddingDelivery(false);
                      }
                    }} style={{ backgroundColor: BLACK, color: GOLD }} className="px-2 py-1 rounded-md text-xs">Save</button>
                    <button onClick={() => { setAddingDelivery(false); setNewDelivery(''); }}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <select value={formData.deliveryStatus || 'Self-collect'}
                      onChange={e => setFormData({ deliveryStatus: e.target.value as any })}
                      className={`${inp} flex-1`}>
                      {deliveryStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => setAddingDelivery(true)}
                      className="flex items-center gap-0.5 px-2 py-1 border border-dashed border-yellow-400 text-yellow-700 rounded-md text-xs hover:bg-yellow-50 whitespace-nowrap">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className={lbl}>Payment Status</label>
                <select value={formData.status || 'Unpaid'}
                  onChange={e => setFormData({ status: e.target.value as any })} className={inp}>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div className="col-span-2">
                <BranchSelector branches={branches} invoiceCompany={invoiceCompany}
                  setInvoiceCompany={setInvoiceCompany} handleAddBranch={handleAddBranch} />
              </div>
            </div>

            {/* Digital Stamp + Exchange Note (warranty language kept neutral) */}
            <div className="grid grid-cols-4 gap-2 items-end">
              <div className="flex items-center h-8">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={!!formData.digitalStamp}
                    onChange={() => setFormData({ digitalStamp: !formData.digitalStamp })}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-yellow-500" />
                  <Stamp size={12} className="text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Digital Stamp on PDF</span>
                </label>
              </div>
              <div className="col-span-3">
                <label className={lbl}>Exchange Note</label>
                <textarea value={formData.exchangeWarrantyNote || ''}
                  onChange={e => setFormData({ exchangeWarrantyNote: e.target.value })}
                  rows={2} placeholder="e.g. No exchange after 7 days"
                  className={`${inp} resize-none h-auto`} />
              </div>
            </div>

            {/* Multi-currency */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Globe size={11} className="text-gray-600" />
                <label className="text-xs font-medium text-gray-700">Invoice Currencies (shown on PDF)</label>
                <span className="text-xs text-gray-400">— select all that apply</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {INVOICE_CURRENCIES.map(c => {
                  const active = selectedCurrencies.includes(c.code);
                  return (
                    <button key={c.code} type="button" onClick={() => toggleCurrency(c.code)}
                      style={active ? { backgroundColor: BLACK, color: GOLD, borderColor: GOLD } : {}}
                      className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${
                        active
                          ? 'shadow-sm ring-2 ring-yellow-300'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-yellow-400 hover:bg-yellow-50'
                      }`}>
                      {c.symbol} {c.code}
                    </button>
                  );
                })}
              </div>
              {selectedCurrencies.length > 1 && (
                <p className="mt-1 text-xs text-gray-500">
                  Primary: <strong>{selectedCurrencies[0]}</strong> · Also shown: {selectedCurrencies.slice(1).join(', ')}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Sales Details (internal) ── */}
        <section className="border border-blue-100 rounded-xl overflow-hidden">
          <div className="px-3 py-1.5 flex items-center gap-2 bg-blue-50 border-b border-blue-100">
            <User size={12} className="text-blue-600" />
            <h4 className="text-xs font-bold text-blue-800">Sales Details</h4>
            <span className="text-xs text-blue-400 ml-auto">Internal — not shown on invoice</span>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className={lbl}>Salesperson</label>
                <select value={formData.salesperson || ''}
                  onChange={e => setFormData({ salesperson: e.target.value })} className={inp}>
                  <option value="">Select salesperson</option>
                  {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.position}</option>)}
                </select>
              </div>

              <div>
                <label className={lbl}>Salesperson Location</label>
                {addingSpLoc ? (
                  <div className="flex gap-1">
                    <input type="text" value={newSpLoc} onChange={e => setNewSpLoc(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === 'Enter' && newSpLoc.trim()) {
                          await handleAddSalespersonLocation(newSpLoc.trim());
                          setFormData({ salespersonLocation: newSpLoc.trim() });
                          setNewSpLoc(''); setAddingSpLoc(false);
                        }
                        if (e.key === 'Escape') { setAddingSpLoc(false); setNewSpLoc(''); }
                      }}
                      placeholder="New location" autoFocus className={`${inp} flex-1`} />
                    <button onClick={async () => {
                      if (newSpLoc.trim()) {
                        await handleAddSalespersonLocation(newSpLoc.trim());
                        setFormData({ salespersonLocation: newSpLoc.trim() });
                        setNewSpLoc(''); setAddingSpLoc(false);
                      }
                    }} style={{ backgroundColor: BLACK, color: GOLD }} className="px-2 py-1 rounded-md text-xs">Save</button>
                    <button onClick={() => { setAddingSpLoc(false); setNewSpLoc(''); }}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <select value={formData.salespersonLocation || ''}
                      onChange={e => setFormData({ salespersonLocation: e.target.value })}
                      className={`${inp} flex-1`}>
                      <option value="">Select location</option>
                      {salespersonLocationsList.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <button onClick={() => setAddingSpLoc(true)}
                      className="flex items-center gap-0.5 px-2 py-1 border border-dashed border-yellow-400 text-yellow-700 rounded-md text-xs hover:bg-yellow-50 whitespace-nowrap">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className={lbl}>Referral To</label>
                <input type="text" value={formData.clientDealBy || ''}
                  onChange={e => setFormData({ clientDealBy: e.target.value })} className={inp} />
              </div>
              <div>
                <label className={lbl}>Referral From</label>
                <input type="text" value={formData.referralBy || ''}
                  onChange={e => setFormData({ referralBy: e.target.value })} className={inp} />
              </div>
              <div className="col-span-4">
                <label className={lbl}>Created By</label>
                <input type="text" value={formData.createdBy || ''}
                  onChange={e => setFormData({ createdBy: e.target.value })} className={inp} />
              </div>
            </div>

            {/* Import Charges */}
            <div className="mt-2 pt-2 border-t border-blue-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Package size={11} className="text-gray-600" />
                <span className="text-xs font-semibold text-gray-700">Import Charges</span>
                <span className="text-xs text-gray-400">(deducted from commission)</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className={lbl}>Cargo Amount</label>
                  <div className="flex gap-1">
                    <input type="number" min="0" value={formData.cargoAmount ?? 0}
                      onChange={e => setFormData({ cargoAmount: Number(e.target.value) })}
                      className={`${inp} flex-1`} placeholder="0" />
                    <select value={formData.cargoCurrency || 'PKR'}
                      onChange={e => setFormData({ cargoCurrency: e.target.value as InvoiceCurrency })}
                      className="px-1 py-1 border border-gray-300 rounded-md text-xs h-8">
                      {INVOICE_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Customs Amount</label>
                  <div className="flex gap-1">
                    <input type="number" min="0" value={formData.customsAmount ?? 0}
                      onChange={e => setFormData({ customsAmount: Number(e.target.value) })}
                      className={`${inp} flex-1`} placeholder="0" />
                    <select value={formData.customsCurrency || 'PKR'}
                      onChange={e => setFormData({ customsCurrency: e.target.value as InvoiceCurrency })}
                      className="px-1 py-1 border border-gray-300 rounded-md text-xs h-8">
                      {INVOICE_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Agent Amount</label>
                  <div className="flex gap-1">
                    <input type="number" min="0" value={formData.agentAmount ?? 0}
                      onChange={e => setFormData({ agentAmount: Number(e.target.value) })}
                      className={`${inp} flex-1`} placeholder="0" />
                    <select value={formData.agentCurrency || 'PKR'}
                      onChange={e => setFormData({ agentCurrency: e.target.value as InvoiceCurrency })}
                      className="px-1 py-1 border border-gray-300 rounded-md text-xs h-8">
                      {INVOICE_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Agent Details</label>
                  <input type="text" value={formData.agentDetails || ''}
                    onChange={e => setFormData({ agentDetails: e.target.value })}
                    className={inp} placeholder="Agent name / reference" />
                </div>
              </div>
              {((formData.cargoAmount || 0) + (formData.customsAmount || 0) + (formData.agentAmount || 0)) > 0 && (
                <p className="mt-1 text-xs text-gray-600 bg-white border border-gray-200 rounded px-2 py-1">
                  Total import charges: <strong>
                    {formatCurrency(
                      convertCurrency(formData.cargoAmount || 0, formData.cargoCurrency || 'PKR', 'PKR', currencyRates)
                      + convertCurrency(formData.customsAmount || 0, formData.customsCurrency || 'PKR', 'PKR', currencyRates)
                      + convertCurrency(formData.agentAmount || 0, formData.agentCurrency || 'PKR', 'PKR', currencyRates)
                    )}
                  </strong>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Payment & Collection (internal) ── */}
        <section className="border border-green-100 rounded-xl overflow-hidden">
          <div className="px-3 py-1.5 flex items-center gap-2 bg-green-50 border-b border-green-100">
            <CreditCard size={12} className="text-green-600" />
            <h4 className="text-xs font-bold text-green-800">Payment & Collection</h4>
            <span className="text-xs text-green-400 ml-auto">Internal — not shown on invoice</span>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className={lbl}>Payment Mode</label>
                <select value={formData.paymentMode || 'Cash'}
                  onChange={e => setFormData({
                    paymentMode: e.target.value as any,
                    bankId: '', bankName: '', bankAccountNumber: '',
                    chequeNumber: '', chequeBank: '', chequeDate: '',
                  })}
                  className={inp}>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online (Bank Transfer)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Payment Status</label>
                <select value={formData.paymentStatus || 'Full'}
                  onChange={e => {
                    const s = e.target.value as 'Full' | 'Partial';
                    setFormData({ paymentStatus: s, paidAmount: s === 'Full' ? total : 0, remainingAmount: s === 'Full' ? 0 : total });
                  }} className={inp}>
                  <option value="Full">Full Payment</option>
                  <option value="Partial">Partial Payment</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Collection Method</label>
                {addingCollection ? (
                  <div className="flex gap-1">
                    <input type="text" value={newCollection} onChange={e => setNewCollection(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === 'Enter' && newCollection.trim()) {
                          await handleAddCollectionMethod(newCollection.trim());
                          setFormData({ collectionMethod: newCollection.trim() as any });
                          setNewCollection(''); setAddingCollection(false);
                        }
                        if (e.key === 'Escape') { setAddingCollection(false); setNewCollection(''); }
                      }}
                      placeholder="New method" autoFocus className={`${inp} flex-1`} />
                    <button onClick={async () => {
                      if (newCollection.trim()) {
                        await handleAddCollectionMethod(newCollection.trim());
                        setFormData({ collectionMethod: newCollection.trim() as any });
                        setNewCollection(''); setAddingCollection(false);
                      }
                    }} style={{ backgroundColor: BLACK, color: GOLD }} className="px-2 py-1 rounded-md text-xs">Save</button>
                    <button onClick={() => { setAddingCollection(false); setNewCollection(''); }}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <select value={formData.collectionMethod || 'Self Collection'}
                      onChange={e => setFormData({ collectionMethod: e.target.value as any })}
                      className={`${inp} flex-1`}>
                      {collectionMethods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <button onClick={() => setAddingCollection(true)}
                      className="flex items-center gap-0.5 px-2 py-1 border border-dashed border-yellow-400 text-yellow-700 rounded-md text-xs hover:bg-yellow-50 whitespace-nowrap">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className={lbl}>
                  Deduction Charges
                  <span className="ml-1 text-xs font-normal text-gray-400">(manual)</span>
                </label>
                <div className="flex gap-1">
                  <input type="number" min="0" value={formData.deductionCharges ?? 0}
                    onChange={e => setFormData({ deductionCharges: Number(e.target.value) })}
                    className={`${inp} flex-1`} placeholder="0" />
                  <select value={(formData as any).deductionCurrency || 'PKR'}
                    onChange={e => setFormData({ ...formData, deductionCurrency: e.target.value as InvoiceCurrency } as any)}
                    className="px-1 py-1 border border-gray-300 rounded-md text-xs h-8">
                    {INVOICE_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>

              {formData.paymentStatus === 'Partial' && (
                <>
                  <div>
                    <label className={lbl}>Paid Amount</label>
                    <input type="number" value={formData.paidAmount || 0}
                      onChange={e => setFormData({ paidAmount: Number(e.target.value), remainingAmount: total - Number(e.target.value) })}
                      className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Remaining</label>
                    <input type="number" value={formData.remainingAmount || 0} readOnly className={`${inp} bg-gray-50`} />
                  </div>
                </>
              )}

              {formData.paymentMode === 'Online' && (
                <div className="col-span-4">
                  <label className={lbl}>Company Bank Account (receiving payment)</label>
                  <select value={formData.bankId || ''} onChange={e => {
                    const bank = banks.find(b => b.id === e.target.value);
                    setFormData({ bankId: bank?.id, bankName: bank?.name, bankAccountNumber: bank?.accountNumber });
                  }} className={inp}>
                    <option value="">Select bank account</option>
                    {banks.map(b => <option key={b.id} value={b.id}>{b.name} — {b.accountNumber}</option>)}
                  </select>
                  {formData.bankName && (
                    <p className="mt-1 text-xs text-green-700 bg-green-100 px-3 py-1 rounded-lg">
                      Payment to: <strong>{formData.bankName}</strong> · A/C: {formData.bankAccountNumber}
                    </p>
                  )}
                </div>
              )}

              {formData.paymentMode === 'Cheque' && (
                <>
                  <div>
                    <label className={lbl}>Cheque Number</label>
                    <input type="text" value={formData.chequeNumber || ''}
                      onChange={e => setFormData({ chequeNumber: e.target.value })}
                      placeholder="e.g. 0012345" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Cheque Date</label>
                    <input type="date" value={formData.chequeDate || ''}
                      onChange={e => setFormData({ chequeDate: e.target.value })} className={inp} />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Cheque Bank / Branch</label>
                    <input type="text" value={formData.chequeBank || ''}
                      onChange={e => setFormData({ chequeBank: e.target.value })}
                      placeholder="e.g. HBL — Rawalpindi Branch" className={inp} />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

      </div>{/* end scrollable body */}

      {/* ── Sticky footer ── */}
      <div className="flex-shrink-0 border-t px-4 py-2.5 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]"
        style={{ borderColor: GOLD + '33', background: '#fafaf8' }}>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-700">Total:</span>
              <span className="text-lg font-extrabold" style={{ color: BLACK }}>{formatCurrency(total)}</span>
            </div>
            {(formData.deductionCharges || 0) > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-500">Deduction:</span>
                <span className="text-red-600 font-medium">
                  − {formatCurrency(formData.deductionCharges || 0)}
                  {(formData as any).deductionCurrency && (formData as any).deductionCurrency !== 'PKR' && (
                    <span className="ml-1 text-gray-400">({(formData as any).deductionCurrency})</span>
                  )}
                </span>
              </div>
            )}
            {((formData.cargoAmount || 0) + (formData.customsAmount || 0) + (formData.agentAmount || 0)) > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-500">Import:</span>
                <span className="text-orange-600 font-medium">
                  − {formatCurrency((formData.cargoAmount || 0) + (formData.customsAmount || 0) + (formData.agentAmount || 0))}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCancel}
              className="px-3 py-1.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium border border-gray-200">
              Cancel
            </button>
            <button onClick={handleSave} disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg disabled:opacity-50 transition-colors font-bold text-sm shadow-sm whitespace-nowrap"
              style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #b8860b 100%)`, color: BLACK }}>
              {isSaving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : isEditing ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </div>
        {pdfGenerating && (
          <p className="text-xs text-gray-500 mt-1 text-right flex items-center justify-end gap-1.5">
            <Loader2 size={10} className="animate-spin" style={{ color: GOLD }} /> PDF uploading to cloud…
          </p>
        )}
      </div>

    </div>
  );
}