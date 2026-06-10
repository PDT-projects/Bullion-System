// Transactions Module - Pending Payments View
// Multi-currency display: AED primary (matches Transaction List theme)

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Eye, Trash2, X, Check, AlertCircle, Clock,
  Loader2, TrendingUp, CreditCard, ArrowDownCircle,
  DollarSign, ReceiptText, Filter,
  ChevronDown, RefreshCw,
} from 'lucide-react';
import { Transaction } from '../models/types';
import { UsePendingPaymentsViewModelReturn } from '../viewModels/usePendingPaymentsViewModel';

interface Props extends UsePendingPaymentsViewModelReturn {}

// ─── Currency System (mirrored from TransactionListView) ─────────────────────

type CurrencyCode = 'PKR' | 'CAD' | 'AED' | 'SAR';

interface CurrencyMeta {
  code: CurrencyCode;
  label: string;
  countryCode: string;
  locale: string;
  decimals: number;
}

const CURRENCIES: CurrencyMeta[] = [
  { code: 'AED', label: 'UAE Dirham',       countryCode: 'AE', locale: 'en-AE', decimals: 2 },
  { code: 'PKR', label: 'Pakistani Rupee',  countryCode: 'PK', locale: 'en-PK', decimals: 0 },
  { code: 'CAD', label: 'Canadian Dollar',  countryCode: 'CA', locale: 'en-CA', decimals: 2 },
  { code: 'SAR', label: 'Saudi Riyal',      countryCode: 'SA', locale: 'en-US', decimals: 2 },
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

// ─── Secondary currency rows shown below main value ───────────────────────────

function CurrencyRows({
  extras, pkrAmount, rates,
}: {
  extras: CurrencyCode[];
  pkrAmount: number;
  rates: RateMap;
}) {
  if (extras.length === 0) return null;
  return (
    <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1">
      {extras.map(code => {
        const meta = getMeta(code);
        const amt  = convertFromPKR(pkrAmount, code, rates);
        return (
          <div key={code} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1 py-0.5 rounded leading-none">
                {meta.countryCode}
              </span>
              {code}
            </span>
            <span className="text-xs font-semibold tabular-nums text-gray-500">
              {fmtAmount(amt, meta)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────

function ViewModal({
  viewTransaction, onClose, getTransactionTotals,
  formatDateTime, markPaymentAsCleared, markTransactionCleared,
  fmtPrimary, extraCurrencies, rates,
}: {
  viewTransaction: Transaction;
  onClose: () => void;
  getTransactionTotals: any;
  formatDateTime: (d: string, t?: string) => string;
  markPaymentAsCleared: (txId: string, payId: string) => Promise<void>;
  markTransactionCleared: (txId: string) => Promise<void>;
  fmtPrimary: (pkr: number) => string;
  extraCurrencies: CurrencyCode[];
  rates: RateMap;
}) {
  const { totalPaid, remainingAmount } = getTransactionTotals(viewTransaction);
  const isChequeTx = viewTransaction.mode === 'Cheque';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {viewTransaction.transactionId}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                viewTransaction.mode === 'Cheque' ? 'bg-purple-100 text-purple-700' :
                viewTransaction.mode === 'Bank'   ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>{viewTransaction.mode}</span>
              {isChequeTx && !viewTransaction.isFullyCleared && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Uncleared
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{viewTransaction.mainCategory}</h3>
            <p className="text-sm text-gray-500">{viewTransaction.subCategory}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* Amount summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Amount', pkr: viewTransaction.amount,  cls: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
              { label: 'Amount Paid',  pkr: totalPaid,               cls: 'bg-green-50 text-green-700 border-green-100'   },
              { label: 'Remaining',    pkr: remainingAmount,
                cls: remainingAmount > 0 ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-gray-50 text-gray-400 border-gray-100' },
            ].map(({ label, pkr, cls }) => (
              <div key={label} className={`p-3.5 rounded-xl text-center border ${cls}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60 mb-1">{label}</p>
                <p className="text-base font-bold">{fmtPrimary(pkr)}</p>
                {extraCurrencies.map(code => (
                  <p key={code} className="text-[10px] opacity-60 mt-0.5">
                    {fmtAmount(convertFromPKR(pkr, code, rates), getMeta(code))}
                  </p>
                ))}
              </div>
            ))}
          </div>

          {/* Mark as Cleared button for uncleared main cheque tx */}
          {isChequeTx && !viewTransaction.isFullyCleared && (viewTransaction.partialPayments || []).length === 0 && (
            <button
              onClick={() => { markTransactionCleared(viewTransaction.id); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              <Check size={15} /> Mark Cheque as Cleared
            </button>
          )}

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {([
              ['Transaction ID', viewTransaction.transactionId],
              ['Date & Time',    formatDateTime(viewTransaction.date, viewTransaction.time)],
              ['Category',       viewTransaction.mainCategory],
              ['Sub Category',   viewTransaction.subCategory],
              ['Paid By',        viewTransaction.paidBy || '—'],
              ['Paid To',        viewTransaction.paidTo || '—'],
              ['Mode',           viewTransaction.mode],
              ['Bank',           viewTransaction.bankName || '—'],
            ] as [string, string][]).map(([l, v]) => (
              <div key={l} className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                <p className="font-medium text-gray-900">{v}</p>
              </div>
            ))}
          </div>

          {/* Cheque details */}
          {viewTransaction.mode === 'Cheque' && viewTransaction.chequeNumber && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-700 mb-3 flex items-center gap-1.5">
                <CreditCard size={13} /> Cheque Details
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-gray-400 mb-0.5">Number</p><p className="font-semibold">{viewTransaction.chequeNumber}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Date</p><p className="font-semibold">{viewTransaction.chequeDate || '—'}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Bank</p><p className="font-semibold">{viewTransaction.chequeBank || '—'}</p></div>
              </div>
            </div>
          )}

          {/* Payment history */}
          {(viewTransaction.partialPayments || []).length > 0 && (
            <div>
              <p className="font-semibold text-gray-800 mb-3 text-sm">Payment History</p>
              <div className="space-y-2">
                {viewTransaction.partialPayments!.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="space-y-0.5">
                      <div>
                        <p className="text-sm font-medium text-gray-900 inline">
                          {fmtPrimary(p.amount)}
                        </p>
                        <span className="text-xs font-normal text-gray-500 ml-1.5">via {p.method}</span>
                        {extraCurrencies.map(code => (
                          <span key={code} className="text-xs text-gray-400 ml-1.5">
                            · {fmtAmount(convertFromPKR(p.amount, code, rates), getMeta(code))}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">{formatDateTime(p.date, p.time)}</p>
                      {p.chequeNumber && (
                        <p className="text-xs text-purple-600">Cheque #{p.chequeNumber}{p.chequeBank ? ` · ${p.chequeBank}` : ''}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${p.isCleared ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.isCleared ? 'Cleared' : 'Uncleared'}
                      </span>
                      {!p.isCleared && p.method !== 'Bank' && (
                        <button
                          onClick={() => markPaymentAsCleared(viewTransaction.id, p.id)}
                          className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 flex items-center gap-1 transition-colors"
                        >
                          <Check size={11} /> Clear
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewTransaction.note && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400 mb-1 font-medium">Note</p>
              <p className="text-sm text-gray-800">{viewTransaction.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function PendingPaymentsView({
  filteredTransactions, viewTransaction, paymentModal, selectedTransactionId,
  filterStatus, paymentData, banks, isLoading, isSaving, summaryStats,
  setViewTransaction, setPaymentModal, setSelectedTransactionId, setFilterStatus, setPaymentData,
  addPartialPayment, markPaymentAsCleared, markTransactionCleared, deleteTransaction,
  getTransactionTotals, formatDateTime, getCategoryColor, getPaymentStatusColor,
}: Props) {

  // ── Currency state — AED primary, PKR as secondary by default ──
  const [primaryCurrency, setPrimary] = useState<CurrencyCode>('AED');
  const [extraCurrencies, setExtras]  = useState<CurrencyCode[]>(['PKR']);
  const { rates, loading: ratesLoading, error: ratesError, lastUpdated, refresh: refreshRates } = useCurrencyRates();

  const fmtPrimary = (pkr: number) =>
    fmtAmount(convertFromPKR(pkr, primaryCurrency, rates), getMeta(primaryCurrency));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-[#4f46e5]" />
        <p className="text-sm text-gray-500">Loading pending payments...</p>
      </div>
    );
  }

  const openPayModal = (id: string) => {
    setSelectedTransactionId(id);
    setPaymentData({ amount: 0, bankId: '', method: 'Cash', chequeNumber: '', chequeDate: '', chequeBank: '' });
    setPaymentModal(true);
  };

  return (
    <div className="p-6 space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Payments</h2>
          <p className="text-gray-500 text-sm mt-1">Unpaid outflows, partially received inflows, and uncleared cheques</p>
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
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Filter size={16} />
            Filters
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <ReceiptText size={16} className="text-gray-600" />
            </div>
            <span className="text-sm text-gray-600">Total Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmtPrimary(summaryStats.totalPending + summaryStats.totalReceivable)}</p>
          <CurrencyRows extras={extraCurrencies} pkrAmount={summaryStats.totalPending + summaryStats.totalReceivable} rates={rates} />
          <p className="text-sm text-gray-500 mt-1">{summaryStats.totalTransactions} records</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <DollarSign size={16} className="text-red-500" />
            </div>
            <span className="text-sm text-gray-600">Total Payable</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{fmtPrimary(summaryStats.totalPending)}</p>
          <CurrencyRows extras={extraCurrencies} pkrAmount={summaryStats.totalPending} rates={rates} />
          <p className="text-sm text-gray-500 mt-1">Outstanding outflows</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Total Receivable</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{fmtPrimary(summaryStats.totalReceivable)}</p>
          <CurrencyRows extras={extraCurrencies} pkrAmount={summaryStats.totalReceivable} rates={rates} />
          <p className="text-sm text-gray-500 mt-1">Pending inflows</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Clock size={16} className="text-yellow-600" />
            </div>
            <span className="text-sm text-gray-600">Uncleared Cheques</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{summaryStats.unclearedCount}</p>
          <p className="text-sm text-gray-500 mt-1">Awaiting clearance</p>
        </div>

      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: 'All' as const,               label: 'All Pending'        },
          { key: 'PartiallyPaid' as const,     label: 'Partially Paid'     },
          { key: 'Uncleared' as const,         label: 'Uncleared Cheques'  },
          { key: 'PendingReceivable' as const, label: 'Pending Receivable' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{
              backgroundColor: filterStatus === key ? '#1e293b' : '#ffffff',
              color: filterStatus === key ? '#ffffff' : '#374151',
              borderColor: filterStatus === key ? '#1e293b' : '#d1d5db',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-500 font-medium">No pending payments in this category</p>
            <p className="text-sm text-gray-400 mt-1">Try a different filter or all transactions are cleared</p>
          </div>
        ) : (
          <div className="overflow-x-auto px-2">
            <table className="w-full" style={{ minWidth: '900px' }}>
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pl-5 pr-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-1">{primaryCurrency}</span>
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remaining</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t, idx) => {
                  const { totalPaid, remainingAmount } = getTransactionTotals(t);
                  const isReceivable = t.mainCategory === 'Cash Inflow';
                  const hasUncleared = (t.partialPayments || []).some(p => !p.isCleared && p.method !== 'Bank');

                  return (
                    <tr
                      key={t.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      {/* Date */}
                      <td className="pl-5 pr-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Transaction ID */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono font-medium text-[#4f46e5]">
                          {t.transactionId || t.id.slice(0, 16)}
                        </span>
                        {t.subCategory && (
                          <p className="text-xs text-gray-400 mt-0.5 font-sans">{t.subCategory}</p>
                        )}
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4">
                        {isReceivable ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                            <TrendingUp size={11} /> Receivable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                            <ArrowDownCircle size={11} /> Payable
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                          {t.mainCategory}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm font-semibold text-gray-900">{fmtPrimary(t.amount)}</p>
                        {extraCurrencies.map(code => (
                          <p key={code} className="text-xs text-gray-400 mt-0.5">
                            {fmtAmount(convertFromPKR(t.amount, code, rates), getMeta(code))}
                          </p>
                        ))}
                      </td>

                      {/* Paid */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-green-600">{fmtPrimary(totalPaid)}</p>
                        {extraCurrencies.map(code => (
                          <p key={code} className="text-xs text-gray-400 mt-0.5">
                            {fmtAmount(convertFromPKR(totalPaid, code, rates), getMeta(code))}
                          </p>
                        ))}
                      </td>

                      {/* Remaining */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className={`text-sm font-semibold ${isReceivable ? 'text-green-600' : 'text-red-600'}`}>
                          {fmtPrimary(remainingAmount)}
                        </p>
                        {extraCurrencies.map(code => (
                          <p key={code} className="text-xs text-gray-400 mt-0.5">
                            {fmtAmount(convertFromPKR(remainingAmount, code, rates), getMeta(code))}
                          </p>
                        ))}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {hasUncleared ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Uncleared
                          </span>
                        ) : remainingAmount > 0 ? (
                          isReceivable ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              Partial
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Full
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          {t.mode === 'Cheque' && !t.isFullyCleared && (t.partialPayments || []).length === 0 ? (
                            <button
                              onClick={() => markTransactionCleared(t.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#4f46e5] hover:bg-[#4338ca] rounded-lg transition-colors"
                            >
                              <Check size={12} /> Mark Cleared
                            </button>
                          ) : (
                            <button
                              onClick={() => openPayModal(t.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors ${
                                isReceivable ? 'bg-green-600 hover:bg-green-700' : 'bg-[#4f46e5] hover:bg-[#4338ca]'
                              }`}
                            >
                              {isReceivable ? 'Receive' : 'Pay'}
                            </button>
                          )}
                          <button
                            onClick={() => setViewTransaction(t)}
                            className="p-1.5 text-gray-400 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => deleteTransaction(t.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── View Details Modal ── */}
      {viewTransaction && (
        <ViewModal
          viewTransaction={viewTransaction}
          onClose={() => setViewTransaction(null)}
          getTransactionTotals={getTransactionTotals}
          formatDateTime={formatDateTime}
          markPaymentAsCleared={markPaymentAsCleared}
          markTransactionCleared={markTransactionCleared}
          fmtPrimary={fmtPrimary}
          extraCurrencies={extraCurrencies}
          rates={rates}
        />
      )}

      {/* ── Payment Modal ── */}
      {paymentModal && selectedTransactionId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {filteredTransactions.find(t => t.id === selectedTransactionId)?.mainCategory === 'Cash Inflow'
                  ? 'Record Receipt'
                  : 'Record Payment'}
              </h3>
              <button onClick={() => { setPaymentModal(false); setSelectedTransactionId(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {(() => {
                const tx = filteredTransactions.find(t => t.id === selectedTransactionId);
                if (!tx) return null;
                const { remainingAmount } = getTransactionTotals(tx);
                const isReceivable = tx.mainCategory === 'Cash Inflow';
                return (
                  <div className={`p-4 rounded-xl border ${isReceivable ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                    <p className="text-xs text-gray-500 mb-1">{isReceivable ? 'Remaining to Receive' : 'Remaining Amount'}</p>
                    <p className={`text-2xl font-bold ${isReceivable ? 'text-green-700' : 'text-blue-700'}`}>
                      {fmtPrimary(remainingAmount)}
                    </p>
                    {extraCurrencies.map(code => (
                      <p key={code} className="text-xs text-gray-400 mt-0.5">
                        {fmtAmount(convertFromPKR(remainingAmount, code, rates), getMeta(code))}
                      </p>
                    ))}
                    <p className="text-xs text-gray-400 mt-0.5">{tx.transactionId} · {tx.subCategory}</p>
                  </div>
                );
              })()}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (PKR) *</label>
                <input type="number" min="0" step="100"
                  value={paymentData.amount || ''}
                  onChange={e => setPaymentData({ amount: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter amount in PKR"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] focus:outline-none text-sm" />
                {paymentData.amount > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    ≈ {fmtPrimary(paymentData.amount)}
                    {extraCurrencies.map(code => (
                      <span key={code} className="ml-2">
                        · {fmtAmount(convertFromPKR(paymentData.amount, code, rates), getMeta(code))}
                      </span>
                    ))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash', 'Bank', 'Cheque'] as const).map(m => (
                    <button key={m} type="button" onClick={() => setPaymentData({ method: m })}
                      className={`py-2.5 text-sm rounded-lg border font-medium transition-colors ${
                        paymentData.method === m
                          ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {paymentData.method === 'Bank' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Bank *</label>
                  <select value={paymentData.bankId} onChange={e => setPaymentData({ bankId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] focus:outline-none text-sm">
                    <option value="">— Select Bank —</option>
                    {banks.map(b => <option key={b.id} value={b.id}>{b.name} — {fmtPrimary(b.balance)}</option>)}
                  </select>
                </div>
              )}

              {paymentData.method === 'Cheque' && (
                <div className="space-y-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-purple-700 flex items-center gap-1.5">
                    <CreditCard size={14} /> Cheque Details
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Number *</label>
                    <input type="text" value={paymentData.chequeNumber || ''}
                      onChange={e => setPaymentData({ chequeNumber: e.target.value })}
                      placeholder="e.g. 001234"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] focus:outline-none text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Date</label>
                      <input type="date" value={paymentData.chequeDate || ''}
                        onChange={e => setPaymentData({ chequeDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank on Cheque</label>
                      <input type="text" value={paymentData.chequeBank || ''}
                        onChange={e => setPaymentData({ chequeBank: e.target.value })}
                        placeholder="e.g. HBL, MCB"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] focus:outline-none text-sm" />
                    </div>
                  </div>
                  <p className="text-xs text-purple-600">Cheque will remain uncleared until manually marked as cleared.</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => { setPaymentModal(false); setSelectedTransactionId(null); }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                Cancel
              </button>
              <button onClick={addPartialPayment} disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors text-sm font-semibold disabled:opacity-50">
                {isSaving
                  ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                  : <><Check size={15} /> Record Payment</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}