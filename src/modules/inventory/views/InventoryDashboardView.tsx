// Inventory Module - View Layer
// InventoryDashboardView — full redesign
// • No internal sidebar (global app sidebar exists)
// • 4 stat cards: Total, In Stock, On Credit, Against Payment
// • Always-visible filter bar (brand, model, category, status, location, ownership)
// • Inline inventory table
// • Working payables modal (records payment via InventoryFirebaseService.updateProduct)

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Package, Plus, RotateCcw, ArrowLeftRight, Wallet, BarChart2,
  AlertTriangle, Trash2, Search, X, MapPin, ArrowRight,
  Loader2, Eye, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { InventoryFirebaseService } from '../models/InventoryFirebaseService';
import { useProductTransferViewModel } from '../viewModels/useProductTransferViewModel';
import { Product } from '../models/types';

// ── Types ─────────────────────────────────────────────────────────────────────

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

function getDisplayLocation(product: Product): string {
  if (product.location) return product.location;
  const cities = Object.values(product.serialCities || {}).filter(Boolean);
  if (!cities.length) return '—';
  const freq: Record<string, number> = {};
  cities.forEach(c => { freq[c] = (freq[c] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    'New':        { bg: '#f1f5f9', color: '#334155' },
    'Available':  { bg: '#dcfce7', color: '#15803d' },
    'In Transit': { bg: '#fef9c3', color: '#92400e' },
    'On-Order':   { bg: '#dbeafe', color: '#1d4ed8' },
    'Sold':       { bg: '#f3f4f6', color: '#6b7280' },
    'Damaged':    { bg: '#fee2e2', color: '#b91c1c' },
    'Returned':   { bg: '#f1f5f9', color: '#334155' },
  };
  const s = map[status] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, backgroundColor: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

const fmtAED = (n: number) =>
  `د.إ ${Math.round(n).toLocaleString('en-PK')}`;

// ── Multi-select filter dropdown ──────────────────────────────────────────────

function MultiFilterSelect({ label, selected, onChange, options }: {
  label: string;
  selected: string[];
  onChange: (v: string[]) => void;
  options: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(v => v !== opt));
    else onChange([...selected, opt]);
  };

  const hasSelection = selected.length > 0;

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130, flex: 1, position: 'relative' }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>

      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '7px 10px',
          border: `1.5px solid ${hasSelection ? '#334155' : '#e2e8f0'}`,
          borderRadius: 7, fontSize: 12,
          backgroundColor: hasSelection ? '#f1f5f9' : '#fff',
          color: hasSelection ? '#0f172a' : '#94a3b8',
          cursor: 'pointer', outline: 'none', textAlign: 'left',
          fontWeight: hasSelection ? 700 : 400,
          transition: 'border-color 0.15s',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {hasSelection
            ? selected.length === 1 ? selected[0] : `${selected.length} selected`
            : `All`}
        </span>
        <ChevronDown size={12} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 4, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 999,
          backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 9,
          boxShadow: '0 8px 28px rgba(0,0,0,0.13)', minWidth: 180, maxWidth: 240,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={() => onChange(options)}
              style={{ fontSize: 11, fontWeight: 700, color: '#334155', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
              Select all
            </button>
            <span style={{ color: '#e2e8f0', fontSize: 14 }}>|</span>
            <button type="button" onClick={() => onChange([])}
              style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
              Clear
            </button>
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {options.length === 0
              ? <div style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8' }}>No options</div>
              : options.map(opt => {
                  const checked = selected.includes(opt);
                  return (
                    <div key={opt} onClick={() => toggle(opt)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9,
                        padding: '8px 12px', cursor: 'pointer', fontSize: 12,
                        backgroundColor: checked ? '#f1f5f9' : 'transparent',
                        color: checked ? '#0f172a' : '#374151',
                        fontWeight: checked ? 600 : 400,
                        userSelect: 'none',
                      }}
                      onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'; }}
                      onMouseLeave={e => { if (!checked) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                    >
                      <span style={{
                        width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${checked ? '#0f172a' : '#d1d5db'}`,
                        backgroundColor: checked ? '#0f172a' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.12s',
                      }}>
                        {checked && (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      {opt}
                    </div>
                  );
                })}
          </div>
        </div>
      )}

      {hasSelection && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
          {selected.map(v => (
            <span key={v} style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 6px', borderRadius: 99, fontSize: 10, fontWeight: 700,
              backgroundColor: '#0f172a', color: '#fff',
            }}>
              {v}
              <span onClick={e => { e.stopPropagation(); toggle(v); }}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                <X size={9} color="#fff" />
              </span>
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
  onAddToExisting,
  onAddReturnedInventory,
  onViewReceivable,
  onViewInventory,
  onViewReport,
  onProductTransfer,
  onViewDeleted,
  onViewPayables,
  onViewTransfer,
}: InventoryDashboardViewProps) {
  const navigate = useNavigate();

  // ── Fetch all products directly ───────────────────────────────────────────
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await InventoryFirebaseService.fetchAllProducts();
      setAllProducts(data);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const { transfers } = useProductTransferViewModel();

  // ── Filters — all always visible, all multi-select ──────────────────────
  const [search,          setSearch]          = useState('');
  const [brandFilter,     setBrandFilter]     = useState<string[]>([]);
  const [modelFilter,     setModelFilter]     = useState<string[]>([]);
  const [categoryFilter,  setCategoryFilter]  = useState<string[]>([]);
  const [statusFilter,    setStatusFilter]    = useState<string[]>([]);
  const [locationFilter,  setLocationFilter]  = useState<string[]>([]);
  const [ownershipFilter, setOwnershipFilter] = useState<string[]>([]);

  // ── Filter option lists ───────────────────────────────────────────────────
  const brands     = useMemo(() => [...new Set(allProducts.map(p => p.brandName).filter(Boolean))].sort(), [allProducts]);
  const models     = useMemo(() => {
    const src = brandFilter.length > 0 ? allProducts.filter(p => brandFilter.includes(p.brandName)) : allProducts;
    return [...new Set(src.map(p => p.modelName).filter(Boolean))].sort();
  }, [allProducts, brandFilter]);
  const categories = useMemo(() => [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort(), [allProducts]);
  const statuses   = useMemo(() => [...new Set(allProducts.map(p => p.status).filter(Boolean))].sort(), [allProducts]);
  const locations  = useMemo(() => [...new Set(allProducts.map(getDisplayLocation).filter(l => l !== '—'))].sort(), [allProducts]);

  const clearFilters = () => {
    setSearch(''); setBrandFilter([]); setModelFilter([]);
    setCategoryFilter([]); setStatusFilter([]); setLocationFilter([]); setOwnershipFilter([]);
  };

  const activeFilterCount =
    (search ? 1 : 0) +
    brandFilter.length + modelFilter.length + categoryFilter.length +
    statusFilter.length + locationFilter.length + ownershipFilter.length;

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let arr = allProducts;
    if (search.trim()) {
      const t = search.toLowerCase();
      arr = arr.filter(p =>
        p.brandName.toLowerCase().includes(t) ||
        p.modelName.toLowerCase().includes(t) ||
        p.category.toLowerCase().includes(t) ||
        (p.serialNumbers || []).some(s => s.toLowerCase().includes(t))
      );
    }
    if (brandFilter.length > 0)     arr = arr.filter(p => brandFilter.includes(p.brandName));
    if (modelFilter.length > 0)     arr = arr.filter(p => modelFilter.includes(p.modelName));
    if (categoryFilter.length > 0)  arr = arr.filter(p => categoryFilter.includes(p.category));
    if (statusFilter.length > 0)    arr = arr.filter(p => statusFilter.includes(p.status));
    if (locationFilter.length > 0)  arr = arr.filter(p => locationFilter.includes(getDisplayLocation(p)));
    if (ownershipFilter.length > 0) arr = arr.filter(p => ownershipFilter.includes(p.ownershipType || 'Owned'));
    return arr;
  }, [allProducts, search, brandFilter, modelFilter, categoryFilter, statusFilter, locationFilter, ownershipFilter]);

  // ── Stat cards ────────────────────────────────────────────────────────────
  const totalItems     = allProducts.length;
  const inStockCount   = allProducts.filter(p => p.stock > 0).length;
  const creditProducts = allProducts.filter(p => p.ownershipType === 'Credit');
  const paymentProducts = allProducts.filter(p => !p.ownershipType || p.ownershipType === 'Owned');
  const creditCount    = creditProducts.length;
  const paymentCount   = paymentProducts.length;

  const inTransitCount = transfers.filter(t => t.status === 'In Transit' || t.status === 'Pending').length;

  // ── Payables modal state ──────────────────────────────────────────────────
  const [payModalProduct,  setPayModalProduct]  = useState<Product | null>(null);
  const [payAmount,        setPayAmount]        = useState(0);
  const [payChannel,       setPayChannel]       = useState<'Cash' | 'Bank' | 'Cheque'>('Cash');
  const [payNote,          setPayNote]          = useState('');
  const [isSubmittingPay,  setIsSubmittingPay]  = useState(false);
  const [showPayables,     setShowPayables]     = useState(false);

  const openPayables = () => setShowPayables(true);

  const openPayModal = (p: Product) => {
    const remaining = Math.max(0, (p.supplierCost || 0) - (p.supplierPaidAmount || 0));
    setPayModalProduct(p);
    setPayAmount(remaining);
    setPayChannel('Cash');
    setPayNote('');
  };

  const handleRecordPayment = async () => {
    if (!payModalProduct || payAmount <= 0) { toast.error('Enter a valid amount'); return; }
    setIsSubmittingPay(true);
    try {
      const prev     = payModalProduct.supplierPaidAmount || 0;
      const newPaid  = prev + payAmount;
      const total    = payModalProduct.supplierCost || 0;
      const newStatus: 'Unpaid' | 'Partial' | 'Cleared' =
        newPaid >= total ? 'Cleared' : newPaid > 0 ? 'Partial' : 'Unpaid';

      await InventoryFirebaseService.updateProduct(payModalProduct.id, {
        supplierPaidAmount:     newPaid,
        supplierPaymentStatus:  newStatus,
        supplierPaymentChannel: payChannel,
      });

      toast.success(`Payment of ${fmtAED(payAmount)} recorded`);
      setPayModalProduct(null);
      loadProducts(); // refresh
    } catch {
      toast.error('Failed to record payment');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // ── Quick action cards ────────────────────────────────────────────────────
  const quickActions = [
    { label: 'Add New',      icon: Plus,           onClick: onAddNewInventory,  iconColor: '#0f172a', iconBg: '#f1f5f9', border: '#cbd5e1', hoverBorder: '#334155', hoverBg: '#f1f5f9' },
    { label: 'Add Returned', icon: RotateCcw,      onClick: onAddReturnedInventory, iconColor: '#d97706', iconBg: '#fffbeb', border: '#fde68a', hoverBorder: '#f59e0b', hoverBg: '#fffbeb' },
    { label: 'Transfer',     icon: ArrowLeftRight, onClick: onViewTransfer,     iconColor: '#1d4ed8', iconBg: '#eff6ff', border: '#bfdbfe', hoverBorder: '#3b82f6', hoverBg: '#eff6ff' },
    { label: 'Payables',     icon: Wallet,         onClick: openPayables,       iconColor: '#b45309', iconBg: '#fffbeb', border: '#fde68a', hoverBorder: '#d97706', hoverBg: '#fffbeb' },
    { label: 'Report',       icon: BarChart2,      onClick: onViewReport,       iconColor: '#7c3aed', iconBg: '#f5f3ff', border: '#ddd6fe', hoverBorder: '#8b5cf6', hoverBg: '#f5f3ff' },
    { label: 'Damaged',      icon: AlertTriangle,  onClick: () => navigate('/inventory/damaged'), iconColor: '#b91c1c', iconBg: '#fef2f2', border: '#fecaca', hoverBorder: '#ef4444', hoverBg: '#fef2f2' },
    { label: 'Deleted',      icon: Trash2,         onClick: onViewDeleted,      iconColor: '#64748b', iconBg: '#f8fafc', border: '#e2e8f0', hoverBorder: '#94a3b8', hoverBg: '#f1f5f9' },
    { label: 'View All',     icon: Package,        onClick: onViewInventory,    iconColor: '#0f766e', iconBg: '#f0fdfa', border: '#99f6e4', hoverBorder: '#14b8a6', hoverBg: '#f0fdfa' },
  ];

  // ── View product modal ────────────────────────────────────────────────────
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  // ── Credit products for payables panel ───────────────────────────────────
  const creditList = useMemo(() =>
    allProducts.filter(p => p.ownershipType === 'Credit')
  , [allProducts]);

  // ── Render ────────────────────────────────────────────────────────────────
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
            <div style={{ fontSize: 12, color: '#64748b' }}>Smart inventory intake with costing and payment tracking</div>
          </div>
        </div>

        {/* ── Quick action cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: 8 }}>
          {quickActions.map(card => {
            const Icon = card.icon;
            return (
              <button key={card.label} onClick={card.onClick}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', border: `1.5px solid ${card.border}`, borderRadius: 11, backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.17s' }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = card.hoverBorder; el.style.backgroundColor = card.hoverBg; el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; el.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = card.border; el.style.backgroundColor = '#fff'; el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; el.style.transform = 'translateY(0)'; }}
              >
                <div style={{ padding: 7, borderRadius: 8, backgroundColor: card.iconBg, flexShrink: 0 }}>
                  <Icon size={14} color={card.iconColor} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{card.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 4 Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Total Items',         value: isLoading ? '—' : String(totalItems),   sub: `${locations.length} location${locations.length !== 1 ? 's' : ''}`, valueColor: '#0f172a', accent: '#e2e8f0' },
            { label: 'In Stock',            value: isLoading ? '—' : String(inStockCount),  sub: 'units with stock > 0',    valueColor: '#15803d', accent: '#bbf7d0' },
            { label: 'Stock on Credit',     value: isLoading ? '—' : String(creditCount),   sub: 'supplier credit items',   valueColor: '#b45309', accent: '#fde68a' },
            { label: 'Against Payment',     value: isLoading ? '—' : String(paymentCount),  sub: 'fully paid items',        valueColor: '#1d4ed8', accent: '#bfdbfe' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#fff', border: `1px solid ${s.accent}`, borderTop: `3px solid ${s.accent}`, borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.valueColor, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Always-visible filter bar ── */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 2, minWidth: 180 }}>
              <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search brand, model, serial, category…"
                style={{ width: '100%', paddingLeft: 28, paddingRight: search ? 28 : 10, paddingTop: 7, paddingBottom: 7, border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, outline: 'none', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                  <X size={12} />
                </button>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 11px', borderRadius: 7, border: '1px solid #fecaca', backgroundColor: '#fef2f2', fontSize: 11, fontWeight: 700, color: '#b91c1c', cursor: 'pointer' }}>
                <X size={11} /> Clear ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Filter selects row — all multi-select */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <MultiFilterSelect label="Brand"     selected={brandFilter}     onChange={v => { setBrandFilter(v); setModelFilter([]); }} options={brands} />
            <MultiFilterSelect label="Model"     selected={modelFilter}     onChange={setModelFilter}     options={models} />
            <MultiFilterSelect label="Category"  selected={categoryFilter}  onChange={setCategoryFilter}  options={categories} />
            <MultiFilterSelect label="Status"    selected={statusFilter}    onChange={setStatusFilter}    options={statuses} />
            <MultiFilterSelect label="Location"  selected={locationFilter}  onChange={setLocationFilter}  options={locations} />
            <MultiFilterSelect label="Ownership" selected={ownershipFilter} onChange={setOwnershipFilter} options={['Owned', 'Credit']} />
          </div>
        </div>

        {/* ── Inventory table ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              Inventory
              {activeFilterCount > 0 && (
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                  ({displayed.length} of {allProducts.length})
                </span>
              )}
            </span>
            <button onClick={onViewInventory}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 11px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
              View all <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '28px 20px', color: '#64748b', fontSize: 13 }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading inventory…
              </div>
            ) : displayed.length === 0 ? (
              <div style={{ padding: '28px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No inventory items match your filters.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Brand / Model', 'Category', 'Serial', 'Location', 'Ownership', 'Stock', 'Cost (AED)', 'Sell (AED)', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((product, idx) => {
                    const loc = getDisplayLocation(product);
                    const ownership = product.ownershipType || 'Owned';
                    return (
                      <tr key={product.id}
                        style={{ borderBottom: idx < displayed.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '9px 12px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 12 }}>{product.modelName}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{product.brandName}</div>
                        </td>
                        <td style={{ padding: '9px 12px', fontSize: 11, color: '#475569', verticalAlign: 'middle' }}>{product.category || '—'}</td>
                        <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 11, color: '#334155', verticalAlign: 'middle' }}>
                          {(product.serialNumbers?.length ?? 0) > 0
                            ? product.serialNumbers.length === 1
                              ? product.serialNumbers[0]
                              : `${product.serialNumbers[0]} +${product.serialNumbers.length - 1}`
                            : '—'}
                        </td>
                        <td style={{ padding: '9px 12px', verticalAlign: 'middle' }}>
                          {loc !== '—'
                            ? <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#475569' }}><MapPin size={11} />{loc}</span>
                            : <span style={{ color: '#94a3b8' }}>—</span>}
                        </td>
                        <td style={{ padding: '9px 12px', verticalAlign: 'middle' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700, backgroundColor: ownership === 'Credit' ? '#fef3c7' : '#f1f5f9', color: ownership === 'Credit' ? '#92400e' : '#334155' }}>
                            {ownership}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px', fontWeight: 700, color: product.stock === 0 ? '#b91c1c' : '#0f172a', verticalAlign: 'middle' }}>{product.stock}</td>
                        <td style={{ padding: '9px 12px', color: '#334155', verticalAlign: 'middle' }}>{product.costPrice ? fmtAED(product.costPrice) : '—'}</td>
                        <td style={{ padding: '9px 12px', color: '#334155', verticalAlign: 'middle' }}>{product.sellPrice ? fmtAED(product.sellPrice) : '—'}</td>
                        <td style={{ padding: '9px 12px', verticalAlign: 'middle' }}>{statusBadge(product.status)}</td>
                        <td style={{ padding: '9px 12px', verticalAlign: 'middle' }}>
                          <button onClick={() => setViewProduct(product)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 6, border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: 11, color: '#475569', cursor: 'pointer' }}>
                            <Eye size={11} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PAYABLES PANEL (slide-in overlay)
      ══════════════════════════════════════════════ */}
      {showPayables && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.4)', zIndex: 40, display: 'flex', justifyContent: 'flex-end' }}
          onClick={() => setShowPayables(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: 560, maxWidth: '95vw', backgroundColor: '#fff', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>

            {/* Panel header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Supplier Payables</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Credit inventory with outstanding balances</div>
                </div>
              </div>
              <button onClick={() => setShowPayables(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Summary bar */}
            {(() => {
              const totalOwed = creditList.reduce((s, p) => s + Math.max(0, (p.supplierCost || 0) - (p.supplierPaidAmount || 0)), 0);
              const soldOutOwed = creditList.filter(p => p.stock === 0).reduce((s, p) => s + Math.max(0, (p.supplierCost || 0) - (p.supplierPaidAmount || 0)), 0);
              return (
                <div style={{ padding: '12px 20px', backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Outstanding</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#b45309' }}>{fmtAED(totalOwed)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sold Out (Due Now)</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#b91c1c' }}>{fmtAED(soldOutOwed)}</div>
                  </div>
                </div>
              );
            })()}

            {/* Credit product list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, padding: 20 }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
                </div>
              ) : creditList.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 13, padding: 20, textAlign: 'center' }}>
                  No credit inventory found.
                </div>
              ) : creditList.map(p => {
                const remaining = Math.max(0, (p.supplierCost || 0) - (p.supplierPaidAmount || 0));
                const paidPct   = p.supplierCost ? Math.min(100, Math.round(((p.supplierPaidAmount || 0) / p.supplierCost) * 100)) : 0;
                const statusColor = p.supplierPaymentStatus === 'Cleared' ? '#15803d' : p.supplierPaymentStatus === 'Partial' ? '#b45309' : '#b91c1c';
                const statusBg    = p.supplierPaymentStatus === 'Cleared' ? '#dcfce7' : p.supplierPaymentStatus === 'Partial' ? '#fef3c7' : '#fee2e2';
                return (
                  <div key={p.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{p.modelName}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{p.brandName} · {p.category || '—'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                          {getDisplayLocation(p)} · Stock: <span style={{ fontWeight: 700, color: p.stock === 0 ? '#b91c1c' : '#0f172a' }}>{p.stock}</span>
                          {p.stock === 0 && <span style={{ color: '#b91c1c', fontWeight: 700 }}> (Sold out — payment due)</span>}
                        </div>
                      </div>
                      <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, backgroundColor: statusBg, color: statusColor }}>
                        {p.supplierPaymentStatus || 'Unpaid'}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                        <span>Paid: <strong style={{ color: '#15803d' }}>{fmtAED(p.supplierPaidAmount || 0)}</strong></span>
                        <span>Total: <strong>{fmtAED(p.supplierCost || 0)}</strong></span>
                      </div>
                      <div style={{ height: 5, backgroundColor: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${paidPct}%`, backgroundColor: paidPct >= 100 ? '#16a34a' : '#f59e0b', borderRadius: 99, transition: 'width 0.3s' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#b45309' }}>
                        Remaining: {fmtAED(remaining)}
                      </div>
                      {remaining > 0 && (
                        <button onClick={() => openPayModal(p)}
                          style={{ padding: '6px 14px', borderRadius: 7, border: 'none', backgroundColor: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          Record Payment
                        </button>
                      )}
                      {remaining <= 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>✓ Fully paid</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          PAYMENT MODAL
      ══════════════════════════════════════════════ */}
      {payModalProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}
          onClick={() => setPayModalProduct(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: '#fff', borderRadius: 14, padding: 24, width: 400, maxWidth: '92vw', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Record Payment</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{payModalProduct.brandName} — {payModalProduct.modelName}</div>
              </div>
              <button onClick={() => setPayModalProduct(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}><X size={18} /></button>
            </div>

            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Supplier cost</span>
                <span style={{ fontWeight: 700 }}>{fmtAED(payModalProduct.supplierCost || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Already paid</span>
                <span style={{ fontWeight: 700, color: '#15803d' }}>{fmtAED(payModalProduct.supplierPaidAmount || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, paddingTop: 6, borderTop: '1px solid #fde68a' }}>
                <span style={{ color: '#b45309', fontWeight: 700 }}>Remaining</span>
                <span style={{ fontWeight: 800, color: '#b45309' }}>{fmtAED(Math.max(0, (payModalProduct.supplierCost || 0) - (payModalProduct.supplierPaidAmount || 0)))}</span>
              </div>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5 }}>Payment Amount (AED) *</label>
              <input type="number" min={0} value={payAmount}
                onChange={e => setPayAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Payment mode */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Payment Mode *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(['Cash', 'Bank', 'Cheque'] as const).map(ch => (
                  <button key={ch} onClick={() => setPayChannel(ch)}
                    style={{ padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, border: `2px solid ${payChannel === ch ? '#0f172a' : '#e2e8f0'}`, backgroundColor: payChannel === ch ? '#f1f5f9' : '#fff', color: payChannel === ch ? '#0f172a' : '#6b7280' }}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5 }}>Note (optional)</label>
              <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="e.g. Partial payment via cheque"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <button onClick={handleRecordPayment} disabled={isSubmittingPay || payAmount <= 0}
              style={{ width: '100%', padding: '11px 0', borderRadius: 9, border: 'none', backgroundColor: isSubmittingPay || payAmount <= 0 ? '#e5e7eb' : '#16a34a', color: isSubmittingPay || payAmount <= 0 ? '#9ca3af' : '#fff', fontWeight: 700, fontSize: 14, cursor: isSubmittingPay || payAmount <= 0 ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
              {isSubmittingPay ? 'Saving…' : `Confirm Payment — ${fmtAED(payAmount)}`}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          QUICK VIEW MODAL
      ══════════════════════════════════════════════ */}
      {viewProduct && (
        <div onClick={() => setViewProduct(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 420, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{viewProduct.modelName}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{viewProduct.brandName}</div>
              </div>
              <button onClick={() => setViewProduct(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { label: 'Status',     value: viewProduct.status },
                { label: 'Category',   value: viewProduct.category || '—' },
                { label: 'Ownership',  value: viewProduct.ownershipType || 'Owned' },
                { label: 'Location',   value: getDisplayLocation(viewProduct) },
                { label: 'Stock',      value: String(viewProduct.stock) },
                { label: 'Cost',       value: viewProduct.costPrice ? fmtAED(viewProduct.costPrice) : '—' },
                { label: 'Sell Price', value: viewProduct.sellPrice ? fmtAED(viewProduct.sellPrice) : '—' },
                ...(viewProduct.ownershipType === 'Credit' ? [
                  { label: 'Supplier Cost',   value: fmtAED(viewProduct.supplierCost || 0) },
                  { label: 'Paid',            value: fmtAED(viewProduct.supplierPaidAmount || 0) },
                  { label: 'Remaining',       value: fmtAED(Math.max(0, (viewProduct.supplierCost || 0) - (viewProduct.supplierPaidAmount || 0))) },
                  { label: 'Payment Status',  value: viewProduct.supplierPaymentStatus || 'Unpaid' },
                ] : []),
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
            {(viewProduct.serialNumbers?.length ?? 0) > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Serials ({viewProduct.serialNumbers.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {viewProduct.serialNumbers.slice(0, 12).map(s => (
                    <span key={s} style={{ fontFamily: 'monospace', fontSize: 11, backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 7px', borderRadius: 4 }}>{s}</span>
                  ))}
                  {viewProduct.serialNumbers.length > 12 && <span style={{ fontSize: 11, color: '#94a3b8', padding: '2px 7px' }}>+{viewProduct.serialNumbers.length - 12} more</span>}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button onClick={() => { navigate(`/inventory/edit/${viewProduct.id}`); setViewProduct(null); }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Edit</button>
              <button onClick={() => { navigate(`/product-transfer?productId=${viewProduct.id}`); setViewProduct(null); }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#334155', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}