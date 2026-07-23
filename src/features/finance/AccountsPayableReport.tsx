// Accounts Payable Report
//
// Shows every transaction categorized under "Account Payable" grouped by
// counterparty (paidTo for outflows we made, paidBy for inflows). For each
// counterparty we compute a running net position:
//
//   • Outflow (payment made)     → we're paying down what we owe   → +
//   • Inflow  (new payable)      → we're taking on new debt         → −
//
// The "current position" per counterparty is Outflow − Inflow. A positive
// number means we've paid more than we owed to them (advance / credit).
// A negative number means we still owe them that much.
//
// Data source: transactions[] with subCategory === 'Account Payable'
// (and optionally 'Supplier Payment' if you want to widen the definition).

import React, { useMemo, useState } from 'react';
import {
  ChevronRight, TrendingDown, Users, Download, Calendar,
  Layers, Minimize2, Maximize2, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Transaction } from '../../modules/transactions/models/types';

interface Props {
  transactions: Transaction[];
  invoices:     any[];
  onBack?:      () => void;
}

const CURRENCY = 'AED';
const AP_CATEGORY  = 'Account Payable';
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

interface ApTx {
  id: string;
  date: string;
  direction: 'paid' | 'received';    // outflow = paid down; inflow = new debt
  amount: number;
  counterparty: string;
  mode?: string;
  note?: string;
}

export function AccountsPayableReport({ transactions }: Props) {
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

  // Bucket AP transactions by counterparty
  const { byCounterparty, totals } = useMemo(() => {
    const apTxs: ApTx[] = [];
    for (const t of transactions || []) {
      if ((t as any).approvalStatus === 'pending_approval') continue;
      if ((t as any).approvalStatus === 'rejected') continue;
      if (t.subCategory !== AP_CATEGORY) continue;
      const d = String(t.date || '').slice(0, 10);
      if (d < from || d > to) continue;
      const isPayment = t.mainCategory === 'Cash Outflow';
      const counterparty = (isPayment ? t.paidTo : t.paidBy) || t.note || 'Unknown counterparty';
      apTxs.push({
        id: t.id || `${t.transactionId}-${t.date}`,
        date: d,
        direction: isPayment ? 'paid' : 'received',
        amount: Number(t.amount) || 0,
        counterparty: String(counterparty),
        mode: t.mode,
        note: t.note,
      });
    }
    apTxs.sort((a, b) => (a.date < b.date ? 1 : -1));

    // Group by counterparty
    const map: Record<string, ApTx[]> = {};
    for (const x of apTxs) (map[x.counterparty] ||= []).push(x);

    const byCounterparty = Object.keys(map).map(name => {
      const txs = map[name];
      const paid     = txs.filter(x => x.direction === 'paid').reduce((s, x) => s + x.amount, 0);
      const received = txs.filter(x => x.direction === 'received').reduce((s, x) => s + x.amount, 0);
      // Owed (negative) means we still owe them.
      // Advance (positive) means we've paid ahead.
      const net = paid - received;
      return { name, txs, paid, received, net };
    }).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

    const totalPaid     = byCounterparty.reduce((s, c) => s + c.paid, 0);
    const totalReceived = byCounterparty.reduce((s, c) => s + c.received, 0);
    const netPosition   = totalPaid - totalReceived;

    return {
      byCounterparty,
      totals: {
        counterparties: byCounterparty.length,
        totalPaid, totalReceived, netPosition,
      },
    };
  }, [transactions, from, to]);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExpanded(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });
  const expandAll   = () => setExpanded(new Set(byCounterparty.map(c => c.name)));
  const collapseAll = () => setExpanded(new Set());

  const handleExport = () => {
    const rows: string[] = [];
    rows.push(`Accounts Payable,${from} to ${to}`);
    rows.push('');
    rows.push('Counterparty,Date,Direction,Amount,Mode,Note');
    for (const c of byCounterparty) {
      for (const x of c.txs) {
        rows.push([c.name, x.date, x.direction, x.amount.toFixed(2), x.mode || '', (x.note || '').replace(/[,\n]/g, ' ')].join(','));
      }
    }
    rows.push('');
    rows.push(`Total Paid,${totals.totalPaid.toFixed(2)}`);
    rows.push(`Total Received,${totals.totalReceived.toFixed(2)}`);
    rows.push(`Net Position,${totals.netPosition.toFixed(2)}`);
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `accounts-payable-${from}-to-${to}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const inp: React.CSSProperties = { padding: '7px 11px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12.5, outline: 'none', backgroundColor: '#fff' };
  const miniBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7, border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginRight: 4 }}>Date range</label>
          {([['all', 'All time'], ['thisMonth', 'This month'], ['lastMonth', 'Last month'], ['last3Months', 'Last 3 months'], ['thisYear', 'This year']] as [Preset, string][]).map(([id, label]) => {
            const active = preset === id;
            return (
              <button key={id} onClick={() => applyPreset(id)} style={{
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
        <Tile icon={<TrendingDown size={18} />} label="Total Paid Out"  value={totals.totalPaid}     fg="#c2410c" bg="#fff7ed" />
        <Tile icon={<ArrowDownRight size={18} />} label="Debt Taken On"  value={totals.totalReceived} fg="#dc2626" bg="#fef2f2" />
        <Tile icon={<Users size={18} />}         label="Counterparties" value={totals.counterparties} fg="#334155" bg="#f1f5f9" plain />
        <Tile
          icon={totals.netPosition >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
          label={totals.netPosition >= 0 ? 'Net Advance' : 'Net Owed'}
          value={Math.abs(totals.netPosition)}
          fg={totals.netPosition >= 0 ? '#059669' : '#dc2626'}
          bg={totals.netPosition >= 0 ? '#ecfdf5' : '#fef2f2'}
          highlight />
      </div>

      {/* Per-counterparty list */}
      <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 22px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={16} color="#334155" />
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Payables by Counterparty</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '10px 22px', backgroundColor: '#fafbfc', borderBottom: '1px solid #e2e8f0', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em' }}>
          <span>Counterparty / Transaction</span>
          <span style={{ textAlign: 'right', minWidth: 180 }}>Amount ({CURRENCY})</span>
        </div>

        {byCounterparty.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            No Account Payable transactions in this range.
          </div>
        ) : byCounterparty.map(c => {
          const isOpen = expanded.has(c.name);
          const owed  = c.net < 0;   // negative net = we still owe them
          return (
            <React.Fragment key={c.name}>
              <div
                onClick={() => toggle(c.name)}
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
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{c.name}</span>
                  <span style={{ fontSize: 10.5, color: '#94a3b8', marginLeft: 4 }}>
                    · {c.txs.length} {c.txs.length === 1 ? 'entry' : 'entries'} · Paid AED {fmt(c.paid)}{c.received > 0 ? ` · Received AED ${fmt(c.received)}` : ''}
                  </span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: owed ? '#dc2626' : '#059669', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', minWidth: 180, textAlign: 'right' }}>
                  {owed ? '−' : '+'}<span style={{ opacity: 0.6, fontSize: '0.82em', marginRight: 3 }}>{CURRENCY}</span>{fmt(Math.abs(c.net))}
                </span>
              </div>

              {isOpen && c.txs.map(x => (
                <div key={x.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 10,
                  alignItems: 'center', padding: '8px 22px 8px 60px',
                  backgroundColor: '#fff', borderBottom: '1px solid #f8fafc',
                  fontSize: 12, color: '#475569',
                }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800,
                      backgroundColor: x.direction === 'paid' ? '#ecfdf5' : '#fef2f2',
                      color:            x.direction === 'paid' ? '#059669' : '#dc2626',
                      marginRight: 8, textTransform: 'uppercase', letterSpacing: '.05em',
                    }}>{x.direction === 'paid' ? 'Paid' : 'New debt'}</span>
                    <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: 11 }}>
                      {fmtDate(x.date)}{x.mode ? ' · ' + x.mode : ''}{x.note ? ' · ' + x.note : ''}
                    </span>
                  </div>
                  <span style={{
                    fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                    color: x.direction === 'paid' ? '#059669' : '#dc2626',
                    textAlign: 'right', minWidth: 180,
                  }}>
                    {x.direction === 'paid' ? '−' : '+'}
                    <span style={{ opacity: 0.55, fontSize: '0.82em', marginRight: 3 }}>{CURRENCY}</span>{fmt(x.amount)}
                  </span>
                </div>
              ))}
            </React.Fragment>
          );
        })}

        {byCounterparty.length > 0 && (
          <div style={{ padding: '14px 22px', backgroundColor: '#0f172a', color: '#fff', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 800 }}>
              {totals.netPosition >= 0 ? 'Net Advance (we\'re ahead)' : 'Net Owed (still owe out)'}
            </span>
            <span style={{ fontSize: 16, fontWeight: 900, color: totals.netPosition >= 0 ? '#6ee7b7' : '#fca5a5', fontVariantNumeric: 'tabular-nums', minWidth: 180, textAlign: 'right' }}>
              {totals.netPosition < 0 ? '−' : '+'}
              <span style={{ opacity: 0.7, fontSize: '0.82em', marginRight: 4 }}>{CURRENCY}</span>
              {fmt(Math.abs(totals.netPosition))}
            </span>
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: '6px 8px 12px' }}>
        Payments (outflow) reduce what we owe. New payables (inflow) increase it. Net = Paid − Received.
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