// Inventory Module - View Layer
// InventoryReportView - full per-serial inventory report

import React from 'react';
import { ArrowLeft, FileBarChart, Search, Loader2 } from 'lucide-react';
import { useInventoryReportViewModel } from '../viewModels/useInventoryReportViewModel';

type VM = ReturnType<typeof useInventoryReportViewModel>;

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '9px 12px', fontSize: 12.5, whiteSpace: 'nowrap' };

const statusBadge = (status: string) => {
  const colors: Record<string, [string, string]> = {
    Available: ['#dcfce7', '#15803d'], Sold: ['#e0e7ff', '#3730a3'], 'In Transit': ['#fef9c3', '#854d0e'],
    Damaged: ['#fee2e2', '#b91c1c'], Returned: ['#f1f5f9', '#334155'],
  };
  const [bg, fg] = colors[status] || ['#f1f5f9', '#334155'];
  return <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, backgroundColor: bg, color: fg }}>{status}</span>;
};

const paymentBadge = (status?: string) => {
  if (!status) return '—';
  const colors: Record<string, [string, string]> = {
    Cleared: ['#dcfce7', '#15803d'], Partial: ['#fef3c7', '#92400e'], Unpaid: ['#fee2e2', '#b91c1c'],
  };
  const [bg, fg] = colors[status] || ['#f1f5f9', '#334155'];
  return <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, backgroundColor: bg, color: fg }}>{status}</span>;
};

export const InventoryReportView: React.FC<VM> = ({
  filteredRows, isLoading, error, search, setSearch, statusFilter, setStatusFilter,
  ownershipFilter, setOwnershipFilter, formatCurrency, formatDate, onBack,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#f8fafc' }}>
    <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <ArrowLeft size={17} />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileBarChart size={17} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Inventory Report</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Full per-serial breakdown of every inventory item</div>
        </div>
      </div>
    </div>

    <div style={{ display: 'flex', gap: 10, padding: '14px 24px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 320 }}>
        <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search model, serial, invoice…"
          style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }} />
      </div>
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}>
        <option value="">All Statuses</option>
        {['Available', 'Sold', 'In Transit', 'Damaged', 'Returned'].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={ownershipFilter} onChange={e => setOwnershipFilter(e.target.value)} style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}>
        <option value="">All Categories</option>
        <option value="Owned">Owned</option>
        <option value="Credit">Credit</option>
      </select>
    </div>

    <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 13 }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading report…
        </div>
      ) : error ? (
        <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div>
      ) : filteredRows.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: 13 }}>No inventory records match your filters.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: 10 }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              {['Model', 'Serial Number', 'Stock-In Date', 'Location', 'Category', 'Status', 'Sold Date', 'Invoice #', 'Supplier Cost', 'Payment Status'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r, i) => (
              <tr key={`${r.productId}-${r.serialNumber}-${i}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ ...td, fontWeight: 600 }}>{r.brandName} {r.modelName}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.serialNumber || '—'}</td>
                <td style={td}>
                  {formatDate(r.stockInDate)}
                  {r.stockInDateIsManual && (
                    <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 700, backgroundColor: '#ffedd5', color: '#c2410c' }}>
                      MANUAL
                    </span>
                  )}
                </td>
                <td style={td}>{r.location || '—'}</td>
                <td style={td}>{r.ownershipType || '—'}</td>
                <td style={td}>{statusBadge(r.currentStatus)}</td>
                <td style={td}>{formatDate(r.soldDate)}</td>
                <td style={td}>{r.invoiceNumber || '—'}</td>
                <td style={td}>{r.ownershipType === 'Credit' ? formatCurrency(r.supplierCost) : '—'}</td>
                <td style={td}>{r.ownershipType === 'Credit' ? paymentBadge(r.supplierPaymentStatus) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);