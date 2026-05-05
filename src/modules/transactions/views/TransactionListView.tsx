// Transactions Module - Transaction List View
// Updated: multi-currency display (PKR / CAD / AED / SAR) matching Dashboard theme

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Edit, Trash2, Search, Download,
  TrendingUp, TrendingDown, Wallet, X,
  AlertCircle, Loader2, Filter,
  CheckCircle, Clock, ShieldAlert, Ban,
  ChevronDown, Check, RefreshCw, DollarSign,
} from 'lucide-react';
import {
  Transaction, TransactionFilters, TransactionStats,
  COMPANIES, MAIN_CATEGORIES,
} from '../models/types';
import { getTransactionTotals, isPending } from '../models/transactionsService';

// ─── Currency System (mirrored from Dashboard) ──────────────────────────────

type CurrencyCode = 'PKR' | 'CAD' | 'AED' | 'SAR';

interface CurrencyMeta {
  code: CurrencyCode;
  label: string;
  countryCode: string;
  locale: string;
  decimals: number;
}

const CURRENCIES: CurrencyMeta[] = [
  { code: 'PKR', label: 'Pakistani Rupee',  countryCode: 'PK', locale: 'en-PK', decimals: 0 },
  { code: 'CAD', label: 'Canadian Dollar',   countryCode: 'CA', locale: 'en-CA', decimals: 2 },
  { code: 'AED', label: 'UAE Dirham',        countryCode: 'AE', locale: 'en-AE', decimals: 2 },
  { code: 'SAR', label: 'Saudi Riyal',       countryCode: 'SA', locale: 'en-US', decimals: 2 },
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

// ─── Currency Dropdown ───────────────────────────────────────────────────────

interface CurrencyDropdownProps {
  primary: CurrencyCode;
  extras: CurrencyCode[];
  onPrimaryChange: (c: CurrencyCode) => void;
  onExtrasChange:  (c: CurrencyCode[]) => void;
  loading: boolean;
  error: boolean;
  lastUpdated: Date | null;
}

function CurrencyDropdown({
  primary, extras, onPrimaryChange, onExtrasChange, loading, error, lastUpdated,
}: CurrencyDropdownProps) {
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

// ─── Currency rows shown below main value on cards ───────────────────────────

function CurrencyRows({
  extras, pkrAmount, rates, dark = false,
}: {
  extras: CurrencyCode[];
  pkrAmount: number;
  rates: RateMap;
  dark?: boolean;
}) {
  if (extras.length === 0) return null;
  return (
    <div
      className={`mt-3 pt-2.5 flex flex-col gap-1.5 ${dark ? '' : 'border-t border-gray-100'}`}
      style={dark ? { borderTop: '1px solid rgba(255,255,255,0.1)' } : {}}
    >
      {extras.map(code => {
        const meta = getMeta(code);
        const amt  = convertFromPKR(pkrAmount, code, rates);
        return (
          <div key={code} className="flex items-center justify-between gap-2">
            <span
              className="flex items-center gap-1.5 text-xs"
              style={dark ? { color: 'rgba(255,255,255,0.45)' } : { color: '#9ca3af' }}
            >
              <span
                className="text-[10px] font-bold px-1 py-0.5 rounded leading-none"
                style={dark ? { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' } : { background: '#f3f4f6', color: '#6b7280' }}
              >
                {getMeta(code).countryCode}
              </span>
              {code}
            </span>
            <span
              className="text-xs font-semibold tabular-nums"
              style={dark ? { color: 'rgba(255,255,255,0.75)' } : { color: '#374151' }}
            >
              {fmtAmount(amt, meta)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label, icon, pkrAmount, primary, extras, rates,
  subtitle, amountColor, dark = false, countValue,
}: {
  label: string;
  icon: React.ReactNode;
  pkrAmount: number;
  primary: CurrencyCode;
  extras: CurrencyCode[];
  rates: RateMap;
  subtitle?: string;
  amountColor?: string;
  dark?: boolean;
  countValue?: React.ReactNode;
}) {
  const meta   = getMeta(primary);
  const amount = convertFromPKR(pkrAmount, primary, rates);

  if (dark) {
    return (
      <div
        className="rounded-2xl p-5 flex flex-col"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#334155 100%)', boxShadow: '0 4px 16px rgba(15,23,42,0.25)' }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
          {icon}
        </div>
        {countValue !== undefined ? (
          <>
            <p className={`text-2xl font-bold tabular-nums leading-none mb-1.5 ${amountColor ?? 'text-white'}`}>{countValue}</p>
            <p className="text-sm tabular-nums" style={{ color: 'rgba(255,255,255,0.5)' }}>{fmtAmount(amount, meta)}</p>
          </>
        ) : (
          <p className={`text-2xl font-bold tabular-nums leading-none mb-1.5 ${amountColor ?? 'text-white'}`}>
            {fmtAmount(amount, meta)}
          </p>
        )}
        {subtitle && <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{subtitle}</p>}
        <CurrencyRows extras={extras} pkrAmount={pkrAmount} rates={rates} dark />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-gray-400 tracking-wide">{label}</span>
        {icon}
      </div>
      {countValue !== undefined ? (
        <>
          <p className={`text-2xl font-bold tabular-nums leading-none mb-1 ${amountColor ?? 'text-gray-900'}`}>{countValue}</p>
          <p className="text-sm text-gray-500 tabular-nums">{fmtAmount(amount, meta)}</p>
        </>
      ) : (
        <p className={`text-2xl font-bold tabular-nums leading-none mb-1.5 ${amountColor ?? 'text-gray-900'}`}>
          {fmtAmount(amount, meta)}
        </p>
      )}
      {subtitle && <p className="text-xs text-gray-400 font-medium">{subtitle}</p>}
      <CurrencyRows extras={extras} pkrAmount={pkrAmount} rates={rates} />
    </div>
  );
}

// ─── IconBadge ────────────────────────────────────────────────────────────────

function IconBadge({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
      {children}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  stats: TransactionStats;
  filters: TransactionFilters;
  isLoading: boolean;
  viewTransaction: Transaction | null;
  setFilters: (f: Partial<TransactionFilters>) => void;
  setViewTransaction: (t: Transaction | null) => void;
  handleDeleteTransaction: (id: string) => void;
  handleCreateTransaction: () => void;
  handleEditTransaction: (id: string) => void;
  handleExportCSV: () => void;
  formatCurrency: (n: number) => string;
  formatDate: (d: string) => string;
  formatDateTime: (d: string, t?: string) => string;
  getCategoryColor: (c: string) => string;
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function TransactionListView({
  transactions, filteredTransactions, stats, filters, isLoading,
  viewTransaction, setFilters, setViewTransaction,
  handleDeleteTransaction, handleCreateTransaction, handleEditTransaction, handleExportCSV,
  formatCurrency, formatDate, formatDateTime, getCategoryColor,
}: Props) {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = React.useState(false);

  // Currency state — local to this view
  const [primaryCurrency, setPrimary] = useState<CurrencyCode>('PKR');
  const [extraCurrencies, setExtras]  = useState<CurrencyCode[]>([]);
  const { rates, loading: ratesLoading, error: ratesError, lastUpdated, refresh: refreshRates } = useCurrencyRates();

  const cardProps = { primary: primaryCurrency, extras: extraCurrencies, rates };

  // Convert a PKR amount for display in the chosen primary currency
  const fmtPrimary = (pkr: number) => fmtAmount(convertFromPKR(pkr, primaryCurrency, rates), getMeta(primaryCurrency));

  const modeBadge = (mode: string) => {
    const colors: Record<string, string> = {
      Cash:   'bg-blue-50 text-blue-700',
      Bank:   'bg-slate-100 text-slate-700',
      Cheque: 'bg-purple-50 text-purple-700',
    };
    return colors[mode] || 'bg-gray-100 text-gray-700';
  };

  const rowMeta = (t: Transaction): {
    rowClass: string;
    statusBadge: React.ReactNode;
    dimAmount: boolean;
  } => {
    if (t.approvalStatus === 'rejected') {
      return {
        rowClass:  'bg-red-50 opacity-75',
        dimAmount: true,
        statusBadge: (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">
            <Ban size={10} /> Rejected
          </span>
        ),
      };
    }
    if (t.approvalStatus === 'pending_approval') {
      return {
        rowClass:  'bg-amber-50',
        dimAmount: true,
        statusBadge: (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
            <ShieldAlert size={10} /> Awaiting Approval
          </span>
        ),
      };
    }
    const pending = isPending(t);
    return {
      rowClass:  '',
      dimAmount: false,
      statusBadge: pending ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700 border border-orange-100 whitespace-nowrap">
          <Clock size={10} /> Pending
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 border border-emerald-100 whitespace-nowrap">
          <CheckCircle size={10} /> Cleared
        </span>
      ),
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 min-h-full bg-gray-50/70">

      {/* ── Header — mirrors Dashboard top bar layout exactly ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: page title */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
          <p className="text-gray-400 text-sm mt-0.5">Record and manage all financial transactions</p>
        </div>

        {/* Right: currency picker · Live indicator · Refresh · Export · Add — same order as Dashboard */}
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
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium transition-all bg-white"
          >
            <Download size={15} /> Export
          </button>
          <button
            onClick={handleCreateTransaction}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 10,
              background: '#1e293b', color: '#fff',
              fontWeight: 700, fontSize: 14,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0f172a')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1e293b')}
          >
            <Plus size={15} /> Add Transaction
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
        <StatCard
          label="Total Inflow"
          icon={<IconBadge bg="bg-emerald-50"><TrendingUp size={15} className="text-emerald-500" /></IconBadge>}
          pkrAmount={stats.totalInflow}
          amountColor="text-emerald-600"
          {...cardProps}
        />
        <StatCard
          label="Total Outflow"
          icon={<IconBadge bg="bg-red-50"><TrendingDown size={15} className="text-red-400" /></IconBadge>}
          pkrAmount={stats.totalOutflow}
          amountColor="text-red-600"
          {...cardProps}
        />
        <StatCard
          label="Net Balance"
          icon={<IconBadge bg="bg-slate-50"><Wallet size={15} className="text-slate-500" /></IconBadge>}
          pkrAmount={stats.netBalance}
          amountColor={stats.netBalance >= 0 ? 'text-slate-800' : 'text-red-600'}
          {...cardProps}
        />
        <StatCard
          label="Pending"
          icon={<IconBadge bg="bg-amber-50"><AlertCircle size={15} className="text-amber-500" /></IconBadge>}
          pkrAmount={stats.totalPending}
          countValue={<span className="text-orange-500">{stats.pendingCount}</span>}
          amountColor="text-orange-600"
          {...cardProps}
        />
      </div>

      {stats.pendingApprovalCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
          <ShieldAlert size={18} className="shrink-0 text-amber-500" />
          <span>
            <strong>{stats.pendingApprovalCount} transaction{stats.pendingApprovalCount > 1 ? 's' : ''}</strong>{' '}
            {stats.pendingApprovalCount > 1 ? 'are' : 'is'} awaiting admin approval.
            These are <strong>not included</strong> in the financial totals above until approved.
          </span>
        </div>
      )}

      {/* ── Search + Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by TXN ID, company, category, note, paid by/to…"
              value={filters.searchTerm}
              onChange={e => setFilters({ searchTerm: e.target.value })}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-xl
                         focus:ring-2 focus:ring-slate-300 focus:border-slate-400 focus:outline-none
                         text-sm placeholder-gray-400 bg-gray-50 hover:bg-white transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
            }`}
          >
            <Filter size={14} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
            {[
              {
                label: 'Category',
                value: filters.mainCategory,
                onChange: (v: string) => setFilters({ mainCategory: v }),
                options: [
                  <option key="" value="">All Categories</option>,
                  ...MAIN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>),
                ],
              },
              {
                label: 'Payment Status',
                value: filters.paymentStatus,
                onChange: (v: string) => setFilters({ paymentStatus: v }),
                options: [
                  <option value="">All Statuses</option>,
                  <option value="Pending">Pending</option>,
                  <option value="Full">Cleared</option>,
                ],
              },
              {
                label: 'Approval Status',
                value: filters.approvalStatus,
                onChange: (v: string) => setFilters({ approvalStatus: v }),
                options: [
                  <option value="">All</option>,
                  <option value="pending_approval">Awaiting Approval</option>,
                  <option value="approved">Approved</option>,
                  <option value="rejected">Rejected</option>,
                  <option value="not_required">No Approval Required</option>,
                ],
              },
              {
                label: 'Company / Branch',
                value: filters.company,
                onChange: (v: string) => setFilters({ company: v }),
                options: [
                  <option value="">All Branches</option>,
                  ...COMPANIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>),
                ],
              },
            ].map(({ label, value, onChange, options }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">{label}</label>
                <select
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-300 focus:outline-none bg-gray-50"
                >
                  {options}
                </select>
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => setFilters({ dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-300 focus:outline-none bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => setFilters({ dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-300 focus:outline-none bg-gray-50"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  searchTerm: '', mainCategory: '', dateFrom: '', dateTo: '',
                  paymentStatus: '', company: '', approvalStatus: '',
                })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1 bg-white"
              >
                <X size={13} /> Clear All
              </button>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {(filters.dateFrom || filters.dateTo || filters.mainCategory || filters.paymentStatus || filters.company || filters.approvalStatus) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {filters.dateFrom && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-xl border border-slate-100 font-medium">
                From: {formatDate(filters.dateFrom)}
                <button onClick={() => setFilters({ dateFrom: '' })}><X size={10} /></button>
              </span>
            )}
            {filters.dateTo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-xl border border-slate-100 font-medium">
                To: {formatDate(filters.dateTo)}
                <button onClick={() => setFilters({ dateTo: '' })}><X size={10} /></button>
              </span>
            )}
            {filters.mainCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-xl border border-slate-100 font-medium">
                {filters.mainCategory}
                <button onClick={() => setFilters({ mainCategory: '' })}><X size={10} /></button>
              </span>
            )}
            {filters.paymentStatus && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-xl border border-slate-100 font-medium">
                {filters.paymentStatus}
                <button onClick={() => setFilters({ paymentStatus: '' })}><X size={10} /></button>
              </span>
            )}
            {filters.approvalStatus && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-xl border border-amber-100 font-medium">
                Approval: {filters.approvalStatus.replace('_', ' ')}
                <button onClick={() => setFilters({ approvalStatus: '' })}><X size={10} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Transaction Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">All Transactions</h3>
            <p className="text-xs text-gray-400 mt-0.5">{filteredTransactions.length} record{filteredTransactions.length !== 1 ? 's' : ''} found</p>
          </div>
          {/* Show active primary currency in table header */}
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {primaryCurrency}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  'TXN ID', 'Date', 'Company', 'Category',
                  'Sub Category', 'Amount', 'Paid', 'Remaining', 'Status', 'Mode', 'Actions',
                ].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center text-gray-300 text-sm">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const { totalPaid, remainingAmount } = getTransactionTotals(t);
                  const { rowClass, statusBadge, dimAmount } = rowMeta(t);
                  const isRejected       = t.approvalStatus === 'rejected';
                  const isPendingApproval = t.approvalStatus === 'pending_approval';

                  return (
                    <tr key={t.id} className={`transition-colors hover:bg-slate-50/60 ${rowClass}`}>

                      {/* TXN ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-mono font-semibold ${isRejected ? 'text-red-400 line-through' : 'text-slate-600'}`}>
                            {t.transactionId || '—'}
                          </span>
                          {isRejected && (
                            <span style={{fontSize:'9px'}} className="font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-px rounded uppercase tracking-widest">
                              Rejected
                            </span>
                          )}
                          {isPendingApproval && (
                            <span style={{fontSize:'9px'}} className="font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-px rounded uppercase tracking-widest">
                              Pending
                            </span>
                          )}
                          {(t as any).linkedType === 'invoice' && (
                            <span style={{fontSize:'9px'}} className="font-bold text-sky-600 bg-sky-50 border border-sky-200 px-1.5 py-px rounded uppercase tracking-widest">
                              Invoice
                            </span>
                          )}
                          {(t as any).linkedType === 'inventory' && (
                            <span style={{fontSize:'9px'}} className="font-bold text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-px rounded uppercase tracking-widest">
                              Inventory
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>

                      {/* Company short name */}
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[130px] truncate" title={t.company}>
                        {t.company.includes(': ') ? t.company.split(': ')[1] : t.company}
                      </td>

                      {/* Main Category */}
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap inline-flex items-center leading-none ${
                          isRejected ? 'bg-red-100 text-red-500 line-through' : getCategoryColor(t.mainCategory)
                        }`}>
                          {t.mainCategory}
                        </span>
                      </td>

                      {/* Sub Category */}
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[130px] truncate" title={t.subCategory}>
                        {t.subCategory}
                      </td>

                      {/* Amount — shows in selected currency */}
                      <td className="px-4 py-3 font-semibold text-sm whitespace-nowrap">
                        {isRejected ? (
                          <span className="text-red-400 line-through">
                            {t.mainCategory === 'Cash Inflow' ? '+' : '−'}
                            {fmtPrimary(t.amount || 0)}
                          </span>
                        ) : (
                          <span className={`${dimAmount ? 'text-gray-400' : t.mainCategory === 'Cash Inflow' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {t.mainCategory === 'Cash Inflow' ? '+' : '−'}
                            {fmtPrimary(t.amount || 0)}
                          </span>
                        )}
                      </td>

                      {/* Paid */}
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {(isRejected || isPendingApproval)
                          ? <span className="text-gray-300">—</span>
                          : <span className="text-emerald-700 font-medium">{fmtPrimary(totalPaid)}</span>
                        }
                      </td>

                      {/* Remaining */}
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {(isRejected || isPendingApproval)
                          ? <span className="text-gray-300">—</span>
                          : remainingAmount > 0
                            ? <span className="text-orange-600 font-medium">{fmtPrimary(remainingAmount)}</span>
                            : <span className="text-gray-300">—</span>
                        }
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">{statusBadge}</td>

                      {/* Mode */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${modeBadge(t.mode)}`}>
                          {t.mode}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewTransaction(t)}
                            title="View details"
                            className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          {!isRejected && (
                            <button
                              onClick={() => handleEditTransaction(t.id)}
                              title="Edit transaction"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/transactions/${t.id}/delete`)}
                            title="Delete transaction"
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View Transaction Modal ── */}
      {viewTransaction && (() => {
        const { totalPaid, remainingAmount } = getTransactionTotals(viewTransaction);
        const pending    = isPending(viewTransaction);
        const isRejected = viewTransaction.approvalStatus === 'rejected';
        const isInflow   = viewTransaction.mainCategory === 'Cash Inflow';
        const isLoan     = viewTransaction.mainCategory === 'Loan';
        const branch     = viewTransaction.company.includes(': ') ? viewTransaction.company.split(': ')[1] : viewTransaction.company;

        const amountColor = isRejected
          ? 'text-red-400 line-through'
          : isInflow
            ? 'text-emerald-500'
            : isLoan
              ? 'text-slate-500'
              : 'text-red-400';

        const amountSign = isInflow ? '+' : '−';

        const approvalBadge = () => {
          const s = viewTransaction.approvalStatus;
          if (!s || s === 'not_required') return null;
          const map: Record<string, { cls: string; label: string }> = {
            pending_approval: { cls: 'bg-amber-100 text-amber-700 border-amber-200', label: '⏳ Pending Approval' },
            approved:         { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: '✅ Approved' },
            rejected:         { cls: 'bg-red-100 text-red-700 border-red-200',        label: '❌ Rejected' },
          };
          const m = map[s];
          if (!m) return null;
          return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${m.cls}`}>
              {m.label}
            </span>
          );
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden ${isRejected ? 'ring-2 ring-red-200' : ''}`}>

              {/* Modal Header — dark slate like Dashboard "Overall Balance" card */}
              <div className={`border-b px-6 pt-5 pb-6 relative ${
                isRejected
                  ? 'bg-red-50 border-red-200'
                  : 'border-gray-100'
              }`}
                style={!isRejected ? {
                  background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#334155 100%)',
                } : {}}
              >
                <button
                  onClick={() => setViewTransaction(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
                  style={!isRejected ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' } : { background: '#fee2e2', color: '#dc2626' }}
                >
                  <X size={15} />
                </button>

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="px-2.5 py-0.5 text-xs font-mono rounded-full tracking-wide"
                    style={!isRejected ? { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' } : { background: '#fee2e2', color: '#dc2626' }}>
                    {viewTransaction.transactionId || '—'}
                  </span>
                  {(viewTransaction as any).linkedType && (
                    <span className={`inline-flex items-center gap-1 text-[10px] ${
                      (viewTransaction as any).linkedType === 'invoice'
                        ? 'text-sky-400'
                        : (viewTransaction as any).linkedType === 'inventory'
                        ? 'text-pink-400'
                        : 'text-gray-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        (viewTransaction as any).linkedType === 'invoice' ? 'bg-sky-400' : 'bg-pink-400'
                      }`} />
                      {(viewTransaction as any).linkedType}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full"
                    style={!isRejected ? { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' } : { background: '#fee2e2', color: '#dc2626' }}>
                    {viewTransaction.mainCategory}
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full"
                    style={!isRejected ? { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' } : { background: '#fee2e2', color: '#dc2626' }}>
                    {viewTransaction.mode}
                  </span>
                  {approvalBadge()}
                </div>

                <div>
                  <p className="text-sm mb-0.5" style={!isRejected ? { color: 'rgba(255,255,255,0.5)' } : { color: '#6b7280' }}>
                    {viewTransaction.subCategory}
                  </p>
                  {/* Primary currency amount */}
                  <p className={`text-4xl font-extrabold tracking-tight ${!isRejected ? amountColor : 'text-red-400 line-through'}`}>
                    {amountSign}{fmtPrimary(viewTransaction.amount || 0)}
                  </p>
                  {/* Extra currencies below */}
                  {extraCurrencies.length > 0 && !isRejected && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {extraCurrencies.map(code => {
                        const meta = getMeta(code);
                        const amt  = convertFromPKR(viewTransaction.amount || 0, code, rates);
                        return (
                          <span key={code} className="flex items-center gap-1 text-sm"
                            style={{ color: 'rgba(255,255,255,0.55)' }}>
                            <span className="text-[10px] font-bold px-1 py-0.5 rounded leading-none"
                              style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
                              {getMeta(code).countryCode}
                            </span>
                            {fmtAmount(amt, meta)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-sm mt-1" style={!isRejected ? { color: 'rgba(255,255,255,0.4)' } : { color: '#9ca3af' }}>
                    {branch} &bull; {formatDate(viewTransaction.date)}
                  </p>
                  {isRejected && (
                    <p className="mt-2 text-xs font-semibold text-red-600 uppercase tracking-wide">
                      ⚠ Rejected — no financial impact recorded
                    </p>
                  )}
                </div>

                {/* Payment progress bar */}
                {viewTransaction.amount > 0 && !isRejected && viewTransaction.approvalStatus !== 'pending_approval' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <span>Paid: {fmtPrimary(totalPaid)}</span>
                      <span>{remainingAmount > 0 ? `Remaining: ${fmtPrimary(remainingAmount)}` : 'Fully cleared'}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <div
                        className="h-full bg-slate-600 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (totalPaid / viewTransaction.amount) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

                {/* Status row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {isRejected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 border border-red-200">
                      <Ban size={13} /> Rejected — No Liquidity Impact
                    </span>
                  ) : viewTransaction.approvalStatus === 'pending_approval' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                      <ShieldAlert size={13} /> Awaiting Admin Approval
                    </span>
                  ) : pending ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 border border-orange-100">
                      <Clock size={13} /> Pending Payment
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700 border border-emerald-100">
                      <CheckCircle size={13} /> Fully Cleared
                    </span>
                  )}
                  {viewTransaction.linkedType && viewTransaction.linkedType !== 'manual' && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold tracking-wide border uppercase ${
                      viewTransaction.linkedType === 'invoice'
                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                        : 'bg-violet-50 text-violet-600 border-violet-100'
                    }`}>
                      {viewTransaction.linkedType === 'invoice' ? '🧾' : '📦'} {viewTransaction.linkedType}
                    </span>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {([
                    ['Date',         formatDate(viewTransaction.date)],
                    ['Time',         viewTransaction.time || '—'],
                    ['Branch',       branch],
                    ['Payment Mode', viewTransaction.mode],
                    ['Paid By',      viewTransaction.paidBy || '—'],
                    ['Paid To',      viewTransaction.paidTo || '—'],
                    ...(viewTransaction.bankName          ? [['Bank',         viewTransaction.bankName]          as [string,string]] : []),
                    ...(viewTransaction.chequeNumber      ? [['Cheque #',     viewTransaction.chequeNumber]      as [string,string]] : []),
                    ...(viewTransaction.chequeBank        ? [['Cheque Bank',  viewTransaction.chequeBank]        as [string,string]] : []),
                    ...(viewTransaction.accountablePerson ? [['Accountable',  viewTransaction.accountablePerson] as [string,string]] : []),
                    ...(viewTransaction.salaryMonth       ? [['Salary Month', viewTransaction.salaryMonth]       as [string,string]] : []),
                    ...(viewTransaction.linkedRef         ? [['Linked Ref',   viewTransaction.linkedRef]         as [string,string]] : []),
                  ] as [string,string][]).map(([label, value]) => (
                    <div key={label} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Payment breakdown */}
                {!isRejected && viewTransaction.approvalStatus !== 'pending_approval' && (
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Total</p>
                      <p className="text-sm font-bold text-slate-700">{fmtPrimary(viewTransaction.amount || 0)}</p>
                      {extraCurrencies.map(code => (
                        <p key={code} className="text-[10px] text-slate-500 mt-0.5">
                          {fmtAmount(convertFromPKR(viewTransaction.amount || 0, code, rates), getMeta(code))}
                        </p>
                      ))}
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500 mb-1">Paid</p>
                      <p className="text-sm font-bold text-emerald-700">{fmtPrimary(totalPaid)}</p>
                      {extraCurrencies.map(code => (
                        <p key={code} className="text-[10px] text-emerald-400 mt-0.5">
                          {fmtAmount(convertFromPKR(totalPaid, code, rates), getMeta(code))}
                        </p>
                      ))}
                    </div>
                    <div className={`p-3 rounded-xl border text-center ${remainingAmount > 0 ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${remainingAmount > 0 ? 'text-orange-400' : 'text-gray-400'}`}>
                        Remaining
                      </p>
                      <p className={`text-sm font-bold ${remainingAmount > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                        {remainingAmount > 0 ? fmtPrimary(remainingAmount) : '—'}
                      </p>
                      {remainingAmount > 0 && extraCurrencies.map(code => (
                        <p key={code} className="text-[10px] text-orange-300 mt-0.5">
                          {fmtAmount(convertFromPKR(remainingAmount, code, rates), getMeta(code))}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note */}
                {viewTransaction.note && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-500 mb-1">Note</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{viewTransaction.note}</p>
                  </div>
                )}

                {/* Rejection reason */}
                {viewTransaction.approvalStatus === 'rejected' && (
                  <div className="p-3.5 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-700">
                      {viewTransaction.rejectionReason || 'Rejected by admin'}
                    </p>
                  </div>
                )}

                {/* Partial payments */}
                {!isRejected && viewTransaction.approvalStatus !== 'pending_approval' &&
                  (viewTransaction.partialPayments || []).length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                      <span className="w-5 h-5 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {viewTransaction.partialPayments!.length}
                      </span>
                      Partial Payments
                    </p>
                    <div className="space-y-2">
                      {viewTransaction.partialPayments!.map((p, idx) => (
                        <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-semibold text-gray-800">{fmtPrimary(p.amount)}</span>
                              {extraCurrencies.map(code => (
                                <span key={code} className="text-xs text-gray-400">
                                  · {fmtAmount(convertFromPKR(p.amount, code, rates), getMeta(code))}
                                </span>
                              ))}
                              <span className="text-xs text-gray-400">· {p.method}</span>
                              {p.chequeNumber && (
                                <span className="text-xs text-gray-400">· #{p.chequeNumber}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDate(p.date)}{p.time ? ` at ${p.time}` : ''}
                            </p>
                          </div>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold border ${
                            p.isCleared
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-100'
                              : 'bg-amber-100 text-amber-700 border-amber-100'
                          }`}>
                            {p.isCleared ? 'Cleared' : 'Uncleared'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex gap-3">
                {!isRejected && (
                  <button
                    onClick={() => { setViewTransaction(null); handleEditTransaction(viewTransaction.id); }}
                    className="flex-1 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Edit size={14} /> Edit
                  </button>
                )}
                <button
                  onClick={() => setViewTransaction(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}