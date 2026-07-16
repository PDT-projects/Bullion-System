// Invoice Module - List View

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

// ── Currency helper — AED only (PKR toggle removed) ────────────────────────
function formatAed(amount: number): string {
  return `AED ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0)}`;
}
// ─────────────────────────────────────────────────────────────────────────────
import {
  FileText, Plus, Search, Eye, X, Loader2, FileDown,
  Filter, XCircle, Truck, CreditCard, Hash, Building2, MapPin, Trash2,
  Pencil, Banknote, Landmark, ChevronDown, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Invoice, InvoiceStats, InvoiceFilters, InvoiceSelectionSummary, PaymentMode } from '../models/types';
import {
  calculateSupplierCost, calculatePurchaseCost, calculateMiscExpense,
  calculateNetAmount, calculatePaidAmount, calculateRemainingAmount,
} from '../models/invoiceService';
import { downloadInvoicePdf, generateInvoicePdf } from '../models/invoicePdfService';
import { useInvoiceFormViewModel } from '../viewModels/useInvoiceFormViewModel';

interface Props {
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  stats: InvoiceStats;
  filters: InvoiceFilters;
  viewingInvoice: Invoice | null;
  isLoading: boolean;
  onSearch: (searchTerm: string) => void;
  onStatusFilter: (status: 'all' | 'Paid' | 'Unpaid') => void;
  onCityFilter: (city: string) => void;
  onSalespersonFilter: (sp: string) => void;
  onDateFromFilter: (date: string) => void;
  onDateToFilter: (date: string) => void;
  onClearFilters: () => void;
  availableCities: string[];
  availableSalespersons: string[];
  salespersonMap?: Record<string, string>;
  onViewInvoice: (invoice: Invoice) => void;
  onCloseView: () => void;
  onEditInvoice: (id: string) => void;
  onCreateInvoice: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  // selection
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  allFilteredSelected: boolean;
  clearSelection: () => void;
  selectionSummary: InvoiceSelectionSummary;
  hasSelection: boolean;
  // payment
  banks: { id: string; name: string; accountNumber: string; balance: number; currency?: string }[];
  paymentInvoice: Invoice | null;
  isRecordingPayment: boolean;
  openPayment: (invoice: Invoice) => void;
  closePayment: () => void;
  submitPayment: (input: { amount: number; mode: PaymentMode; date: string; bankId?: string; note?: string }) => Promise<void>;
}

// ── Multi-select filter dropdown ──────────────────────────────────────────────
function InvoiceMultiFilter({ label, selected, onChange, options, displayName }: {
  label: string; selected: string[]; onChange: (v: string[]) => void;
  options: string[]; displayName?: (v: string) => string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const display = displayName ?? ((v: string) => v);
  React.useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const toggle = (opt: string) => onChange(selected.includes(opt) ? selected.filter(v => v !== opt) : [...selected, opt]);
  const has = selected.length > 0;
  return (
    <div ref={ref} style={{ display:'flex', flexDirection:'column', gap:4, minWidth:130, flex:1, position:'relative' }}>
      <label style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</label>
      <button type="button" onClick={() => setOpen(p => !p)}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'7px 10px',
          border:`1.5px solid ${has?'#334155':'#e2e8f0'}`, borderRadius:7, fontSize:12, backgroundColor:has?'#f1f5f9':'#fff',
          color:has?'#0f172a':'#9ca3af', cursor:'pointer', fontWeight:has?700:400, textAlign:'left' }}>
        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
          {has ? (selected.length === 1 ? display(selected[0]) : `${selected.length} selected`) : 'All'}
        </span>
        <ChevronDown size={13} style={{ flexShrink:0, marginLeft:4 }} />
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:999, backgroundColor:'#fff',
          border:'1px solid #e2e8f0', borderRadius:9, boxShadow:'0 8px 28px rgba(0,0,0,0.13)', minWidth:180, overflow:'hidden' }}>
          <div style={{ padding:'7px 10px', borderBottom:'1px solid #f1f5f9', display:'flex', gap:8 }}>
            <button type="button" onClick={() => onChange(options)} style={{ fontSize:11, fontWeight:700, color:'#334155', border:'none', background:'none', cursor:'pointer', padding:0 }}>Select all</button>
            <span style={{ color:'#e2e8f0' }}>|</span>
            <button type="button" onClick={() => onChange([])} style={{ fontSize:11, fontWeight:700, color:'#94a3b8', border:'none', background:'none', cursor:'pointer', padding:0 }}>Clear</button>
          </div>
          <div style={{ maxHeight:220, overflowY:'auto' }}>
            {options.map(opt => {
              const checked = selected.includes(opt);
              return (
                <div key={opt} onClick={() => toggle(opt)}
                  style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 12px', cursor:'pointer', fontSize:12,
                    backgroundColor:checked?'#f1f5f9':'transparent', color:checked?'#0f172a':'#374151', fontWeight:checked?600:400, userSelect:'none' }}>
                  <span style={{ width:15, height:15, borderRadius:4, flexShrink:0, border:`2px solid ${checked?'#0f172a':'#d1d5db'}`,
                    backgroundColor:checked?'#0f172a':'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  {display(opt)}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {has && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginTop:2 }}>
          {selected.map(v => (
            <span key={v} style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 6px', borderRadius:99, fontSize:10, fontWeight:700, backgroundColor:'#0f172a', color:'#fff' }}>
              {display(v)}
              <span onClick={e => { e.stopPropagation(); toggle(v); }} style={{ cursor:'pointer', display:'flex', alignItems:'center' }}>
                <X size={9} color="#fff" />
              </span>
            </span>
          ))}
        </div>
      )}
    </div>

  );
}

function deliveryBadge(status: string) {
  const map: Record<string, string> = {
    'Delivered':    'bg-green-100 text-green-800',
    'Self-collect': 'bg-blue-100 text-blue-800',
    'LCS':          'bg-yellow-100 text-yellow-800',
    'Daewoo':       'bg-purple-100 text-purple-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
}

function receivedBadge(status: string) {
  const map: Record<string, string> = {
    'Received':   'bg-green-100 text-green-800',
    'In Process': 'bg-yellow-100 text-yellow-800',
    'Pending':    'bg-gray-100 text-gray-600',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Paid: 'bg-green-100 text-green-800',
    Partial: 'bg-amber-100 text-amber-800',
    Unpaid: 'bg-red-100 text-red-800',
    Returned: 'bg-gray-200 text-gray-600',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

interface PaymentModalBank { id: string; name: string; accountNumber: string; balance: number; currency?: string; }
interface PaymentInput { amount: number; mode: PaymentMode; date: string; bankId?: string; note?: string; }

function PaymentModal({
  invoice, banks, isSaving, onClose, onSubmit, formatDisplay,
}: {
  invoice: Invoice; banks: PaymentModalBank[]; isSaving: boolean;
  onClose: () => void; onSubmit: (input: PaymentInput) => void;
  formatDisplay: (n: number) => string;
}) {
  const total = invoice.totalAmount || 0;
  const alreadyPaid = calculatePaidAmount(invoice);
  const remaining = Math.max(0, total - alreadyPaid);

  const [amount, setAmount] = useState<number>(remaining);
  const [mode, setMode] = useState<PaymentMode>('Cash');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bankId, setBankId] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const willClear = amount >= remaining && remaining > 0;
  const valid = amount > 0 && (mode !== 'Bank' || !!bankId);

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div
        ref={el => {
          if (el) {
            el.style.setProperty('width', '520px', 'important');
            el.style.setProperty('min-width', '0', 'important');
            el.style.setProperty('max-width', '92vw', 'important');
          }
        }}
        style={{ background: '#ffffff', borderRadius: 12, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <div>
            <h3 className="text-base font-bold text-gray-900">Record Payment</h3>
            <p className="text-xs text-gray-400">{invoice.invoiceNumber} · {invoice.customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-200"><X size={18} /></button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total', value: formatDisplay(total), color: 'text-gray-900' },
              { label: 'Already Paid', value: formatDisplay(alreadyPaid), color: 'text-green-600' },
              { label: 'Remaining', value: formatDisplay(remaining), color: 'text-red-600' },
            ].map(c => (
              <div key={c.label} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{c.label}</div>
                <div className={`text-sm font-extrabold mt-0.5 ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Amount Paying Now *</label>
              <input type="number" min="0" max={remaining || undefined} value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {willClear
              ? <>Full remaining amount — invoice moves to <strong className="text-green-700">Paid</strong>.</>
              : <>Partial payment — invoice stays <strong className="text-amber-700">Partial</strong>.</>}
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Payment Method *</label>
            <div className="grid grid-cols-2 gap-2">
              {([['Cash', Banknote], ['Bank', Landmark]] as [PaymentMode, any][]).map(([m, Icon]) => {
                const sel = mode === m;
                return (
                  <button key={m} type="button" onClick={() => setMode(m)}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold transition ${
                      sel ? 'border-gray-800 bg-gray-100 text-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    <Icon size={16} /> {m === 'Bank' ? 'Bank Transfer' : 'Cash'}
                  </button>
                );
              })}
            </div>
          </div>

          {mode === 'Bank' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Receiving Bank *</label>
              <select value={bankId} onChange={e => setBankId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900">
                <option value="">Select bank account</option>
                {banks.map(b => <option key={b.id} value={b.id}>{b.name} — {b.accountNumber}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Note <span className="font-normal text-gray-400">(optional)</span></label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. cash received at counter"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px 20px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
          <button onClick={onClose} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium whitespace-nowrap flex-shrink-0">
            <X size={15} style={{ flexShrink: 0 }} /> <span>Cancel</span>
          </button>
          <button onClick={() => onSubmit({ amount, mode, date, bankId: bankId || undefined, note: note || undefined })}
            disabled={!valid || isSaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-bold disabled:opacity-50 whitespace-nowrap flex-shrink-0 hover:brightness-125 transition"
            style={{ backgroundColor: '#1f2937' }}>
            {isSaving
              ? <><Loader2 size={15} className="animate-spin" style={{ flexShrink: 0 }} /> <span>Saving…</span></>
              : <span>Confirm Payment</span>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ── Quick Invoice Creation Modal ─────────────────────────────────────────────
function QuickInvoiceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const vm = useInvoiceFormViewModel();

  // ── Customer ──────────────────────────────────────────────────────────────
  const [custName,     setCustName]     = React.useState('');
  const [custPhone,    setCustPhone]    = React.useState('');
  const [custCNIC,     setCustCNIC]     = React.useState('');
  const [custCity,     setCustCity]     = React.useState('');
  const [custCountry,  setCustCountry]  = React.useState('');
  const [custAddress,  setCustAddress]  = React.useState('');
  const [showSugg,     setShowSugg]     = React.useState(false);
  const [salesperson,  setSalesperson]  = React.useState('');
  const [delivery,     setDelivery]     = React.useState('Self-collect');
  const [saving,       setSaving]       = React.useState(false);

  const [savedCustomers, setSavedCustomers] = React.useState<any[]>([]);
  const savedSps: string[] = (vm as any).savedSalespersons || [];

  // Fetch customers directly
  React.useEffect(() => {
    import('firebase/firestore').then(({ collection, getDocs, query, orderBy }) =>
      import('../../../api/firebase/firebase').then(({ db }) =>
        getDocs(query(collection(db, 'customers'), orderBy('customerName'))).then(snap => {
          setSavedCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }).catch(() => {})
      )
    );
  }, []);
  const custSugg = custName.trim()
    ? savedCustomers.filter((x: any) => x.customerName?.toLowerCase().includes(custName.toLowerCase()) || x.customerPhone?.includes(custName)).slice(0, 6)
    : savedCustomers.slice(0, 4);

  const fillCust = (x: any) => {
    setCustName(x.customerName||''); setCustPhone(x.customerPhone||'');
    setCustCNIC(x.customerCNIC||''); setCustCity(x.customerCity||'');
    setCustCountry(x.customerProvince||''); setCustAddress(x.customerAddress||'');
    setShowSugg(false);
  };

  // ── Products ──────────────────────────────────────────────────────────────
  const [allLocations, setAllLocations] = React.useState<string[]>([]);
  const [prodLocation, setProdLocation] = React.useState('');
  const [products,     setProducts]     = React.useState<any[]>([]);
  const [prodLoading,  setProdLoading]  = React.useState(true);

  // Load locations once
  React.useEffect(() => {
    import('firebase/firestore').then(({ collection, getDocs, query, where }) =>
      import('../../../api/firebase/firebase').then(({ db }) =>
        getDocs(query(collection(db, 'products'), where('stock', '>', 0))).then(snap => {
          const locs = new Set<string>();
          snap.docs.forEach(d => { const l = (d.data() as any).location; if (l) locs.add(l); });
          setAllLocations(Array.from(locs).sort());
        }).catch(() => {})
      )
    );
  }, []);

  // Fetch products — all at once, filter client-side (avoids composite index requirement)
  const fetchProducts = React.useCallback((loc: string) => {
    setProdLoading(true);
    import('firebase/firestore').then(({ collection, getDocs, query, where }) =>
      import('../../../api/firebase/firebase').then(({ db }) =>
        getDocs(query(collection(db, 'products'), where('stock', '>', 0))).then(snap => {
          const all = snap.docs.map(d => {
            const data = d.data() as any;
            return {
              id: d.id,
              label: `${data.brandName || ''} ${data.modelName || ''}`.trim(),
              brandName: data.brandName || '', modelName: data.modelName || '',
              location: data.location || '',
              sellPrice: data.sellPrice || data.salePrice || 0,
              stock: data.stock || 0,
              serialNumbers: data.serialNumbers || [],
              serialStatus: data.serialStatus || {},
              supplierCost: data.ownershipType === 'Credit' ? (data.supplierCost || data.costPrice || 0) : 0,
              purchaseCost: data.ownershipType === 'Credit' ? 0 : (data.costPrice || data.purchaseCost || 0),
              ownershipType: data.ownershipType || 'Owned',
              category: data.category || '',
              description: data.description || '',
            };
          });
          // Extract locations for filter
          const locs = new Set<string>();
          all.forEach(p => { if (p.location) locs.add(p.location); });
          setAllLocations(Array.from(locs).sort());
          // Filter by location client-side
          setAllProductsCache(all);
          setProducts(all); // initially show all, location filter applies after
        }).catch(() => setProducts([])).finally(() => setProdLoading(false))
      )
    );
  }, []);

  const [allProductsCache, setAllProductsCache] = React.useState<any[]>([]);
  React.useEffect(() => { fetchProducts(''); }, [fetchProducts]);
  React.useEffect(() => { if (allProductsCache.length > 0) setProducts(prodLocation ? allProductsCache.filter((p:any) => p.location === prodLocation) : allProductsCache); }, [prodLocation, allProductsCache]);

  // ── Lines ─────────────────────────────────────────────────────────────────
  type Line = { id: string; productId: string; serial: string; qty: number; price: number };
  const [lines, setLines] = React.useState<Line[]>([{ id: '1', productId: '', serial: '', qty: 1, price: 0 }]);

  const addLine    = () => setLines(p => [...p, { id: String(Date.now()), productId: '', serial: '', qty: 1, price: 0 }]);
  const removeLine = (id: string) => setLines(p => p.length > 1 ? p.filter(l => l.id !== id) : p);
  const updateLine = (id: string, field: keyof Line, val: any) =>
    setLines(p => p.map(l => {
      if (l.id !== id) return l;
      const u = { ...l, [field]: val };
      if (field === 'productId') {
        const prod = products.find((x: any) => x.id === val);
        u.price  = prod?.sellPrice || 0;
        u.serial = '';
      }
      return u;
    }));

  const getSerials = (productId: string, lineId: string) => {
    const prod = products.find((x: any) => x.id === productId);
    if (!prod) return [];
    const used = lines.filter(l => l.id !== lineId && l.productId === productId).map(l => l.serial);
    return (prod.serialNumbers || []).filter((s: string) => prod.serialStatus?.[s] !== 'Sold' && !used.includes(s));
  };

  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!custName.trim()) { toast.error('Customer name is required'); return; }
    if (!lines.some(l => l.productId)) { toast.error('Select at least one product'); return; }
    setSaving(true);
    try {
      const { InvoiceFirebaseService } = await import('../models/InvoiceFirebaseService');
      const { CustomerFirebaseService } = await import('../models/CustomerFirebaseService');
      const validLines = lines.filter(l => l.productId);
      const invoiceProducts = validLines.map((l, i) => {
        const p = products.find((x: any) => x.id === l.productId);
        return {
          id: String(i), productId: l.productId,
          productName: p ? `${p.brandName} ${p.modelName}` : '',
          brandName: p?.brandName || '', modelName: p?.modelName || '',
          category: p?.category || '', description: p?.description || '',
          quantity: l.qty, price: l.price, total: l.qty * l.price,
          serialNumbers: l.serial ? [l.serial] : [], currency: 'AED',
          supplierCost: p?.supplierCost || 0,
          purchaseCost: p?.purchaseCost || 0,
          ownershipType: p?.ownershipType,
        };
      });
      await InvoiceFirebaseService.createInvoice({
        invoiceNumber: vm.formData.invoiceNumber || '',
        date: vm.formData.date || new Date().toLocaleDateString('en-CA'),
        customerName: custName, customerPhone: custPhone,
        customerCNIC: custCNIC, customerCity: custCity,
        customerProvince: custCountry, customerAddress: custAddress || undefined,
        salesperson: salesperson || undefined,
        exchangeWarrantyNote: '',
        deliveryStatus: delivery, deliveryReceivedStatus: 'Pending',
        status: 'Unpaid', paymentStatus: 'unpaid',
        collectionMethod: 'Unpaid', payments: [],
        paidAmount: 0, remainingAmount: total, totalAmount: total,
        supplierCostTotal: invoiceProducts.reduce((s, p) => s + (p.supplierCost||0)*p.quantity, 0),
        purchaseCostTotal: invoiceProducts.reduce((s, p) => s + (p.purchaseCost||0)*p.quantity, 0),
        miscExpense: 0, deductionCharges: 0, cargoAmount: 0, customsAmount: 0, agentAmount: 0,
        selectedCurrencies: ['AED'], branch: '', digitalStamp: false,
        products: invoiceProducts,
      } as any);

      // ── Deduct stock from inventory ──────────────────────────────────────────
      const { collection, getDoc, doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../../../api/firebase/firebase');
      for (const l of validLines) {
        try {
          const prodRef = doc(db, 'products', l.productId);
          const snap = await getDoc(prodRef);
          if (!snap.exists()) continue;
          const pdata = snap.data() as any;
          const newSerialStatus = { ...(pdata.serialStatus || {}) };
          const newSerialSoldDates = { ...(pdata.serialSoldDates || {}) };
          const soldDate = new Date().toISOString();

          if (l.serial) {
            // Mark specific serial as Sold
            newSerialStatus[l.serial] = 'Sold';
            newSerialSoldDates[l.serial] = soldDate;
          } else {
            // No serial chosen — mark first available serial as Sold
            const avail = (pdata.serialNumbers || []).find((s: string) => newSerialStatus[s] !== 'Sold');
            if (avail) { newSerialStatus[avail] = 'Sold'; newSerialSoldDates[avail] = soldDate; }
          }

          const newStock = Math.max(0, (pdata.stock || 0) - l.qty);
          const allSold = (pdata.serialNumbers || []).length > 0 &&
            (pdata.serialNumbers || []).every((s: string) => newSerialStatus[s] === 'Sold');

          await updateDoc(prodRef, {
            stock: newStock,
            serialStatus: newSerialStatus,
            serialSoldDates: newSerialSoldDates,
            status: allSold || newStock === 0 ? 'Sold' : pdata.status,
            updatedAt: soldDate,
          });
        } catch (stockErr) {
          console.warn('[Invoice] Stock deduction failed for', l.productId, stockErr);
        }
      }

      // Auto-save customer
      CustomerFirebaseService.upsertCustomer({
        customerName: custName, customerPhone: custPhone,
        customerCNIC: custCNIC, customerCity: custCity,
        customerProvince: custCountry, customerAddress: custAddress||undefined,
        exchangeWarrantyNote: '',
      } as any).catch(() => {});
      toast.success(`✅ Invoice ${vm.formData.invoiceNumber} created`);
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create invoice');
    } finally { setSaving(false); }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const iSty: React.CSSProperties = { width:'100%', border:'1px solid #e2e8f0', borderRadius:8, padding:'7px 11px', fontSize:12, color:'#111827', backgroundColor:'#fff', outline:'none', boxSizing:'border-box' };
  const lbl:  React.CSSProperties = { fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:4 };
  const card: React.CSSProperties = { backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 14px' };

  return createPortal(
    <div onClick={onClose}
      style={{ position:'fixed', inset:0, backgroundColor:'rgba(15,23,42,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width:660, maxWidth:'96vw', maxHeight:'92vh', backgroundColor:'#f8fafc', borderRadius:14, overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.35)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ backgroundColor:'#fff', padding:'12px 18px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:'#111827' }}>Create Invoice</div>
            <div style={{ fontSize:11, color:'#94a3b8' }}>{vm.formData.invoiceNumber||'…'} · {vm.formData.date}</div>
          </div>
          <button onClick={onClose} style={{ width:26, height:26, borderRadius:6, border:'1px solid #e2e8f0', backgroundColor:'#f8fafc', cursor:'pointer', fontSize:16, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:10 }}>

          {/* ── Customer ── */}
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:700, color:'#0f172a', marginBottom:8 }}>Customer</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {/* Name autocomplete */}
              <div style={{ position:'relative' }}>
                <label style={lbl}>Name *</label>
                <input value={custName}
                  onChange={e => { setCustName(e.target.value); setShowSugg(true); }}
                  onFocus={() => setShowSugg(true)}
                  onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                  placeholder="Type name or search…"
                  style={{ ...iSty, fontWeight: custName?600:400 }} />
                {showSugg && custSugg.length > 0 && (
                  <div style={{ position:'absolute', top:'calc(100% + 2px)', left:0, right:0, zIndex:200, backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:9, boxShadow:'0 8px 20px rgba(0,0,0,0.15)', maxHeight:140, overflowY:'auto' }}>
                    {custSugg.map((s: any, i: number) => (
                      <div key={i} onMouseDown={() => fillCust(s)}
                        style={{ padding:'7px 12px', cursor:'pointer', borderBottom:'1px solid #f9fafb' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor='#f8fafc'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor=''}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{s.customerName}</div>
                        <div style={{ fontSize:11, color:'#94a3b8' }}>{s.customerPhone}{s.customerCity?` · ${s.customerCity}`:''}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Row: phone + CNIC */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div>
                  <label style={lbl}>Phone</label>
                  <input type="tel" value={custPhone} onChange={e=>setCustPhone(e.target.value)} style={iSty} />
                </div>
                <div>
                  <label style={lbl}>Identity</label>
                  <input value={custCNIC} onChange={e=>setCustCNIC(e.target.value)} style={iSty} />
                </div>
              </div>
              {/* Row: city + country + address */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                <div>
                  <label style={lbl}>City</label>
                  <input value={custCity} onChange={e=>setCustCity(e.target.value)} style={iSty} />
                </div>
                <div>
                  <label style={lbl}>Country</label>
                  <input value={custCountry} onChange={e=>setCustCountry(e.target.value)} style={iSty} />
                </div>
                <div>
                  <label style={lbl}>Address</label>
                  <input value={custAddress} onChange={e=>setCustAddress(e.target.value)} style={iSty} />
                </div>
              </div>
              {/* Salesperson */}
              <div>
                <label style={lbl}>Salesperson</label>
                <input value={salesperson} onChange={e=>setSalesperson(e.target.value)} list="modal-sp-list" style={iSty} placeholder="Select or type…" />
                <datalist id="modal-sp-list">{savedSps.map(s => <option key={s} value={s}/>)}</datalist>
              </div>
            </div>
          </div>

          {/* ── Products ── */}
          <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden' }}>
            {/* Header with location filter */}
            <div style={{ padding:'8px 12px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>Products</span>
              <select value={prodLocation} onChange={e => setProdLocation(e.target.value)}
                style={{ fontSize:11, border:'1px solid #e2e8f0', borderRadius:6, padding:'4px 8px', color:prodLocation?'#0f172a':'#94a3b8', backgroundColor:prodLocation?'#f1f5f9':'#f9fafb', cursor:'pointer', outline:'none' }}>
                <option value="">All locations ({products.length})</option>
                {allLocations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {prodLoading && <Loader2 size={13} color="#94a3b8" style={{ animation:'spin 1s linear infinite' }}/>}
              <button onClick={addLine}
                style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'none', backgroundColor:'#0f172a', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                <Plus size={11}/> Add Product
              </button>
            </div>

            {/* Column headers */}
            <div style={{ display:'grid', gridTemplateColumns:'2.2fr 1.1fr 48px 88px 24px', gap:5, padding:'5px 12px', backgroundColor:'#f9fafb', borderBottom:'1px solid #e2e8f0' }}>
              {['Product','Serial No.','Qty','Price (AED)',''].map(h => (
                <div key={h} style={{ fontSize:9, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</div>
              ))}
            </div>

            {/* Product rows */}
            {lines.map((l, i) => {
              const serials = getSerials(l.productId, l.id);
              return (
                <div key={l.id} style={{ display:'grid', gridTemplateColumns:'2.2fr 1.1fr 48px 88px 24px', gap:5, padding:'6px 12px', borderBottom: i<lines.length-1 ? '1px solid #f3f4f6' : 'none', alignItems:'center' }}>
                  <select value={l.productId} onChange={e => updateLine(l.id,'productId',e.target.value)}
                    style={{ border:'1px solid #e2e8f0', borderRadius:7, padding:'5px 6px', fontSize:11, outline:'none', width:'100%', backgroundColor:'#fff', color:l.productId?'#111827':'#94a3b8' }}>
                    <option value="">{prodLoading ? 'Loading…' : products.length===0 ? 'No products' : `— select product —`}</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.brandName} {p.modelName} (AED {(p.sellPrice||0).toLocaleString()}, {p.stock} left{p.location?` · ${p.location}`:''})</option>
                    ))}
                  </select>
                  <select value={l.serial} onChange={e => updateLine(l.id,'serial',e.target.value)}
                    disabled={!l.productId}
                    style={{ border:'1px solid #e2e8f0', borderRadius:7, padding:'5px 4px', fontSize:11, outline:'none', width:'100%', backgroundColor:'#fff', opacity:l.productId?1:0.4 }}>
                    <option value="">— any —</option>
                    {serials.map((s: string) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="number" min={1} value={l.qty} onChange={e=>updateLine(l.id,'qty',parseInt(e.target.value)||1)}
                    style={{ border:'1px solid #e2e8f0', borderRadius:7, padding:'5px 3px', fontSize:12, outline:'none', width:'100%', textAlign:'center' }}/>
                  <input type="number" min={0} step="any" value={l.price||''} onChange={e=>updateLine(l.id,'price',parseFloat(e.target.value)||0)}
                    placeholder="0.00"
                    style={{ border:'1px solid #e2e8f0', borderRadius:7, padding:'5px 4px', fontSize:12, outline:'none', width:'100%', textAlign:'right' }}/>
                  <button onClick={() => removeLine(l.id)} disabled={lines.length===1}
                    style={{ border:'none', background:'transparent', cursor:lines.length===1?'not-allowed':'pointer', opacity:lines.length===1?0.3:1, display:'flex', padding:0 }}>
                    <X size={13} color="#ef4444"/>
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Delivery ── */}
          <div style={card}>
            <label style={{ ...lbl, marginBottom:7 }}>Delivery Method</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['Self-collect','Courier','COD','Self Delivered'].map(v => (
                <button key={v} onClick={() => setDelivery(v)}
                  style={{ padding:'6px 12px', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:600,
                    border:`2px solid ${delivery===v?'#111827':'#e2e8f0'}`,
                    backgroundColor:delivery===v?'#111827':'#fff',
                    color:delivery===v?'#fff':'#6b7280' }}>{v}</button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ backgroundColor:'#fff', borderTop:'1px solid #e2e8f0', padding:'11px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ fontSize:13, color:'#6b7280' }}>
            Total: <strong style={{ color:'#111827', fontSize:15 }}>AED {total.toLocaleString('en-AE',{minimumFractionDigits:2})}</strong>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #d1d5db', backgroundColor:'#fff', color:'#374151', fontWeight:600, fontSize:13, cursor:'pointer' }}>Cancel</button>
            <button onClick={handleGenerate} disabled={saving}
              style={{ padding:'8px 20px', borderRadius:8, border:'none', backgroundColor:saving?'#94a3b8':'#111827', color:'#fff', fontWeight:700, fontSize:13, cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6 }}>
              {saving ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : <><Check size={14}/> Generate Invoice</>}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


export function InvoiceListView({
  invoices, filteredInvoices, stats, filters, viewingInvoice, isLoading,
  onSearch, onStatusFilter, onCityFilter, onSalespersonFilter,
  onDateFromFilter, onDateToFilter, onClearFilters,
  availableCities, availableSalespersons,
  salespersonMap = {},
  onViewInvoice, onCloseView, onEditInvoice, onCreateInvoice,
  formatCurrency, formatDate,
  selectedIds, isSelected, toggleSelect, toggleSelectAll, allFilteredSelected,
  clearSelection, selectionSummary, hasSelection,
  banks, paymentInvoice, isRecordingPayment, openPayment, closePayment, submitPayment,
}: Props) {

  const spName = (idOrName: string | undefined): string => {
    if (!idOrName) return '—';
    if (salespersonMap[idOrName]) return salespersonMap[idOrName];
    const looksLikeId = idOrName.length > 15 && !/\s/.test(idOrName);
    if (looksLikeId) return idOrName.slice(0, 8) + '…';
    return idOrName;
  };

  const [generatingPdf, setGeneratingPdf] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const formatDisplay = (aedAmount: number): string => formatAed(aedAmount);

  // FIX: Added toast.error() so the user sees feedback when PDF generation
  // fails, instead of the error being silently swallowed in the catch block.
  const handleDownloadPdf = async (invoice: Invoice) => {
    if (generatingPdf.has(invoice.id)) return;
    setGeneratingPdf(prev => new Set(prev).add(invoice.id));
    try {
      await downloadInvoicePdf(invoice);
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('PDF download failed. Please try again.');
    } finally {
      setGeneratingPdf(prev => { const n = new Set(prev); n.delete(invoice.id); return n; });
    }
  };

  // PDF preview state
  const [previewUrl,     setPreviewUrl]     = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const openPdfPreview = useCallback(async (invoice: Invoice) => {
    setPreviewLoading(true);
    setPreviewUrl(null);
    try {
      const blob = await generateInvoicePdf(invoice);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      toast.error('Failed to generate PDF preview');
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const closePdfPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [previewUrl]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const hasActiveFilters =
    !!filters.searchTerm ||
    (Array.isArray(filters.statusFilter) ? filters.statusFilter.length > 0 : filters.statusFilter !== 'all') ||
    !!filters.dateFrom || !!filters.dateTo ||
    (Array.isArray(filters.cityFilter) ? filters.cityFilter.length > 0 : !!filters.cityFilter) ||
    (Array.isArray(filters.salespersonFilter) ? filters.salespersonFilter.length > 0 : !!filters.salespersonFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 pb-28">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {filteredInvoices.length} of {invoices.length} invoices shown
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices/deleted')}
            title="Deleted Invoices"
            style={{ borderColor: '#fecaca', color: '#b91c1c' }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white font-semibold text-sm whitespace-nowrap flex-shrink-0 hover:bg-red-50 transition-colors">
            <Trash2 size={16} /> Deleted Invoices
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ backgroundColor: '#1f2937', color: '#ffffff', border: '1px solid #374151' }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg active:scale-95 transition-all font-semibold shadow-md whitespace-nowrap flex-shrink-0">
            <Plus size={18} /> Create Invoice
          </button>
        </div>
      </div>



      {/* ── Filter Bar — multi-select ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Filters</span>
          {hasActiveFilters && (
            <button onClick={onClearFilters} className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
              <XCircle size={13} /> Clear all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3 items-start">
          <InvoiceMultiFilter label="Status"
            selected={Array.isArray(filters.statusFilter) ? filters.statusFilter as string[] : []}
            onChange={v => onStatusFilter(v as any)}
            options={['Paid', 'Unpaid', 'Partial']} />
          <InvoiceMultiFilter label="City"
            selected={Array.isArray(filters.cityFilter) ? filters.cityFilter as string[] : (filters.cityFilter ? [filters.cityFilter as string] : [])}
            onChange={v => onCityFilter(v)}
            options={availableCities} />
          <InvoiceMultiFilter label="Salesperson"
            selected={Array.isArray(filters.salespersonFilter) ? filters.salespersonFilter as string[] : (filters.salespersonFilter ? [filters.salespersonFilter as string] : [])}
            onChange={v => onSalespersonFilter(v)}
            options={availableSalespersons}
            displayName={sp => spName(sp)} />
          <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:130 }}>
            <label style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.06em' }}>From Date</label>
            <input type="date" value={filters.dateFrom} onChange={e => onDateFromFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white text-gray-900" />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:130 }}>
            <label style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.06em' }}>To Date</label>
            <input type="date" value={filters.dateTo} onChange={e => onDateToFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white text-gray-900" />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-gray-800" title="Select all filtered" />
                </th>
                {[
                  'Invoice #', 'Date', 'Customer', 'Branch / City',
                  'Salesperson', 'Products', 'Amount (AED)',
                  'Supplier Cost', 'Purchase Cost', 'COGS', 'Misc Exp',
                  'Net Sale', 'Paid', 'Amount Left',
                  'Delivery', 'Status', 'Actions',
                ].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={18} className="px-4 py-14 text-center text-gray-400">
                    <FileText className="mx-auto mb-3 text-gray-300" size={44} />
                    <p className="font-medium text-gray-500">No invoices found</p>
                    <p className="text-xs mt-1">
                      {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first invoice to get started'}
                    </p>
                  </td>
                </tr>
              ) : filteredInvoices.map(invoice => {
                const supplierCost = calculateSupplierCost(invoice);
                const purchaseCost = calculatePurchaseCost(invoice);
                const misc = calculateMiscExpense(invoice);
                const netSale = (invoice.totalAmount || 0) - misc;
                const paid = calculatePaidAmount(invoice);
                const remaining = calculateRemainingAmount(invoice);
                const selected = isSelected(invoice.id);
                return (
                <tr key={invoice.id} className={`transition-colors ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>

                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selected} onChange={() => toggleSelect(invoice.id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-gray-800" />
                  </td>

                  <td className="px-3 py-3 font-semibold text-gray-800 whitespace-nowrap">
                    {invoice.invoiceNumber}
                  </td>

                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(invoice.date)}
                  </td>

                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900">{invoice.customerName}</p>
                    <p className="text-xs text-gray-400">{invoice.customerPhone}</p>
                    {invoice.customerPhone2 && (
                      <p className="text-xs text-gray-400">{invoice.customerPhone2}</p>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-800 text-sm">{invoice.customerCity || '—'}</p>
                    {invoice.salespersonLocation && (
                      <p className="text-xs text-gray-400 mt-0.5">{invoice.salespersonLocation}</p>
                    )}
                    {invoice.productLocation && (
                      <p className="text-xs text-gray-600 mt-0.5">Stock: {invoice.productLocation}</p>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    {invoice.salesperson ? (
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{spName(invoice.salesperson)}</p>
                        {invoice.clientDealBy && (
                          <p className="text-xs text-gray-400 mt-0.5">Deal: {spName(invoice.clientDealBy)}</p>
                        )}
                        {invoice.referralBy && (
                          <p className="text-xs text-gray-400">Ref: {invoice.referralBy}</p>
                        )}
                      </div>
                    ) : <span className="text-gray-300 text-sm">—</span>}
                  </td>

                  <td className="px-3 py-3" style={{ maxWidth: 200 }}>
                    {invoice.products.map((p: any, pi: number) => (
                      <div key={pi} style={{ marginBottom: pi < invoice.products.length - 1 ? 4 : 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                          {p.productName || p.modelName || '—'}
                        </div>
                        {p.serialNumbers?.length > 0 && (
                          <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                            {p.serialNumbers.slice(0, 2).join(', ')}{p.serialNumbers.length > 2 ? ` +${p.serialNumbers.length - 2}` : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </td>

                  <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">
                    {formatDisplay(invoice.totalAmount)}
                  </td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                    {(() => {
                      const hasSupplier = supplierCost > 0 && purchaseCost === 0;
                      return hasSupplier ? formatDisplay(supplierCost) : '—';
                    })()}
                  </td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                    {(() => {
                      const hasSupplierOnly = supplierCost > 0 && purchaseCost === 0;
                      return !hasSupplierOnly && purchaseCost > 0 ? formatDisplay(purchaseCost) : '—';
                    })()}
                  </td>
                  {/* COGS = whichever cost applies (mutually exclusive) */}
                  <td className="px-3 py-3 whitespace-nowrap font-semibold" style={{ color: '#7c3aed' }}>
                    {(() => {
                      const hasSupplierOnly = supplierCost > 0 && purchaseCost === 0;
                      const cogs = hasSupplierOnly ? supplierCost : purchaseCost;
                      return cogs > 0 ? formatDisplay(cogs) : '—';
                    })()}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{misc > 0 ? <span className="text-red-600 font-medium">{formatDisplay(misc)}</span> : '—'}</td>
                  <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">{formatDisplay(netSale)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {invoice.status === 'Unpaid'
                      ? <span className="text-gray-300">—</span>
                      : paid > 0
                      ? <span className="text-green-700 font-semibold">{formatDisplay(paid)}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {invoice.status === 'Paid'
                      ? <span className="text-green-600 font-semibold">Cleared</span>
                      : invoice.status === 'Unpaid'
                      ? <span className="text-red-600 font-semibold">{formatDisplay(invoice.totalAmount)}</span>
                      : remaining > 0
                      ? <span className="text-red-600 font-semibold">{formatDisplay(remaining)}</span>
                      : <span className="text-green-600 font-semibold">Cleared</span>}
                  </td>

                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${deliveryBadge(invoice.deliveryStatus)}`}>
                      {invoice.deliveryStatus}
                    </span>
                    {invoice.deliveryReceivedStatus && invoice.deliveryReceivedStatus !== 'Pending' && (
                      <span className={`block mt-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${receivedBadge(invoice.deliveryReceivedStatus)}`}>
                        {invoice.deliveryReceivedStatus}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    {invoice.status !== 'Paid' && invoice.status !== 'Returned' && (
                      <button onClick={() => openPayment(invoice)}
                        className="inline-flex items-center justify-center text-xs font-semibold px-3 py-1.5 rounded-md text-white whitespace-nowrap hover:brightness-125 transition"
                        style={{ backgroundColor: '#1f2937' }}>
                        Record Payment
                      </button>
                    )}
                    {invoice.paymentMode && invoice.status !== 'Unpaid' && (
                      <div className="mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          invoice.paymentMode === 'Cash'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {invoice.paymentMode === 'Cash' ? 'Cash' : 'Bank'}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openPdfPreview(invoice)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View PDF">
                        <Eye size={15} />
                      </button>

                      <button onClick={() => navigate(`/invoices/${invoice.id}/delete`)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(invoice)}
                        disabled={generatingPdf.has(invoice.id)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40"
                        title="Download PDF">
                        {generatingPdf.has(invoice.id)
                          ? <Loader2 size={15} className="animate-spin" />
                          : <FileDown size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
            {filteredInvoices.length > 0 && (() => {
              const src = hasSelection
                ? filteredInvoices.filter(i => isSelected(i.id))
                : filteredInvoices;
              const tTotal    = src.reduce((s, i) => s + (i.totalAmount || 0), 0);
              const tSupplier = src.reduce((s, i) => s + calculateSupplierCost(i), 0);
              const tPurchase = src.reduce((s, i) => s + calculatePurchaseCost(i), 0);
              const tMisc     = src.reduce((s, i) => s + calculateMiscExpense(i), 0);
              const tNet      = tTotal - tMisc;
              const tPaid     = src.reduce((s, i) => s + calculatePaidAmount(i), 0);
              const tLeft     = src.reduce((s, i) => s + calculateRemainingAmount(i), 0);
              return (
                <tfoot>
                  <tr style={{ backgroundColor: '#0f172a' }}>
                    {/* Label cell */}
                    <td colSpan={7} style={{ padding: '0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                          {hasSelection ? `${src.length} selected` : `All ${src.length}`}
                        </span>
                        {hasSelection && (
                          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, backgroundColor: '#1e293b', color: '#94a3b8', fontWeight: 700 }}>
                            of {filteredInvoices.length} total
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Amount (AED) */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Amount</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{formatDisplay(tTotal)}</div>
                    </td>
                    {/* Supplier Cost */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Supplier</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8' }}>
                        {src.some(i => calculateSupplierCost(i) > 0 && calculatePurchaseCost(i) === 0)
                          ? formatDisplay(src.filter(i => calculatePurchaseCost(i) === 0).reduce((s, i) => s + calculateSupplierCost(i), 0))
                          : '—'}
                      </div>
                    </td>
                    {/* Purchase Cost */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Purchase</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8' }}>{tPurchase > 0 ? formatDisplay(tPurchase) : '—'}</div>
                    </td>
                    {/* COGS — sum of whichever cost applies per invoice (mutually exclusive) */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', borderLeft: '1px solid #1e293b', borderRight: '1px solid #1e293b' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>COGS</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#c4b5fd' }}>
                        {(() => {
                          const tCogs = src.reduce((s, i) => {
                            const sc = calculateSupplierCost(i);
                            const pc = calculatePurchaseCost(i);
                            return s + (sc > 0 && pc === 0 ? sc : pc);
                          }, 0);
                          return tCogs > 0 ? formatDisplay(tCogs) : '—';
                        })()}
                      </div>
                    </td>
                    {/* Misc Exp */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Misc Exp</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fca5a5' }}>{tMisc > 0 ? formatDisplay(tMisc) : '—'}</div>
                    </td>
                    {/* Net Sale */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', borderLeft: '1px solid #1e293b' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Net Sale</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{formatDisplay(tNet)}</div>
                    </td>
                    {/* Paid */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Paid</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#86efac' }}>{tPaid > 0 ? formatDisplay(tPaid) : '—'}</div>
                    </td>
                    {/* Amount Left */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Left</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: tLeft > 0 ? '#fca5a5' : '#86efac' }}>
                        {tLeft > 0 ? formatDisplay(tLeft) : '—'}
                      </div>
                    </td>
                    <td colSpan={3} style={{ padding: '10px 12px' }}></td>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>
      </div>

      {/* ── Payment Modal ── */}
      {paymentInvoice && (
        <PaymentModal invoice={paymentInvoice} banks={banks} isSaving={isRecordingPayment}
          onClose={closePayment} onSubmit={submitPayment} formatDisplay={formatDisplay} />
      )}

      {/* ── View Modal ── */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Invoice Details</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{viewingInvoice.invoiceNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(viewingInvoice)}
                  disabled={generatingPdf.has(viewingInvoice.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-40">
                  {generatingPdf.has(viewingInvoice.id)
                    ? <><Loader2 size={13} className="animate-spin" /> Generating…</>
                    : <><FileDown size={14} /> Download PDF</>}
                </button>
                <button onClick={onCloseView} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">

              {/* ── Customer & Invoice Info ── */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer & Invoice</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500">Invoice #</p><p className="font-medium">{viewingInvoice.invoiceNumber}</p></div>
                  <div><p className="text-gray-500">Date</p><p className="font-medium">{formatDate(viewingInvoice.date)}</p></div>
                  <div>
                    <p className="text-gray-500">Customer</p>
                    <p className="font-medium">{viewingInvoice.customerName}</p>
                    <p className="text-xs text-gray-400">{viewingInvoice.customerPhone}</p>
                    {viewingInvoice.customerPhone2 && <p className="text-xs text-gray-400">{viewingInvoice.customerPhone2}</p>}
                  </div>
                  <div><p className="text-gray-500">CNIC</p><p className="font-medium font-mono text-xs">{viewingInvoice.customerCNIC}</p></div>
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium">{viewingInvoice.customerCity}{viewingInvoice.customerProvince ? `, ${viewingInvoice.customerProvince}` : ''}</p>
                    {viewingInvoice.customerAddress && <p className="text-xs text-gray-400 mt-0.5">{viewingInvoice.customerAddress}</p>}
                  </div>
                  {viewingInvoice.warrantyLocation && (
                    <div><p className="text-gray-500">Warranty Location</p><p className="font-medium">{viewingInvoice.warrantyLocation}</p></div>
                  )}
                </div>
              </div>

              {/* ── Branch / Sales Info ── */}
              {(viewingInvoice.salesperson || viewingInvoice.salespersonLocation || viewingInvoice.clientDealBy || viewingInvoice.referralBy || viewingInvoice.createdBy || viewingInvoice.productLocation) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Building2 size={12} /> Branch & Sales Info
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewingInvoice.salesperson && (
                      <div><p className="text-gray-500">Salesperson</p><p className="font-medium">{spName(viewingInvoice.salesperson)}</p></div>
                    )}
                    {viewingInvoice.salespersonLocation && (
                      <div><p className="text-gray-500">Branch / Location</p><p className="font-medium">{viewingInvoice.salespersonLocation}</p></div>
                    )}
                    {viewingInvoice.clientDealBy && (
                      <div><p className="text-gray-500">Client Deal By</p><p className="font-medium">{spName(viewingInvoice.clientDealBy)}</p></div>
                    )}
                    {viewingInvoice.referralBy && (
                      <div><p className="text-gray-500">Referral By</p><p className="font-medium">{viewingInvoice.referralBy}</p></div>
                    )}
                    {viewingInvoice.createdBy && (
                      <div><p className="text-gray-500">Created By</p><p className="font-medium">{spName(viewingInvoice.createdBy)}</p></div>
                    )}
                    {viewingInvoice.productLocation && (
                      <div><p className="text-gray-500">Product / Stock Location</p><p className="font-medium">{viewingInvoice.productLocation}</p></div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Products ── */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Products</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Product</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Serials</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingInvoice.products.map((p, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-gray-900">{p.productName}</p>
                            {p.brandName && <p className="text-xs text-gray-400">{p.brandName} · {p.modelName}</p>}
                            {p.category && <p className="text-xs text-gray-400">{p.category}</p>}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700">{p.quantity} × {formatDisplay(p.price)}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {(p.serialNumbers || []).map(s => (
                                <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">{s}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium">{formatDisplay(p.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Delivery ── */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Delivery Status</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${deliveryBadge(viewingInvoice.deliveryStatus)}`}>
                    {viewingInvoice.deliveryStatus}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Received Status</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${receivedBadge(viewingInvoice.deliveryReceivedStatus)}`}>
                    {viewingInvoice.deliveryReceivedStatus}
                  </span>
                </div>
                {viewingInvoice.collectionMethod && (
                  <div>
                    <p className="text-gray-500 mb-1">Collection Method</p>
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {viewingInvoice.collectionMethod}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Payment ── */}
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CreditCard size={12} /> Payment Details
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Pay Status</p>
                    <span className={`inline-flex mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                      viewingInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>{viewingInvoice.status}</span>
                  </div>
                  {viewingInvoice.paymentMode && (
                    <div><p className="text-gray-500">Mode</p><p className="font-medium">{viewingInvoice.paymentMode}</p></div>
                  )}
                  {viewingInvoice.paymentStatus && (
                    <div><p className="text-gray-500">Full / Partial</p><p className="font-medium">{viewingInvoice.paymentStatus}</p></div>
                  )}
                  {viewingInvoice.paymentStatus === 'Partial' && (
                    <>
                      <div><p className="text-gray-500">Paid Amount</p><p className="font-medium text-green-700">{formatDisplay(viewingInvoice.paidAmount || 0)}</p></div>
                      <div><p className="text-gray-500">Remaining</p><p className="font-medium text-red-600">{formatDisplay(viewingInvoice.remainingAmount || 0)}</p></div>
                    </>
                  )}
                  {viewingInvoice.paymentMode === 'Online' && viewingInvoice.bankName && (
                    <>
                      <div><p className="text-gray-500">Bank</p><p className="font-medium">{viewingInvoice.bankName}</p></div>
                      {viewingInvoice.bankAccountNumber && (
                        <div><p className="text-gray-500">Account #</p><p className="font-mono text-xs">{viewingInvoice.bankAccountNumber}</p></div>
                      )}
                    </>
                  )}
                  {viewingInvoice.paidBy && <div><p className="text-gray-500">Paid By</p><p className="font-medium">{viewingInvoice.paidBy}</p></div>}
                  {viewingInvoice.paidTo && <div><p className="text-gray-500">Paid To</p><p className="font-medium">{viewingInvoice.paidTo}</p></div>}
                </div>
              </div>

              {/* ── Totals ── */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatDisplay(viewingInvoice.totalAmount)}</span>
                </div>
                {(viewingInvoice.deductionCharges || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deduction Charges</span>
                    <span className="text-red-600 font-medium">−{formatDisplay(viewingInvoice.deductionCharges)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-1">
                  <span className="text-base font-bold text-gray-900">Net Total</span>
                  <span className="text-2xl font-bold text-gray-800">
                    {formatDisplay(viewingInvoice.totalAmount - (viewingInvoice.deductionCharges || 0))}
                  </span>
                </div>
              </div>

              {viewingInvoice.exchangeWarrantyNote && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                  <p className="text-xs font-semibold text-yellow-700 mb-1">Exchange / Warranty Note</p>
                  <p className="text-gray-700">{viewingInvoice.exchangeWarrantyNote}</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Quick Create Invoice Modal */}
      {showCreateModal && (
        <QuickInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onSaved={() => { setShowCreateModal(false); }}
        />
      )}

      {/* PDF Preview Modal */}
      {(previewUrl || previewLoading) && createPortal(
        <div onClick={closePdfPreview}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: '82vw', maxWidth: 960, height: '90vh', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Invoice Preview</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {previewUrl && (
                  <button onClick={() => { const a = document.createElement('a'); a.href = previewUrl!; a.download = 'invoice.pdf'; a.click(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7, border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    <FileDown size={14} /> Download
                  </button>
                )}
                <button onClick={closePdfPreview}
                  style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 18, fontWeight: 700 }}>
                  ×
                </button>
              </div>
            </div>
            {previewLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#64748b', fontSize: 14 }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Generating PDF…
              </div>
            ) : previewUrl ? (
              <iframe ref={previewRef} src={previewUrl} style={{ flex: 1, border: 'none', width: '100%' }} title="Invoice PDF Preview" />
            ) : null}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}