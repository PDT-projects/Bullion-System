// Inventory Module - View Layer
// InventoryListView
// UPDATED: Multi-currency display (PKR / USD / AED / SAR / CAD)
//   - CurrencyDropdown in header (same pattern as Dashboard)
//   - Cost / Sell Price columns show primary currency + extra currency rows
//   - Total inventory value stat card shows all selected currencies
//   - Price in view modal also shows currency extras
// FIX: Delete button uses inline style (not Tailwind) so bg-red-600 is never purged
// FIX: onDelete fires after Firebase soft-delete succeeds; item removed from list immediately
// FIX: toast.success shown on successful delete; toast.error on failure

import React, { useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { InventoryFirebaseService } from '../models/InventoryFirebaseService';
import { Plus, Filter, Package, Eye, MapPin, ArrowLeft, Banknote, Building2, CreditCard, Trash2, AlertTriangle, ArrowRight, Check, ChevronDown, X, Search, Tag, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product, ProductFilters, ProductTransfer } from '../models/types';
import { InventoryService } from '../models/inventoryService';
import { InventoryCurrencyDropdown } from './InventoryCurrencyDropdown';
import { InventoryReportView } from './InventoryReportView';
import { useInventoryReportViewModel } from '../viewModels/useInventoryReportViewModel';
import { Activity, FileText } from 'lucide-react';

interface InventoryListViewProps {
  products: Product[];
  categories: string[];
  uniqueLocations: string[];
  filters: ProductFilters;
  showFilters: boolean;
  activeFilterCount: number;
  viewProduct: Product | null;
  isLoading?: boolean;
  stats: {
    totalProducts: number;
    totalStock: number;
    totalValue: number;
    newProducts: number;
    inTransit: number;
    available: number;
  };
  setFilter: (key: keyof ProductFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setViewProduct: (product: Product | null) => void;
  onAddNew: () => void;
  onAddToExisting: () => void;
  onTransfer: (id: string) => void;
  onReceiveProduct?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onBack?: () => void;
  /** Active transfers — used to show route pill on In Transit products */
  transfers?: ProductTransfer[];
  /** The currently logged-in Firebase user — needed for delete attribution */
  currentUser?: { uid: string; email: string; displayName?: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDisplayLocation(product: Product): string {
  if (product.location) return product.location;
  const cities = Object.values(product.serialCities || {}).filter(Boolean);
  if (cities.length === 0) return '—';
  const freq: Record<string, number> = {};
  cities.forEach(c => { freq[c] = (freq[c] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

/** Returns the most recent transfer route for a product, or null.
 *  - `received: false` → still In Transit / Pending (amber pill)
 *  - `received: true`  → already received at destination (shown as completed route)
 */
function getTransitRoute(
  product: Product,
  transfers: ProductTransfer[],
): { from: string; to: string; received: boolean } | null {
  // First: check for any active (In Transit / Pending) transfer
  const activeMatch = transfers
    .filter(t =>
      t.productId === product.id &&
      (t.status === 'In Transit' || t.status === 'Pending')
    )
    .sort((a, b) => {
      const da = new Date(a.transferDate || a.date || 0).getTime();
      const db = new Date(b.transferDate || b.date || 0).getTime();
      return db - da;
    })[0];
  if (activeMatch) {
    return { from: activeMatch.fromLocation, to: activeMatch.toLocation, received: false };
  }
  // Second: check for the most recent Received / Completed transfer
  const receivedMatch = transfers
    .filter(t =>
      t.productId === product.id &&
      (t.status === 'Received' || t.status === 'Completed')
    )
    .sort((a, b) => {
      const da = new Date(a.transferDate || a.date || 0).getTime();
      const db = new Date(b.transferDate || b.date || 0).getTime();
      return db - da;
    })[0];
  if (receivedMatch) {
    return { from: receivedMatch.fromLocation, to: receivedMatch.toLocation, received: true };
  }
  return null;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'New':        'bg-slate-100 text-[#1e293b]',
    'In Transit': 'bg-yellow-100 text-yellow-800',
    'Available':  'bg-green-100 text-green-800',
    'Sold':       'bg-gray-100 text-gray-800',
    'Damaged':    'bg-red-100 text-red-800',
    'Returned':   'bg-slate-100 text-[#1e293b]',
    'On-Order':   'bg-orange-100 text-orange-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// (PaymentModeBadge removed — Payment column dropped from the table per sheet alignment)

// ── Payment detail panel ──────────────────────────────────────────────────────
function PaymentDetailPanel({ product, fmt }: { product: Product; fmt: (n: number) => string }) {
  const pi = (product as any).paymentInfo;
  if (!pi) return null;
  const statusColor: Record<string, string> = {
    paid: '#16a34a', unpaid: '#dc2626', partial: '#d97706',
  };
  return (
    <div style={{ borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <CreditCard size={14} color="#0f172a" />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Payment Details</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: '#fff', border: `1px solid ${statusColor[pi.paymentStatus] || '#e2e8f0'}`, color: statusColor[pi.paymentStatus] || '#374151' }}>
          {pi.paymentStatus?.charAt(0).toUpperCase() + pi.paymentStatus?.slice(1)}
        </span>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pi.transactionId && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#6b7280' }}>Transaction ID</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#1e293b' }}>{pi.transactionId}</span>
          </div>
        )}
        {[
          ['Total Amount', fmt(pi.totalAmount || 0)],
          ['Paid Amount',  fmt(pi.paidAmount  || 0)],
          ['Remaining',    fmt(Math.max(0, (pi.totalAmount || 0) - (pi.paidAmount || 0)))],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#6b7280' }}>{label}</span>
            <span style={{ fontWeight: 600, color: label === 'Remaining' && (pi.totalAmount - pi.paidAmount) > 0 ? '#dc2626' : '#111827' }}>{value}</span>
          </div>
        ))}
        {pi.paymentStatus !== 'unpaid' && (
          <div style={{ paddingTop: 8, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#6b7280' }}>Payment Method</span>
            {pi.installments?.length > 0 ? (
              <span style={{ fontWeight: 700, color: '#7c3aed' }}>Mixed (Instalments)</span>
            ) : pi.paymentMode === 'cash' ? (
              <span style={{ fontWeight: 700, color: '#16a34a' }}>💵 Cash in Hand</span>
            ) : (
              <span style={{ fontWeight: 700, color: '#0f172a' }}>🏦 {pi.bankName || 'Bank Transfer'}</span>
            )}
          </div>
        )}
        {pi.installments?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Instalment Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {pi.installments.map((inst: any, idx: number) => (
                <div key={inst.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11 }}>
                  <span style={{ fontWeight: 700, color: '#374151', minWidth: 20 }}>#{idx + 1}</span>
                  {inst.mode === 'cash' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#16a34a', fontWeight: 600 }}>
                      <Banknote size={10} /> Cash
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#0f172a', fontWeight: 600 }}>
                      <Building2 size={10} /> {inst.bankName || 'Bank'}
                    </span>
                  )}
                  <span style={{ flex: 1, color: '#6b7280' }}>{inst.date}</span>
                  {inst.note && <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{inst.note}</span>}
                  <span style={{ fontWeight: 700, color: '#111827', marginLeft: 'auto' }}>{fmt(inst.amount || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



// ── Generic Multi-Select Dropdown (Location / Category / Status) ────────────

function MultiSelectFilter({
  label,
  pluralLabel,
  icon: FilterIcon,
  options,
  selected,
  onChange,
  allLabel,
}: {
  label: string;
  pluralLabel?: string;
  icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  allLabel: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const toggle = (val: string) =>
    onChange(
      selected.includes(val)
        ? selected.filter(v => v !== val)
        : [...selected, val]
    );

  const displayLabel =
    selected.length === 0
      ? allLabel
      : selected.length === 1
      ? selected[0]
      : `${selected.length} ${pluralLabel || `${label}s`}`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
          border: `1px solid ${open || selected.length > 0 ? '#1e293b' : '#d1d5db'}`,
          backgroundColor: selected.length > 0 ? '#f1f5f9' : '#fff',
          color: selected.length > 0 ? '#0f172a' : '#374151',
          fontWeight: selected.length > 0 ? 600 : 400,
          boxShadow: open ? '0 0 0 2px rgba(15,23,42,0.15)' : 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <FilterIcon size={13} color={selected.length > 0 ? '#0f172a' : '#9ca3af'} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayLabel}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 6 }}>
          {selected.length > 0 && (
            <span
              onClick={e => { e.stopPropagation(); onChange([]); }}
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 2 }}
              title="Clear"
            >
              <X size={12} color="#1e293b" />
            </span>
          )}
          <ChevronDown size={14} color="#9ca3af" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }} />
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 200,
        }}>
          {/* Select All / Clear */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
            <button
              type="button"
              onClick={() => onChange([...options])}
              style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Clear
            </button>
          </div>

          {/* Options */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {options.length === 0 ? (
              <div style={{ padding: '12px', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>No options found</div>
            ) : options.map(opt => {
              const isSelected = selected.includes(opt);
              return (
                <div
                  key={opt}
                  onClick={() => toggle(opt)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', cursor: 'pointer',
                    backgroundColor: isSelected ? '#f1f5f9' : 'transparent',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSelected ? '#f1f5f9' : 'transparent'; }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${isSelected ? '#1e293b' : '#d1d5db'}`,
                    backgroundColor: isSelected ? '#1e293b' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? '#0f172a' : '#374151' }}>
                    {opt}
                  </span>
                </div>
              );
            })}
          </div>

          {selected.length > 0 && (
            <div style={{ padding: '6px 12px 8px', borderTop: '1px solid #f3f4f6', fontSize: 11, color: '#1e293b', fontWeight: 600 }}>
              {selected.length} of {options.length} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export function InventoryListView({
  products, categories, uniqueLocations, filters, showFilters, activeFilterCount,
  viewProduct, isLoading, stats,
  setFilter, clearFilters, toggleFilters, setViewProduct,
  onAddNew, onAddToExisting, onTransfer, onReceiveProduct, onEdit, onDelete,
  onBack, currentUser, transfers = [],
}: InventoryListViewProps) {
  const fmt = InventoryService.formatCurrency;
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = React.useState<Product | null>(null);
  const [isDeleting,    setIsDeleting]    = React.useState(false);
  const [tab, setTab] = React.useState<'inventory' | 'report'>('inventory');
  const reportVM = useInventoryReportViewModel();

  // ── Local multi-select filters (client-side, on top of ViewModel filters) ──
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);

  // ── Global search — matches against brand, model, category, status, location, ownership ──
  const [searchQuery, setSearchQuery] = React.useState('');

  const statusOptions = ['New', 'Available', 'In Transit', 'Damaged', 'Returned', 'On-Order'];

  const displayProducts = React.useMemo(() => {
    let result = products;

    if (selectedLocations.length > 0) {
      result = result.filter(p => selectedLocations.includes(getDisplayLocation(p)));
    }
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    }
    if (selectedStatuses.length > 0) {
      result = result.filter(p => selectedStatuses.includes(p.status));
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(p => {
        const haystack = [
          p.brandName, p.modelName, p.category, p.status,
          getDisplayLocation(p), p.ownershipType, p.supplierPaymentStatus, ...p.serialNumbers,
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }

    return result;
  }, [products, selectedLocations, selectedCategories, selectedStatuses, searchQuery]);

  const activeLocalFilterCount =
    (selectedLocations.length > 0 ? 1 : 0) +
    (selectedCategories.length > 0 ? 1 : 0) +
    (selectedStatuses.length > 0 ? 1 : 0);

  // ── Delete handler ─────────────────────────────────────────────────────────
  // 1. Calls Firebase — waits for confirmation
  // 2. Only on success: calls onDelete(id) so the parent ViewModel removes the
  //    item from its list state → row disappears immediately without a refetch
  // 3. Shows toast.success so the user gets clear feedback
  // 4. Shows toast.error on failure — item stays in the list, nothing is broken
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const user = currentUser ?? { uid: 'unknown', email: 'unknown@system', displayName: 'Unknown User' };
      await InventoryFirebaseService.deleteProduct(deleteConfirm.id, {
        uid:         user.uid,
        email:       user.email,
        displayName: user.displayName,
      });

      // ✅ Firebase write confirmed — now update local state
      onDelete?.(deleteConfirm.id);          // parent removes item from list
      setDeleteConfirm(null);                // close modal
      setViewProduct(null);                  // close view modal if open
      toast.success(`${deleteConfirm.brandName} ${deleteConfirm.modelName} moved to Deleted Inventory`);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete item. Please try again.');
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBack = () => onBack ? onBack() : navigate('/inventory');

  // ── Currency state ────────────────────────────────────────────────────────
  const ratesLoading = false;
  const ratesError = false;
  const lastUpdated = null;

  const fmtPrimary = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency', currency: 'AED', minimumFractionDigits: 0, maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="p-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={handleBack}
            style={{ minWidth: 36, minHeight: 36 }}
            className="flex items-center justify-center rounded-lg border border-gray-300 bg-white shadow-sm hover:bg-gray-100 text-gray-700"
            title="Back to Inventory">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-2xl font-bold">Inventory</h2>
            {tab === 'inventory' && (
              <p className="text-sm text-gray-600 mt-1">
                {stats.totalProducts} products · {stats.totalStock} units · {fmtPrimary(stats.totalValue)} value
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {tab === 'inventory' && (
            <InventoryCurrencyDropdown
              loading={ratesLoading}
              error={ratesError}
              lastUpdated={lastUpdated}
            />
          )}
          <button
            onClick={tab === 'report' ? reportVM.toggleFilters : toggleFilters}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              backgroundColor: (tab === 'report' ? reportVM.showFilters : showFilters) ? '#0f172a' : '#f1f5f9',
              color: (tab === 'report' ? reportVM.showFilters : showFilters) ? '#fff' : '#374151',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <Filter size={16} />
            Filters {(() => {
              const count = tab === 'report' ? reportVM.activeFilterCount : (activeFilterCount + activeLocalFilterCount);
              return count > 0 && `(${count})`;
            })()}
          </button>
          {tab === 'inventory' && (
            <>
              <button
                onClick={onAddToExisting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', backgroundColor: '#f1f5f9', color: '#374151',
                  border: '1px solid #e2e8f0', transition: 'all 0.15s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <Plus size={16} /> Add Stock
              </button>
              <button
                onClick={onAddNew}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', backgroundColor: '#0f172a', color: '#fff',
                  border: 'none', transition: 'all 0.15s',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.3)',
                }}
              >
                <Plus size={16} /> New Product
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Inventory / Report toggle ── */}
      <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 20, gap: 2 }}>
        {[{ key: 'inventory', label: 'Inventory', icon: Activity }, { key: 'report', label: 'Report', icon: FileText }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as 'inventory' | 'report')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              backgroundColor: tab === t.key ? '#fff' : 'transparent',
              color: tab === t.key ? '#0f172a' : '#64748b',
              boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'report' ? (
        <div style={{ marginTop: -4 }}>
          <InventoryReportView {...reportVM} embedded hideFilterToggle />
        </div>
      ) : (
      <>
      {/* ── Global Search ── */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search brand, model, category, status, location…"
          style={{
            width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, fontSize: 14,
            border: `1.5px solid ${searchQuery ? '#1e293b' : '#e2e8f0'}`,
            backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            outline: 'none', transition: 'border-color 0.15s',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer',
              backgroundColor: '#f1f5f9', color: '#64748b',
            }}
            title="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* ── Stats (compact, fixed-size squares) ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Products',   value: stats.totalProducts, color: '#0f172a' },
          { label: 'Stock',      value: stats.totalStock,    color: '#16a34a' },
          { label: 'In Transit', value: stats.inTransit,     color: '#d97706' },
          { label: 'Available',  value: stats.available,     color: '#334155' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg shadow-sm border border-gray-200"
            style={{ width: 104, height: 76, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200"
          style={{ width: 140, height: 76, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
            {fmtPrimary(stats.totalValue)}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Total Value</div>
        </div>
      </div>

      {/* ── Filters ── */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input type="text" value={filters.brandSearch}
                onChange={e => setFilter('brandSearch', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search brand..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input type="text" value={filters.modelSearch}
                onChange={e => setFilter('modelSearch', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search model..." />
            </div>
            <MultiSelectFilter
              label="Category"
              pluralLabel="Categories"
              icon={Layers}
              options={categories}
              selected={selectedCategories}
              onChange={setSelectedCategories}
              allLabel="All Categories"
            />
            <MultiSelectFilter
              label="Status"
              pluralLabel="Statuses"
              icon={Tag}
              options={statusOptions}
              selected={selectedStatuses}
              onChange={setSelectedStatuses}
              allLabel="All Statuses"
            />
            <MultiSelectFilter
              label="Location"
              icon={MapPin}
              options={uniqueLocations}
              selected={selectedLocations}
              onChange={setSelectedLocations}
              allLabel="All Locations"
            />
            <div className="flex items-end">
              <button
                onClick={() => {
                  clearFilters();
                  setSelectedLocations([]);
                  setSelectedCategories([]);
                  setSelectedStatuses([]);
                  setSearchQuery('');
                }}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm">
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && (
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
          Showing {displayProducts.length} of {products.length} products
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Package size={40} className="opacity-40" />
              <span className="text-sm">Loading inventory...</span>
            </div>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Package size={40} className="opacity-40" />
              <span className="text-sm">No products found</span>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                {['Stock-In Date (Auto)', 'Stock-In Date (Manual)', 'Type', 'Brand', 'Model', 'Serial No.', 'Location',
                  'Ownership', 'Stock', 'Sell (AED)',
                  'Supplier/Purchasing Cost', 'Sold Goods Payment',
                  'Condition', 'Current Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayProducts.map((product, idx) => (
                <tr
                  key={product.id}
                  className="transition-colors"
                  style={
                    product.status === 'In Transit'
                      ? { backgroundColor: '#fffbeb', borderLeft: '3px solid #f59e0b' }
                      : { backgroundColor: idx % 2 === 1 ? '#fafafa' : '#fff', borderLeft: '3px solid transparent' }
                  }
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = product.status === 'In Transit' ? '#fef3c7' : '#f1f5f9'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = product.status === 'In Transit' ? '#fffbeb' : (idx % 2 === 1 ? '#fafafa' : '#fff'); }}
                >
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {(() => {
                      const dates = Object.values(product.serialStockInDates || {});
                      const earliest = dates.length ? dates.sort()[0] : product.createdAt;
                      return earliest ? new Date(earliest).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {(() => {
                      const dates = Object.values(product.serialStockInDatesManual || {});
                      return dates.length ? new Date(dates.sort()[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                    })()}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-600">{product.category}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900 text-sm">{product.brandName}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-700">{product.modelName}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-gray-600" style={{ maxWidth: 180 }}>
                    {product.serialNumbers.length === 0 ? '—' : (
                      <span className="truncate block" title={product.serialNumbers.join(', ')}>
                        {product.serialNumbers.slice(0, 2).join(', ')}
                        {product.serialNumbers.length > 2 && ` +${product.serialNumbers.length - 2} more`}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[100px]" title={getDisplayLocation(product)}>
                        {getDisplayLocation(product)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.ownershipType === 'Credit' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {product.ownershipType || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                    {product.stock} units
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div style={{ fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtPrimary(product.sellPrice)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {fmtPrimary(product.costPrice)}
                  </td>
                  <td className="px-4 py-3">
                    {product.ownershipType === 'Credit' ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.supplierPaymentStatus === 'Cleared' ? 'bg-green-100 text-green-700' :
                        product.supplierPaymentStatus === 'Partial' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {product.supplierPaymentStatus === 'Cleared' ? 'Clear' : product.supplierPaymentStatus === 'Partial' ? 'Partial' : 'Pending'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {product.stock > 0 ? 'In Stock' : 'Sold'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {/* View — slate */}
                      <button
                        onClick={() => setViewProduct(product)}
                        title="View details"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer',
                          backgroundColor: '#f1f5f9', color: '#334155', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.color = '#0f172a'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9'; (e.currentTarget as HTMLButtonElement).style.color = '#334155'; }}
                      >
                        <Eye size={15} />
                      </button>
                      {/* Delete — solid red, always visible */}
                      <button
                        onClick={() => setDeleteConfirm(product)}
                        title="Delete product"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer',
                          backgroundColor: '#dc2626', color: '#ffffff', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b91c1c'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#dc2626'; }}
                      >
                        <Trash2 size={15} />
                      </button>
                      {onReceiveProduct && (
                        <button onClick={() => onReceiveProduct(product.id)}
                          style={{
                            padding: '4px 10px', borderRadius: 7, border: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc', color: '#374151', cursor: 'pointer',
                            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0f172a'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f8fafc'; (e.currentTarget as HTMLButtonElement).style.color = '#374151'; }}
                          title="Move to Stock">
                          → Stock
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-red-100 bg-red-50">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-100">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-800">Delete Inventory Item</h3>
                <p className="text-xs text-red-500 mt-0.5">This action cannot be undone</p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-gray-700">
                You are about to permanently delete:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 space-y-1">
                <p className="text-sm font-bold text-gray-900">{deleteConfirm.brandName} {deleteConfirm.modelName}</p>
                <p className="text-xs text-gray-500">{deleteConfirm.category} · {deleteConfirm.stock} units in stock</p>
                <p className="text-xs text-gray-400 font-mono">{deleteConfirm.id}</p>
              </div>
              <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                ⚠️ This item will be moved to <strong>Deleted Inventory</strong> and hidden from all live views. The original record is preserved in Firebase and visible under the Deleted Inventory section.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>

              {/* FIX: inline style ensures red is never purged by Tailwind */}
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                onMouseEnter={e => { if (!isDeleting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b91c1c'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#dc2626'; }}
              >
                {isDeleting ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Deleting…</>
                ) : (
                  <><Trash2 size={14} /> Delete Permanently</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Modal ── */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold">Product Details</h3>
              <button onClick={() => setViewProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Brand',    viewProduct.brandName],
                  ['Model',    viewProduct.modelName],
                  ['Category', viewProduct.category],
                  ['Status',   viewProduct.status],
                  ['Stock',    `${viewProduct.stock} units`],
                  ['Warranty', `${viewProduct.warrantyYears} year${viewProduct.warrantyYears !== 1 ? 's' : ''}`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="font-medium text-gray-900">{value}</p>
                  </div>
                ))}
                <div>
                  <p className="text-xs text-gray-500">Cost Price</p>
                  <p className="font-semibold text-gray-900">{fmtPrimary(viewProduct.costPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sell Price</p>
                  <p className="font-semibold text-gray-900">{fmtPrimary(viewProduct.sellPrice)}</p>
                </div>
                <div className="col-span-2 flex items-center gap-2 pt-2 border-t border-gray-100">
                  <MapPin className="w-4 h-4 text-[#334155] flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Primary Location</p>
                    {(() => {
                      const route = getTransitRoute(viewProduct, transfers);
                      if (route) {
                        return (
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${route.received ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'}`}>{route.from}</span>
                            <ArrowRight size={13} className={route.received ? 'text-slate-400 shrink-0' : 'text-yellow-600 shrink-0'} />
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${route.received ? 'bg-green-50 text-green-700' : 'bg-green-100 text-green-700'}`}>{route.to}</span>
                            {!route.received && (
                              <span className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full font-medium">In Transit</span>
                            )}
                          </div>
                        );
                      }
                      return <p className="font-semibold text-[#1e293b]">{getDisplayLocation(viewProduct)}</p>;
                    })()}
                  </div>
                </div>
              </div>

              <PaymentDetailPanel product={viewProduct} fmt={pkr => fmtPrimary(pkr)} />

              {viewProduct.serialNumbers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Serial Numbers ({viewProduct.serialNumbers.length}) — by Location
                  </p>
                  <div className="space-y-3">
                    {(() => {
                      const groups = InventoryService.groupSerialsByLocation(viewProduct);
                      return Object.entries(groups)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([city, serials]) => (
                          <div key={city} className="rounded-lg border border-gray-200 overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
                              <MapPin className="w-3.5 h-3.5 text-[#334155]" />
                              <span className="text-xs font-semibold text-[#1e293b]">{city}</span>
                              <span className="ml-auto text-xs text-slate-400">
                                {serials.length} unit{serials.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="p-3 flex flex-wrap gap-2">
                              {serials.map((serial, idx) => (
                                <span key={idx} className="text-xs font-mono bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-700">
                                  {serial}
                                </span>
                              ))}
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </div>
              )}

              {viewProduct.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-800">{viewProduct.description}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button onClick={() => setViewProduct(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Close
              </button>
              <button onClick={() => { setViewProduct(null); setDeleteConfirm(viewProduct); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b91c1c'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#dc2626'; }}
              >
                <Trash2 size={16} /> Delete
              </button>
              {onReceiveProduct && (
                <button onClick={() => { setViewProduct(null); onReceiveProduct(viewProduct.id); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                  Move to Stock
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}