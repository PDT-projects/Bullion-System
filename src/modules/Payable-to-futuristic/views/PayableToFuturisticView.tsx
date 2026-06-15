// views/PayableToFuturisticView.tsx
import React, { useState } from 'react';
import {
  Building2, RefreshCw, AlertCircle, Loader2,
  DollarSign, ChevronDown, ChevronRight, Package,
  FileText, MapPin,
} from 'lucide-react';
import { usePayableToFuturistic } from '../viewModels/usePayableToFuturistic';
import type { InvoicePayableSummary, DerivedPayable } from '../viewModels/usePayableToFuturistic';
import type { Currency } from '../models/payableToFuturistic';
import { CURRENCY_SYMBOLS } from '../models/payableToFuturistic';

const ALL_CURRENCIES: Currency[] = ['AED', 'PKR', 'SAR', 'USD'];

type CurrKey = 'aed' | 'pkr' | 'sar' | 'usd';
function currKey(c: Currency): CurrKey { return c.toLowerCase() as CurrKey; }

function fmt(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

// ── Inline style constants so Tailwind purge never removes them ───────────────
const S = {
  charcoal:      { backgroundColor: '#1e293b', color: '#ffffff' } as React.CSSProperties,
  charcoalLight: { backgroundColor: '#334155', color: '#ffffff' } as React.CSSProperties,
  charcoalCard:  { backgroundColor: '#1e293b', color: '#ffffff', border: '1px solid #334155' } as React.CSSProperties,
  tabActive:     { backgroundColor: '#1e293b', color: '#ffffff' } as React.CSSProperties,
  tabInactive:   { backgroundColor: 'transparent', color: '#64748b' } as React.CSSProperties,
  toggleBtn:     { backgroundColor: '#1e293b', color: '#ffffff', width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as React.CSSProperties,
};

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  partial: { label: 'Partial', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  paid:    { label: 'Paid',    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};
function StatusBadge({ status }: { status: 'pending' | 'partial' | 'paid' }) {
  const { label, cls } = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ── Product sub-row ───────────────────────────────────────────────────────────
function ProductRow({ item, currency }: { item: DerivedPayable; currency: Currency }) {
  const k = currKey(currency);
  const sym = CURRENCY_SYMBOLS[currency];
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors" style={{ backgroundColor: '#f8fafc' }}>
      <td className="pl-16 pr-4 py-3">
        <div className="flex items-center gap-2">
          <Package size={13} className="text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-700">{item.modelName}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        {item.location
          ? <span className="inline-flex items-center gap-1 text-xs text-gray-500"><MapPin size={11} />{item.location}</span>
          : <span className="text-gray-300 text-xs">—</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-semibold text-gray-800">{sym} {fmt(item.amounts[k])}</span>
      </td>
      <td className="px-4 py-3 text-center"><StatusBadge status={item.status} /></td>
      <td className="px-4 py-3 text-center text-gray-500 text-xs">{fmtDate(item.saleDate)}</td>
    </tr>
  );
}

// ── Invoice group row ─────────────────────────────────────────────────────────
function InvoiceGroup({
  summary, currency, expanded, onToggle,
}: {
  summary: InvoicePayableSummary;
  currency: Currency;
  expanded: boolean;
  onToggle: () => void;
}) {
  const k = currKey(currency);
  const sym = CURRENCY_SYMBOLS[currency];
  return (
    <>
      <tr
        className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div style={S.toggleBtn}>
              {expanded
                ? <ChevronDown size={12} color="#ffffff" />
                : <ChevronRight size={12} color="#ffffff" />}
            </div>
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">
                {summary.invoiceNumber !== 'No Invoice'
                  ? `Invoice #${summary.invoiceNumber}`
                  : 'No Invoice Linked'}
              </span>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {summary.items.length} item{summary.items.length !== 1 ? 's' : ''}
            </span>
          </div>
        </td>
        <td className="px-4 py-4 text-gray-500 text-xs">{fmtDate(summary.saleDate)}</td>
        <td className="px-4 py-4 text-right">
          <span className="text-base font-bold text-gray-900">{sym} {fmt(summary.totalAmounts[k])}</span>
        </td>
        <td className="px-4 py-4 text-center"><StatusBadge status={summary.status} /></td>
        <td className="px-4 py-4 text-center text-gray-400 text-xs">{fmtDate(summary.saleDate)}</td>
      </tr>
      {expanded && summary.items.map((item) => (
        <ProductRow key={item.productId} item={item} currency={currency} />
      ))}
    </>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────
export const PayableToFuturisticView: React.FC = () => {
  const { summaries, totals, loading, error, refresh } = usePayableToFuturistic();
  const [activeCurrency, setActiveCurrency] = useState<Currency>('USD');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpandedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const expandAll   = () => setExpandedIds(new Set(summaries.map((s) => s.invoiceId)));
  const collapseAll = () => setExpandedIds(new Set());

  const totalItems   = summaries.reduce((n, s) => n + s.items.length, 0);
  const pendingCount = summaries.filter((s) => s.status === 'pending').length;
  const k   = currKey(activeCurrency);
  const sym = CURRENCY_SYMBOLS[activeCurrency];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-gray-600" />
          <span className="text-sm text-gray-500">Loading Futuristic payables…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={refresh} className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 transition-colors">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Charcoal icon — inline style guarantees render */}
          <div style={{ ...S.charcoal, padding: 10, borderRadius: 12 }}>
            <Building2 size={20} color="#ffffff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Payable to Futuristic</h1>
            <p className="text-xs text-gray-500">
              {totalItems} product{totalItems !== 1 ? 's' : ''} across {summaries.length} invoice{summaries.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* USD — charcoal primary card */}
        <div style={{ ...S.charcoalCard, borderRadius: 16, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Total (USD)</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>$ {fmt(totals.usd)}</p>
        </div>
        {/* AED */}
        <div className="rounded-2xl p-4 bg-white border border-gray-100 shadow-sm">
          <p className="text-xs font-medium mb-1.5 text-gray-500">Total (AED)</p>
          <p className="text-lg font-bold text-gray-800">{fmt(totals.aed)}</p>
        </div>
        {/* PKR */}
        <div className="rounded-2xl p-4 bg-white border border-gray-100 shadow-sm">
          <p className="text-xs font-medium mb-1.5 text-gray-500">Total (PKR)</p>
          <p className="text-lg font-bold text-gray-800">{fmt(totals.pkr)}</p>
        </div>
        {/* SAR */}
        <div className="rounded-2xl p-4 bg-white border border-gray-100 shadow-sm">
          <p className="text-xs font-medium mb-1.5 text-gray-500">Total (SAR)</p>
          <p className="text-lg font-bold text-gray-800">{fmt(totals.sar)}</p>
        </div>
      </div>

      {/* ── Pills ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-2 text-sm px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg">
          <DollarSign size={13} />
          Outstanding: <strong>{pendingCount} invoice{pendingCount !== 1 ? 's' : ''} pending</strong>
        </span>
        <span className="inline-flex items-center gap-2 text-sm px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg">
          <Package size={13} />
          {totalItems} Futuristic unit{totalItems !== 1 ? 's' : ''} tracked
        </span>
      </div>

      {/* ── Currency Tabs ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {ALL_CURRENCIES.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCurrency(c)}
            style={activeCurrency === c ? S.tabActive : S.tabInactive}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          >
            {c}
          </button>
        ))}
      </div>

      {/* ── Table / Empty ──────────────────────────────────────────────────── */}
      {summaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Building2 size={48} className="mb-4 opacity-20" />
          <p className="text-base font-medium text-gray-500">No Futuristic products found</p>
          <p className="text-sm mt-1 text-gray-400">
            Products with brand "Futuristic" linked to invoices will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Invoices &amp; Products
            </span>
            <div className="flex items-center gap-3">
              <button onClick={expandAll}   className="text-xs font-medium text-gray-700 hover:underline">Expand all</button>
              <span className="text-gray-300 text-xs">|</span>
              <button onClick={collapseAll} className="text-xs text-gray-500 hover:underline">Collapse all</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Invoice / Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Amount ({activeCurrency})</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Sale Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summaries.map((s) => (
                  <InvoiceGroup
                    key={s.invoiceId}
                    summary={s}
                    currency={activeCurrency}
                    expanded={expandedIds.has(s.invoiceId)}
                    onToggle={() => toggle(s.invoiceId)}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-5 py-4 font-bold text-gray-800" colSpan={2}>Grand Total</td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-lg font-bold text-gray-900">{sym} {fmt(totals[k])}</span>
                  </td>
                  <td colSpan={2} className="px-4 py-4 text-center text-xs text-gray-500">
                    {summaries.filter((s) => s.status === 'paid').length} of {summaries.length} invoices paid
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Price Reference ─────────────────────────────────────────────────── */}
      <details className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden group">
        <summary className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors list-none flex items-center gap-2 select-none">
          <ChevronRight size={13} className="group-open:rotate-90 transition-transform" />
          Futuristic Price Reference
        </summary>
        <div className="px-5 pb-4 pt-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {([
              ['Revealer', 500], ['Revealer Plus', 700],
              ['Unvieler', 750], ['Unvieler Plus', 900],
              ['Tgx Lite', 1300], ['Tgx Pro', 1500],
              ['Tgx Special Edition', 1800], ['Tgx Pro Plus', 2000],
            ] as [string, number][]).map(([model, price]) => (
              <div key={model} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-600">{model}</span>
                <span className="text-xs font-bold text-gray-800">${price}</span>
              </div>
            ))}
          </div>
        </div>
      </details>

    </div>
  );
};