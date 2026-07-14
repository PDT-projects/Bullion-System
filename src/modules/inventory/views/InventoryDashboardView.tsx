// Inventory Module - View Layer
// InventoryDashboardView — unified dashboard
// • Compact action cards (no Report / View All — merged into table)
// • 4 stat cards
// • Always-visible multi-select filters
// • Full per-serial report table (Stock-In, Type, Brand, Model, Serial,
//   Location, Ownership, Condition, Status, Sold Date, Invoice #,
//   Supplier Cost, Purchasing Cost, Sold Goods Payment)
// • Checkboxes + sticky totals footer

import React, { useState, useMemo, useCallback } from 'react';
import {
  Package, Plus, RotateCcw, ArrowLeftRight, Wallet, AlertTriangle,
  Trash2, Search, X, MapPin, Loader2, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useInventoryReportViewModel } from '../viewModels/useInventoryReportViewModel';
import { useProductTransferViewModel } from '../viewModels/useProductTransferViewModel';
import { InventoryReportRow } from '../models/types';

// ── Props ─────────────────────────────────────────────────────────────────────
interface InventoryDashboardViewProps {
  onAddNewInventory: () => void;
  onAddToExisting: () => void;
  onAddReturnedInventory: () => void;
  onViewReceivable: () => void;
  onViewInventory: () => void;
  onViewReport: () => void;
  onProductTransfer: () => void;
  onViewDeleted: () => void;
  onViewPayables: () => void;
  onViewTransfer: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const PAYMENT_DISPLAY: Record<string, string> = {
  Cleared: 'Clear', Partial: 'Partial', Unpaid: 'Pending',
};
const PAYMENT_COLOR: Record<string, { bg: string; color: string }> = {
  Clear:   { bg: '#dcfce7', color: '#15803d' },
  Partial: { bg: '#fef3c7', color: '#92400e' },
  Pending: { bg: '#fee2e2', color: '#b91c1c' },
};
const conditionStyle = (c: string): { bg: string; color: string } => ({
  New:      { bg: '#dbeafe', color: '#1d4ed8' },
  Used:     { bg: '#f1f5f9', color: '#334155' },
  Damaged:  { bg: '#fee2e2', color: '#b91c1c' },
  Returned: { bg: '#fef3c7', color: '#92400e' },
} as any)[c] || { bg: '#f3f4f6', color: '#6b7280' };

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, backgroundColor: bg, color }}>
      {label}
    </span>
  );
}

// ── Multi-select filter dropdown ──────────────────────────────────────────────
function MultiFilter({ label, selected, onChange, options }: {
  label: string; selected: string[]; onChange: (v: string[]) => void; options: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter(v => v !== opt) : [...selected, opt]);
  const has = selected.length > 0;

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 120, flex: 1, position: 'relative' }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</label>
      <button type="button" onClick={() => setOpen(p => !p)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '7px 10px',
          border: `1.5px solid ${has ? '#334155' : '#e2e8f0'}`, borderRadius: 7, fontSize: 12,
          backgroundColor: has ? '#f1f5f9' : '#fff', color: has ? '#0f172a' : '#94a3b8',
          cursor: 'pointer', fontWeight: has ? 700 : 400, outline: 'none', textAlign: 'left' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {has ? (selected.length === 1 ? selected[0] : `${selected.length} selected`) : 'All'}
        </span>
        <ChevronDown size={12} style={{ flexShrink: 0, marginLeft: 4, color: '#94a3b8' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 999, backgroundColor: '#fff',
          border: '1px solid #e2e8f0', borderRadius: 9, boxShadow: '0 8px 28px rgba(0,0,0,0.13)', minWidth: 180, overflow: 'hidden' }}>
          <div style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => onChange(options)} style={{ fontSize: 11, fontWeight: 700, color: '#334155', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>All</button>
            <span style={{ color: '#e2e8f0' }}>|</span>
            <button type="button" onClick={() => onChange([])} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>Clear</button>
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {options.length === 0
              ? <div style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8' }}>No options</div>
              : options.map(opt => {
                const checked = selected.includes(opt);
                return (
                  <div key={opt} onClick={() => toggle(opt)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', cursor: 'pointer',
                      fontSize: 12, backgroundColor: checked ? '#f1f5f9' : 'transparent',
                      color: checked ? '#0f172a' : '#374151', fontWeight: checked ? 600 : 400, userSelect: 'none' }}>
                    <span style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `2px solid ${checked ? '#0f172a' : '#d1d5db'}`, backgroundColor: checked ? '#0f172a' : '#fff', transition: 'all 0.12s' }}>
                      {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    {opt}
                  </div>
                );
              })}
          </div>
        </div>
      )}
      {has && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
          {selected.map(v => (
            <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 99, fontSize: 10, fontWeight: 700, backgroundColor: '#0f172a', color: '#fff' }}>
              {v}
              <span onClick={e => { e.stopPropagation(); toggle(v); }} style={{ cursor: 'pointer', display: 'flex' }}><X size={8} color="#fff" /></span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function InventoryDashboardView({
  onAddNewInventory,
  onAddReturnedInventory,
  onViewPayables,
  onViewTransfer,
  onViewDeleted,
}: InventoryDashboardViewProps) {
  const navigate = useNavigate();
  const vm = useInventoryReportViewModel();
  const { transfers } = useProductTransferViewModel();

  // ── Checkbox state ────────────────────────────────────────────────────────
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const rowKey = (r: InventoryReportRow) => `${r.productId}-${r.serialNumber}`;

  const allKeys = useMemo(() => vm.filteredRows.map(rowKey), [vm.filteredRows]);
  const allChecked = allKeys.length > 0 && allKeys.every(k => selectedKeys.has(k));
  const someChecked = allKeys.some(k => selectedKeys.has(k));

  const toggleAll = () => {
    if (allChecked) setSelectedKeys(new Set());
    else setSelectedKeys(new Set(allKeys));
  };
  const toggleRow = (k: string) => {
    const next = new Set(selectedKeys);
    next.has(k) ? next.delete(k) : next.add(k);
    setSelectedKeys(next);
  };

  // ── Single-value filters (non-multi) ─────────────────────────────────────
  const [statusF,    setStatusF]    = useState('');
  const [ownershipF, setOwnershipF] = useState('');

  // Apply single-value filters on top of the VM's filtered rows
  const displayed = useMemo(() => {
    let arr = vm.filteredRows;
    if (statusF)    arr = arr.filter(r => r.currentStatus === statusF);
    if (ownershipF) arr = arr.filter(r => r.ownershipType === ownershipF);
    return arr;
  }, [vm.filteredRows, statusF, ownershipF]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalRows     = vm.rows.length;
  const totalInStock  = vm.rows.filter(r => r.currentStatus !== 'Sold').length;
  const ownedInStock  = vm.rows.filter(r => r.ownershipType !== 'Credit' && r.currentStatus !== 'Sold').length;
  const creditInStock = vm.rows.filter(r => r.ownershipType === 'Credit' && r.currentStatus !== 'Sold').length;
  const inTransit     = transfers.filter(t => t.status === 'In Transit' || t.status === 'Pending').length;

  // ── Totals for selected / all visible rows ────────────────────────────────
  const selectedRows = displayed.filter(r => selectedKeys.has(rowKey(r)));
  const totalsSource = selectedRows.length > 0 ? selectedRows : displayed;
  const totalSupplier   = totalsSource.reduce((s, r) => s + (r.supplierCost   || 0), 0);
  const totalPurchasing = totalsSource.reduce((s, r) => s + (r.purchasingCost || 0), 0);
  const totalPaid       = totalsSource.reduce((s, r) => s + (r.supplierPaidAmount || 0), 0);

  const fmtAED = (n: number) => n > 0 ? `د.إ ${Math.round(n).toLocaleString('en-AE')}` : '—';

  // ── Active filter count ───────────────────────────────────────────────────
  const activeFilters = vm.activeFilterCount + (statusF ? 1 : 0) + (ownershipF ? 1 : 0);

  const clearAll = () => { vm.clearFilters(); setStatusF(''); setOwnershipF(''); };

  // ── Quick action cards ────────────────────────────────────────────────────
  const quickActions = [
    { label: 'Add New',      icon: Plus,           onClick: onAddNewInventory,  iconColor: '#0f172a', iconBg: '#f1f5f9', border: '#cbd5e1', hoverBorder: '#334155', hoverBg: '#f1f5f9' },
    { label: 'Add Returned', icon: RotateCcw,      onClick: onAddReturnedInventory, iconColor: '#d97706', iconBg: '#fffbeb', border: '#fde68a', hoverBorder: '#f59e0b', hoverBg: '#fffbeb' },
    { label: 'Transfer',     icon: ArrowLeftRight, onClick: onViewTransfer,     iconColor: '#1d4ed8', iconBg: '#eff6ff', border: '#bfdbfe', hoverBorder: '#3b82f6', hoverBg: '#eff6ff' },
    { label: 'Damaged',      icon: AlertTriangle,  onClick: () => navigate('/inventory/damaged'), iconColor: '#b91c1c', iconBg: '#fef2f2', border: '#fecaca', hoverBorder: '#ef4444', hoverBg: '#fef2f2' },
    { label: 'Deleted',      icon: Trash2,         onClick: onViewDeleted,      iconColor: '#64748b', iconBg: '#f8fafc', border: '#e2e8f0', hoverBorder: '#94a3b8', hoverBg: '#f1f5f9' },
  ];

  const HEADERS = [
    '', // checkbox
    'Stock-In Date', 'Type', 'Brand', 'Model', 'Serial No.',
    'Location', 'Ownership', 'Condition', 'Status',
    'Sold Date', 'Invoice #', 'Supplier Cost', 'Purchasing Cost', 'Sold Goods Payment',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#f8fafc', overflowY: 'auto' }}>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Page title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Inventory</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Per-serial inventory with sales, costs and payment tracking</div>
          </div>
        </div>

        {/* Quick action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: 8 }}>
          {quickActions.map(card => {
            const Icon = card.icon;
            return (
              <button key={card.label} onClick={card.onClick}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px',
                  border: `1.5px solid ${card.border}`, borderRadius: 11, backgroundColor: '#fff',
                  cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.17s' }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = card.hoverBorder; el.style.backgroundColor = card.hoverBg; el.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = card.border; el.style.backgroundColor = '#fff'; el.style.transform = 'translateY(0)'; }}
              >
                <div style={{ padding: 7, borderRadius: 8, backgroundColor: card.iconBg, flexShrink: 0 }}>
                  <Icon size={14} color={card.iconColor} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{card.label}</span>
              </button>
            );
          })}
        </div>

        {/* Always-visible filter bar */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Filters</span>
            {activeFilters > 0 && (
              <button onClick={clearAll}
                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: '1px solid #fecaca', backgroundColor: '#fef2f2', fontSize: 11, fontWeight: 700, color: '#b91c1c', cursor: 'pointer' }}>
                <X size={11} /> Clear ({activeFilters})
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 12 }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 2, minWidth: 200 }}>
              <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="text" value={vm.search} onChange={e => vm.setSearch(e.target.value)}
                placeholder="Search brand, model, serial, invoice…"
                style={{ width: '100%', paddingLeft: 28, paddingRight: vm.search ? 28 : 10, paddingTop: 7, paddingBottom: 7,
                  border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, outline: 'none', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box' }} />
              {vm.search && (
                <button onClick={() => vm.setSearch('')} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', display: 'flex' }}>
                  <X size={12} color="#94a3b8" />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <MultiFilter label="Brand"     selected={vm.brandFilter}  onChange={v => { vm.setBrandFilter(v); vm.setModelFilter([]); }} options={vm.brandOptions} />
            <MultiFilter label="Model"     selected={vm.modelFilter}  onChange={vm.setModelFilter}  options={vm.modelOptions} />
            <MultiFilter label="Type"      selected={vm.typeFilter ? [vm.typeFilter] : []}
              onChange={v => vm.setTypeFilter(v[v.length - 1] || '')} options={vm.typeOptions} />
            <MultiFilter label="Location"  selected={vm.locationFilter ? [vm.locationFilter] : []}
              onChange={v => vm.setLocationFilter(v[v.length - 1] || '')} options={vm.locationOptions} />
            <MultiFilter label="Condition" selected={vm.conditionFilter ? [vm.conditionFilter] : []}
              onChange={v => vm.setConditionFilter(v[v.length - 1] || '')} options={vm.conditionOptions} />
            <MultiFilter label="Status"    selected={statusF ? [statusF] : []}
              onChange={v => setStatusF(v[v.length - 1] || '')} options={['In Stock', 'Sold']} />
            <MultiFilter label="Ownership" selected={ownershipF ? [ownershipF] : []}
              onChange={v => setOwnershipF(v[v.length - 1] || '')} options={['Owned', 'Credit']} />

            {/* Date range */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 130 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>From Date</label>
              <input type="date" value={vm.dateFrom} onChange={e => vm.setDateFrom(e.target.value)}
                style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, outline: 'none', color: '#0f172a', backgroundColor: '#fff' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 130 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>To Date</label>
              <input type="date" value={vm.dateTo} onChange={e => vm.setDateTo(e.target.value)}
                style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, outline: 'none', color: '#0f172a', backgroundColor: '#fff' }} />
            </div>
          </div>
        </div>

        {/* Inventory table */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              Inventory
              {!vm.isLoading && (
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: '#64748b' }}>
                  {selectedRows.length > 0
                    ? `${selectedRows.length} selected of ${displayed.length}`
                    : `${displayed.length} item${displayed.length !== 1 ? 's' : ''}`}
                </span>
              )}
            </span>
            {selectedRows.length > 0 && (
              <button onClick={() => setSelectedKeys(new Set())}
                style={{ fontSize: 11, color: '#64748b', border: 'none', background: 'none', cursor: 'pointer' }}>
                Clear selection
              </button>
            )}
          </div>

          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
            {vm.isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '28px 20px', color: '#64748b', fontSize: 13 }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading inventory…
              </div>
            ) : displayed.length === 0 ? (
              <div style={{ padding: '28px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No inventory items match your filters.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', position: 'sticky', top: 0, zIndex: 10 }}>
                      {/* Checkbox all */}
                      <th style={{ padding: '9px 12px', width: 36, textAlign: 'center' }}>
                        <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = !allChecked && someChecked; }}
                          onChange={toggleAll}
                          style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#fff' }} />
                      </th>
                      {HEADERS.slice(1).map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((r, idx) => {
                      const key = rowKey(r);
                      const checked = selectedKeys.has(key);
                      const payLabel = r.supplierPaymentStatus ? (PAYMENT_DISPLAY[r.supplierPaymentStatus] || r.supplierPaymentStatus) : null;
                      const condS = conditionStyle(r.condition);
                      return (
                        <tr key={key}
                          style={{ borderBottom: idx < displayed.length - 1 ? '1px solid #f1f5f9' : 'none', backgroundColor: checked ? '#f0f9ff' : idx % 2 === 1 ? '#fafafa' : '#fff', transition: 'background 0.1s' }}
                          onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = checked ? '#f0f9ff' : idx % 2 === 1 ? '#fafafa' : '#fff'; }}
                        >
                          <td style={{ padding: '9px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <input type="checkbox" checked={checked} onChange={() => toggleRow(key)}
                              style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0f172a' }} />
                          </td>
                          <td style={{ padding: '9px 12px', color: '#64748b', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{vm.formatDate(r.stockInDateAuto)}</td>
                          <td style={{ padding: '9px 12px', color: '#64748b', verticalAlign: 'middle' }}>{r.type || '—'}</td>
                          <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0f172a', verticalAlign: 'middle' }}>{r.brandName}</td>
                          <td style={{ padding: '9px 12px', color: '#334155', verticalAlign: 'middle' }}>{r.modelName}</td>
                          <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 11, color: '#334155', verticalAlign: 'middle' }}>{r.serialNumber || '—'}</td>
                          <td style={{ padding: '9px 12px', verticalAlign: 'middle' }}>
                            {r.location ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#475569' }}>
                                <MapPin size={11} />{r.location}
                              </span>
                            ) : <span style={{ color: '#94a3b8' }}>—</span>}
                          </td>
                          <td style={{ padding: '9px 12px', verticalAlign: 'middle' }}>
                            <Badge
                              label={r.ownershipType || '—'}
                              bg={r.ownershipType === 'Credit' ? '#fef3c7' : '#f1f5f9'}
                              color={r.ownershipType === 'Credit' ? '#92400e' : '#334155'}
                            />
                          </td>
                          <td style={{ padding: '9px 12px', verticalAlign: 'middle' }}>
                            <Badge label={r.condition} bg={condS.bg} color={condS.color} />
                          </td>
                          <td style={{ padding: '9px 12px', verticalAlign: 'middle' }}>
                            <Badge
                              label={r.currentStatus}
                              bg={r.currentStatus === 'Sold' ? '#e0e7ff' : '#dcfce7'}
                              color={r.currentStatus === 'Sold' ? '#4338ca' : '#15803d'}
                            />
                          </td>
                          <td style={{ padding: '9px 12px', color: '#64748b', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                            {r.currentStatus === 'Sold' ? vm.formatDate(r.soldDate) : '—'}
                          </td>
                          <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 11, color: r.currentStatus === 'Sold' && r.invoiceNumber ? '#0f172a' : '#94a3b8', fontWeight: r.currentStatus === 'Sold' && r.invoiceNumber ? 700 : 400, verticalAlign: 'middle' }}>
                            {r.currentStatus === 'Sold' && r.invoiceNumber ? r.invoiceNumber : '—'}
                          </td>
                          <td style={{ padding: '9px 12px', color: '#334155', verticalAlign: 'middle' }}>{vm.formatCurrency(r.supplierCost)}</td>
                          <td style={{ padding: '9px 12px', color: '#334155', verticalAlign: 'middle' }}>{vm.formatCurrency(r.purchasingCost)}</td>
                          <td style={{ padding: '9px 12px', verticalAlign: 'middle' }}>
                            {payLabel
                              ? <Badge label={payLabel} bg={PAYMENT_COLOR[payLabel]?.bg || '#f3f4f6'} color={PAYMENT_COLOR[payLabel]?.color || '#6b7280'} />
                              : <span style={{ color: '#94a3b8' }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Sticky totals footer */}
                  <tfoot>
                    <tr style={{ backgroundColor: '#0f172a', position: 'sticky', bottom: 0 }}>
                      <td colSpan={12} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        {selectedRows.length > 0 ? `Totals — ${selectedRows.length} selected rows` : `Totals — all ${displayed.length} rows`}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>{fmtAED(totalSupplier)}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>{fmtAED(totalPurchasing)}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 800, color: '#4ade80', whiteSpace: 'nowrap' }}>{fmtAED(totalPaid)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}