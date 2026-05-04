// Dashboard.tsx — professional redesign
// - Clean card labels (sentence case, not ALL CAPS)
// - Working currency checkboxes with visible tick
// - Proper dropdown with indigo selected state + country-code badges
// - Clean extra-currency rows on cards

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserPermissions } from '../../modules/user-management/hooks/useUserPermissions';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, Building2, DollarSign,
  Activity, FileText, AlertCircle, RefreshCw, Loader2, BarChart2,
  ChevronDown, Check,
} from 'lucide-react';

import { useDashboardData } from './UseDashboardData';
import { ReportsHub } from './ReportsHub';

// ─── Currency config ──────────────────────────────────────────────────────────

type CurrencyCode = 'PKR' | 'CAD' | 'AED' | 'SAR';

interface CurrencyMeta {
  code: CurrencyCode;
  label: string;
  flag: string;
  locale: string;
  decimals: number;
}

const CURRENCIES: CurrencyMeta[] = [
  { code: 'PKR', label: 'Pakistani Rupee', flag: '🇵🇰', locale: 'en-PK', decimals: 0 },
  { code: 'CAD', label: 'Canadian Dollar', flag: '🇨🇦', locale: 'en-CA', decimals: 2 },
  { code: 'AED', label: 'UAE Dirham',      flag: '🇦🇪', locale: 'en-AE', decimals: 2 },
  { code: 'SAR', label: 'Saudi Riyal',     flag: '🇸🇦', locale: 'en-US', decimals: 2 },
];

type RateMap = Record<CurrencyCode, number>;
const FALLBACK_RATES: RateMap = { PKR: 279.5, CAD: 1.38, AED: 3.67, SAR: 3.75 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const convertFromPKR = (amount: number, target: CurrencyCode, rates: RateMap): number =>
  target === 'PKR' ? amount : (amount / rates.PKR) * rates[target];

const fmt = (amount: number, meta: CurrencyMeta): string => {
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

const getMeta  = (code: CurrencyCode) => CURRENCIES.find(c => c.code === code)!;
const pkrMeta  = getMeta('PKR');
const formatPKR = (n: number) => fmt(n, pkrMeta);

// ─── useCurrencyRates ─────────────────────────────────────────────────────────

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
    finally  { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetch_]);

  return { rates, loading, error, lastUpdated };
}

// ─── CurrencyDropdown ─────────────────────────────────────────────────────────

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
      {/* Trigger */}
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
            {primaryMeta.code.slice(0, 2).toUpperCase()}
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
          <div className="absolute top-full left-0 mt-2 w-[260px] bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-50 overflow-hidden">

            {/* Primary section */}
            <div className="px-4 pt-4 pb-1.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Primary Currency</p>
            </div>
            {CURRENCIES.map(cur => {
              const sel = primary === cur.code;
              return (
                <button
                  key={cur.code}
                  onClick={() => selectPrimary(cur.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    sel ? 'bg-slate-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md leading-none tracking-wide ${
                    sel ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {cur.code.slice(0, 2)}
                  </span>
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-sm font-semibold ${sel ? 'text-slate-800' : 'text-gray-700'}`}>{cur.code}</p>
                    <p className="text-[11px] text-gray-400 truncate">{cur.label}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    sel ? 'bg-slate-800' : 'bg-transparent'
                  }`}>
                    {sel && <Check size={11} className="text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}

            {/* Also show section */}
            <div className="border-t border-gray-100 mx-4 mt-1" />
            <div className="px-4 pt-3 pb-1.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Also Show on Cards</p>
            </div>
            {CURRENCIES.filter(c => c.code !== primary).map(cur => {
              const chk = extras.includes(cur.code);
              return (
                <button
                  key={cur.code}
                  onClick={() => toggleExtra(cur.code)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                >
                  <span className="text-[10px] font-extrabold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md leading-none tracking-wide shrink-0">
                    {cur.code.slice(0, 2)}
                  </span>
                  <span className="text-sm text-gray-700 flex-1 truncate">
                    {cur.code}<span className="text-gray-400 font-normal"> · {cur.label}</span>
                  </span>
                  {/* Square checkbox - using explicit rendering */}
                  <div
                    className="shrink-0 transition-all"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: chk ? '2px solid #1e293b' : '2px solid #d1d5db',
                      background: chk ? '#1e293b' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
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

      {/* Rate status */}
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

// ─── Currency rows helper (shared by cards) ───────────────────────────────────

function CurrencyRows({
  extras, pkrAmount, rates, dark = false, subtitleSuffix,
}: {
  extras: CurrencyCode[];
  pkrAmount: number;
  rates: RateMap;
  dark?: boolean;
  subtitleSuffix?: string;
}) {
  if (extras.length === 0) return null;
  return (
    <div className={`mt-3 pt-2.5 flex flex-col gap-1.5 ${dark ? '' : 'border-t border-gray-100'}`}
      style={dark ? { borderTop: '1px solid rgba(255,255,255,0.1)' } : {}}>
      {extras.map(code => {
        const meta = getMeta(code);
        const amt  = convertFromPKR(pkrAmount, code, rates);
        return (
          <div key={code} className="flex items-center justify-between gap-2">
            <span className={`flex items-center gap-1.5 text-xs ${dark ? '' : 'text-gray-400'}`}
              style={dark ? { color: 'rgba(255,255,255,0.45)' } : {}}>
              <span className={`text-[10px] font-bold px-1 py-0.5 rounded leading-none ${dark ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-500'}`}>
                {code.slice(0, 2)}
              </span>
              {code}
            </span>
            <span className={`text-xs font-semibold tabular-nums ${dark ? '' : 'text-gray-600'}`}
              style={dark ? { color: 'rgba(255,255,255,0.75)' } : {}}>
              {fmt(amt, meta)}{subtitleSuffix ? ` ${subtitleSuffix}` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── AmountCard ───────────────────────────────────────────────────────────────

interface AmountCardProps {
  label: string;
  icon: React.ReactNode;
  pkrAmount: number;
  primary: CurrencyCode;
  extras: CurrencyCode[];
  rates: RateMap;
  subtitle?: string;
  amountColor?: string;
  dark?: boolean;
}

function AmountCard({ label, icon, pkrAmount, primary, extras, rates, subtitle, amountColor, dark = false }: AmountCardProps) {
  const meta   = getMeta(primary);
  const amount = convertFromPKR(pkrAmount, primary, rates);

  if (dark) {
    return (
      <div className="rounded-2xl p-5 flex flex-col"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)', boxShadow: '0 4px 16px rgba(15,23,42,0.25)' }}>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
          {icon}
        </div>
        <p className={`text-2xl font-bold tabular-nums leading-none mb-1.5 ${amountColor ?? 'text-white'}`}>
          {fmt(amount, meta)}
        </p>
        {subtitle && <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{subtitle}</p>}
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
      <p className={`text-2xl font-bold tabular-nums leading-none mb-1.5 ${amountColor ?? 'text-gray-900'}`}>
        {fmt(amount, meta)}
      </p>
      {subtitle && <p className="text-xs text-gray-400 font-medium">{subtitle}</p>}
      <CurrencyRows extras={extras} pkrAmount={pkrAmount} rates={rates} />
    </div>
  );
}

// ─── SmallStatCard ────────────────────────────────────────────────────────────

interface SmallStatCardProps {
  label: string;
  countValue?: React.ReactNode;
  pkrAmount?: number;
  primary: CurrencyCode;
  extras: CurrencyCode[];
  rates: RateMap;
  amountColor?: string;
  subtitle?: string;
  subtitleSuffix?: string;
}

function SmallStatCard({ label, countValue, pkrAmount = 0, primary, extras, rates, amountColor = 'text-gray-900', subtitle, subtitleSuffix }: SmallStatCardProps) {
  const meta   = getMeta(primary);
  const amount = convertFromPKR(pkrAmount, primary, rates);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <p className="text-xs font-semibold text-gray-400 tracking-wide mb-2.5">{label}</p>

      {countValue !== undefined ? (
        <>
          <p className={`text-2xl font-bold tabular-nums leading-none mb-1 ${amountColor}`}>{countValue}</p>
          <p className="text-sm text-gray-500 tabular-nums">
            {fmt(amount, meta)}{subtitleSuffix ? ` ${subtitleSuffix}` : ''}
          </p>
        </>
      ) : (
        <>
          <p className={`text-xl font-bold tabular-nums leading-none mb-1 ${amountColor}`}>
            {fmt(amount, meta)}
          </p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </>
      )}

      <CurrencyRows
        extras={pkrAmount !== 0 ? extras : []}
        pkrAmount={pkrAmount}
        rates={rates}
        subtitleSuffix={subtitleSuffix}
      />
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

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { hasPermission, hasAnyReportPermission, isLoading: permissionsLoading } = useUserPermissions();
  const canViewOverview = hasPermission('Dashboard');

  const [activeTab, setActiveTab]     = useState<string | null>(null);
  const [primaryCurrency, setPrimary] = useState<CurrencyCode>('PKR');
  const [extraCurrencies, setExtras]  = useState<CurrencyCode[]>([]);

  const { rates, loading: ratesLoading, error: ratesError, lastUpdated } = useCurrencyRates();

  useEffect(() => {
    if (!permissionsLoading)
      setActiveTab(prev => prev === null ? (canViewOverview ? 'overview' : 'reports') : prev);
  }, [permissionsLoading, canViewOverview]);

  const { transactions, banks, loans, invoices, commissions, products, loading, error, refresh, stats, monthlyChartData } = useDashboardData();
  const currentMonthLabel = new Date().toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });

  if (permissionsLoading || activeTab === null || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 size={28} className="animate-spin text-indigo-600" />
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={refresh} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    );
  }

  const tabs = [
    ...(canViewOverview        ? [{ id: 'overview', label: 'Overview', icon: Activity }] : []),
    ...(hasAnyReportPermission ? [{ id: 'reports',  label: 'Reports',  icon: FileText }] : []),
  ];

  if (tabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <BarChart2 size={40} className="text-gray-200" />
        <p className="font-medium text-gray-400">No access</p>
        <p className="text-sm text-gray-400">Contact your administrator.</p>
      </div>
    );
  }

  const cardCurrencyProps = { primary: primaryCurrency, extras: extraCurrencies, rates };

  const overviewContent = (
    <>
      {/* Primary balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4 items-start">
        <AmountCard label="Total Inflow"
          icon={<IconBadge bg="bg-emerald-50"><TrendingUp size={15} className="text-emerald-500" /></IconBadge>}
          pkrAmount={stats.cashInflow} subtitle={currentMonthLabel} {...cardCurrencyProps} />
        <AmountCard label="Total Outflow"
          icon={<IconBadge bg="bg-red-50"><TrendingDown size={15} className="text-red-400" /></IconBadge>}
          pkrAmount={stats.cashOutflow} subtitle={currentMonthLabel} {...cardCurrencyProps} />
        <AmountCard label="Cash Balance"
          icon={<IconBadge bg="bg-slate-50"><Wallet size={15} className="text-slate-500" /></IconBadge>}
          pkrAmount={stats.cashBalance}
          amountColor={stats.cashBalance < 0 ? 'text-red-500' : 'text-gray-900'}
          subtitle={`Inflow − Outflow · ${currentMonthLabel}`} {...cardCurrencyProps} />
        <AmountCard label="Bank Balance"
          icon={<IconBadge bg="bg-indigo-50"><Building2 size={15} className="text-indigo-400" /></IconBadge>}
          pkrAmount={stats.totalBankBalance}
          subtitle={`${banks.length} account${banks.length !== 1 ? 's' : ''}`} {...cardCurrencyProps} />
        <AmountCard label="Overall Balance"
          icon={<div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <DollarSign size={15} style={{ color: 'rgba(255,255,255,0.7)' }} /></div>}
          pkrAmount={stats.overallBalance}
          amountColor={stats.overallBalance < 0 ? 'text-red-300' : 'text-white'}
          subtitle="Cash + Banks" dark {...cardCurrencyProps} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <SmallStatCard label="Pending Transactions"
          countValue={<span className="text-orange-500">{stats.pendingTransactions}</span>}
          pkrAmount={stats.pendingAmount} subtitleSuffix="outstanding" {...cardCurrencyProps} />
        <SmallStatCard label="Loans Receivable"
          pkrAmount={stats.totalLoansReceivable} subtitle="Outstanding" amountColor="text-blue-600" {...cardCurrencyProps} />
        <SmallStatCard label="Loans Payable"
          pkrAmount={stats.totalLoansPayable} subtitle="Outstanding" amountColor="text-red-500" {...cardCurrencyProps} />
        <SmallStatCard label="Pending Bills"
          countValue={<span className="text-yellow-500">{stats.pendingBills}</span>}
          pkrAmount={stats.pendingBillsAmount} subtitleSuffix="due" {...cardCurrencyProps} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Cashflow Over Time</h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{primaryCurrency}</span>
          </div>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number, n: string) => [formatPKR(v), n]} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Line type="monotone" dataKey="inflow"  stroke="#10b981" strokeWidth={2} name="Inflow"  dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="outflow" stroke="#f87171" strokeWidth={2} name="Outflow" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="net"     stroke="#6366f1" strokeWidth={1.5} name="Net" dot={false} strokeDasharray="4 3" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-sm text-gray-300">No transaction data yet</div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Inflow vs Outflow</h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{primaryCurrency}</span>
          </div>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number, n: string) => [formatPKR(v), n]} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="inflow"  fill="#10b981" name="Inflow"  radius={[3, 3, 0, 0]} />
                <Bar dataKey="outflow" fill="#f87171" name="Outflow" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-sm text-gray-300">No transaction data yet</div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Recent Transactions</h3>
          <span className="text-xs text-gray-400 font-semibold bg-gray-100 px-2.5 py-1 rounded-lg">{transactions.length} total</span>
        </div>
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center h-28 text-sm text-gray-300">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Date', 'ID', 'Category', 'Sub Category', 'Amount', 'Mode', 'Bank'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.slice(0, 10).map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{new Date(t.date).toLocaleDateString('en-PK')}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-400">{t.transactionId || t.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${
                        t.mainCategory === 'Cash Inflow' ? 'bg-emerald-50 text-emerald-700'
                        : t.mainCategory === 'Cash Outflow' ? 'bg-red-50 text-red-600'
                        : 'bg-blue-50 text-blue-700'
                      }`}>{t.mainCategory}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.subCategory}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-800 tabular-nums">{formatPKR(t.amount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${
                        t.mode === 'Cash' ? 'bg-blue-50 text-blue-700'
                        : t.mode === 'Bank' ? 'bg-purple-50 text-purple-700'
                        : 'bg-yellow-50 text-yellow-700'
                      }`}>{t.mode}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.bankName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="p-6 min-h-full bg-gray-50/70">
      {/* ── Unified top bar: tabs left, currency+refresh right ── */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        {/* Tab switcher (only when 2 tabs) */}
        {tabs.length > 1 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#e2e8f0', borderRadius: 12, padding: 4 }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={activeTab === tab.id
                  ? { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 8, background: '#fff', color: '#0f172a', fontWeight: 700, fontSize: 14, border: '1.5px solid #cbd5e1', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }
                  : { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 8, background: 'transparent', color: '#64748b', fontWeight: 500, fontSize: 14, border: '1.5px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }
                }>
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <div />
        )}

        {/* Currency + Refresh — only show on Overview tab */}
        {activeTab !== 'reports' && (
          <div className="flex items-center gap-3">
            <CurrencyDropdown
              primary={primaryCurrency} extras={extraCurrencies}
              onPrimaryChange={setPrimary} onExtrasChange={setExtras}
              loading={ratesLoading} error={ratesError} lastUpdated={lastUpdated}
            />
            <button onClick={refresh} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors bg-white border border-gray-200 rounded-xl px-3 py-2 hover:shadow-sm">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        )}
      </div>

      {activeTab === 'reports' ? (
        <ReportsHub transactions={transactions} banks={banks} loans={loans}
          invoices={invoices} commissions={commissions} products={products}
          backLabel="Back to Reports Hub" />
      ) : overviewContent}
    </div>
  );
}