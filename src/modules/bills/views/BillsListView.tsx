// Bills Module - View Layer
// Changes: AED primary multi-currency display (matches TransactionListView / PendingPaymentsView)

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Bill, BillFilters } from '../models/types';
import { BillsService } from '../models/billsService';
import { Button } from '../../../components/ui/button';
import {
  Plus, Search, Filter, Eye, Edit, Trash2, X, FileText, Printer,
  Zap, Wifi, Droplets, Receipt, CreditCard,
  ChevronDown, Check, Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';

interface BillsListViewProps {
  bills: Bill[];
  allBills: Bill[];
  filters: BillFilters;
  showFilters: boolean;
  activeFilterCount: number;
  viewingBill: Bill | null;
  viewingSlip: Bill | null;
  isLoading: boolean;
  stats: {
    totalBills: number; totalAmount: number;
    electricityCount: number; electricityTotal: number;
    internetCount: number; internetTotal: number;
    utilitiesCount: number; utilitiesTotal: number;
  };
  setFilter: (key: keyof BillFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setViewingBill: (bill: Bill | null) => void;
  setViewingSlip: (bill: Bill | null) => void;
  handleDelete: (id: string) => void;
  handleAdd: () => void;
  handleEdit: (id: string) => void;
  handlePrint: (bill: Bill) => void;
  getCategoryColor: (category: string) => string;
  getCategoryIconName: (category: string) => 'Zap' | 'Wifi' | 'Droplets' | 'Receipt';
}

// ─── Currency System ──────────────────────────────────────────────────────────

type CurrencyCode = 'PKR' | 'CAD' | 'AED' | 'SAR';

interface CurrencyMeta {
  code: CurrencyCode;
  label: string;
  countryCode: string;
  locale: string;
  decimals: number;
}

const CURRENCIES: CurrencyMeta[] = [
  { code: 'AED', label: 'UAE Dirham',      countryCode: 'AE', locale: 'en-AE', decimals: 2 },
  { code: 'PKR', label: 'Pakistani Rupee', countryCode: 'PK', locale: 'en-PK', decimals: 0 },
  { code: 'CAD', label: 'Canadian Dollar', countryCode: 'CA', locale: 'en-CA', decimals: 2 },
  { code: 'SAR', label: 'Saudi Riyal',     countryCode: 'SA', locale: 'en-US', decimals: 2 },
];

type RateMap = Record<CurrencyCode, number>;
const FALLBACK_RATES: RateMap = { PKR: 279.5, CAD: 1.38, AED: 3.67, SAR: 3.75 };

const getMeta = (code: CurrencyCode) => CURRENCIES.find(c => c.code === code)!;

const fmtAmount = (amount: number, meta: CurrencyMeta): string => {
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency', currency: meta.code,
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    }).format(amount);
  } catch {
    return `${meta.code} ${amount.toFixed(meta.decimals)}`;
  }
};

const convertFromPKR = (amount: number, target: CurrencyCode, rates: RateMap): number =>
  target === 'PKR' ? amount : (amount / rates.PKR) * rates[target];

// Bills are stored AED-denominated (the Bills form saves `amount` directly in AED
// and stamps `currency: 'AED'` on the record), unlike other modules that store PKR.
// This converts an AED-denominated bill amount into any target display currency.
const convertFromAED = (amount: number, target: CurrencyCode, rates: RateMap): number =>
  target === 'AED' ? amount : (amount / rates.AED) * rates[target];

function useCurrencyRates() {
  const [rates, setRates]             = useState<RateMap>(FALLBACK_RATES);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data.result === 'success') {
        setRates({ PKR: data.rates.PKR, CAD: data.rates.CAD, AED: data.rates.AED, SAR: data.rates.SAR });
        setLastUpdated(new Date());
        setError(false);
      } else throw new Error();
    } catch { setError(true); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetch_]);

  return { rates, loading, error, lastUpdated, refresh: fetch_ };
}

// ─── Currency Dropdown ────────────────────────────────────────────────────────

function CurrencyDropdown({
  primary, extras, onPrimaryChange, onExtrasChange, loading, error, lastUpdated,
}: {
  primary: CurrencyCode;
  extras: CurrencyCode[];
  onPrimaryChange: (c: CurrencyCode) => void;
  onExtrasChange:  (c: CurrencyCode[]) => void;
  loading: boolean;
  error: boolean;
  lastUpdated: Date | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const primaryMeta = getMeta(primary);

  const toggleExtra = (code: CurrencyCode) => {
    if (code === primary) return;
    onExtrasChange(extras.includes(code) ? extras.filter(c => c !== code) : [...extras, code]);
  };

  const selectPrimary = (code: CurrencyCode) => {
    onPrimaryChange(code);
    onExtrasChange(extras.filter(c => c !== code));
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            height: 38, padding: '0 14px',
            background: '#fff', border: '2px solid #94a3b8',
            borderRadius: 10, cursor: 'pointer',
            fontSize: 14, color: '#334155',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            outline: 'none', whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 800, color: '#475569', background: '#f1f5f9', padding: '2px 5px', borderRadius: 4, letterSpacing: '0.05em', lineHeight: 1 }}>
            {primaryMeta.countryCode}
          </span>
          <span style={{ fontWeight: 600, color: '#334155' }}>{primaryMeta.code}</span>
          {extras.length > 0 && (
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#1e293b', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
              +{extras.length}
            </span>
          )}
          <ChevronDown size={13} style={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </button>

        {open && (
          <div className="absolute top-full right-0 mt-2 w-[268px] bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.13)] z-50 overflow-hidden">
            <div className="px-4 pt-4 pb-1.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Primary Currency</p>
            </div>
            {CURRENCIES.map(cur => {
              const sel = primary === cur.code;
              return (
                <button key={cur.code} onClick={() => selectPrimary(cur.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${sel ? 'bg-slate-50' : 'hover:bg-gray-50'}`}>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded leading-none tracking-wide ${sel ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {cur.countryCode}
                  </span>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-sm font-semibold ${sel ? 'text-slate-800' : 'text-gray-700'}`}>{cur.code}</p>
                    <p className="text-[11px] text-gray-400 truncate">{cur.label}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${sel ? 'bg-slate-800' : 'bg-transparent'}`}>
                    {sel && <Check size={11} className="text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
            <div className="border-t border-gray-100 mx-4 mt-1" />
            <div className="px-4 pt-3 pb-1.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Also Show on Cards</p>
            </div>
            {CURRENCIES.filter(c => c.code !== primary).map(cur => {
              const chk = extras.includes(cur.code);
              return (
                <button key={cur.code} onClick={() => toggleExtra(cur.code)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors">
                  <span className="text-[10px] font-extrabold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded leading-none tracking-wide shrink-0">
                    {cur.countryCode}
                  </span>
                  <span className="text-sm text-gray-700 flex-1 truncate">
                    {cur.code}<span className="text-gray-400 font-normal"> · {cur.label}</span>
                  </span>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: chk ? '2px solid #1e293b' : '2px solid #d1d5db',
                    background: chk ? '#1e293b' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {chk && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
            <div className="h-3" />
          </div>
        )}
      </div>

      {loading && (
        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Loader2 size={11} className="animate-spin" /> Updating…
        </span>
      )}
      {error && !loading && (
        <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
          <AlertCircle size={11} /> Estimated rates
        </span>
      )}
      {lastUpdated && !loading && !error && (
        <span className="flex items-center gap-1.5 text-sm text-slate-500 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_4px_rgba(52,211,153,0.6)]" />
          Live · {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

// ─── Secondary currency rows ──────────────────────────────────────────────────

function CurrencyRows({ extras, aedAmount, rates }: { extras: CurrencyCode[]; aedAmount: number; rates: RateMap }) {
  if (extras.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-col gap-0.5">
      {extras.map(code => {
        const meta = getMeta(code);
        return (
          <p key={code} className="text-xs text-gray-400 tabular-nums">
            {fmtAmount(convertFromAED(aedAmount, code, rates), meta)}
          </p>
        );
      })}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHARCOAL       = '#1e293b';
const CHARCOAL_HOVER = '#334155';
const CHARCOAL_LIGHT = 'rgba(30,41,59,0.08)';

const CategoryIcon: React.FC<{ name: string }> = ({ name }) => {
  switch (name) {
    case 'Zap':      return <Zap className="w-4 h-4 text-yellow-600" />;
    case 'Wifi':     return <Wifi className="w-4 h-4 text-blue-600" />;
    case 'Droplets': return <Droplets className="w-4 h-4 text-cyan-600" />;
    default:         return <Receipt className="w-4 h-4 text-gray-600" />;
  }
};

const modeBadge = (mode: string) => {
  if (mode === 'Bank')   return 'bg-blue-100 text-blue-700';
  if (mode === 'Cheque') return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-700';
};

// ─── Main View ────────────────────────────────────────────────────────────────

export const BillsListView: React.FC<BillsListViewProps> = ({
  bills, filters, showFilters, activeFilterCount,
  viewingBill, viewingSlip, isLoading, stats,
  setFilter, clearFilters, toggleFilters,
  setViewingBill, setViewingSlip,
  handleDelete, handleAdd, handleEdit, handlePrint,
  getCategoryColor, getCategoryIconName,
}) => {
  // ── Currency state — AED primary, PKR secondary by default ──
  const [primaryCurrency, setPrimary] = useState<CurrencyCode>('AED');
  const [extraCurrencies, setExtras]  = useState<CurrencyCode[]>(['PKR']);
  const { rates, loading: ratesLoading, error: ratesError, lastUpdated, refresh: refreshRates } = useCurrencyRates();

  const fmtPrimary = (aed: number) =>
    fmtAmount(convertFromAED(aed, primaryCurrency, rates), getMeta(primaryCurrency));

  const fmtD = BillsService.formatDate;

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bills</h2>
          <p className="text-gray-600">Manage utility bills and recurring payments</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CurrencyDropdown
            primary={primaryCurrency} extras={extraCurrencies}
            onPrimaryChange={setPrimary} onExtrasChange={setExtras}
            loading={ratesLoading} error={ratesError} lastUpdated={lastUpdated}
          />
          <button
            onClick={refreshRates}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors bg-white border border-gray-200 rounded-xl px-3 py-2 hover:shadow-sm"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={toggleFilters}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
            style={showFilters
              ? { backgroundColor: CHARCOAL, color: '#fff', borderColor: CHARCOAL }
              : { backgroundColor: '#fff', color: '#374151', borderColor: '#d1d5db' }
            }>
            <Filter size={18} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <Button
            onClick={handleAdd}
            className="flex items-center gap-2 text-white hover:text-white"
            style={{ backgroundColor: CHARCOAL }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = CHARCOAL_HOVER)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = CHARCOAL)}
          >
            <Plus size={18} /> Add Bill
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bills',  aed: stats.totalAmount,       sub: `${stats.totalBills} records`,     icon: <Receipt size={18} style={{ color: CHARCOAL }} /> },
          { label: 'Electricity',  aed: stats.electricityTotal,  sub: `${stats.electricityCount} bills`, icon: <Zap size={18} className="text-yellow-600" /> },
          { label: 'Internet',     aed: stats.internetTotal,     sub: `${stats.internetCount} bills`,    icon: <Wifi size={18} className="text-blue-600" /> },
          { label: 'Utilities',    aed: stats.utilitiesTotal,    sub: `${stats.utilitiesCount} bills`,   icon: <Droplets size={18} className="text-cyan-600" /> },
        ].map(s => (
          <div key={s.label} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">{s.icon}<p className="text-sm text-gray-600">{s.label}</p></div>
            <p className="text-xl font-bold text-gray-900">{fmtPrimary(s.aed)}</p>
            <CurrencyRows extras={extraCurrencies} aedAmount={s.aed} rates={rates} />
            <p className="text-sm text-gray-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Vendor, company, cheque..."
                  value={filters.searchTerm} onChange={(e) => setFilter('searchTerm', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': CHARCOAL } as any} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={filters.categoryFilter} onChange={(e) => setFilter('categoryFilter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2">
                <option value="all">All Categories</option>
                <option value="Electricity">Electricity</option>
                <option value="Internet">Internet</option>
                <option value="Utilities">Utilities</option>
                <option value="Purchase Order">Purchase Order</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select value={filters.paymentMethodFilter} onChange={(e) => setFilter('paymentMethodFilter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2">
                <option value="">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input type="date" value={filters.dateFrom || ''} onChange={(e) => setFilter('dateFrom', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input type="date" value={filters.dateTo || ''} onChange={(e) => setFilter('dateTo', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div className="mt-3 flex justify-end">
              <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-800 font-medium">Clear all filters</button>
            </div>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-3" style={{ borderColor: CHARCOAL }} />
            <p className="text-gray-600">Loading bills...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Date', 'Category', 'Paid To', 'Company', 'Method', 'Amount', 'Paid', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {h === 'Amount' || h === 'Paid'
                        ? <>{h} <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-1">{primaryCurrency}</span></>
                        : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      <Receipt className="mx-auto mb-3 text-gray-300" size={48} />
                      <p className="text-lg font-medium">No bills found</p>
                      <p className="text-sm mt-1">Add a new bill to get started</p>
                    </td>
                  </tr>
                ) : bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{fmtD(bill.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CategoryIcon name={getCategoryIconName(bill.subCategory)} />
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(bill.subCategory)}`}>
                          {bill.subCategory}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 text-sm">{bill.paidTo || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{bill.company?.split(': ')[1] || bill.company}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${modeBadge(bill.mode)}`}>{bill.mode}</span>
                        {bill.bankName && <span className="text-xs text-gray-400">{bill.bankName}</span>}
                        {bill.chequeNumber && (
                          <span className="flex items-center gap-0.5 text-xs text-purple-600" title={`Cheque #${bill.chequeNumber}`}>
                            <CreditCard size={10} /> #{bill.chequeNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Amount */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-semibold text-gray-900 text-sm">{fmtPrimary(bill.amount)}</p>
                      <CurrencyRows extras={extraCurrencies} aedAmount={bill.amount} rates={rates} />
                    </td>
                    {/* Paid */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm text-green-700 font-medium">{fmtPrimary(bill.amountPaid ?? bill.amount)}</p>
                      <CurrencyRows extras={extraCurrencies} aedAmount={bill.amountPaid ?? bill.amount} rates={rates} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        bill.paymentStatus === 'Full' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{bill.paymentStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewingBill(bill)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View"><Eye size={15} /></button>
                        <button onClick={() => handleEdit(bill.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Edit"><Edit size={15} /></button>
                        <button onClick={() => setViewingSlip(bill)} className="p-1.5 rounded hover:bg-gray-100" style={{ color: CHARCOAL }} title="Slip"><FileText size={15} /></button>
                        <button onClick={() => handlePrint(bill)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Print"><Printer size={15} /></button>
                        <button onClick={() => handleDelete(bill.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── View Bill Modal ── */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold">Bill Details</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{viewingBill.transactionId}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setViewingBill(null); handleEdit(viewingBill.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                  <Edit size={13} /> Edit
                </button>
                <button onClick={() => setViewingBill(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={22} /></button>
              </div>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Date',           fmtD(viewingBill.date)],
                  ['Bill Month',     viewingBill.billMonth || '—'],
                  ['Company',        viewingBill.company?.split(': ')[1] || viewingBill.company],
                  ['Category',       viewingBill.subCategory],
                  ['Paid To',        viewingBill.paidTo || '—'],
                  ['Paid By',        viewingBill.paidBy || '—'],
                  ['Transaction By', viewingBill.transactionBy || '—'],
                  ['Mode',           viewingBill.mode],
                  ['Bank',           viewingBill.bankName || '—'],
                ].map(([l, v]) => (
                  <div key={l}><p className="text-gray-500 text-xs">{l}</p><p className="font-medium text-gray-900">{v}</p></div>
                ))}
              </div>
              {viewingBill.chequeNumber && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1.5"><CreditCard size={13} /> Cheque Details</p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div><p className="text-gray-400">Number</p><p className="font-semibold">{viewingBill.chequeNumber}</p></div>
                    <div><p className="text-gray-400">Date</p><p className="font-semibold">{viewingBill.chequeDate ? fmtD(viewingBill.chequeDate) : '—'}</p></div>
                    <div><p className="text-gray-400">Bank on Cheque</p><p className="font-semibold">{viewingBill.chequeBank || '—'}</p></div>
                  </div>
                </div>
              )}
              {/* Amount summary */}
              <div className="grid grid-cols-3 gap-3 border-t pt-4">
                {[
                  { label: 'Total Amount', aed: viewingBill.amount,                           cls: 'bg-blue-50 text-blue-700' },
                  { label: 'Paid',         aed: viewingBill.amountPaid ?? viewingBill.amount, cls: 'bg-green-50 text-green-700' },
                  { label: 'Remaining',    aed: viewingBill.remainingAmount ?? 0,             cls: 'bg-orange-50 text-orange-700' },
                ].map(({ label, aed, cls }) => (
                  <div key={label} className={`${cls} p-3 rounded-lg text-center`}>
                    <p className="text-xs opacity-70">{label}</p>
                    <p className="font-bold">{fmtPrimary(aed)}</p>
                    {extraCurrencies.map(code => (
                      <p key={code} className="text-[10px] opacity-60 mt-0.5">
                        {fmtAmount(convertFromAED(aed, code, rates), getMeta(code))}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t pt-3">
                <span className="text-xs text-gray-500">Payment Status:</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${viewingBill.paymentStatus === 'Full' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {viewingBill.paymentStatus}
                </span>
              </div>
              {viewingBill.note && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400 mb-1">Note</p><p className="font-medium">{viewingBill.note}</p></div>}
              {viewingBill.imageUrl && <div className="border-t pt-3"><p className="text-xs text-gray-500 mb-2">Receipt</p><img src={viewingBill.imageUrl} alt="Receipt" className="max-w-full h-auto rounded border" /></div>}
            </div>
          </div>
        </div>
      )}

      {/* ── View Slip Modal ── */}
      {viewingSlip && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Bill Payment Slip</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePrint(viewingSlip)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"><Printer size={20} /></button>
                <button onClick={() => setViewingSlip(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={22} /></button>
              </div>
            </div>
            <div className="p-8">
              <div className="text-center border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold" style={{ color: CHARCOAL }}>Pakistan Detectors Technologies</h2>
                <p className="text-sm text-gray-600 mt-1">{viewingSlip.company?.split(': ')[1] || viewingSlip.company}</p>
                <p className="text-lg font-semibold mt-3">BILL PAYMENT SLIP</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
                {[
                  ['Date', fmtD(viewingSlip.date)], ['Bill Month', viewingSlip.billMonth || '—'],
                  ['Category', viewingSlip.subCategory], ['Paid To', viewingSlip.paidTo || '—'],
                  ['Paid By', viewingSlip.paidBy || '—'], ['Transaction By', viewingSlip.transactionBy || '—'],
                ].map(([l, v]) => (
                  <div key={l}><p className="text-gray-500 text-xs">{l}</p><p className="font-semibold">{v}</p></div>
                ))}
                <div>
                  <p className="text-gray-500 text-xs">Payment Method</p>
                  <p className="font-semibold">
                    {viewingSlip.mode}{viewingSlip.bankName ? ` (${viewingSlip.bankName})` : ''}{viewingSlip.chequeNumber ? ` — Cheque #${viewingSlip.chequeNumber}` : ''}
                  </p>
                </div>
              </div>
              {viewingSlip.chequeNumber && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 text-xs">
                  <p className="font-semibold text-purple-700 mb-1 flex items-center gap-1"><CreditCard size={12} /> Cheque Details</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div><p className="text-gray-400">No.</p><p className="font-medium">{viewingSlip.chequeNumber}</p></div>
                    <div><p className="text-gray-400">Date</p><p className="font-medium">{viewingSlip.chequeDate ? fmtD(viewingSlip.chequeDate) : '—'}</p></div>
                    <div><p className="text-gray-400">Bank</p><p className="font-medium">{viewingSlip.chequeBank || '—'}</p></div>
                  </div>
                </div>
              )}
              <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: CHARCOAL_LIGHT }}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Amount Paid:</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold" style={{ color: CHARCOAL }}>{fmtPrimary(viewingSlip.amountPaid ?? viewingSlip.amount)}</span>
                    {extraCurrencies.map(code => (
                      <p key={code} className="text-xs text-gray-500 mt-0.5">
                        {fmtAmount(convertFromAED(viewingSlip.amountPaid ?? viewingSlip.amount, code, rates), getMeta(code))}
                      </p>
                    ))}
                  </div>
                </div>
                {(viewingSlip.remainingAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-yellow-700 mt-2">
                    <span>Remaining:</span>
                    <span className="font-semibold">{fmtPrimary(viewingSlip.remainingAmount ?? 0)}</span>
                  </div>
                )}
              </div>
              {viewingSlip.note && <div className="border-t pt-4 mb-4"><p className="text-sm font-semibold mb-1">Note:</p><p className="text-sm text-gray-600">{viewingSlip.note}</p></div>}
              {viewingSlip.imageUrl && <div className="border-t pt-4 mb-4"><p className="text-sm font-semibold mb-2">Receipt:</p><img src={viewingSlip.imageUrl} alt="Receipt" className="max-w-full h-auto rounded border" /></div>}
              <div className="border-t pt-4 text-center text-xs text-gray-400">Generated {new Date().toLocaleString('en-PK')}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};