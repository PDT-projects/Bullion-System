// Against the Invoice Module — Dashboard

import React, { useState } from 'react';
import {
  FileText, Plus, Search, Filter, Trash2, Eye,
  TrendingDown, Wallet, CheckCircle, Receipt,
  AlertCircle, Loader2, X,
} from 'lucide-react';
import { useATIViewModel } from '../viewModels/useATIViewModel';
import { ATICreateForm } from './ATICreateForm';
import { AgainstInvoiceEntry, InvoiceBalanceSummary } from '../models/types';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Settled: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  Partial: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  Active:  { bg: '#f1f5f9', color: '#1e293b', border: '#cbd5e1' },
};
const MODE_STYLE: Record<string, { bg: string; color: string }> = {
  Cash:   { bg: '#f0fdf4', color: '#15803d' },
  Bank:   { bg: '#f1f5f9', color: '#1e293b' },
  Cheque: { bg: '#faf5ff', color: '#7e22ce' },
};

const getStatus = (s: string) => STATUS_STYLE[s] ?? { bg: '#f9fafb', color: '#374151', border: '#e5e7eb' };
const getMode   = (m: string) => MODE_STYLE[m]   ?? { bg: '#f9fafb', color: '#374151' };

/* ── Progress Bar ── */
function ProgressBar({ paid, total }: { paid: number; total: number }) {
  const pct   = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  const color = pct >= 100 ? '#22c55e' : pct > 50 ? '#334155' : '#f59e0b';
  return (
    <div style={{ width: '100%', height: '5px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px', transition: 'width 0.4s' }} />
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ icon: Icon, label, value, sub, iconColor, iconBg }: {
  icon: React.ElementType; label: string; value: string; sub?: string; iconColor: string; iconBg: string;
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
      padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} color={iconColor} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
        {sub && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── Balance Card ── */
function BalanceCard({ summary, onViewEntries }: { summary: InvoiceBalanceSummary; onViewEntries: (n: string) => void }) {
  const st = getStatus(summary.status);
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{summary.invoiceNumber}</span>
            <span style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600,
              background: st.bg, color: st.color, border: `1px solid ${st.border}`,
            }}>{summary.status}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>{summary.customerName}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Last: {fmtDate(summary.lastPaymentDate || summary.date)}</div>
        </div>
        <button
          onClick={() => onViewEntries(summary.invoiceNumber)}
          style={{ fontSize: '11px', color: '#0f172a', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
        >
          <Eye size={12} /> {summary.entryCount}
        </button>
      </div>
      <ProgressBar paid={summary.totalPaid} total={summary.invoiceTotal} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
        <span style={{ color: '#6b7280' }}>Paid <strong style={{ color: '#16a34a' }}>{fmt(summary.totalPaid)}</strong></span>
        <span style={{ fontWeight: 700, color: summary.remaining > 0 ? '#dc2626' : '#16a34a' }}>{fmt(summary.remaining)} left</span>
      </div>
    </div>
  );
}

/* ── Entry Row ── */
function EntryRow({ entry, onDelete, onView }: {
  entry: AgainstInvoiceEntry;
  onDelete: (e: AgainstInvoiceEntry) => void;
  onView:   (e: AgainstInvoiceEntry) => void;
}) {
  const st = getStatus(entry.status);
  const md = getMode(entry.paymentMode);
  return (
    <tr style={{ borderBottom: '1px solid #f3f4f6' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <td style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#374151' }}>{entry.transactionId}</div>
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{fmtDate(entry.date)}</div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{entry.invoiceNumber}</div>
        <div style={{ fontSize: '11px', color: '#6b7280', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.customerName}</div>
      </td>
      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{fmt(entry.amount)}</span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{
          fontSize: '11px', padding: '3px 8px', borderRadius: '999px', fontWeight: 600,
          background: md.bg, color: md.color,
        }}>{entry.paymentMode}</span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>{fmt(entry.totalPaidAfter)}</div>
        <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>{fmt(entry.remainingAfter)} left</div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{
          fontSize: '11px', padding: '3px 8px', borderRadius: '999px', fontWeight: 600,
          background: st.bg, color: st.color, border: `1px solid ${st.border}`,
        }}>{entry.status}</span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => onView(entry)}
            title="View"
            style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none';    e.currentTarget.style.color = '#9ca3af'; }}
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onDelete(entry)}
            title="Delete"
            style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none';    e.currentTarget.style.color = '#9ca3af'; }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── Detail Modal ── */
function EntryDetailModal({ entry, onClose }: { entry: AgainstInvoiceEntry; onClose: () => void }) {
  const st = getStatus(entry.status);
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px',
    }}>
      <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '420px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={13} color="#0f172a" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Payment Details</span>
          </div>
          <button onClick={onClose} style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={16} />
          </button>
        </div>

        {/* Amount hero */}
        <div style={{ padding: '20px', background: '#f9fafb', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Amount</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: '4px 0' }}>{fmt(entry.amount)}</div>
          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
            {entry.status}
          </span>
        </div>

        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {[
            { label: 'Transaction ID', value: entry.transactionId, mono: true },
            { label: 'Invoice',        value: entry.invoiceNumber },
            { label: 'Customer',       value: entry.customerName },
            { label: 'Payment Mode',   value: entry.paymentMode },
            { label: 'Date',           value: fmtDate(entry.date) },
            { label: 'Time',           value: entry.time || '—' },
          ].map(({ label, value, mono }) => (
            <div key={label}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              <div style={{ fontSize: mono ? '11px' : '13px', fontWeight: 600, color: '#111827', marginTop: '2px', fontFamily: mono ? 'monospace' : undefined }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#16a34a' }}>Total Paid</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#15803d', marginTop: '2px' }}>{fmt(entry.totalPaidAfter)}</div>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#dc2626' }}>Remaining</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#b91c1c', marginTop: '2px' }}>{fmt(entry.remainingAfter)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export function AgainstInvoiceDashboard() {
  const vm = useATIViewModel();
  const [tab,          setTab]          = useState<'entries' | 'balances'>('entries');
  const [showFilters,  setShowFilters]  = useState(false);
  const [balanceFilter,setBalanceFilter]= useState('');
  const [viewDetail,   setViewDetail]   = useState<AgainstInvoiceEntry | null>(null);

  const filteredSummaries = vm.balanceSummaries.filter(s =>
    s.invoiceNumber.toLowerCase().includes(balanceFilter.toLowerCase()) ||
    s.customerName.toLowerCase().includes(balanceFilter.toLowerCase())
  );

  // ── Create form view ───────────────────────────────────────────────────────
  if (vm.activeView === 'create') {
    return (
      <ATICreateForm
        invoices={vm.availableInvoices}
        isSubmitting={vm.isSubmitting}
        branches={vm.branches}
        banks={vm.banks}
        onAddBranch={vm.onAddBranch}
        onSubmit={vm.handleSubmit}
        onCancel={() => vm.setActiveView('list')}
        onSearchInvoices={vm.searchInvoices}   // ← NEW prop wired here
      />
    );
  }

  const inputStyle = {
    fontSize: '13px', color: '#374151', background: '#fff',
    border: '1.5px solid #e5e7eb', borderRadius: '8px',
    padding: '8px 14px', outline: 'none', boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: '#fff', border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={20} color="#374151" />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>Against the Invoice</h1>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, marginTop: '2px' }}>Track payments linked to specific invoices</p>
            </div>
          </div>

          <button
            onClick={() => vm.setActiveView('create')}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '10px 18px',
              background: '#0f172a', color: '#fff', border: 'none',
              borderRadius: '9px', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(15,23,42,0.35)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1e293b')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0f172a')}
          >
            <Plus size={16} />
            New Payment Entry
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <StatCard icon={Receipt}      label="Total Entries"    value={String(vm.stats.totalEntries)}  iconColor="#334155" iconBg="#f1f5f9" />
          <StatCard icon={Wallet}       label="Total Paid"       value={fmt(vm.stats.totalAmountPaid)}  iconColor="#22c55e" iconBg="#f0fdf4" />
          <StatCard icon={TrendingDown} label="Still Remaining"  value={fmt(vm.stats.totalRemaining)}   iconColor="#ef4444" iconBg="#fef2f2" />
          <StatCard icon={CheckCircle}  label="Settled Invoices" value={String(vm.stats.settledCount)}  iconColor="#22c55e" iconBg="#f0fdf4"
            sub={`${vm.stats.partialCount} partial`} />
        </div>

        {/* ── Tabs + Content ── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
            {(['entries', 'balances'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '13px 16px', fontSize: '13px', fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: tab === t ? '#0f172a' : '#6b7280',
                  borderBottom: tab === t ? '2px solid #0f172a' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'entries'
                  ? `All Entries (${vm.filteredEntries.length})`
                  : `Invoice Balances (${vm.balanceSummaries.length})`}
              </button>
            ))}
          </div>

          {/* ── Entries ── */}
          {tab === 'entries' && (
            <div>
              {/* Filter toolbar */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    value={vm.filters.searchTerm}
                    onChange={e => vm.setFilters({ searchTerm: e.target.value })}
                    placeholder="Search invoice, customer, ID..."
                    style={{ ...inputStyle, paddingLeft: '32px', width: '100%' }}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(f => !f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                    fontSize: '13px', fontWeight: 600, borderRadius: '8px', cursor: 'pointer',
                    border: showFilters ? '1.5px solid #cbd5e1' : '1.5px solid #e5e7eb',
                    background: showFilters ? '#f1f5f9' : '#fff',
                    color: showFilters ? '#0f172a' : '#374151',
                  }}
                >
                  <Filter size={14} /> Filters
                </button>
                {(vm.filters.status || vm.filters.dateFrom || vm.filters.dateTo) && (
                  <button
                    onClick={vm.resetFilters}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px',
                      fontSize: '13px', fontWeight: 600, borderRadius: '8px', cursor: 'pointer',
                      border: '1.5px solid #fecaca', background: '#fef2f2', color: '#dc2626',
                    }}
                  >
                    <X size={13} /> Clear
                  </button>
                )}
              </div>

              {showFilters && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <select value={vm.filters.status} onChange={e => vm.setFilters({ status: e.target.value })} style={inputStyle}>
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Partial">Partial</option>
                    <option value="Settled">Settled</option>
                  </select>
                  <input type="date" value={vm.filters.dateFrom} onChange={e => vm.setFilters({ dateFrom: e.target.value })} style={inputStyle} />
                  <input type="date" value={vm.filters.dateTo}   onChange={e => vm.setFilters({ dateTo: e.target.value })}   style={inputStyle} />
                </div>
              )}

              {/* Table */}
              {vm.isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px', gap: '10px', color: '#9ca3af' }}>
                  <Loader2 size={20} color="#334155" className="animate-spin" />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>Loading entries…</span>
                </div>
              ) : vm.filteredEntries.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', gap: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Receipt size={26} color="#d1d5db" />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>No entries found</span>
                  <button
                    onClick={() => vm.setActiveView('create')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0f172a', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <Plus size={14} /> Record first payment
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                        {['Transaction', 'Invoice', 'Amount', 'Mode', 'Balance', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vm.filteredEntries.map(entry => (
                        <EntryRow key={entry.id} entry={entry} onDelete={vm.handleDelete} onView={e => setViewDetail(e)} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Balances ── */}
          {tab === 'balances' && (
            <div style={{ padding: '20px' }}>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  value={balanceFilter}
                  onChange={e => setBalanceFilter(e.target.value)}
                  placeholder="Search invoice or customer..."
                  style={{ ...inputStyle, paddingLeft: '32px', width: '100%' }}
                />
              </div>

              {vm.isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '10px', color: '#9ca3af' }}>
                  <Loader2 size={20} color="#334155" className="animate-spin" />
                </div>
              ) : filteredSummaries.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '10px' }}>
                  <AlertCircle size={32} color="#d1d5db" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>No invoice balances yet</span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {filteredSummaries.map(s => (
                    <BalanceCard key={s.invoiceId} summary={s} onViewEntries={() => setTab('entries')} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {viewDetail && <EntryDetailModal entry={viewDetail} onClose={() => setViewDetail(null)} />}
    </div>
  );
}