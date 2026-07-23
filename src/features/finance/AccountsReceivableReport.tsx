// Accounts Receivable Report
//
// Shows every invoice with an outstanding balance (unpaid or partial),
// grouped by customer with expandable per-invoice detail rows. Includes
// an aging breakdown (current / 1-30 / 31-60 / 61-90 / 90+ days) and
// date-range filter chips.
//
// Data source: invoices[] — any invoice where remainingAmount > 0
//              (or totalAmount - paidAmount > 0) counts as AR.

import React, { useMemo, useState } from 'react';
import {
  ChevronRight, TrendingUp, Users, Clock, AlertTriangle,
  Download, Calendar, Layers, Minimize2, Maximize2,
} from 'lucide-react';

interface Props {
  transactions: any[];
  invoices:     any[];
  onBack?:      () => void;
}

const CURRENCY = 'AED';
const fmt = (n: number) =>
  (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso: string) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  } catch { return iso; }
};
const daysSince = (iso: string): number => {
  if (!iso) return 0;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
};

interface OpenInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  totalAmount:  number;
  paidAmount:   number;
  remaining:    number;
  ageDays:      number;
  bucket:       'current' | '1-30' | '31-60' | '61-90' | '90+';
}

export function AccountsReceivableReport({ invoices }: Props) {
  // Date-range filter — filters by invoice date so users can look at
  // AR "as of" a period. Default: all invoices (any date).
  type Preset = 'all' | 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear' | 'custom';
  const [preset, setPreset] = useState<Preset>('all');
  const [from, setFrom] = useState<string>('2000-01-01');
  const [to, setTo]     = useState<string>(() => new Date().toISOString().slice(0, 10));

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p === 'custom') return;
    const now = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    let f: Date, t: Date;
    switch (p) {
      case 'thisMonth':   f = new Date(now.getFullYear(), now.getMonth(), 1); t = now; break;
      case 'lastMonth':   f = new Date(now.getFullYear(), now.getMonth() - 1, 1); t = new Date(now.getFullYear(), now.getMonth(), 0); break;
      case 'last3Months': f = new Date(now.getFullYear(), now.getMonth() - 2, 1); t = now; break;
      case 'thisYear':    f = new Date(now.getFullYear(), 0, 1); t = now; break;
      case 'all':         f = new Date(2000, 0, 1); t = now; break;
      default: return;
    }
    setFrom(iso(f)); setTo(iso(t));
  };
  const onFromChange = (v: string) => { setFrom(v); setPreset('custom'); };
  const onToChange   = (v: string) => { setTo(v);   setPreset('custom'); };

  // Build the list of open invoices
  const { openInvoices, byCustomer, totals, aging } = useMemo(() => {
    const openInvoices: OpenInvoice[] = [];
    for (const inv of invoices || []) {
      if (inv.status === 'deleted') continue;
      const total = Number(inv.totalAmount) || 0;
      const paid  = Number(inv.paidAmount)  || 0;
      const remaining = Number(inv.remainingAmount);
      const owed = (isFinite(remaining) && remaining > 0)
        ? remaining
        : Math.max(0, total - paid);
      if (owed <= 0.001) continue;
      const invDate = String(inv.date || '').slice(0, 10);
      if (invDate < from || invDate > to) continue;
      const ageDays = daysSince(invDate);
      const bucket: OpenInvoice['bucket'] =
        ageDays === 0            ? 'current' :
        ageDays <= 30            ? '1-30'    :
        ageDays <= 60            ? '31-60'   :
        ageDays <= 90            ? '61-90'   : '90+';
      openInvoices.push({
        id: inv.id || inv.invoiceNumber,
        invoiceNumber: inv.invoiceNumber || 'INV-?',
        date: invDate,
        customerName: inv.customerName || 'Unknown Customer',
        totalAmount: total,
        paidAmount: paid,
        remaining: owed,
        ageDays,
        bucket,
      });
    }
    openInvoices.sort((a, b) => b.remaining - a.remaining);

    // Group by customer
    const byCustomerMap: Record<string, OpenInvoice[]> = {};
    for (const oi of openInvoices) {
      (byCustomerMap[oi.customerName] ||= []).push(oi);
    }
    const byCustomer = Object.keys(byCustomerMap).map(name => {
      const invs = byCustomerMap[name];
      const total = invs.reduce((s, i) => s + i.remaining, 0);
      const oldest = invs.reduce((m, i) => Math.max(m, i.ageDays), 0);
      return { name, invoices: invs, total, oldest };
    }).sort((a, b) => b.total - a.total);

    // Aging totals
    const aging = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    for (const oi of openInvoices) aging[oi.bucket] += oi.remaining;

    const totalOwed = openInvoices.reduce((s, i) => s + i.remaining, 0);
    const overdue   = aging['1-30'] + aging['31-60'] + aging['61-90'] + aging['90+'];
    const critical  = aging['90+'];

    return {
      openInvoices, byCustomer,
      totals: { totalOwed, customers: byCustomer.length, overdue, critical },
      aging,
    };
  }, [invoices, from, to]);

  // Expand/collapse per customer
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExpanded(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });
  const expandAll   = () => setExpanded(new Set(byCustomer.map(c => c.name)));
  const collapseAll = () => setExpanded(new Set());

  const handleExport = () => {
    const rows: string[] = [];
    rows.push(`Accounts Receivable,${from} to ${to}`);
    rows.push('');
    rows.push('Customer,Invoice #,Date,Age (days),Total,Paid,Remaining');
    for (const c of byCustomer) {
      for (const i of c.invoices) {
        rows.push([c.name, i.invoiceNumber, i.date, String(i.ageDays), i.totalAmount.toFixed(2), i.paidAmount.toFixed(2), i.remaining.toFixed(2)].join(','));
      }
    }
    rows.push('');
    rows.push(`Total Outstanding,${totals.totalOwed.toFixed(2)}`);
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `accounts-receivable-${from}-to-${to}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const inp: React.CSSProperties = {
    padding: '7px 11px', border: '1px solid #e2e8f0', borderRadius: 7,
    fontSize: 12.5, outline: 'none', backgroundColor: '#fff',
  };
  const miniBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '7px 12px', borderRadius: 7, border: '1px solid #e2e8f0',
    backgroundColor: '#fff', fontSize: 11.5, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Filters + actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginRight: 4 }}>Invoice date</label>
          {([['all', 'All time'], ['thisMonth', 'This month'], ['lastMonth', 'Last month'], ['last3Months', 'Last 3 months'], ['thisYear', 'This year']] as [Preset, string][]).map(([id, label]) => {
            const active = preset === id;
            return (
              <button key={id} onClick={() => applyPreset(id)}
                style={{
                  padding: '5px 11px', borderRadius: 99,
                  border: active ? 'none' : '1px solid #e2e8f0',
                  backgroundColor: active ? '#0f172a' : '#fff',
                  color: active ? '#fff' : '#334155',
                  fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{label}</button>
            );
          })}
          {preset === 'custom' && <span style={{ padding: '5px 11px', borderRadius: 99, backgroundColor: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700 }}>Custom range</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Calendar size={15} color="#64748b" />
          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' }}>From</label>
          <input type="date" value={from} onChange={e => onFromChange(e.target.value)} max={to} style={inp} />
          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' }}>To</label>
          <input type="date" value={to} onChange={e => onToChange(e.target.value)} min={from} style={inp} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button onClick={expandAll} style={{ ...miniBtn, color: '#334155' }}><Maximize2 size={12} /> Expand All</button>
            <button onClick={collapseAll} style={{ ...miniBtn, color: '#334155' }}><Minimize2 size={12} /> Collapse All</button>
            <button onClick={handleExport} style={{ ...miniBtn, backgroundColor: '#0f172a', color: '#fff', border: 'none' }}><Download size={12} /> Export CSV</button>
          </div>
        </div>
      </div>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <Tile icon={<TrendingUp size={18} />} label="Total Outstanding" value={totals.totalOwed} fg="#c2410c" bg="#fff7ed" />
        <Tile icon={<Users size={18} />}       label="Customers"          value={totals.customers} fg="#334155" bg="#f1f5f9" plain />
        <Tile icon={<Clock size={18} />}       label="Overdue (>0 days)"  value={totals.overdue} fg="#dc2626" bg="#fef2f2" />
        <Tile icon={<AlertTriangle size={18} />} label="Critical (>90 days)" value={totals.critical} fg="#b91c1c" bg="#fef2f2" highlight />
      </div>

      {/* Aging breakdown */}
      <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', fontSize: 12.5, fontWeight: 800, color: '#334155', backgroundColor: '#fafbfc' }}>
          Aging Breakdown
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 0 }}>
          {([['current', 'Current', '#059669'], ['1-30', '1–30 days', '#0284c7'], ['31-60', '31–60 days', '#c2410c'], ['61-90', '61–90 days', '#dc2626'], ['90+', '90+ days', '#991b1b']] as [keyof typeof aging, string, string][]).map(([k, label, color], i) => (
            <div key={String(k)} style={{ padding: '14px 16px', borderRight: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ opacity: 0.55, fontSize: '0.75em', marginRight: 3 }}>{CURRENCY}</span>{fmt(aging[k])}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-customer list */}
      <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 22px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={16} color="#334155" />
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Outstanding by Customer</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '10px 22px', backgroundColor: '#fafbfc', borderBottom: '1px solid #e2e8f0', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em' }}>
          <span>Customer / Invoice</span>
          <span style={{ textAlign: 'right', minWidth: 180 }}>Remaining ({CURRENCY})</span>
        </div>

        {byCustomer.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            No outstanding invoices in this range. Everyone's paid up.
          </div>
        ) : byCustomer.map(cust => {
          const isOpen = expanded.has(cust.name);
          return (
            <React.Fragment key={cust.name}>
              <div
                onClick={() => toggle(cust.name)}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 10,
                  alignItems: 'center', padding: '12px 22px',
                  backgroundColor: isOpen ? '#f8fafc' : '#fff',
                  borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                  transition: 'background-color 0.12s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ChevronRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease', color: '#c2410c' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{cust.name}</span>
                  <span style={{ fontSize: 10.5, color: '#94a3b8', marginLeft: 4 }}>
                    · {cust.invoices.length} {cust.invoices.length === 1 ? 'invoice' : 'invoices'} · oldest {cust.oldest}d
                  </span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#c2410c', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', minWidth: 180, textAlign: 'right' }}>
                  <span style={{ opacity: 0.6, fontSize: '0.82em', marginRight: 3 }}>{CURRENCY}</span>{fmt(cust.total)}
                </span>
              </div>

              {isOpen && cust.invoices.map(inv => (
                <div key={inv.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 10,
                  alignItems: 'center', padding: '8px 22px 8px 60px',
                  backgroundColor: '#fff', borderBottom: '1px solid #f8fafc',
                  fontSize: 12, color: '#475569',
                }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{inv.invoiceNumber}</span>
                    <span style={{ marginLeft: 8, fontStyle: 'italic', color: '#94a3b8', fontSize: 11 }}>
                      {fmtDate(inv.date)} · {inv.ageDays}d old · Paid AED {fmt(inv.paidAmount)} of AED {fmt(inv.totalAmount)}
                    </span>
                  </div>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: inv.ageDays > 60 ? '#dc2626' : '#c2410c', textAlign: 'right', minWidth: 180 }}>
                    <span style={{ opacity: 0.55, fontSize: '0.82em', marginRight: 3 }}>{CURRENCY}</span>{fmt(inv.remaining)}
                  </span>
                </div>
              ))}
            </React.Fragment>
          );
        })}

        {byCustomer.length > 0 && (
          <div style={{ padding: '14px 22px', backgroundColor: '#0f172a', color: '#fff', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 800 }}>Total Accounts Receivable</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fca5a5', fontVariantNumeric: 'tabular-nums', minWidth: 180, textAlign: 'right' }}>
              <span style={{ opacity: 0.7, fontSize: '0.82em', marginRight: 4 }}>{CURRENCY}</span>{fmt(totals.totalOwed)}
            </span>
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: '6px 8px 12px' }}>
        Shows every invoice with a remaining balance. Age is calculated from the invoice date to today.
      </div>
    </div>
  );
}

const Tile: React.FC<{
  icon: React.ReactNode; label: string; value: number;
  fg: string; bg: string; plain?: boolean; highlight?: boolean;
}> = ({ icon, label, value, fg, bg, plain, highlight }) => (
  <div style={{
    backgroundColor: highlight ? fg : '#fff', borderRadius: 12, padding: '16px 18px',
    border: highlight ? 'none' : '1px solid #e2e8f0',
    display: 'flex', alignItems: 'center', gap: 14,
    boxShadow: highlight ? '0 6px 16px -6px rgba(15,23,42,0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 11,
      backgroundColor: highlight ? 'rgba(255,255,255,0.18)' : bg,
      color: highlight ? '#fff' : fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: highlight ? 'rgba(255,255,255,0.85)' : '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: highlight ? '#fff' : fg, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', marginTop: 2 }}>
        {!plain && <span style={{ fontSize: 11, opacity: 0.7, marginRight: 3 }}>{CURRENCY}</span>}
        {plain ? value : fmt(value)}
      </div>
    </div>
  </div>
);