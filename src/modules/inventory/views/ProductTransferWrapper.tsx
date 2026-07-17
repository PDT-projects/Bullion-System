// Inventory Module - Wrapper
// ProductTransferCreateWrapper
//
// Now a tabbed container: the "Transfer" tile on the inventory dashboard
// opens this and users can switch between:
//   • New Transfer  → the existing ProductTransferCreateView form
//   • Transfer Report → a compact inline table of past transfers, with
//                      Mark-as-Received action for In-Transit rows.
//
// The report reuses `useProductTransferViewModel` (already fetches the full
// transfer collection via TransferFirebaseService.fetchAllTransfers) so no
// new service calls are needed.

import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Package, Loader2, Search, CheckCircle2, Truck, Clock, XCircle, Plus } from 'lucide-react';
import { useProductTransferCreateViewModel } from '../viewModels/useProductTransferCreateViewModel';
import { useProductTransferViewModel } from '../viewModels/useProductTransferViewModel';
import { ProductTransferCreateView } from './ProductTransferCreateView';
import { ProductTransfer } from '../models/types';

type Tab = 'report' | 'new';

export const ProductTransferCreateWrapper: React.FC = () => {
  // Default view is the Transfer Report — the "+ New Transfer" button
  // toggles to the create form. After a successful save the create VM
  // navigates away, but while the popup is open we always land users on
  // the report first so they can see history at a glance.
  const [tab, setTab] = useState<Tab>('report');
  const createVm = useProductTransferCreateViewModel();
  const reportVm = useProductTransferViewModel();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Header bar. In REPORT mode it shows the title, stats summary, and a
          "+ New Transfer" button. In CREATE mode we hide the title (the create
          view has its own "New Product Transfer" header) and only show the
          "← Back to Report" toggle so users can flip back without leaving the
          popup. */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: tab === 'report' ? '14px 20px' : '10px 20px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0', flexShrink: 0,
      }}>
        {tab === 'report' ? (
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Product Transfers</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              {reportVm.stats.totalTransfers} total · {reportVm.stats.inTransitTransfers} in transit · {reportVm.stats.receivedTransfers} received
            </div>
          </div>
        ) : (
          <div />
        )}
        <button
          onClick={() => setTab(tab === 'report' ? 'new' : 'report')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 9,
            fontSize: 13, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            backgroundColor: tab === 'report' ? '#0f172a' : '#f1f5f9',
            color:           tab === 'report' ? '#fff'    : '#0f172a',
            boxShadow: tab === 'report' ? '0 2px 6px rgba(15,23,42,0.25)' : 'none',
          }}
        >
          {tab === 'report' ? <><Plus size={14} /> New Transfer</> : <><ArrowLeft size={14} /> Back to Report</>}
        </button>
      </div>

      {/* Content — either the compact report or the create form */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'report'
          ? <TransferReportSection vm={reportVm} onNewTransferClick={() => setTab('new')} />
          : <ProductTransferCreateView {...createVm} />}
      </div>
    </div>
  );
};

// ── Compact Transfer Report section ────────────────────────────────────────
// Shows transfer history inline in the popup. Deliberately lighter than the
// full ProductTransferView page: no PDF download, no side details modal —
// just the essentials plus a Mark-Received button on In-Transit rows.
function TransferReportSection({ vm, onNewTransferClick }: {
  vm: ReturnType<typeof useProductTransferViewModel>;
  onNewTransferClick: () => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'In Transit' | 'Received' | 'Pending' | 'Cancelled'>('');

  const filtered = vm.transfers.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      if (
        !((t.productName || '').toLowerCase().includes(s) ||
          (t.brandName   || '').toLowerCase().includes(s) ||
          (t.modelName   || '').toLowerCase().includes(s) ||
          (t.fromLocation|| '').toLowerCase().includes(s) ||
          (t.toLocation  || '').toLowerCase().includes(s) ||
          (t.transferredBy || '').toLowerCase().includes(s))
      ) return false;
    }
    return true;
  });

  if (vm.isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading transfers…
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Header removed — the wrapper already shows the title + stats.
          Stat pills stay here as a quick visual breakdown. */}

      {/* Stat pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatPill label="Total"     value={vm.stats.totalTransfers}     icon={<Truck size={13} />}         color="#334155" bg="#f1f5f9" />
        <StatPill label="In Transit" value={vm.stats.inTransitTransfers} icon={<Truck size={13} />}         color="#1d4ed8" bg="#eff6ff" />
        <StatPill label="Received"  value={vm.stats.receivedTransfers}  icon={<CheckCircle2 size={13} />}  color="#15803d" bg="#f0fdf4" />
        <StatPill label="Pending"   value={vm.stats.pendingTransfers}   icon={<Clock size={13} />}         color="#b45309" bg="#fffbeb" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search product, brand, location, transferred by…"
            style={{
              width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #d1d5db',
              borderRadius: 8, fontSize: 13, outline: 'none', backgroundColor: '#fff',
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          style={{
            padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8,
            fontSize: 13, outline: 'none', backgroundColor: '#fff', cursor: 'pointer',
          }}
        >
          <option value="">All statuses</option>
          <option value="In Transit">In Transit</option>
          <option value="Received">Received</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{
          padding: 32, textAlign: 'center',
          backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0',
        }}>
          <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: vm.transfers.length === 0 ? 14 : 0 }}>
            {vm.transfers.length === 0 ? 'No transfers yet.' : 'No transfers match the current filters.'}
          </div>
          {vm.transfers.length === 0 && (
            <button
              onClick={onNewTransferClick}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 9,
                border: 'none', backgroundColor: '#0f172a', color: '#fff',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              <Plus size={13} /> Create your first transfer
            </button>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                {['Date', 'Product', 'Route', 'Serials', 'By', 'Status', 'Action'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 700,
                    color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em',
                    borderBottom: '1px solid #e2e8f0',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const rowKey = t.id || `${t.productId}-${t.date}`;
                return (
                  <TransferRow key={rowKey} t={t} onMarkReceived={vm.handleMarkReceived} formatDateTime={vm.formatDateTime} />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Row + helpers ──────────────────────────────────────────────────────────
interface TransferRowProps {
  t: ProductTransfer;
  onMarkReceived: (t: ProductTransfer) => Promise<void>;
  formatDateTime: (d: string) => string;
}
const TransferRow: React.FC<TransferRowProps> = ({ t, onMarkReceived, formatDateTime }) => {
  const [busy, setBusy] = useState(false);
  const handleReceive = async () => {
    setBusy(true);
    try { await onMarkReceived(t); } finally { setBusy(false); }
  };
  const serials = t.serialNumbers || [];

  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ padding: '10px 12px', fontSize: 12, color: '#334155', whiteSpace: 'nowrap' }}>
        {formatDateTime(t.date || t.transferDate || '')}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Package size={12} color="#94a3b8" />
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{t.productName || `${t.brandName || ''} ${t.modelName || ''}`.trim() || '—'}</span>
        </div>
      </td>
      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
          <span style={{ padding: '2px 8px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: 99, fontWeight: 600 }}>{t.fromLocation}</span>
          <ArrowRight size={11} color="#94a3b8" />
          <span style={{ padding: '2px 8px', backgroundColor: '#f0fdf4', color: '#15803d', borderRadius: 99, fontWeight: 600 }}>{t.toLocation}</span>
        </div>
      </td>
      <td style={{ padding: '10px 12px', fontSize: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxWidth: 180 }}>
          {serials.slice(0, 2).map(s => (
            <span key={s} style={{ padding: '1px 6px', backgroundColor: '#f1f5f9', color: '#1e293b', borderRadius: 4, fontSize: 10, fontFamily: 'monospace' }}>
              {s}
            </span>
          ))}
          {serials.length > 2 && (
            <span style={{ fontSize: 10, color: '#94a3b8' }}>+{serials.length - 2}</span>
          )}
          {serials.length === 0 && <span style={{ color: '#94a3b8', fontSize: 11 }}>{t.quantity} units</span>}
        </div>
      </td>
      <td style={{ padding: '10px 12px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
        {t.transferredBy || '—'}
      </td>
      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
        <StatusBadge status={t.status} />
      </td>
      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
        {t.status === 'In Transit' && (
          <button
            onClick={handleReceive}
            disabled={busy}
            style={{
              padding: '5px 11px', fontSize: 11, fontWeight: 700, borderRadius: 6,
              border: 'none', backgroundColor: busy ? '#94a3b8' : '#15803d', color: '#fff',
              cursor: busy ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            {busy ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> …</> : <><CheckCircle2 size={11} /> Received</>}
          </button>
        )}
      </td>
    </tr>
  );
};

function StatusBadge({ status }: { status: ProductTransfer['status'] }) {
  const map: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    'In Transit': { bg: '#eff6ff', color: '#1d4ed8', icon: <Truck size={10} /> },
    'Received':   { bg: '#f0fdf4', color: '#15803d', icon: <CheckCircle2 size={10} /> },
    'Pending':    { bg: '#fffbeb', color: '#b45309', icon: <Clock size={10} /> },
    'Cancelled':  { bg: '#fef2f2', color: '#b91c1c', icon: <XCircle size={10} /> },
  };
  const s = map[status] || map['Pending'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
      backgroundColor: s.bg, color: s.color,
    }}>
      {s.icon} {status}
    </span>
  );
}

function StatPill({ label, value, icon, color, bg }: {
  label: string; value: number; icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '7px 12px', borderRadius: 10, backgroundColor: bg,
      border: `1px solid ${color}22`,
    }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}:</span>
      <span style={{ fontSize: 13, fontWeight: 800, color }}>{value}</span>
    </div>
  );
}