// Inventory Module - View Layer
// InventoryReportView - per-serial inventory report
// Styled to match InventoryListView's table exactly; columns match the sheet:
// Stock-in Date (Auto), Stock-in Date (Manual), Type, Brand, Model, Serial No.,
// Location, Ownership, Condition, Current Status, Sold Date, Invoice #,
// Supplier/Purchasing Cost, Sold Goods Payment.

import React from 'react';
import { ArrowLeft, FileBarChart, Search, Loader2, Filter, X } from 'lucide-react';
import { useInventoryReportViewModel } from '../viewModels/useInventoryReportViewModel';

type VM = ReturnType<typeof useInventoryReportViewModel>;

const HEADERS = [
  'Stock-In Date (Auto)', 'Stock-In Date (Manual)', 'Type', 'Brand', 'Model',
  'Serial No.', 'Location', 'Ownership', 'Condition', 'Current Status',
  'Sold Date', 'Invoice #', 'Supplier/Purchasing Cost', 'Sold Goods Payment',
];

// Supplier credit payment status, relabeled for display: Cleared→Clear, Unpaid→Pending
const PAYMENT_DISPLAY: Record<string, string> = { Cleared: 'Clear', Partial: 'Partial', Unpaid: 'Pending' };
const PAYMENT_COLOR: Record<string, string> = {
  Clear: 'bg-green-100 text-green-700', Partial: 'bg-amber-100 text-amber-800', Pending: 'bg-red-100 text-red-700',
};

const conditionColor = (c: string) => {
  const map: Record<string, string> = {
    New: 'bg-blue-100 text-blue-700', Used: 'bg-slate-100 text-slate-700',
    Damaged: 'bg-red-100 text-red-700', Returned: 'bg-amber-100 text-amber-800',
  };
  return map[c] || 'bg-gray-100 text-gray-700';
};

export const InventoryReportView: React.FC<VM & { embedded?: boolean; hideFilterToggle?: boolean }> = ({
  filteredRows, isLoading, error, search, setSearch,
  showFilters, toggleFilters, clearFilters, activeFilterCount,
  hideFilterToggle,
  statusFilter, setStatusFilter, ownershipFilter, setOwnershipFilter,
  typeFilter, setTypeFilter, typeOptions,
  locationFilter, setLocationFilter, locationOptions,
  conditionFilter, setConditionFilter, conditionOptions,
  dateFrom, setDateFrom, dateTo, setDateTo,
  formatCurrency, formatDate, onBack, embedded,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: embedded ? 'transparent' : '#f8fafc' }}>
    {!embedded && (
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
    )}

    <div className="p-6">
      {/* ── Search + Filters toggle (matches View Inventory) ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search brand, model, serial, location, invoice…"
            style={{
              width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, fontSize: 14,
              border: `1.5px solid ${search ? '#1e293b' : '#e2e8f0'}`,
              backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              outline: 'none',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} title="Clear search"
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer',
                backgroundColor: '#f1f5f9', color: '#64748b',
              }}>
              <X size={12} />
            </button>
          )}
        </div>
        {!hideFilterToggle && (
          <button
            onClick={toggleFilters}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14,
              cursor: 'pointer', border: 'none',
              backgroundColor: showFilters ? '#0f172a' : '#f1f5f9',
              color: showFilters ? '#fff' : '#374151',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <Filter size={16} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">All Types</option>
                {typeOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">All Locations</option>
                {locationOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select value={conditionFilter} onChange={e => setConditionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">All Conditions</option>
                {conditionOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">All Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Sold">Sold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ownership</label>
              <select value={ownershipFilter} onChange={e => setOwnershipFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">All Ownership</option>
                <option value="Owned">Owned</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={clearFilters}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm">
                Clear Filters
              </button>
            </div>
            <div className="md:col-span-3 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock-In Date Range</label>
              <div className="flex items-center gap-2">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                <span className="text-gray-400 text-sm">to</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading report…
        </div>
      ) : error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : filteredRows.length === 0 ? (
        <div className="text-gray-400 text-sm">No inventory records match your filters.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                {HEADERS.map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((r, i) => {
                const paymentLabel = r.supplierPaymentStatus ? (PAYMENT_DISPLAY[r.supplierPaymentStatus] || r.supplierPaymentStatus) : null;
                return (
                  <tr key={`${r.productId}-${r.serialNumber}-${i}`} style={{ backgroundColor: i % 2 === 1 ? '#fafafa' : '#fff' }}>
                    <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">{formatDate(r.stockInDateAuto)}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">{r.stockInDateManual ? formatDate(r.stockInDateManual) : '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{r.type || '—'}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-900 text-sm">{r.brandName}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-700">{r.modelName}</td>
                    <td className="px-4 py-2.5 text-sm font-mono text-gray-700">{r.serialNumber || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{r.location || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${r.ownershipType === 'Credit' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                        {r.ownershipType || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${conditionColor(r.condition)}`}>{r.condition}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${r.currentStatus === 'Sold' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                        {r.currentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">{formatDate(r.soldDate)}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{r.invoiceNumber || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{formatCurrency(r.supplierCost)}</td>
                    <td className="px-4 py-2.5">
                      {paymentLabel ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${PAYMENT_COLOR[paymentLabel] || 'bg-gray-100 text-gray-700'}`}>{paymentLabel}</span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);