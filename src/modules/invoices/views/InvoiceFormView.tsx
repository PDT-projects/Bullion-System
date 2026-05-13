import React, { useState } from 'react';
import {
  Plus, Trash2, X, Hash, Truck, User, CreditCard,
  Loader2, FileDown, Stamp, MapPin, Package, Globe,
} from 'lucide-react';
import { Invoice, InvoiceProduct, ProductInfo } from '../models/types';
import { makeBranchValue, branchFromValue } from '../viewModels/useInvoiceFormViewModel';
import { TxCompany } from '../../transactions/models/TransactionBridgeService';
import { InvoiceCurrency, INVOICE_CURRENCIES } from '../models/invoiceService';

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
  // Country/City (replaces provinceCities)
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
  selectedCurrencies?: InvoiceCurrency[];
  toggleCurrency?: (c: InvoiceCurrency) => void;
}

const CHARCOAL_RING = 'focus:ring-gray-600';
const inp = `w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${CHARCOAL_RING} text-sm h-8`;
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
              style={sel ? { backgroundColor: '#1f2937', color: '#ffffff', borderColor: '#1f2937' } : {}}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1 ${
                sel
                  ? 'shadow-sm ring-2 ring-gray-300'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-500 hover:bg-gray-50'
              }`}>
              {sel && <span className="text-xs">✓</span>}
              {branch}
            </button>
          );
        })}
        {addingBranch ? (
          <div className="flex items-center gap-1.5">
            <input ref={inputRef} type="text" value={newBranch}
              onChange={e => setNewBranch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setAddingBranch(false); }}
              className="px-2 py-1 border-2 border-gray-600 rounded-lg text-xs outline-none w-28"
              placeholder="Branch name…" />
            <button type="button" onClick={save} disabled={saving || !newBranch.trim()}
              style={{ backgroundColor: '#374151', color: '#ffffff' }}
              className="px-2 py-1 rounded text-xs font-semibold disabled:opacity-50">
              {saving ? '…' : 'Save'}
            </button>
            <button type="button" onClick={() => setAddingBranch(false)}
              className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600">✕</button>
          </div>
        ) : (
          <button type="button" onClick={() => setAddingBranch(true)}
            className="px-3 py-1.5 rounded-lg border border-dashed border-gray-400 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
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
// Replaces the old Province/City picker.
// Shows previously used countries in a dropdown; cities for the chosen country are
// shown in a second dropdown.  Both fields have an "Add New" inline text entry.
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
  const [addingCity,    setAddingCity]    = useState(false);
  const [newCity,       setNewCity]       = useState('');

  const citiesForCountry = savedCitiesForCountry(country);

  const saveCountry = () => {
    const c = newCountry.trim();
    if (!c) return;
    setFormData({ customerProvince: c, customerCity: '' });
    setNewCountry(''); setAddingCountry(false);
  };

  const saveCity = async () => {
    const c = newCity.trim();
    if (!c || !country) return;
    await handleAddCountryCity(country, c);
    setNewCity(''); setAddingCity(false);
  };

  return (
    <>
      {/* Country */}
      <div>
        <label className={lbl}>Country</label>
        {addingCountry ? (
          <div className="flex gap-1">
            <input type="text" value={newCountry} onChange={e => setNewCountry(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveCountry(); if (e.key === 'Escape') { setAddingCountry(false); setNewCountry(''); } }}
              placeholder="e.g. UAE" autoFocus className={`${inp} flex-1`} />
            <button onClick={saveCountry} style={{ backgroundColor: '#374151', color: '#ffffff' }} className="px-2 py-1 rounded-md text-xs">Save</button>
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
              className="flex items-center gap-0.5 px-2 py-1 border border-dashed border-gray-400 text-gray-600 rounded-md text-xs hover:bg-gray-50 whitespace-nowrap">
              <Plus size={11} /> Add
            </button>
          </div>
        )}
      </div>

      {/* City */}
      <div>
        <label className={lbl}>City</label>
        {addingCity ? (
          <div className="flex gap-1">
            <input type="text" value={newCity} onChange={e => setNewCity(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveCity(); if (e.key === 'Escape') { setAddingCity(false); setNewCity(''); } }}
              placeholder="e.g. Dubai" autoFocus className={`${inp} flex-1`} />
            <button onClick={saveCity} style={{ backgroundColor: '#374151', color: '#ffffff' }} className="px-2 py-1 rounded-md text-xs">Save</button>
            <button onClick={() => { setAddingCity(false); setNewCity(''); }}
              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"><X size={12} /></button>
          </div>
        ) : (
          <div className="flex gap-1">
            <select value={city}
              onChange={e => setFormData({ customerCity: e.target.value })}
              disabled={!country}
              className={`${inp} flex-1 disabled:bg-gray-50 disabled:text-gray-400`}>
              <option value="">Select city</option>
              {citiesForCountry.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => setAddingCity(true)} title="Add new city"
              disabled={!country}
              className="flex items-center gap-0.5 px-2 py-1 border border-dashed border-gray-400 text-gray-600 rounded-md text-xs hover:bg-gray-50 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed">
              <Plus size={11} /> Add
            </button>
          </div>
        )}
      </div>
    </>
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
  selectedCurrencies = ['PKR'],
  toggleCurrency = () => {},
}: Props) {
  const total = calculateTotal();

  const [addingSpLoc, setAddingSpLoc] = useState(false);
  const [newSpLoc,    setNewSpLoc]    = useState('');

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-base font-bold text-gray-900">
          {isEditing ? 'Edit Invoice' : 'Create Invoice'}
        </h3>
        <div className="flex items-center gap-2">
          {pdfGenerating && (
            <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
              <Loader2 size={12} className="animate-spin" /> Saving PDF to cloud…
            </div>
          )}
          <button onClick={handleDownloadPdf} disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-400 text-gray-700 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors text-xs font-medium shadow-sm">
            {isDownloadingPdf
              ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
              : <><FileDown size={13} /> Download PDF</>}
          </button>
          <button onClick={handleCancel} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-0">

        {/* ── Customer Information ── */}
        <div className="border-b pb-2">
          <h4 className="font-semibold text-gray-900 mb-1.5 text-sm">Customer Information</h4>

          {/* Row 1: Invoice Number | Date | Customer Name | CNIC */}
          <div className="grid grid-cols-4 gap-2 mb-2">
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
                  <div className="flex items-center h-8 border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-gray-600 bg-white">
                    <span className="px-2 text-sm text-gray-500 bg-gray-50 whitespace-nowrap border-r border-gray-200 select-none h-full flex items-center">
                      {prefix}{fixedPart}
                    </span>
                    <input type="text" value={editablePart} maxLength={3}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                        setFormData({ invoiceNumber: `${prefix}${fixedPart}${val}` });
                      }}
                      className="flex-1 px-1 text-sm font-semibold text-gray-900 bg-white focus:outline-none text-center min-w-0"
                      title="Edit last 3 digits of invoice number" />
                  </div>
                );
              })()}
            </div>
            <div>
              <label className={lbl}>Date</label>
              {isEditing ? (
                <input type="date" value={formData.date || ''}
                  onChange={e => setFormData({ date: e.target.value })} className={inp} />
              ) : (
                <div className={`${inp} flex items-center gap-1.5 bg-gray-50 text-gray-600 cursor-not-allowed select-none`}
                  title="Date is automatically set to today">
                  <span className="text-xs">🔒</span>
                  <span>{formData.date || new Date().toISOString().split('T')[0]}</span>
                </div>
              )}
            </div>
            <div className="relative">
              <label className={lbl}>Customer Name *</label>
              <input type="text" value={formData.customerName || ''}
                onChange={e => handleCustomerSearch(e.target.value, 'customerName')}
                placeholder="Enter customer name" className={inp} />
              {showSuggestions && (
                <div className="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-lg w-full max-h-40 overflow-y-auto mt-1">
                  {customerSuggestions.map(s => (
                    <div key={s.id} onClick={() => handleCustomerSelect(s)}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-50 text-xs">
                      {s.customerName} <span className="text-gray-400">({s.customerPhone})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className={lbl}>CNIC *</label>
              <input type="text" value={formData.customerCNIC || ''}
                onChange={e => setFormData({ customerCNIC: e.target.value })}
                placeholder="42101-1234567-1" className={inp} />
            </div>
          </div>

          {/* Row 2: Phone | Second Phone | Country | City */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div className="relative">
              <label className={lbl}>Phone Number *</label>
              <input type="tel" value={formData.customerPhone || ''}
                onChange={e => handleCustomerSearch(e.target.value, 'customerPhone')}
                placeholder="+92 300 1234567" className={inp} />
            </div>
            <div>
              <label className={lbl}>Second Phone</label>
              <input type="tel" value={formData.customerPhone2 || ''}
                onChange={e => setFormData({ customerPhone2: e.target.value })} className={inp} />
            </div>

            {/* Country / City — replaces Province / City */}
            <CountryCitySelector
              country={formData.customerProvince || ''}
              city={formData.customerCity || ''}
              savedCountries={savedCountries}
              savedCitiesForCountry={savedCitiesForCountry}
              setFormData={setFormData}
              handleAddCountryCity={handleAddCountryCity}
            />
          </div>

          {/* Row 3: Address | Warranty Location */}
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-2">
              <label className={lbl}>Address</label>
              <input type="text" value={formData.customerAddress || ''}
                onChange={e => setFormData({ customerAddress: e.target.value })} className={inp} />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Warranty Location</label>
              <input type="text" value={formData.warrantyLocation || ''}
                onChange={e => setFormData({ warrantyLocation: e.target.value })} className={inp} />
            </div>
          </div>
        </div>

        {/* ── Products ── */}
        <div className="border-b pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="font-semibold text-gray-900 text-sm">Products</h4>
            <button onClick={addProduct}
              style={{ backgroundColor: '#374151', color: '#ffffff' }}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors">
              <Plus size={14} /> Add Product
            </button>
          </div>

          {selectedProducts.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-3 bg-gray-50 rounded-lg">No products added yet</p>
          ) : (
            <div className="space-y-2">
              {selectedProducts.map((product, index) => {
                const serials = product.productId ? getAvailableSerialsForProduct(product.productId, product.id) : [];
                const ownSelected  = (product.serialNumbers || []).filter(s => s.trim() !== '');
                const totalChoices = serials.length + ownSelected.length;
                const maxQty       = Math.max(totalChoices, product.quantity);
                return (
                  <div key={product.id} className="border rounded-lg p-2 bg-gray-50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-700">Product {index + 1}</span>
                      <button onClick={() => removeProduct(product.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-1.5">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-0.5">Product *</label>
                        <select value={product.productId} onChange={e => updateProduct(product.id, 'productId', e.target.value)} className={inp}>
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
                          Qty * {product.productId && <span className="text-gray-500 font-normal">(max {maxQty})</span>}
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
                      <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
                        {product.brandName   && <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium">{product.brandName}</span>}
                        {product.modelName   && <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium">{product.modelName}</span>}
                        {product.category    && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{product.category}</span>}
                        {product.description && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full truncate max-w-xs">{product.description}</span>}
                      </div>
                    )}
                    {product.productId && product.quantity > 0 && (
                      <div className="border-t pt-2">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Hash size={12} className="text-gray-700" />
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
                          <p className="text-xs text-red-500">No available serial numbers for this product. Please check inventory.</p>
                        )}
                      </div>
                    )}
                    <div className="mt-2 text-right text-xs font-semibold text-gray-900">
                      Total: {formatCurrency(product.total)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Delivery & Information ── */}
        <div className="border-b pb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <Truck size={14} className="text-gray-700" />
            <h4 className="font-semibold text-gray-900 text-sm">Delivery & Information</h4>
          </div>
          {/* Row 1: Delivery Status | Payment Status | Branch/Company (spans 2 cols) */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div>
              <label className={lbl}>Delivery Status</label>
              <select value={formData.deliveryStatus || 'Self-collect'}
                onChange={e => setFormData({ deliveryStatus: e.target.value as any })} className={inp}>
                {deliveryStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
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

          {/* Row 2: Digital Stamp | Warranty Note */}
          <div className="grid grid-cols-4 gap-2 items-end mb-2">
            <div className="flex items-center h-8">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={!!formData.digitalStamp}
                  onChange={() => setFormData({ digitalStamp: !formData.digitalStamp })}
                  className="w-4 h-4 rounded border-gray-300 text-gray-700 focus:ring-gray-600 cursor-pointer" />
                <Stamp size={13} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Add Digital Stamp to PDF</span>
              </label>
            </div>
            <div className="col-span-3">
              <label className={lbl}>Exchange & Warranty Note</label>
              <textarea value={formData.exchangeWarrantyNote || ''}
                onChange={e => setFormData({ exchangeWarrantyNote: e.target.value })}
                rows={2} placeholder="e.g., 2 years warranty, no exchange after 7 days"
                className={`${inp} resize-none h-auto`} />
            </div>
          </div>

          {/* Multi-currency selector */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Globe size={12} className="text-gray-600" />
              <label className="text-xs font-medium text-gray-700">Invoice Currencies (shown on PDF)</label>
              <span className="text-xs text-gray-400">— select all that apply</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {INVOICE_CURRENCIES.map(c => {
                const active = selectedCurrencies.includes(c.code);
                return (
                  <button key={c.code} type="button" onClick={() => toggleCurrency(c.code)}
                    style={active ? { backgroundColor: '#1f2937', color: '#ffffff', borderColor: '#1f2937' } : {}}
                    className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${
                      active
                        ? 'shadow-sm ring-2 ring-gray-300'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500 hover:bg-gray-50'
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

        {/* ── Sales Details (internal) ── */}
        <div className="border-b pb-2 bg-blue-50 p-2 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <User size={13} className="text-gray-700" />
            <h4 className="font-semibold text-gray-900 text-sm">Sales Details</h4>
            <span className="text-xs text-gray-400 ml-auto">Internal — not shown on invoice</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className={lbl}>Salesperson</label>
              <select value={formData.salesperson || ''}
                onChange={e => setFormData({ salesperson: e.target.value })} className={inp}>
                <option value="">Select salesperson</option>
                {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.position}</option>)}
              </select>
            </div>

            {/* Salesperson Location with Add New */}
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
                  }} style={{ backgroundColor: '#374151', color: '#ffffff' }} className="px-2 py-1 rounded-md text-xs">Save</button>
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
                  <button onClick={() => setAddingSpLoc(true)} title="Add new location"
                    className="flex items-center gap-0.5 px-2 py-1 border border-dashed border-gray-400 text-gray-600 rounded-md text-xs hover:bg-gray-50 whitespace-nowrap">
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
          <div className="mt-2 pt-2 border-t border-blue-200">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Package size={12} className="text-gray-600" />
              <span className="text-xs font-semibold text-gray-700">Import Charges</span>
              <span className="text-xs text-gray-400">(deducted from commission alongside delivery deductions)</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className={lbl}>Cargo Amount</label>
                <input type="number" min="0" value={formData.cargoAmount ?? 0}
                  onChange={e => setFormData({ cargoAmount: Number(e.target.value) })}
                  className={inp} placeholder="0" />
              </div>
              <div>
                <label className={lbl}>Customs Amount</label>
                <input type="number" min="0" value={formData.customsAmount ?? 0}
                  onChange={e => setFormData({ customsAmount: Number(e.target.value) })}
                  className={inp} placeholder="0" />
              </div>
              <div>
                <label className={lbl}>Agent Amount</label>
                <input type="number" min="0" value={formData.agentAmount ?? 0}
                  onChange={e => setFormData({ agentAmount: Number(e.target.value) })}
                  className={inp} placeholder="0" />
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
                  {formatCurrency((formData.cargoAmount || 0) + (formData.customsAmount || 0) + (formData.agentAmount || 0))}
                </strong> — will be deducted from commission
              </p>
            )}
          </div>
        </div>

        {/* ── Payment & Collection (internal) ── */}
        <div className="pb-2 bg-green-50 p-2 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <CreditCard size={13} className="text-green-600" />
            <h4 className="font-semibold text-gray-900 text-sm">Payment & Collection</h4>
            <span className="text-xs text-gray-400 ml-auto">Internal — not shown on invoice</span>
          </div>
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
              <select value={formData.collectionMethod || 'Self Collection'}
                onChange={e => setFormData({ collectionMethod: e.target.value as any })} className={inp}>
                {collectionMethods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>
                Deduction Charges
                <span className="ml-1 text-xs font-normal text-gray-400">(manual)</span>
              </label>
              <input type="number" min="0" value={formData.deductionCharges ?? 0}
                onChange={e => setFormData({ deductionCharges: Number(e.target.value) })}
                className={inp} placeholder="0" />
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
                  <input type="number" value={formData.remainingAmount || 0} readOnly className={`${inp} bg-white`} />
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

      </div>

      {/* ── Total & Save — sticky footer, always visible ── */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-900">Total Amount:</span>
              <span className="text-xl font-bold text-gray-700">{formatCurrency(total)}</span>
            </div>
            {(formData.deductionCharges || 0) > 0 && (
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-500">Delivery Deduction:</span>
                <span className="text-red-600 font-medium">− {formatCurrency(formData.deductionCharges || 0)}</span>
              </div>
            )}
            {((formData.cargoAmount || 0) + (formData.customsAmount || 0) + (formData.agentAmount || 0)) > 0 && (
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-500">Import Charges:</span>
                <span className="text-orange-600 font-medium">
                  − {formatCurrency((formData.cargoAmount || 0) + (formData.customsAmount || 0) + (formData.agentAmount || 0))}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadPdf} disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors text-xs font-medium">
              {isDownloadingPdf
                ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
                : <><FileDown size={13} /> Download PDF</>}
            </button>
            <button onClick={handleCancel}
              className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium border border-gray-200">
              Cancel
            </button>
            <button onClick={handleSave} disabled={isSaving}
              style={{ backgroundColor: '#1f2937', color: '#ffffff' }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg disabled:opacity-50 transition-colors font-semibold text-sm shadow-sm whitespace-nowrap">
              {isSaving
                ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                : isEditing ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </div>
        {pdfGenerating && (
          <p className="text-xs text-gray-600 mt-1 text-right flex items-center justify-end gap-1.5">
            <Loader2 size={10} className="animate-spin" /> PDF uploading to cloud storage…
          </p>
        )}
      </div>

    </div>
  );
}