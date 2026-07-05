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
import { CurrencyDropdown, CurrencyRows } from './CurrencyPicker';

import { useDashboardData } from './UseDashboardData';
import { ReportsHub } from './ReportsHub';
import { usePayableToFuturistic } from '../../modules/Payable-to-futuristic/viewModels/usePayableToFuturistic';
import type { CurrencyAmounts } from '../../modules/Payable-to-futuristic/models/payableToFuturistic';

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
  { code: 'AED', label: 'UAE Dirham',      flag: '🇦🇪', locale: 'en-AE', decimals: 2 },
  { code: 'PKR', label: 'Pakistani Rupee', flag: '🇵🇰', locale: 'en-PK', decimals: 0 },
  { code: 'CAD', label: 'Canadian Dollar', flag: '🇨🇦', locale: 'en-CA', decimals: 2 },
  { code: 'SAR', label: 'Saudi Riyal',     flag: '🇸🇦', locale: 'en-US', decimals: 2 },
];

type RateMap = Record<CurrencyCode, number>;
const FALLBACK_RATES: RateMap = { PKR: 279.5, CAD: 1.38, AED: 3.67, SAR: 3.75 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const convertFromAed = (amount: number, target: CurrencyCode, rates: RateMap): number =>
  target === 'AED' ? amount : (amount / rates.AED) * rates[target];

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

// Group raw bank balances by their own native currency — NO conversion.
// Mirrors the Bank Accounts page's "Total Balance" card, which intentionally
// keeps PKR and AED (etc.) separate since converting them with a rough rate
// mixes real money with an approximation and misrepresents the total.
function groupBankBalancesByCurrency(banks: any[]): Partial<Record<CurrencyCode, number>> {
  const totals: Partial<Record<CurrencyCode, number>> = {};
  for (const b of banks) {
    const code = ((b.currency || b.accountCurrency || 'AED') as CurrencyCode);
    totals[code] = (totals[code] || 0) + (b.balance || 0);
  }
  return totals;
}

// Resolve a Payable-to-Futuristic CurrencyAmounts object (aed/pkr/sar/usd,
// computed with that module's own fixed rates) into whichever currency the
// Dashboard currently has selected. AED/PKR/SAR map 1:1 onto the exact same
// figures shown on the Payables screen. CAD has no slot in that module, so
// it's the only case derived via the Dashboard's live USD-based rates —
// everything else is taken verbatim, with no re-conversion.
function resolvePayableAmount(amounts: CurrencyAmounts, code: CurrencyCode, rates: RateMap): number {
  switch (code) {
    case 'AED': return amounts.aed;
    case 'PKR': return amounts.pkr;
    case 'SAR': return amounts.sar;
    case 'CAD': return amounts.usd * rates.CAD; // rates are USD-based
    default:    return amounts.aed;
  }
}

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

// Using the shared `CurrencyDropdown` from CurrencyPicker (imported above).
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
  const amount = convertFromAed(pkrAmount, primary, rates);

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

// ─── BankBalanceCard ──────────────────────────────────────────────────────────
// Unlike AmountCard, this never converts between currencies — it shows each
// bank's balance in its own currency, stacked, exactly like the Bank Accounts
// page's Total Balance card (e.g. "Rs 438,846" + "AED 5,000").

function BankBalanceCard({ label, icon, banks, subtitle, dark = false }: {
  label: string; icon: React.ReactNode; banks: any[]; subtitle?: string; dark?: boolean;
}) {
  const totals = groupBankBalancesByCurrency(banks);
  const codes  = Object.keys(totals) as CurrencyCode[];

  const wrapCls  = dark ? '' : 'bg-white border border-gray-100 hover:shadow-md hover:border-gray-200';
  const labelCol = dark ? 'rgba(255,255,255,0.45)' : undefined;
  const subCol   = dark ? 'rgba(255,255,255,0.35)' : undefined;
  const amtCls   = dark ? 'text-white' : 'text-gray-900';

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col transition-all duration-200 ${wrapCls}`}
      style={dark ? { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)', boxShadow: '0 4px 16px rgba(15,23,42,0.25)' } : undefined}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className={`text-xs font-semibold tracking-wide ${dark ? '' : 'text-gray-400'}`} style={{ color: labelCol }}>{label}</span>
        {icon}
      </div>
      {codes.length === 0 ? (
        <p className={`text-2xl font-bold tabular-nums leading-none mb-1.5 ${amtCls}`}>{fmt(0, getMeta('AED'))}</p>
      ) : (
        codes.map((code, i) => (
          <p key={code} className={`font-bold tabular-nums leading-tight ${i === 0 ? `text-2xl mb-0.5 ${amtCls}` : `text-base ${dark ? 'text-white/70' : 'text-gray-500'}`}`}>
            {fmt(totals[code]!, getMeta(code))}
          </p>
        ))
      )}
      {subtitle && <p className={`text-xs font-medium mt-1 ${dark ? '' : 'text-gray-400'}`} style={{ color: subCol }}>{subtitle}</p>}
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
  rawAed?: boolean; // true = value is already an exact AED amount; skip PKR conversion
}

function SmallStatCard({ label, countValue, pkrAmount = 0, primary, extras, rates, amountColor = 'text-gray-900', subtitle, subtitleSuffix, rawAed = false }: SmallStatCardProps) {
  const meta   = rawAed ? getMeta('AED') : getMeta(primary);
  const amount = rawAed ? pkrAmount : convertFromAed(pkrAmount, primary, rates);
  const rowExtras = rawAed ? [] : extras;

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
        extras={pkrAmount !== 0 ? rowExtras : []}
        pkrAmount={pkrAmount}
        rates={rates}
        subtitleSuffix={subtitleSuffix}
      />
    </div>
  );
}

// ─── PayableToFuturisticCard ───────────────────────────────────────────────────
// Same visual style as SmallStatCard, but sourced directly from the Payable to
// Futuristic module's own `totals` (CurrencyAmounts), not from a PKR base stat.
// This guarantees the figure shown here is identical to the one on that screen.

function PayableToFuturisticCard({
  label, amounts, primary, extras, rates, amountColor = 'text-red-500', subtitle,
}: {
  label: string;
  amounts: CurrencyAmounts;
  primary: CurrencyCode;
  extras: CurrencyCode[];
  rates: RateMap;
  amountColor?: string;
  subtitle?: string;
}) {
  const meta   = getMeta(primary);
  const amount = resolvePayableAmount(amounts, primary, rates);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <p className="text-xs font-semibold text-gray-400 tracking-wide mb-2.5">{label}</p>
      <p className={`text-xl font-bold tabular-nums leading-none mb-1 ${amountColor}`}>
        {fmt(amount, meta)}
      </p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}

      {extras.length > 0 && (
        <div className="mt-3 pt-2.5 flex flex-col gap-1.5 border-t border-gray-100">
          {extras.map(code => {
            const exMeta = getMeta(code);
            const exAmt  = resolvePayableAmount(amounts, code, rates);
            return (
              <div key={code} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="text-[10px] font-bold px-1 py-0.5 rounded leading-none bg-gray-100 text-gray-500">
                    {code.slice(0, 2)}
                  </span>
                  {code}
                </span>
                <span className="text-xs font-semibold tabular-nums text-gray-600">
                  {fmt(exAmt, exMeta)}
                </span>
              </div>
            );
          })}
        </div>
      )}
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
  const primaryCurrency: CurrencyCode = 'AED';
  const extraCurrencies: CurrencyCode[] = [];

  const { rates, loading: ratesLoading, error: ratesError, lastUpdated } = useCurrencyRates();

  useEffect(() => {
    if (!permissionsLoading)
      setActiveTab(prev => prev === null ? (canViewOverview ? 'overview' : 'reports') : prev);
  }, [permissionsLoading, canViewOverview]);

  const { transactions, banks, loans, invoices, commissions, products, loading, error, refresh, stats, monthlyChartData } = useDashboardData();
  const { totals: futuristicTotals, loading: futuristicLoading } = usePayableToFuturistic();
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
        <BankBalanceCard label="Bank Balance"
          icon={<IconBadge bg="bg-indigo-50"><Building2 size={15} className="text-indigo-400" /></IconBadge>}
          banks={banks}
          subtitle={`${banks.length} account${banks.length !== 1 ? 's' : ''}`} />
        <AmountCard label="Overall Balance"
          icon={<div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f1f5f9' }}>
            <DollarSign size={15} style={{ color: '#334155' }} /></div>}
          pkrAmount={stats.overallBalance}
          amountColor={stats.overallBalance < 0 ? 'text-red-500' : 'text-gray-900'}
          subtitle="Cash + Banks" {...cardCurrencyProps} />
      </div>

      {/* Secondary stats — 5 cards, uniform style */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
        <SmallStatCard label="Pending Transactions"
          countValue={<span className="text-orange-500">{stats.pendingTransactions}</span>}
          pkrAmount={stats.pendingAmount} subtitleSuffix="outstanding" {...cardCurrencyProps} />
        <SmallStatCard label="Loans Receivable"
          pkrAmount={stats.totalLoansReceivable} subtitle="Outstanding" amountColor="text-blue-600" rawAed {...cardCurrencyProps} />
        <SmallStatCard label="Loans Payable"
          pkrAmount={stats.totalLoansPayable} subtitle="Outstanding" amountColor="text-red-500" rawAed {...cardCurrencyProps} />
        <SmallStatCard label="Pending Bills"
          countValue={<span className="text-yellow-500">{stats.pendingBills}</span>}
          pkrAmount={stats.pendingBillsAmount} subtitleSuffix="due" {...cardCurrencyProps} />
        <PayableToFuturisticCard label="Payable to Futuristic"
          amounts={futuristicTotals} subtitle={futuristicLoading ? 'Loading…' : 'Outstanding'} amountColor="text-red-500" {...cardCurrencyProps} />
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
                <Tooltip formatter={(v: number, n: string) => [fmt(convertFromAed(v, primaryCurrency, rates), getMeta(primaryCurrency)), n]} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
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
                <Tooltip formatter={(v: number, n: string) => [fmt(convertFromAed(v, primaryCurrency, rates), getMeta(primaryCurrency)), n]} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
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
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-800 tabular-nums">{fmt(convertFromAed(t.amount, primaryCurrency, rates), getMeta(primaryCurrency))}</td>
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
            <CurrencyDropdown primary={primaryCurrency} extras={extraCurrencies} loading={ratesLoading} error={ratesError} lastUpdated={lastUpdated} />
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