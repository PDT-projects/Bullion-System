// Purchased Orders — list view
// Summary tiles, brand tabs, filters and priority-sorted shipment cards.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Plus, Search, Ship, Globe, Package, Check, Clock, AlertTriangle,
  Trash2, RefreshCw, Loader2, X,
} from 'lucide-react';
import { usePurchasedOrdersViewModel } from '../viewModels/usePurchasedOrdersViewModel';
import {
  calculateShipmentCosting, shipmentPriority, PRIORITY_LABEL, money,
} from '../models/purchasedOrderService';
import { Shipment, SHIPMENT_STATUSES, DisplayCurrency, SHIPMENT_CURRENCIES } from '../models/types';
import { seedDemoShipments } from '../models/seedDemoShipments';

const S = {
  card:  { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' } as React.CSSProperties,
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 } as React.CSSProperties,
  inp:   { width: '100%', padding: '8px 11px', borderRadius: 8, border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
};

const PRIORITY_COLOR: Record<number, { fg: string; bg: string }> = {
  1:  { fg: '#b91c1c', bg: '#fef2f2' },
  2:  { fg: '#b45309', bg: '#fffbeb' },
  3:  { fg: '#b45309', bg: '#fffbeb' },
  4:  { fg: '#15803d', bg: '#f0fdf4' },
  5:  { fg: '#1d4ed8', bg: '#eff6ff' },
  90: { fg: '#475569', bg: '#f1f5f9' },
  99: { fg: '#64748b', bg: '#f1f5f9' },
};

function Tile({ value, label, tone }: { value: number | string; label: string; tone?: 'warn' | 'ok' }) {
  const fg = tone === 'warn' ? '#b45309' : tone === 'ok' ? '#15803d' : '#0f172a';
  return (
    <div style={{ ...S.card, padding: '14px 16px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: fg, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
      padding: '3px 8px', borderRadius: 20,
      color: ok ? '#15803d' : '#94a3b8', backgroundColor: ok ? '#f0fdf4' : '#f8fafc',
      border: `1px solid ${ok ? '#bbf7d0' : '#e2e8f0'}`,
    }}>
      {ok ? <Check size={11} /> : <Clock size={11} />} {label}
    </span>
  );
}

function ShipmentCard({ s, view, onOpen, onDelete }: {
  s: Shipment; view: DisplayCurrency; onOpen: () => void; onDelete: () => void;
}) {
  const costing = calculateShipmentCosting(s);
  const p       = shipmentPriority(s);
  const colour  = PRIORITY_COLOR[p] || PRIORITY_COLOR[5];
  const units   = costing.totalQuantity;

  return (
    <div onClick={onOpen}
      style={{ ...S.card, cursor: 'pointer', borderLeft: `4px solid ${colour.fg}`, transition: 'box-shadow .15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,.08)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {s.brandName || '—'}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, color: colour.fg, backgroundColor: colour.bg }}>
              {PRIORITY_LABEL[p]}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{s.shipmentNumber}</div>
        </div>
        <button type="button" title="Delete shipment"
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 4 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#cbd5e1'}>
          <Trash2 size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#64748b', marginBottom: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Globe size={12} /> {s.originCountry || '—'}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Package size={12} /> {units} unit{units === 1 ? '' : 's'}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Ship size={12} /> {s.status}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        <StatusPill ok={!!s.actualArrivalDate}                label="Arrived" />
        <StatusPill ok={s.customsStatus === 'Applied'}        label="Customs" />
        <StatusPill ok={s.freightStatus === 'Applied'}        label="Freight" />
        <StatusPill ok={s.costingStatus === 'Complete'}       label="Costed" />
      </div>

      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>Landed cost</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{money(costing.landedTotal, view)}</span>
      </div>
      {units > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Avg per unit</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{money(costing.averageLandedUnitCost, view)}</span>
        </div>
      )}
    </div>
  );
}

export const PurchasedOrdersView: React.FC = () => {
  const navigate = useNavigate();
  const vm = usePurchasedOrdersViewModel();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  // Display only. Every figure is stored and calculated in AED.
  const [view, setView] = useState<DisplayCurrency>('AED');
  const [seeding, setSeeding] = useState(false);

  // Demo data, offered only when the collection is empty so it cannot be
  // triggered by accident on a live list. Seeding skips numbers that already
  // exist, so pressing it twice is harmless.
  const loadDemo = async () => {
    setSeeding(true);
    try {
      const r = await seedDemoShipments();
      if (r.created > 0) toast.success(`Loaded ${r.created} demo shipment${r.created === 1 ? '' : 's'}`);
      else if (r.skipped > 0) toast.info('Demo shipments already exist');
      if (r.errors.length) toast.error(r.errors[0]);
      await vm.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Could not load demo data');
    } finally {
      setSeeding(false);
    }
  };

  const tabs = ['ALL', ...vm.brands];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ship size={17} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Purchased Orders</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Track imported shipments, customs, freight and landed product costs.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>View in</span>
          <select value={view} onChange={e => setView(e.target.value as DisplayCurrency)}
            style={{ padding: '6px 9px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12, cursor: 'pointer' }}>
            {SHIPMENT_CURRENCIES.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => vm.refresh()} disabled={vm.isLoading}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
          <RefreshCw size={14} /> Refresh
        </button>
        <button type="button" onClick={() => navigate('/purchased-orders/new')}
          style={{ padding: '9px 16px', borderRadius: 8, border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> New Shipment
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          <Tile value={vm.summary.total}          label="Shipments" />
          <Tile value={vm.summary.inTransit}      label="In transit" />
          <Tile value={vm.summary.arrived}        label="Arrived" tone="ok" />
          <Tile value={vm.summary.pendingCustoms} label="Pending duty"    tone="warn" />
          <Tile value={vm.summary.pendingFreight} label="Pending freight" tone="warn" />
          <Tile value={vm.summary.pendingCosting} label="Pending costing" tone="warn" />
          <Tile value={vm.summary.partiallyReceived} label="Part received" tone="warn" />
          <Tile value={money(vm.summary.landedValue, view)} label="Landed value" />
        </div>

        {/* Brand tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
          {tabs.map(t => {
            const active = vm.filters.brand === t;
            return (
              <button key={t} type="button" onClick={() => vm.setBrand(t)}
                style={{
                  padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  border: `1px solid ${active ? '#0f172a' : '#e2e8f0'}`,
                  backgroundColor: active ? '#0f172a' : '#fff',
                  color: active ? '#fff' : '#475569',
                }}>
                {t}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <div>
            <label style={S.label}>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type="text" value={vm.filters.search} onChange={e => vm.setSearch(e.target.value)}
                placeholder="Shipment number, supplier, tracking..."
                style={{ ...S.inp, paddingLeft: 30 }} />
            </div>
          </div>
          <div>
            <label style={S.label}>Status</label>
            <select value={vm.filters.status} onChange={e => vm.setStatus(e.target.value)} style={{ ...S.inp, cursor: 'pointer' }}>
              <option value="ALL">All statuses</option>
              {SHIPMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Costing</label>
            <select value={vm.filters.costing} onChange={e => vm.setCosting(e.target.value)} style={{ ...S.inp, cursor: 'pointer' }}>
              <option value="ALL">All</option>
              <option value="Pending">Pending</option>
              <option value="Complete">Complete</option>
            </select>
          </div>
          <button type="button" onClick={vm.clearFilters}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#475569', height: 36 }}>
            Clear
          </button>
        </div>

        {/* States */}
        {vm.isLoading && (
          <div style={{ ...S.card, textAlign: 'center', padding: 40, color: '#64748b' }}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
            <div style={{ fontSize: 13 }}>Loading shipments...</div>
          </div>
        )}

        {!vm.isLoading && vm.error && (
          <div style={{ ...S.card, borderColor: '#fecaca', backgroundColor: '#fef2f2', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={17} color="#b91c1c" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#b91c1c' }}>Could not load shipments</div>
              <div style={{ fontSize: 12, color: '#dc2626', marginTop: 2 }}>{vm.error}</div>
            </div>
          </div>
        )}

        {!vm.isLoading && !vm.error && vm.visible.length === 0 && (
          <div style={{ ...S.card, textAlign: 'center', padding: 46 }}>
            <Ship size={30} color="#cbd5e1" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>No shipments found</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
              {vm.shipments.length === 0 ? 'Create your first import shipment to get started.' : 'No shipment matches the current filters.'}
            </div>
            <div style={{ display: 'inline-flex', gap: 8 }}>
              <button type="button" onClick={() => navigate('/purchased-orders/new')}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={15} /> Create Shipment
              </button>
              {vm.shipments.length === 0 && (
                <button type="button" onClick={loadDemo} disabled={seeding}
                  style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontWeight: 700, fontSize: 13, cursor: seeding ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {seeding
                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</>
                    : <>Load demo data</>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cards */}
        {!vm.isLoading && vm.visible.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
            {vm.visible.map(s => (
              <ShipmentCard key={s.id} s={s} view={view}
                onOpen={() => navigate(`/purchased-orders/${s.id}`)}
                onDelete={() => setConfirmId(s.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {confirmId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => setConfirmId(null)}>
          <div style={{ ...S.card, width: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Delete shipment?</div>
              <button type="button" onClick={() => setConfirmId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={16} /></button>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
              This removes the shipment and its costing. It cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setConfirmId(null)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button type="button" onClick={() => { vm.removeShipment(confirmId); setConfirmId(null); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
