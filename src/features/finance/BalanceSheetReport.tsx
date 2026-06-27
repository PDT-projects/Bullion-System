// BalanceSheetReport.tsx
// Computes balance sheet figures from live Firestore data.
// Assets = Cash + Banks + Inventory + Loans Receivable
// Liabilities = Loans Payable + Pending Bills
// Equity = Assets − Liabilities (accounting identity)
//
// ALSO: renders a "Manual BS Classification" panel driven by the
// bsMainCategory / bsSubCategory fields saved on each transaction.
// Priority: manual classification (saved from form) → shown in dedicated section.

import React, { useMemo, useState } from 'react';
import { resolveBSBucket, getTransactionTotals } from '../../modules/transactions/models/transactionsService';
import type { Transaction } from '../../modules/transactions/models/types';
import { ArrowLeft, Tag, ChevronDown, ChevronUp, Filter, X, Calendar, MapPin } from 'lucide-react';
import { CurrencyCode, useCurrencyRates, convertFromPKR, fmtCurrency as fmtForeignCurrency, getCurrencyMeta } from './currencyUtils';
import { CurrencyDropdown } from './CurrencyPicker';

// Remove local type - use imported Transaction type
type Bank      = { id: string; name: string; balance: number; accountNumber: string; };
type Loan      = { id: string; type: 'Payable' | 'Receivable'; remaining: number; loanAmount: number; paid: number; status: string; };
type Product   = { id: string; costPrice: number; stock: number; };
type Bill      = { id: string; amount: number; status: string; };

type BalanceSheetReportProps = {
  transactions: Transaction[];
  banks: Bank[];
  loans: Loan[];
  products: Product[];
  onBack: () => void;
  // bills prop is optional — pass if available
  bills?: Bill[];
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-AE', {
    style: 'currency', currency: 'AED', minimumFractionDigits: 0
  }).format(amount);

const Row = ({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) => (
  <div className={`flex justify-between items-center py-2 border-b border-gray-100 ${bold ? 'font-semibold' : ''}`}>
    <span className={bold ? 'text-gray-900' : 'text-gray-700'}>{label}</span>
    <span className={bold ? 'font-bold text-lg text-gray-900' : 'font-medium text-gray-900'}>{formatCurrency(value)}</span>
  </div>
);

const SubTotal = ({ label, value, colorClass = 'bg-blue-50' }: { label: string; value: number; colorClass?: string }) => (
  <div className={`flex justify-between items-center py-3 ${colorClass} rounded-lg px-3 mt-2`}>
    <span className="font-semibold text-gray-900">{label}</span>
    <span className="font-bold text-lg text-gray-900">{formatCurrency(value)}</span>
  </div>
);

export function BalanceSheetReport({ transactions, banks, loans, products, bills = [], onBack }: BalanceSheetReportProps) {
  const [showBSClassified, setShowBSClassified] = useState(true);
  const [expandedSubs,     setExpandedSubs]     = useState<Set<string>>(new Set());

  const today    = new Date().toISOString().split('T')[0];
  const thisYear = new Date().getFullYear();
  const getTransactionLocation = (t: any): string => {
    const c = t.company || '';
    if (c.includes('Dubai'))         return 'Dubai';
    if (c.includes('Saudi Arabia'))  return 'Saudi Arabia';
    if (c.includes('Chad'))          return 'Chad';
    if (c.includes('Abu Dhabi'))     return 'Abu Dhabi';
    if (c.includes('Sharjah'))       return 'Sharjah';
    if (c.includes('Oman'))          return 'Oman';
    if (c.includes('Qatar'))         return 'Qatar';
    if (c.includes('Kuwait'))        return 'Kuwait';
    return '';
  };
  const LOCATIONS = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => { const l = getTransactionLocation(t); if (l) s.add(l); });
    return ['Dubai','Saudi Arabia','Chad','Abu Dhabi','Sharjah','Oman','Qatar','Kuwait'].filter(l => s.has(l));
  }, [transactions]);

  // ── Filter state ────────────────────────────────────────────────────────────
  type FilterMode = 'alltime' | 'yearly' | 'monthly' | 'custom';
  const [filterMode,        setFilterMode]        = useState<FilterMode>('alltime');
  const [selectedYears,     setSelectedYears]     = useState<number[]>([]);
  const [selectedMonths,    setSelectedMonths]    = useState<string[]>([]);
  const [customFrom,        setCustomFrom]        = useState('');
  const [customTo,          setCustomTo]          = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const [primaryCurrency, setPrimaryCurrency] = useState<CurrencyCode>('AED');
  const [extraCurrencies, setExtraCurrencies]   = useState<CurrencyCode[]>(['USD', 'SAR', 'PKR']);
  const { rates, loading: ratesLoading, error: ratesError, lastUpdated } = useCurrencyRates();
  const reportCurrencyCodes: CurrencyCode[] = [primaryCurrency, ...extraCurrencies];

  const availableYears = useMemo(() => {
    const s = new Set<number>();
    transactions.forEach(t => {
      const y = parseInt((t.date || '').slice(0, 4));
      if (y > 2000 && y <= thisYear + 1) s.add(y);
    });
    return Array.from(s).sort((a, b) => b - a);
  }, [transactions]);

  const availableMonths = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => { const ym = (t.date || '').slice(0, 7); if (ym) s.add(ym); });
    return Array.from(s).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const toggleYear     = (y: number) => setSelectedYears(p => p.includes(y) ? p.filter(v => v !== y) : [...p, y]);
  const toggleMonth    = (m: string) => setSelectedMonths(p => p.includes(m) ? p.filter(v => v !== m) : [...p, m]);
  const toggleLocation = (l: string) => setSelectedLocations(p => p.includes(l) ? p.filter(v => v !== l) : [...p, l]);
  const hasActiveFilter = filterMode !== 'alltime' || selectedLocations.length > 0;

  const resetFilters = () => {
    setFilterMode('alltime'); setSelectedYears([]); setSelectedMonths([]);
    setCustomFrom(''); setCustomTo(''); setSelectedLocations([]);
  };

  const modeBtnStyle = (mode: FilterMode): React.CSSProperties => ({
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '8px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: filterMode === mode ? '#1e293b' : '#ffffff',
    color: filterMode === mode ? '#ffffff' : '#4b5563',
    borderColor: filterMode === mode ? '#1e293b' : '#d1d5db',
    boxShadow: filterMode === mode ? '0 1px 3px rgba(79,70,229,0.3)' : 'none',
  });

  const activePeriodLabel = () => {
    if (filterMode === 'alltime') return 'All Time';
    if (filterMode === 'yearly'  && selectedYears.length > 0)  return selectedYears.sort().join(', ');
    if (filterMode === 'monthly' && selectedMonths.length > 0) return `${selectedMonths.length} month(s)`;
    if (filterMode === 'custom'  && (customFrom || customTo))  return `${customFrom || '—'} → ${customTo || '—'}`;
    return 'All Time';
  };

  const toggleSub = (key: string) =>
    setExpandedSubs(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // ── Filtered transactions (approval + date + location) ─────────────────────
  const liquid = useMemo(() => {
    return transactions.filter(t => {
      const approved = t.approvalStatus === 'approved' || t.approvalStatus === 'not_required' || !t.approvalStatus;
      if (!approved) return false;

      const d = (t.date || '').slice(0, 10);

      // Date filter
      if (d) {
        if (filterMode === 'monthly' && selectedMonths.length > 0) {
          if (!selectedMonths.some(ym => d.startsWith(ym))) return false;
        } else if (filterMode === 'yearly' && selectedYears.length > 0) {
          if (!selectedYears.includes(parseInt(d.slice(0, 4)))) return false;
        } else if (filterMode === 'custom') {
          const from = customFrom || '2000-01-01';
          const to   = customTo   || '2099-12-31';
          if (d < from || d > to) return false;
        }
      }

      // Location filter
      if (selectedLocations.length > 0) {
        if (!selectedLocations.includes(getTransactionLocation(t))) return false;
      }

      return true;
    });
  }, [transactions, filterMode, selectedMonths, selectedYears, customFrom, customTo, selectedLocations]);



  // ── FULL BS Classification (manual + auto) ─────────────────────────────────
  const classifiedBS = useMemo(() => {
    const map = new Map<string, Map<string, { total: number; txns: Transaction[]; manual: boolean[] }>>();
    for (const t of liquid) {
      const bucket = resolveBSBucket(t);
      if (!bucket) continue;
      
      if (!map.has(bucket.bsMain)) map.set(bucket.bsMain, new Map());
      const inner = map.get(bucket.bsMain)!;
      if (!inner.has(bucket.bsSub)) inner.set(bucket.bsSub, { total: 0, txns: [], manual: [] });
      const entry = inner.get(bucket.bsSub)!;
      entry.total += t.amount || 0;
      entry.txns.push(t);
      entry.manual.push(!!(t.bsMainCategory && t.bsSubCategory));
    }
    return map;
  }, [liquid]);

  // ── Manual-only for legacy panel (backwards compatible)
  const bsClassified = useMemo(() => {
    const map = new Map<string, Map<string, { total: number; txns: Transaction[] }>>();
    for (const t of liquid) {
      if (!t.bsMainCategory || !t.bsSubCategory) continue;
      if (!map.has(t.bsMainCategory)) map.set(t.bsMainCategory, new Map());
      const inner = map.get(t.bsMainCategory)!;
      if (!inner.has(t.bsSubCategory)) inner.set(t.bsSubCategory, { total: 0, txns: [] });
      const entry = inner.get(t.bsSubCategory)!;
      entry.total += t.amount || 0;
      entry.txns.push(t);
    }
    return map;
  }, [liquid]);

  const bsClassifiedCount = useMemo(() => {
    let count = 0;
    bsClassified.forEach(inner => inner.forEach(v => { count += v.txns.length; }));
    return count;
  }, [bsClassified]);

  const bsSectionTotal = (main: string) => {
    const inner = bsClassified.get(main);
    if (!inner) return 0;
    let total = 0;
    inner.forEach(v => { total += v.total; });
    return total;
  };

  const bs = useMemo(() => {
    // ── ASSETS ──────────────────────────────────────────────────────────────
    // Cash in Hand: only the amounts actually paid in Cash mode.
    const cashIn  = liquid.filter(t => t.mainCategory === 'Cash Inflow'  && t.mode === 'Cash')
      .reduce((s, t) => s + getTransactionTotals(t).totalPaid, 0);
    const cashOut = liquid.filter(t => t.mainCategory === 'Cash Outflow' && t.mode === 'Cash')
      .reduce((s, t) => s + getTransactionTotals(t).totalPaid, 0);
    const cashInHand = Math.max(0, cashIn - cashOut);

    // Bank balance: from banks collection
    const bankBalance = banks.reduce((s, b) => s + (b.balance || 0), 0);

    // Accounts receivable: pending inflow (partial / cheque uncleared)
    const accountsReceivable = liquid
      .filter(t => t.mainCategory === 'Cash Inflow' && (t.remainingAmount ?? 0) > 0)
      .reduce((s, t) => s + (t.remainingAmount ?? 0), 0);

    // Inventory value: sum of (costPrice × stock)
    const inventoryValue = products.reduce((s, p) => s + (p.costPrice || 0) * (p.stock || 0), 0);

    // Loans receivable (what others owe us)
    const loansReceivable = loans
      .filter(l => l.type === 'Receivable' && l.status !== 'Full')
      .reduce((s, l) => s + (l.remaining || 0), 0);

    // Add manually classified assets that are not already represented by the standard totals.
    const knownAssetBuckets = new Set(['Cash & Cash Equivalents', 'Inventory', 'Accounts Receivable', 'Loans Receivable']);
    const classifiedAssets = Array.from(classifiedBS.get('Assets')?.entries() || [])
      .filter(([sub]) => !knownAssetBuckets.has(sub))
      .reduce((sum, [, entry]) => sum + entry.total, 0);
    const totalCurrentAssets = cashInHand + bankBalance + accountsReceivable + inventoryValue + loansReceivable + classifiedAssets;

    // Fixed assets — keep as 0 unless a fixed asset module is added
    const totalFixedAssets = 0;

    const totalAssets = totalCurrentAssets + totalFixedAssets;

    // ── LIABILITIES ──────────────────────────────────────────────────────────
    // Accounts payable: pending outflow
    const accountsPayable = liquid
      .filter(t => t.mainCategory === 'Cash Outflow' && (t.remainingAmount ?? 0) > 0)
      .reduce((s, t) => s + (t.remainingAmount ?? 0), 0);

    // Loans payable
    const loansPayable = loans
      .filter(l => l.type === 'Payable' && l.status !== 'Full')
      .reduce((s, l) => s + (l.remaining || 0), 0);

    // Pending bills
    const pendingBills = bills
      .filter(b => b.status === 'Pending' || b.status === 'Overdue')
      .reduce((s, b) => s + b.amount, 0);

    // Add manually classified liabilities that are not already included in standard current liability totals.
    const knownLiabilityBuckets = new Set(['Accounts Payable', 'Short-term Loans']);
    const classifiedLiabilities = Array.from(classifiedBS.get('Liabilities & Equity')?.entries() || [])
      .filter(([sub]) => !knownLiabilityBuckets.has(sub))
      .reduce((sum, [, entry]) => sum + entry.total, 0);
    const totalCurrentLiabilities = accountsPayable + loansPayable + pendingBills + classifiedLiabilities;
    const totalLiabilities        = totalCurrentLiabilities;

    // ── EQUITY ───────────────────────────────────────────────────────────────
    // Fundamental accounting equation: Assets = Liabilities + Equity
    const totalEquity                 = totalAssets - totalLiabilities;
    const totalLiabilitiesAndEquity   = totalLiabilities + totalEquity;

    return {
      assets: {
        cashInHand, bankBalance, accountsReceivable,
        inventoryValue, loansReceivable,
        totalCurrentAssets, totalFixedAssets, totalAssets,
      },
      liabilities: {
        accountsPayable, loansPayable, pendingBills,
        totalCurrentLiabilities, totalLiabilities,
      },
      equity: { totalEquity },
      totalLiabilitiesAndEquity,
      balanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1,
    };
  }, [liquid, banks, loans, products, bills]);

  // Stored amounts are already in AED. Show AED as-is; convert only for other currencies.
  const convertFromAED = (aed: number, code: CurrencyCode) =>
    code === 'AED' ? aed : convertFromPKR(aed, code, rates);

  const currencyMetrics = useMemo(() => reportCurrencyCodes.map(code => ({
    code,
    totalAssets: convertFromAED(bs.assets.totalAssets, code),
    totalLiabilities: convertFromAED(bs.liabilities.totalLiabilities, code),
    totalEquity: convertFromAED(bs.equity.totalEquity, code),
  })), [rates, reportCurrencyCodes, bs.assets.totalAssets, bs.liabilities.totalLiabilities, bs.equity.totalEquity]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Balance Sheet</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Computed from live data · {activePeriodLabel()}
            {selectedLocations.length > 0 && (
              <span className="ml-2 text-purple-600 font-medium">· {selectedLocations.join(', ')}</span>
            )}
            {bsClassifiedCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-slate-800">
                <Tag size={12} /> {bsClassifiedCount} manually classified
              </span>
            )}
          </p>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <ArrowLeft size={16} /> Back to Reports Hub
        </button>
      </div>

      {/* ── Filter Panel ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-800" />
            <h2 className="font-semibold text-gray-900">Filters</h2>
            {hasActiveFilter && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-slate-800">Active</span>
            )}
          </div>
          {hasActiveFilter && (
            <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
              <X size={12} /> Reset all
            </button>
          )}
        </div>

        {/* ── Location filter ── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={13} className="text-purple-500" />
            <span className="text-xs font-semibold text-gray-700">Location / Branch</span>
            {selectedLocations.length > 0 && (
              <button onClick={() => setSelectedLocations([])} className="text-xs text-red-400 hover:text-red-600 ml-auto">Clear</button>
            )}
          </div>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            <button onClick={() => setSelectedLocations([])} style={{padding:'6px 16px',fontSize:'12px',fontWeight:600,borderRadius:'8px',border:'1px solid',cursor:'pointer',background:selectedLocations.length===0?'#1e293b':'#ffffff',color:selectedLocations.length===0?'#ffffff':'#374151',borderColor:selectedLocations.length===0?'#1e293b':'#d1d5db'}}>
              All Locations
            </button>
            {LOCATIONS.map(loc => (
              <button key={loc} onClick={() => toggleLocation(loc)} style={{padding:'6px 16px',fontSize:'12px',fontWeight:600,borderRadius:'8px',border:'1px solid',cursor:'pointer',display:'flex',alignItems:'center',gap:'4px',background:selectedLocations.includes(loc)?'#1e293b':'#ffffff',color:selectedLocations.includes(loc)?'#ffffff':'#374151',borderColor:selectedLocations.includes(loc)?'#1e293b':'#d1d5db'}}>
                <MapPin size={11} style={{color:'inherit'}} />
                <span>{loc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Period filter ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={13} className="text-slate-600" />
            <span className="text-xs font-semibold text-gray-700">Period</span>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            <button style={modeBtnStyle('alltime')} onClick={() => setFilterMode('alltime')}>All Time</button>
            <button style={modeBtnStyle('yearly')}  onClick={() => setFilterMode('yearly')}>By Year</button>
            <button style={modeBtnStyle('monthly')} onClick={() => setFilterMode('monthly')}>By Month</button>
            <button style={modeBtnStyle('custom')}  onClick={() => setFilterMode('custom')}>Custom Range</button>
          </div>

          {filterMode === 'yearly' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Select one or more years</span>
                {selectedYears.length > 0 && <button onClick={() => setSelectedYears([])} className="text-xs text-red-400 hover:text-red-600">Clear</button>}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableYears.map(y => (
                  <button key={y} onClick={() => toggleYear(y)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      selectedYears.includes(y) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-700 border-gray-300 hover:border-slate-600'
                    }`}>{y}</button>
                ))}
                {availableYears.length === 0 && <p className="text-xs text-gray-400 italic">No data available</p>}
              </div>
              {selectedYears.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {[...selectedYears].sort().map(y => (
                    <span key={y} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-slate-800 text-xs rounded-full">
                      {y}<button onClick={() => toggleYear(y)}><X size={9} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {filterMode === 'monthly' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Select one or more months</span>
                {selectedMonths.length > 0 && <button onClick={() => setSelectedMonths([])} className="text-xs text-red-400 hover:text-red-600">Clear</button>}
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                {availableMonths.map(ym => (
                  <button key={ym} onClick={() => toggleMonth(ym)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      selectedMonths.includes(ym) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-700 border-gray-300 hover:border-slate-600'
                    }`}>{monthLabel(ym)}</button>
                ))}
                {availableMonths.length === 0 && <p className="text-xs text-gray-400 italic">No data available</p>}
              </div>
              {selectedMonths.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {[...selectedMonths].sort().map(ym => (
                    <span key={ym} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-slate-800 text-xs rounded-full">
                      {monthLabel(ym)}<button onClick={() => toggleMonth(ym)}><X size={9} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {filterMode === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">From</label>
                <input type="date" value={customFrom} max={customTo || undefined} onChange={e => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">To</label>
                <input type="date" value={customTo} min={customFrom || undefined} onChange={e => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 text-sm" />
              </div>
            </div>
          )}
        </div>

        {/* Active filter summary */}
        <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
          <Calendar size={11} className="text-slate-500 flex-shrink-0" />
          <span>
            Period: <strong className="text-gray-700">{activePeriodLabel()}</strong>
            {selectedLocations.length > 0 && (
              <> · Location: <strong className="text-purple-600">{selectedLocations.join(', ')}</strong></>
            )}
            {' '}· <strong className="text-gray-700">{liquid.length}</strong> transactions
          </span>
        </div>
      </div>



      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Currency conversion summary</h3>
              <p className="text-xs text-gray-500">Choose the report currency and optional extra conversions.</p>
            </div>
            <CurrencyDropdown
              primary={primaryCurrency}
              extras={extraCurrencies}
              onPrimaryChange={setPrimaryCurrency}
              onExtrasChange={setExtraCurrencies}
              loading={ratesLoading}
              error={ratesError}
              lastUpdated={lastUpdated}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <span>{ratesLoading ? 'Loading exchange rates…' : ratesError ? 'Using fallback rates' : `Updated ${lastUpdated ? lastUpdated.toLocaleTimeString('en-US') : '—'}`}</span>
            {ratesError && <span className="text-amber-600">Using estimated rates</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currencyMetrics.map(item => (
              <div key={item.code} className="rounded-xl border border-gray-100 p-4 bg-slate-50">
                <div className="text-sm font-semibold text-gray-900">{getCurrencyMeta(item.code).flag} {item.code}</div>
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <div>
                    <div className="text-xs text-gray-500">Total Assets</div>
                    <div className="font-semibold text-gray-900">{fmtForeignCurrency(item.totalAssets, item.code)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Total Liabilities</div>
                    <div className="font-semibold text-gray-900">{fmtForeignCurrency(item.totalLiabilities, item.code)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Equity</div>
                    <div className="font-semibold text-gray-900">{fmtForeignCurrency(item.totalEquity, item.code)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── ASSETS ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">ASSETS</h2>

          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Current Assets</h3>
          <div className="space-y-1 mb-4">
            <Row label="Cash in Hand"          value={bs.assets.cashInHand} />
            <Row label="Bank Balance"          value={bs.assets.bankBalance} />
            <Row label="Accounts Receivable"   value={bs.assets.accountsReceivable} />
            <Row label="Inventory Stock Value" value={bs.assets.inventoryValue} />
            <Row label="Loans Receivable"      value={bs.assets.loansReceivable} />
          </div>
          <SubTotal label="Total Current Assets" value={bs.assets.totalCurrentAssets} colorClass="bg-blue-50" />

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3 border-b border-gray-200 pb-2">Fixed Assets</h3>
          <p className="text-sm text-gray-400 italic mb-3">Fixed asset module not yet active</p>
          <SubTotal label="Total Fixed Assets" value={bs.assets.totalFixedAssets} colorClass="bg-blue-50" />

          <div className="border-t-2 border-gray-300 pt-4 mt-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg px-4">
              <span className="text-xl font-bold text-gray-900">Total Assets</span>
              <span className="text-2xl font-bold text-blue-600">{formatCurrency(bs.assets.totalAssets)}</span>
            </div>
          </div>
        </div>

        {/* ── LIABILITIES & EQUITY ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">LIABILITIES & EQUITY</h2>

          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Current Liabilities</h3>
          <div className="space-y-1 mb-4">
            <Row label="Accounts Payable (Pending)"  value={bs.liabilities.accountsPayable} />
            <Row label="Loans Payable (Outstanding)" value={bs.liabilities.loansPayable} />
            <Row label="Pending Bills"               value={bs.liabilities.pendingBills} />
          </div>
          <SubTotal label="Total Current Liabilities" value={bs.liabilities.totalCurrentLiabilities} colorClass="bg-red-50" />

          <div className="mt-4 mb-6">
            <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-3">
              <span className="font-semibold text-gray-900">Total Liabilities</span>
              <span className="font-bold text-lg text-red-600">{formatCurrency(bs.liabilities.totalLiabilities)}</span>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Equity</h3>
          <div className="space-y-1 mb-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Owner's Equity (Assets − Liabilities)</span>
              <span className={`font-medium ${bs.equity.totalEquity >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {formatCurrency(bs.equity.totalEquity)}
              </span>
            </div>
          </div>
          <SubTotal label="Total Equity" value={bs.equity.totalEquity} colorClass="bg-green-50" />

          <div className="border-t-2 border-gray-300 pt-4 mt-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4">
              <span className="text-xl font-bold text-gray-900">Total Liabilities & Equity</span>
              <span className="text-2xl font-bold text-green-600">{formatCurrency(bs.totalLiabilitiesAndEquity)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Manual BS Classification Panel ── */}
      {bsClassifiedCount > 0 && (
        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 overflow-hidden">
          <button
            onClick={() => setShowBSClassified(v => !v)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-gray-200" />
              <h2 className="text-base font-bold text-gray-100">
                Balance Sheet — Manual Classification
              </h2>
              <span className="bg-gray-800 text-gray-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                {bsClassifiedCount} transactions
              </span>
            </div>
            {showBSClassified
              ? <ChevronUp size={20} className="text-gray-400" />
              : <ChevronDown size={20} className="text-gray-400" />
            }
          </button>
          {showBSClassified && (
            <div className="p-5 border-t border-gray-800 space-y-6">
              <p className="text-xs text-gray-400">
                Transactions with a manual Balance Sheet category override set in the transaction form.
                These reflect your deliberate classification and are shown here for reporting.
              </p>



              {Array.from(bsClassified.entries()).map(([mainCat, subMap]) => (
                <div key={mainCat}>
                  <div className={`flex justify-between items-center px-3 py-2 rounded-lg mb-3 font-semibold text-sm ${
                    mainCat === 'Assets' ? 'bg-blue-50 text-blue-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <span>{mainCat}</span>
                    <span>{formatCurrency(bsSectionTotal(mainCat))}</span>
                  </div>
                  {Array.from(subMap.entries()).map(([subCat, { total, txns }]) => {
                    const key      = `${mainCat}__${subCat}`;
                    const expanded = expandedSubs.has(key);
                    return (
                    <div key={subCat} className="mb-4">
                      <div className="flex justify-between items-center py-1.5 border-b border-gray-200 mb-2">
                        <span className="text-sm font-medium text-gray-700">{subCat}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(total)}</span>
                      </div>
                      <button
                        onClick={() => toggleSub(key)}
                        className="text-xs text-slate-600 hover:text-slate-800 mb-2 flex items-center gap-1"
                      >
                        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {txns.length} transaction{txns.length !== 1 ? 's' : ''}
                      </button>
                      {expanded && (
                        <div className="overflow-x-auto rounded-lg border border-gray-100">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                {['Date', 'Company', 'Sub Category', 'Amount'].map(h => (
                                  <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wider">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {txns.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-gray-700">{(t.date || '').slice(0, 10)}</td>
                                  <td className="px-3 py-2 text-gray-700">{t.company || '—'}</td>
                                  <td className="px-3 py-2 text-gray-500">{t.subCategory}</td>
                                  <td className="px-3 py-2 font-semibold text-gray-900">{formatCurrency(t.amount || 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Balance verification */}
      <div className={`rounded-xl p-6 border text-center ${bs.balanced ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-300'}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Balance Verification</h3>
        <div className="flex items-center justify-center gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Assets</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(bs.assets.totalAssets)}</p>
          </div>
          <span className="text-2xl text-gray-400">=</span>
          <div>
            <p className="text-xs text-gray-500 mb-1">Liabilities + Equity</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(bs.totalLiabilitiesAndEquity)}</p>
          </div>
        </div>
        <p className={`text-sm mt-3 font-medium ${bs.balanced ? 'text-green-600' : 'text-yellow-700'}`}>
          {bs.balanced ? '✓ Balance sheet is balanced' : '⚠ Minor rounding difference detected'}
        </p>
      </div>
     </div>
  );
}