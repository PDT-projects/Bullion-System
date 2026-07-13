import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Trash2, X, Hash, Truck, User, CreditCard,
  Loader2, FileDown, Stamp, Package, Globe, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Invoice, InvoiceProduct, ProductInfo } from '../models/types';
import { makeBranchValue, branchFromValue } from '../viewModels/useInvoiceFormViewModel';
import { TxCompany } from '../../transactions/models/TransactionBridgeService';
import { InvoiceCurrency, INVOICE_CURRENCIES, convertCurrency } from '../models/invoiceService';

interface Employee { id: string; name: string; position: string; status: 'active' | 'inactive'; }
interface Bank    { id: string; name: string; accountNumber: string; balance: number; }

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
  productsLoading?: boolean;
  activeEmployees: Employee[];
  banks: Bank[];
  savedSalespersons?: string[];
  handleAddSalesperson?: (name: string) => Promise<void>;
  saveCustomerToBook?: () => Promise<void>;
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
const CHARCOAL = '#374151';

const inp = `w-full px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm h-10 bg-white transition-colors`;
const lbl = 'block text-xs font-semibold text-gray-600 mb-1.5';

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
              style={sel ? { backgroundColor: CHARCOAL, color: '#fff', borderColor: CHARCOAL } : {}}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1 ${
                sel
                  ? 'shadow-sm ring-2 ring-slate-300'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}>
              {sel && <span className="text-xs" style={{ color: CHARCOAL }}>✓</span>}
              {branch}
            </button>
          );
        })}
        {addingBranch ? (
          <div className="flex items-center gap-1.5">
            <input ref={inputRef} type="text" value={newBranch}
              onChange={e => setNewBranch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setAddingBranch(false); }}
              className="px-2 py-1 border-2 border-slate-400 rounded-lg text-xs outline-none w-28"
              placeholder="Branch name…" />
            <button type="button" onClick={save} disabled={saving || !newBranch.trim()}
              style={{ backgroundColor: CHARCOAL, color: '#fff' }} className="px-2 py-1 rounded text-xs font-semibold disabled:opacity-50">
              {saving ? '…' : 'Save'}
            </button>
            <button type="button" onClick={() => setAddingBranch(false)}
              className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600">✕</button>
          </div>
        ) : (
          <button type="button" onClick={() => setAddingBranch(true)}
            className="px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            ➕ Add New
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">
        PDF header: <span className="text-gray-600 font-medium">Bullion Electronics — {branchFromValue(invoiceCompany)}</span>
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
            <button onClick={saveCountry} disabled={savingCountry} style={{ backgroundColor: CHARCOAL, color: '#fff' }} className="px-2 py-1 rounded-lg text-xs disabled:opacity-50">{savingCountry ? '…' : 'Save'}</button>
            <button onClick={() => { setAddingCountry(false); setNewCountry(''); }}
              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs"><X size={12} /></button>
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
              className="flex items-center gap-0.5 px-2.5 py-2 border border-dashed border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50 whitespace-nowrap">
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

// ── Customer book dropdown ────────────────────────────────────────────────────
// Shows from the first keystroke. Displays full customer info: name, phone,
// CNIC, city/address. Clicking fills ALL customer fields in the form.
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
    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer Book</span>
          <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full font-bold">{suggestions.length}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-0.5 rounded"><X size={12} /></button>
      </div>
      {suggestions.map((s, i) => (
        <div key={s.id || i} onClick={() => { onSelect(s); onClose(); }}
          className="px-3 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 group">
          {/* Name + phone row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-gray-900 group-hover:text-blue-700 truncate">{s.customerName}</span>
            <span className="text-xs font-mono text-gray-500 shrink-0">{s.customerPhone}</span>
          </div>
          {/* Details row */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {s.customerPhone2 && (
              <span className="text-[11px] text-gray-400">📞 {s.customerPhone2}</span>
            )}
            {s.customerCNIC && (
              <span className="text-[11px] text-gray-400">🪪 {s.customerCNIC}</span>
            )}
            {(s.customerCity || s.customerProvince) && (
              <span className="text-[11px] text-gray-400">
                📍 {[s.customerCity, s.customerProvince].filter(Boolean).join(', ')}
              </span>
            )}
            {s.customerAddress && (
              <span className="text-[11px] text-gray-400 truncate max-w-[180px]">🏠 {s.customerAddress}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ProductPriceInput ─────────────────────────────────────────────────────────
// AED-native: product.price is stored DIRECTLY in the row's selected currency.
// What the user types is what is saved (1:1, no hidden conversion master). This
// keeps editing and persistence consistent with how invoices are read back.
//
// State contract:
//   inputValue    — what is shown in the <input>; equals product.price (in `currency`)
//   product.price — the authoritative value, expressed in `currency`
//
// On currency change: convert product.price into the new currency and store that.
// On price type:      store the typed value as-is.
function ProductPriceInput({
  product,
  currencyRates,
  updateProduct,
}: {
  product: InvoiceProduct;
  currencyRates: Record<InvoiceCurrency, number>;
  updateProduct: (id: string, field: string, value: any) => void;
}) {
  // Pure AED. docToInvoice already normalises stored amounts to AED on read,
  // so product.price is AED — edit and save it 1:1 with no conversion.
  const [inputValue, setInputValue] = React.useState<number>(() => product.price || 0);

  React.useEffect(() => {
    setInputValue(product.price || 0);
  }, [product.id, product.price]);

  const handlePriceChange = (raw: number) => {
    setInputValue(raw);
    updateProduct(product.id, 'price', raw);
  };

  return (
    <div>
      <div className="flex gap-1">
        <input
          type="number"
          min="0"
          step="any"
          value={inputValue || ''}
          onChange={e => handlePriceChange(Number(e.target.value))}
          className={`${inp} flex-1`}
          placeholder="0"
        />
        <span className="px-2 flex items-center border border-gray-300 rounded-lg text-xs h-10 bg-gray-50 text-gray-600">
          AED
        </span>
      </div>
    </div>
  );
}


// ── Save to Customer Book button — handles its own loading/success state ──────
function SaveToCustomerBookButton({
  customerName, onSave,
}: { customerName: string; onSave: () => Promise<void> }) {
  const [saving,  setSaving]  = React.useState(false);
  const [saved,   setSaved]   = React.useState(false);
  const [errMsg,  setErrMsg]  = React.useState('');

  const handle = async () => {
    setSaving(true); setSaved(false); setErrMsg('');
    try {
      await onSave();
      setSaved(true);
      toast.success(`✅ ${customerName} saved to Customer Book`);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      const msg = err?.message || 'Failed to save — check your connection';
      setErrMsg(msg);
      toast.error(msg);
      console.error('[CustomerBook]', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
      <span className="text-xs text-gray-500">
        {saved
          ? <span className="text-green-600 font-semibold">✅ {customerName} saved to Customer Book</span>
          : errMsg
          ? <span className="text-red-500">⚠️ {errMsg}</span>
          : <>💾 Save <strong>{customerName}</strong> to customer book for quick lookup next time</>
        }
      </span>
      <button
        type="button"
        onClick={handle}
        disabled={saving || saved}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed transition-all shrink-0 disabled:opacity-60"
        style={{
          borderColor: saved ? '#16a34a' : '#334155',
          color:       saved ? '#16a34a' : '#334155',
          backgroundColor: 'transparent',
        }}
      >
        {saving
          ? <><Loader2 size={11} className="animate-spin" /> Saving…</>
          : saved
          ? <>✓ Saved</>
          : <>+ Save to Customer Book</>
        }
      </button>
    </div>
  );
}

export function InvoiceFormView({
  formData, selectedProducts, customerSuggestions, showSuggestions,
  isEditing, isLoading, isSaving, pdfGenerating, isDownloadingPdf,
  savedCountries, savedCitiesForCountry, handleAddCountryCity,
  salespersonLocations, deliveryStatuses, collectionMethods,
  availableProducts, productsLoading = false, activeEmployees, banks,
  savedSalespersons = [], handleAddSalesperson = async () => {},
  saveCustomerToBook = async () => {},
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
  selectedCurrencies = ['AED'],
  toggleCurrency = () => {},
  currencyRates,
}: Props) {
  const total = calculateTotal();

  // Amounts are AED (normalised on read). Display 1:1.
  const AED_RATE = 1;
  const fmtAed = (aed: number) => formatCurrency(aed || 0);

  const [addingSpLoc, setAddingSpLoc] = useState(false);
  const [newSpLoc,    setNewSpLoc]    = useState('');
  const [addingSp,    setAddingSp]    = useState(false);
  const [newSp,       setNewSp]       = useState('');
  const [addingDelivery, setAddingDelivery] = useState(false);
  const [newDelivery,    setNewDelivery]    = useState('');
  const [addingCollection, setAddingCollection] = useState(false);
  const [newCollection,    setNewCollection]    = useState('');
  const [showNameSuggestions, setShowNameSuggestions]  = useState(false);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [showSpSuggestions,   setShowSpSuggestions]    = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const nameRef  = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const spRef    = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (nameRef.current  && !nameRef.current.contains(e.target as Node))  setShowNameSuggestions(false);
      if (phoneRef.current && !phoneRef.current.contains(e.target as Node)) setShowPhoneSuggestions(false);
      if (spRef.current    && !spRef.current.contains(e.target as Node))    setShowSpSuggestions(false);
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
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: CHARCOAL }} />
      </div>
    );
  }

  return (
    // ── Slide-in panel (not full-screen; parent controls positioning) ──────
    // The parent should render this inside a right-side drawer panel.
    // We occupy full height of that container and scroll internally.
    <div className="flex flex-col h-full bg-white overflow-hidden">

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white"
        >
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: CHARCOAL }} />
          <h3 className="text-sm font-bold" style={{ color: CHARCOAL }}>
            {isEditing ? 'Edit Invoice' : 'New Invoice'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {pdfGenerating && (
            <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
              style={{ background: '#f3f4f6', color: '#4b5563' }}>
              <Loader2 size={11} className="animate-spin" /> Saving PDF…
            </div>
          )}
          <button onClick={handleDownloadPdf} disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50"
            style={{ borderColor: '#d1d5db', color: '#374151', background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {isDownloadingPdf
              ? <><Loader2 size={11} className="animate-spin" /> Generating…</>
              : <><FileDown size={12} /> PDF</>}
          </button>
          <button onClick={handleCancel}
            className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: '#9ca3af' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* ── Customer Information ── */}
        <section className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="px-4 py-3 flex items-center gap-2.5"
            style={{ background: '#f9fafb', borderBottom: '1px solid #eef2f7' }}>
            <User size={15} style={{ color: CHARCOAL }} />
            <h4 className="text-sm font-bold" style={{ color: CHARCOAL }}>Customer Information</h4>
          </div>
          <div className="p-4 space-y-4">

            {/* Row 1: Invoice # | Date | Customer Name | Identity Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Invoice Number */}
              <div>
                <label className={lbl}>Invoice Number <span className="ml-1 text-xs font-normal text-gray-400">(auto)</span></label>
                <div className="flex items-center h-10 px-3 border border-gray-300 rounded-lg bg-gray-50 select-none" title="Auto-generated — resets and increments daily">
                  <span className="text-sm font-semibold text-gray-900 tracking-wide">{formData.invoiceNumber || '—'}</span>
                  <span className="ml-auto text-[10px] font-medium text-gray-400 uppercase">Fixed daily</span>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className={lbl}>Date</label>
                {/*
                  FIX: this used to lock the date as a read-only "today" value
                  whenever creating a new invoice (isEditing === false), and
                  only allowed editing when updating an existing invoice. The
                  field now always renders as an editable date input — it
                  still defaults to today's date, but can be changed before
                  saving, for both new and existing invoices.
                */}
                <input type="date" value={formData.date || ''}
                  onChange={e => setFormData({ date: e.target.value })} className={inp} />
              </div>

              {/* Customer Name — with history dropdown */}
              <div className="relative" ref={nameRef} data-field-error={!!fieldErrors.customerName}>
                <label className={lbl}>
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input type="text" value={formData.customerName || ''}
                    onChange={e => {
                      handleCustomerSearch(e.target.value, 'customerName');
                      setShowNameSuggestions(true);
                      if (e.target.value.trim()) setFieldErrors(prev => { const n = {...prev}; delete n.customerName; return n; });
                    }}
                    onFocus={() => setShowNameSuggestions(true)}
                    placeholder="Enter customer name"
                    className={fieldErrors.customerName ? `${inp} !border-red-400 !bg-red-50 focus:!ring-red-300` : inp} />
                  {customerSuggestions.length > 0 && (
                    <button type="button"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setShowNameSuggestions(v => !v)}>
                      <ChevronDown size={14} />
                    </button>
                  )}
                </div>
                {fieldErrors.customerName && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium flex items-center gap-1">
                    ⚠ {fieldErrors.customerName}
                  </p>
                )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative" ref={phoneRef} data-field-error={!!fieldErrors.customerPhone}>
                <label className={lbl}>
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input type="tel" value={formData.customerPhone || ''}
                  onChange={e => {
                    handleCustomerSearch(e.target.value, 'customerPhone');
                    setShowPhoneSuggestions(true);
                    if (e.target.value.trim()) setFieldErrors(prev => { const n = {...prev}; delete n.customerPhone; return n; });
                  }}
                  onFocus={() => setShowPhoneSuggestions(true)}
                  placeholder="+92 300 1234567"
                  className={fieldErrors.customerPhone ? `${inp} !border-red-400 !bg-red-50 focus:!ring-red-300` : inp} />
                {fieldErrors.customerPhone && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium flex items-center gap-1">
                    ⚠ {fieldErrors.customerPhone}
                  </p>
                )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Address</label>
                <input type="text" value={formData.customerAddress || ''}
                  onChange={e => setFormData({ customerAddress: e.target.value })} className={inp} />
              </div>
            </div>

            {/* Save to Customer Book */}
            {(formData.customerName || '').trim() && (formData.customerPhone || '').trim() && (
              <SaveToCustomerBookButton
                customerName={formData.customerName || ''}
                onSave={saveCustomerToBook}
              />
            )}
          </div>
        </section>

        {/* ── Products ── */}
        <section className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: '#f9fafb', borderBottom: '1px solid #eef2f7' }}>
            <div className="flex items-center gap-2">
              <Package size={15} style={{ color: CHARCOAL }} />
              <h4 className="text-sm font-bold" style={{ color: CHARCOAL }}>Products</h4>
            </div>
            <button onClick={() => { addProduct(); setFieldErrors(prev => { const n = {...prev}; delete n.products; return n; }); }}
              className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg font-semibold transition-colors"
              style={{ background: CHARCOAL, color: '#fff' }}>
              <Plus size={12} /> Add Product
            </button>
          </div>
          <div className="p-4">
            {selectedProducts.length === 0 ? (
              <div data-field-error={!!fieldErrors.products}>
                <p className={`text-xs text-center py-6 rounded-lg border border-dashed ${fieldErrors.products ? 'bg-red-50 border-red-300 text-red-400' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                  {fieldErrors.products ? `⚠ ${fieldErrors.products}` : 'No products added yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedProducts.map((product, index) => {
                  const serials      = product.productId ? getAvailableSerialsForProduct(product.productId, product.id) : [];
                  const ownSelected  = (product.serialNumbers || []).filter(s => s.trim() !== '');
                  const totalChoices = serials.length + ownSelected.length;
                  const maxQty       = Math.max(totalChoices, product.quantity);
                  return (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-gray-700">Product {index + 1}</span>
                        <button onClick={() => removeProduct(product.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-1.5">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product *</label>
                          <select value={product.productId}
                            onChange={e => updateProduct(product.id, 'productId', e.target.value)} className={inp}>
                            <option value="">— Select product —</option>
                            {availableProducts.map(p => {
                              const availCount = getAvailableSerialsForProduct(p.id, product.id).length;
                              const isCurrent  = p.id === product.productId;
                              const label = [p.brandName, p.modelName, p.category ? `[${p.category}]` : '', `(${availCount} avail)`].filter(Boolean).join(' ');
                              return <option key={p.id} value={p.id} disabled={availCount === 0 && !isCurrent}>{label}</option>;
                            })}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Qty * {product.productId && <span className="text-gray-400 font-normal">(max {maxQty})</span>}
                          </label>
                          <input type="number" min="1" max={maxQty || undefined} value={product.quantity}
                            onChange={e => {
                              const v = Math.max(1, Math.min(Number(e.target.value), maxQty || 9999));
                              updateProduct(product.id, 'quantity', v);
                            }} className={inp} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Unit Price <span className="ml-1 font-normal text-gray-400">(AED)</span>
                          </label>
                          <ProductPriceInput
                            product={product}
                            currencyRates={currencyRates}
                            updateProduct={updateProduct}
                          />
                        </div>
                      </div>
                      {product.productId && (() => {
                        const pInfo = availableProducts.find(ap => ap.id === product.productId);
                        const thumb = pInfo?.imageUrls && pInfo.imageUrls.length > 0 ? pInfo.imageUrls[0] : undefined;
                        return (
                          <div className="mb-2 flex items-center gap-3">
                            {thumb && (
                              <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff' }}>
                                <img src={thumb} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1 text-xs">
                              {product.brandName   && <span className="px-2 py-0.5 bg-white border border-gray-200 text-gray-700 rounded-full font-medium">{product.brandName}</span>}
                              {product.modelName   && <span className="px-2 py-0.5 bg-white border border-gray-200 text-gray-700 rounded-full font-medium">{product.modelName}</span>}
                              {product.category    && <span className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 rounded-full">{product.category}</span>}
                              {product.description && <span className="px-2 py-0.5 bg-white border border-gray-200 text-gray-500 rounded-full truncate max-w-xs">{product.description}</span>}
                            </div>
                          </div>
                        );
                      })()}
                      {product.productId && product.quantity > 0 && (
                        <div className="border-t border-gray-200 pt-2">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Hash size={11} className="text-gray-600" />
                            <span className="text-xs font-semibold text-gray-700">Serial Numbers ({product.quantity} required)</span>
                            {serials.length === 0 && ownSelected.length === 0 && (
                              <span className="ml-2 text-xs text-red-500">No available serials</span>
                            )}
                          </div>
                          {(serials.length > 0 || ownSelected.length > 0) ? (
                            <div className="grid grid-cols-3 gap-2">
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
                      <div className="mt-2 text-right text-xs font-bold" style={{ color: '#374151' }}>
                        Total: <span style={{ color: CHARCOAL }}>
                          {fmtAed(product.total)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── Delivery & Information ── */}
        <section className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="px-4 py-3 flex items-center gap-2.5"
            style={{ background: '#f9fafb', borderBottom: '1px solid #eef2f7' }}>
            <Truck size={15} style={{ color: CHARCOAL }} />
            <h4 className="text-sm font-bold" style={{ color: CHARCOAL }}>Delivery & Information</h4>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                    }} style={{ backgroundColor: CHARCOAL, color: '#fff' }} className="px-2 py-1 rounded-lg text-xs">Save</button>
                    <button onClick={() => { setAddingDelivery(false); setNewDelivery(''); }}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs"><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <select value={formData.deliveryStatus || 'Self-collect'}
                      onChange={e => setFormData({ deliveryStatus: e.target.value as any })}
                      className={`${inp} flex-1`}>
                      {deliveryStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => setAddingDelivery(true)}
                      className="flex items-center gap-0.5 px-2.5 py-2 border border-dashed border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50 whitespace-nowrap">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                )}
              </div>
              <div className="col-span-3">
                <BranchSelector branches={branches} invoiceCompany={invoiceCompany}
                  setInvoiceCompany={setInvoiceCompany} handleAddBranch={handleAddBranch} />
              </div>
            </div>

            {/* Digital Stamp + Exchange Note (warranty language kept neutral) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div className="flex items-center h-10">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={!!formData.digitalStamp}
                    onChange={() => setFormData({ digitalStamp: !formData.digitalStamp })}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-slate-600" />
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
                      style={active ? { backgroundColor: CHARCOAL, color: '#fff', borderColor: CHARCOAL } : {}}
                      className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${
                        active
                          ? 'shadow-sm ring-2 ring-slate-300'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
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
        <section className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="px-4 py-3 flex items-center gap-2.5 bg-gray-50 border-b border-gray-100">
            <User size={15} className="text-gray-500" />
            <h4 className="text-sm font-bold text-gray-700">Sales Details</h4>
            <span className="text-xs text-gray-400 ml-auto">Internal — not shown on invoice</span>
          </div>
          <div className="p-4">
            {/* Salesperson — dropdown of saved names + Add new inline */}
            <div className="relative" ref={spRef}>
              <label className={lbl}>Salesperson Name</label>
              {addingSp ? (
                /* Add new salesperson inline */
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newSp}
                    onChange={e => setNewSp(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Enter' && newSp.trim()) {
                        await handleAddSalesperson(newSp.trim());
                        setNewSp(''); setAddingSp(false);
                      }
                      if (e.key === 'Escape') { setAddingSp(false); setNewSp(''); }
                    }}
                    placeholder="Enter salesperson name…"
                    autoFocus
                    className={`${inp} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (newSp.trim()) { await handleAddSalesperson(newSp.trim()); setNewSp(''); setAddingSp(false); }
                    }}
                    disabled={!newSp.trim()}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                    style={{ backgroundColor: CHARCOAL, color: '#fff' }}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingSp(false); setNewSp(''); }}
                    className="px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                /* Dropdown of saved salespersons */
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formData.salesperson || ''}
                      onChange={e => {
                        setFormData({ salesperson: e.target.value });
                        setShowSpSuggestions(true);
                      }}
                      onFocus={() => setShowSpSuggestions(true)}
                      placeholder="Select or type a name…"
                      autoComplete="off"
                      className={inp}
                    />
                    {/* Dropdown */}
                    {showSpSuggestions && (() => {
                      const val = (formData.salesperson || '').toLowerCase();
                      const allSp = [
                        ...activeEmployees.map(e => e.name),
                        ...savedSalespersons,
                      ].filter((v, i, a) => a.indexOf(v) === i);
                      const matches = val
                        ? allSp.filter(s => s.toLowerCase().includes(val))
                        : allSp;
                      if (matches.length === 0 && !val) return null;
                      return (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                          <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Salespersons</span>
                            {val && <span className="text-[10px] text-gray-400">{matches.length} match{matches.length !== 1 ? 'es' : ''}</span>}
                          </div>
                          {matches.length === 0 ? (
                            <div className="px-3 py-3 text-xs text-gray-400 text-center">No matches for &quot;{formData.salesperson}&quot;</div>
                          ) : matches.map(name => (
                            <div key={name}
                              onMouseDown={e => { e.preventDefault(); setFormData({ salesperson: name }); setShowSpSuggestions(false); }}
                              className="px-3 py-2.5 cursor-pointer hover:bg-blue-50 text-sm text-gray-800 font-medium border-b border-gray-50 last:border-0 transition-colors flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                                {name.charAt(0).toUpperCase()}
                              </span>
                              {name}
                              {formData.salesperson === name && <span className="ml-auto text-blue-500 text-xs">✓</span>}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  {/* Add new button */}
                  <button
                    type="button"
                    onClick={() => { setAddingSp(true); setNewSp(''); setShowSpSuggestions(false); }}
                    className="flex items-center gap-1 px-2.5 py-2 border border-dashed border-gray-300 text-gray-500 rounded-lg text-xs hover:bg-gray-50 hover:border-gray-400 transition-colors whitespace-nowrap shrink-0"
                    title="Add new salesperson">
                    <Plus size={12} /> Add new
                  </button>
                </div>
              )}
              {/* Currently selected display */}
              {!addingSp && formData.salesperson && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-500">Selected:</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-900 text-white">
                    {formData.salesperson}
                    <span onClick={() => setFormData({ salesperson: '' })} className="cursor-pointer opacity-60 hover:opacity-100 ml-0.5">
                      <X size={9} color="white" />
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Import Charges */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Package size={11} className="text-gray-600" />
                <span className="text-xs font-semibold text-gray-700">Import Charges</span>
                <span className="text-xs text-gray-400">(deducted from commission)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className={lbl}>Cargo Amount</label>
                  <div className="flex gap-1">
                    <input type="number" min="0" value={formData.cargoAmount ?? 0}
                      onChange={e => setFormData({ cargoAmount: Number(e.target.value) })}
                      className={`${inp} flex-1`} placeholder="0" />
                    <select value={formData.cargoCurrency || 'AED'}
                      onChange={e => setFormData({ cargoCurrency: e.target.value as InvoiceCurrency })}
                      className="px-1 py-1 border border-gray-300 rounded-lg text-xs h-10">
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
                    <select value={formData.customsCurrency || 'AED'}
                      onChange={e => setFormData({ customsCurrency: e.target.value as InvoiceCurrency })}
                      className="px-1 py-1 border border-gray-300 rounded-lg text-xs h-10">
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
                    <select value={formData.agentCurrency || 'AED'}
                      onChange={e => setFormData({ agentCurrency: e.target.value as InvoiceCurrency })}
                      className="px-1 py-1 border border-gray-300 rounded-lg text-xs h-10">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                <div>
                  <label className={lbl}>Deduction Charges <span className="ml-1 text-xs font-normal text-gray-400">(manual)</span></label>
                  <input type="number" min="0" value={formData.deductionCharges ?? 0}
                    onChange={e => setFormData({ deductionCharges: Number(e.target.value) })}
                    className={inp} placeholder="0" />
                </div>
                <div className="col-span-3">
                  <label className={lbl}>Collection Method</label>
                  {addingCollection ? (
                    <div className="flex gap-1">
                      <input type="text" value={newCollection} onChange={e => setNewCollection(e.target.value)}
                        onKeyDown={async e => {
                          if (e.key === 'Enter' && newCollection.trim()) { await handleAddCollectionMethod(newCollection.trim()); setFormData({ collectionMethod: newCollection.trim() as any }); setNewCollection(''); setAddingCollection(false); }
                          if (e.key === 'Escape') { setAddingCollection(false); setNewCollection(''); }
                        }}
                        placeholder="New method" autoFocus className={`${inp} flex-1`} />
                      <button onClick={async () => { if (newCollection.trim()) { await handleAddCollectionMethod(newCollection.trim()); setFormData({ collectionMethod: newCollection.trim() as any }); setNewCollection(''); setAddingCollection(false); } }} style={{ backgroundColor: CHARCOAL, color: '#fff' }} className="px-2 py-1 rounded-lg text-xs">Save</button>
                      <button onClick={() => { setAddingCollection(false); setNewCollection(''); }} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs"><X size={12} /></button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <select value={formData.collectionMethod || 'Self Collection'} onChange={e => setFormData({ collectionMethod: e.target.value as any })} className={`${inp} flex-1`}>
                        {collectionMethods.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <button onClick={() => setAddingCollection(true)} className="flex items-center gap-0.5 px-2.5 py-2 border border-dashed border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50 whitespace-nowrap"><Plus size={11} /> Add</button>
                    </div>
                  )}
                </div>
              </div>
              {((formData.cargoAmount || 0) + (formData.customsAmount || 0) + (formData.agentAmount || 0)) > 0 && (
                <p className="mt-1 text-xs text-gray-600 bg-white border border-gray-200 rounded px-2 py-1">
                  Total import charges: <strong>
                    {formatCurrency(
                      convertCurrency(formData.cargoAmount || 0, formData.cargoCurrency || 'AED', 'AED', currencyRates)
                      + convertCurrency(formData.customsAmount || 0, formData.customsCurrency || 'AED', 'AED', currencyRates)
                      + convertCurrency(formData.agentAmount || 0, formData.agentCurrency || 'AED', 'AED', currencyRates)
                    )}
                  </strong>
                </p>
              )}
            </div>
          </div>
        </section>


      </div>{/* end scrollable body */}

      {/* ── Sticky footer ── */}
      <div className="flex-shrink-0 border-t px-5 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]"
        style={{ borderColor: '#e5e7eb', background: '#f9fafb' }}>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-700">Total:</span>
              <span className="text-xl font-extrabold" style={{ color: '#374151' }}>
                {fmtAed(total)}
              </span>
            </div>
            {(formData.deductionCharges || 0) > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-500">Deduction:</span>
                <span className="text-red-600 font-medium">
                  − {formatCurrency(
                    convertCurrency(
                      formData.deductionCharges || 0,
                      (formData as any).deductionCurrency || 'AED',
                      'AED',
                      currencyRates,
                    )
                  )}
                  {(formData as any).deductionCurrency && (formData as any).deductionCurrency !== 'AED' && (
                    <span className="ml-1 text-gray-400">({(formData as any).deductionCurrency})</span>
                  )}
                </span>
              </div>
            )}
            {((formData.cargoAmount || 0) + (formData.customsAmount || 0) + (formData.agentAmount || 0)) > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-500">Import:</span>
                <span className="text-orange-600 font-medium">
                  − {formatCurrency(
                    convertCurrency(formData.cargoAmount || 0, formData.cargoCurrency || 'AED', 'AED', currencyRates)
                    + convertCurrency(formData.customsAmount || 0, formData.customsCurrency || 'AED', 'AED', currencyRates)
                    + convertCurrency(formData.agentAmount || 0, formData.agentCurrency || 'AED', 'AED', currencyRates)
                  )}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCancel}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium border border-gray-200">
              Cancel
            </button>
            <button onClick={() => {
                // Field-level validation — highlight required fields before submitting
                const errs: Record<string, string> = {};
                if (!(formData.customerName  || '').trim()) errs.customerName  = 'Customer name is required';
                if (!(formData.customerPhone || '').trim()) errs.customerPhone = 'Phone number is required';
                if (selectedProducts.length === 0)          errs.products      = 'At least one product is required';
                selectedProducts.forEach((p: any, i: number) => {
                  if (!p.productId) errs[`product_${i}`] = 'Select a product';
                  const vs = (p.serialNumbers || []).filter((s: string) => s.trim() !== '');
                  if (vs.length !== p.quantity) errs[`serial_${i}`] = `Select ${p.quantity} serial number(s)`;
                });
                setFieldErrors(errs);
                if (Object.keys(errs).length > 0) {
                  const el = document.querySelector('[data-field-error="true"]');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  return;
                }
                handleSave();
              }} disabled={isSaving}
              className="flex items-center gap-1.5 px-6 py-2 rounded-lg disabled:opacity-50 transition-colors font-bold text-sm shadow-sm whitespace-nowrap"
              style={{ background: CHARCOAL, color: '#fff' }}>
              {isSaving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : isEditing ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </div>
        {pdfGenerating && (
          <p className="text-xs text-gray-500 mt-1 text-right flex items-center justify-end gap-1.5">
            <Loader2 size={10} className="animate-spin" style={{ color: CHARCOAL }} /> PDF uploading to cloud…
          </p>
        )}
      </div>

    </div>
  );
}