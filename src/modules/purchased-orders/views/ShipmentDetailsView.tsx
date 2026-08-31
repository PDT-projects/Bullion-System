// Purchased Orders — shipment detail
//
// The screen this replaces was a spreadsheet, where an accountant could click
// any cell and read the formula behind it. Losing that is what makes people
// stop trusting a costing screen, so every calculated figure here carries its
// arithmetic and shows it on hover.
//
// Customs, freight, other charges and tax are edited in place and the whole
// sheet recalculates as you type. Nothing is written until Save.

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, Check, Clock, Loader2, Ship, Truck, FileText, Calculator,
  AlertTriangle, Save, PackageCheck,
} from 'lucide-react';
import { PurchasedOrderFirebaseService } from '../models/purchasedOrderFirebaseService';
import {
  calculateShipmentCosting, shipmentWorkflow, money, moneyRaw, round2,
} from '../models/purchasedOrderService';
import { Shipment, DisplayCurrency, SHIPMENT_CURRENCIES } from '../models/types';

const S = {
  card: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' } as React.CSSProperties,
  h:    { fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 } as React.CSSProperties,
  th:   { padding: '8px 10px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' } as React.CSSProperties,
  td:   { padding: '7px 10px', fontSize: 12, color: '#0f172a', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9' } as React.CSSProperties,
  inp:  { width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  label:{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 } as React.CSSProperties,
};

/**
 * A number that explains itself. The dotted underline is the affordance; the
 * tooltip is positioned from the cursor and flips left near the right edge so
 * it never runs off screen on the widest column.
 */
function Cell({ text, formula, bold, tone }: {
  text: string; formula?: string; bold?: boolean; tone?: 'ok' | 'muted';
}) {
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const colour = tone === 'ok' ? '#15803d' : tone === 'muted' ? '#94a3b8' : '#0f172a';

  if (!formula) return <td style={{ ...S.td, fontWeight: bold ? 700 : 400, color: colour }}>{text}</td>;

  return (
    <td
      style={{ ...S.td, fontWeight: bold ? 700 : 400, color: colour, cursor: 'help', borderBottom: '1px dotted #cbd5e1' }}
      onMouseMove={e => setTip({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setTip(null)}
    >
      {text}
      {tip && (
        <div style={{
          position: 'fixed',
          left: tip.x + 340 > window.innerWidth ? tip.x - 340 : tip.x + 14,
          top: tip.y + 14,
          zIndex: 999, maxWidth: 330,
          backgroundColor: '#0f172a', color: '#e2e8f0',
          border: '1px solid #334155', borderRadius: 8, padding: '10px 12px',
          fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre-wrap', textAlign: 'left',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          pointerEvents: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.28)',
        }}>{formula}</div>
      )}
    </td>
  );
}

function Field({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{value || '—'}</div>
    </div>
  );
}

export const ShipmentDetailsView: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [view, setView]         = useState<DisplayCurrency>('AED');

  // Charges are edited locally and committed on Save, so a half-typed number
  // never reaches Firestore and the sheet still recalculates on every keystroke.
  const [charges, setCharges] = useState({ freight: 0, customs: 0, other: 0, tax: 0 });
  const [received, setReceived] = useState<Record<string, number>>({});
  const [dirty, setDirty] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        const s = await PurchasedOrderFirebaseService.fetchById(id);
        if (cancelled) return;
        setShipment(s);
        if (s) {
          setCharges({
            freight: s.freightAmount, customs: s.customsAmount,
            other: s.otherCharges,    tax: s.salesTaxAmount,
          });
          setReceived(Object.fromEntries(s.lines.map(l => [l.id, l.receivedQuantity])));
          loadedRef.current = true;
        }
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message || 'Failed to load shipment');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  /**
   * Costed from the LOCAL edits, not the stored document, so the table reflects
   * what you are typing before you commit it.
   */
  const costing = useMemo(() => {
    if (!shipment) return null;
    return calculateShipmentCosting({
      currency: shipment.currency,
      exchangeRate: shipment.exchangeRate,
      freightAmount: charges.freight,
      customsAmount: charges.customs,
      otherCharges: charges.other,
      salesTaxAmount: charges.tax,
      lines: shipment.lines.map(l => ({ ...l, receivedQuantity: received[l.id] ?? l.receivedQuantity })),
    });
  }, [shipment, charges, received]);

  const setCharge = (k: keyof typeof charges, v: number) => {
    setCharges(p => ({ ...p, [k]: v }));
    if (loadedRef.current) setDirty(true);
  };
  const setRecv = (lineId: string, v: number) => {
    setReceived(p => ({ ...p, [lineId]: v }));
    if (loadedRef.current) setDirty(true);
  };

  const save = useCallback(async () => {
    if (!id || !shipment) return;
    setSaving(true);
    try {
      await PurchasedOrderFirebaseService.update(id, {
        freightAmount: charges.freight,
        customsAmount: charges.customs,
        otherCharges:  charges.other,
        salesTaxAmount: charges.tax,
        lines: shipment.lines.map(l => ({ ...l, receivedQuantity: received[l.id] ?? l.receivedQuantity })),
      });
      setShipment(prev => prev ? {
        ...prev,
        freightAmount: charges.freight, customsAmount: charges.customs,
        otherCharges: charges.other, salesTaxAmount: charges.tax,
        lines: prev.lines.map(l => ({ ...l, receivedQuantity: received[l.id] ?? l.receivedQuantity })),
      } : prev);
      setDirty(false);
      toast.success('Shipment saved');
    } catch (err: any) {
      toast.error(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [id, shipment, charges, received]);

  const patch = useCallback(async (p: Partial<Shipment>) => {
    if (!id) return;
    setSaving(true);
    try {
      await PurchasedOrderFirebaseService.patchStatus(id, p);
      setShipment(prev => (prev ? { ...prev, ...p } : prev));
      toast.success('Shipment updated');
    } catch (err: any) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: 13, marginTop: 8 }}>Loading shipment…</div>
      </div>
    );
  }

  if (!shipment || !costing) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Shipment not found</div>
        <button type="button" onClick={() => navigate('/purchased-orders')}
          style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontSize: 13 }}>
          Back to Purchased Orders
        </button>
      </div>
    );
  }

  const c   = costing;
  const cur = shipment.currency;
  const M   = (aed: number) => money(aed, view);
  const flow = shipmentWorkflow({ ...shipment, lines: c.lines });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={() => navigate('/purchased-orders')}
          style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={17} color="#64748b" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{shipment.shipmentNumber}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {shipment.brandName} · {shipment.supplierName} · {shipment.originCountry} · {shipment.status}
          </div>
        </div>

        {/* Display currency. Storage stays AED — this only changes what you read. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>View in</span>
          <select value={view} onChange={e => setView(e.target.value as DisplayCurrency)}
            style={{ ...S.inp, width: 'auto', padding: '6px 9px', fontSize: 12, cursor: 'pointer' }}>
            {SHIPMENT_CURRENCIES.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>

        {dirty && (
          <button type="button" onClick={save} disabled={saving}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />} Save
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {view !== 'AED' && (
          <div style={{ padding: '8px 14px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, color: '#1e3a8a' }}>
            Showing converted values for reading only. Every figure is stored and calculated in AED.
          </div>
        )}

        {/* Overview */}
        <div style={S.card}>
          <div style={S.h}><Ship size={14} /> Shipment overview</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
            <Field label="Brand"             value={shipment.brandName} />
            <Field label="Supplier"          value={shipment.supplierName} />
            <Field label="Supplier order no" value={shipment.supplierOrderNumber} />
            <Field label="Origin"            value={shipment.originCountry} />
            <Field label="Destination"       value={shipment.destinationCountry} />
            <Field label="Order date"        value={shipment.orderDate} />
            <Field label="Dispatched"        value={shipment.shipmentDate} />
            <Field label="Expected"          value={shipment.expectedArrivalDate} />
            <Field label="Arrived"           value={shipment.actualArrivalDate} />
            <Field label="Method"            value={shipment.shipMethod} />
            <Field label="Freight terms"     value={shipment.freightTerms} />
            <Field label="Tracking"          value={shipment.trackingNumber} />
            <Field label="Invoice currency"  value={cur} />
            <Field label="Rate (AED per 1)"  value={shipment.exchangeRate} />
          </div>
        </div>

        {/* Progress */}
        <div style={S.card}>
          <div style={S.h}><Truck size={14} /> Progress</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {flow.map((st, i) => {
              const ok = st.state === 'Completed';
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 20,
                  fontSize: 12, fontWeight: 600,
                  color: ok ? '#15803d' : '#94a3b8',
                  backgroundColor: ok ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${ok ? '#bbf7d0' : '#e2e8f0'}`,
                }}>
                  {ok ? <Check size={12} /> : <Clock size={12} />} {st.label}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
            {!shipment.actualArrivalDate && (
              <button type="button" disabled={saving}
                onClick={() => patch({ actualArrivalDate: new Date().toISOString().slice(0, 10), status: 'Arrived' })}
                style={{ padding: '7px 13px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Mark arrived
              </button>
            )}
            {shipment.customsStatus !== 'Applied' && (
              <button type="button" disabled={saving}
                onClick={() => patch({ customsStatus: 'Applied', status: 'Customs Cleared' })}
                style={{ padding: '7px 13px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Apply customs duty
              </button>
            )}
            {shipment.freightStatus !== 'Applied' && (
              <button type="button" disabled={saving}
                onClick={() => patch({ freightStatus: 'Applied' })}
                style={{ padding: '7px 13px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Apply freight
              </button>
            )}
            {shipment.costingStatus !== 'Complete'
              && shipment.customsStatus === 'Applied'
              && shipment.freightStatus === 'Applied' && (
              <button type="button" disabled={saving || !c.reconciles}
                onClick={() => patch({ costingStatus: 'Complete', status: 'Costing Complete' })}
                style={{ padding: '7px 13px', borderRadius: 8, border: 'none', backgroundColor: c.reconciles ? '#15803d' : '#94a3b8', color: '#fff', cursor: c.reconciles ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 700 }}>
                Finalise costing
              </button>
            )}
          </div>
          {shipment.costingStatus !== 'Complete'
            && (shipment.customsStatus !== 'Applied' || shipment.freightStatus !== 'Applied') && (
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '10px 0 0' }}>
              Costing can only be finalised once both customs duty and freight are applied.
            </p>
          )}
        </div>

        {/* Charges — live */}
        <div style={S.card}>
          <div style={S.h}><Calculator size={14} /> Import charges
            <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 11 }}>entered in {cur}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {([
              ['Freight',      'freight', c.freightBase, c.formulas.freightBase],
              ['Customs duty', 'customs', c.customsBase, c.formulas.customsBase],
              ['Other charges','other',   c.otherBase,   c.formulas.otherBase],
              ['Sales tax',    'tax',     c.taxBase,     c.formulas.taxBase],
            ] as const).map(([label, key, base]) => (
              <div key={key}>
                <label style={S.label}>{label}</label>
                <input type="number" min={0} step="any"
                  value={charges[key] || ''}
                  onChange={e => setCharge(key, parseFloat(e.target.value) || 0)}
                  placeholder="0.00" style={S.inp} />
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>= {M(base)}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '12px 0 0' }}>
            Change any value and the table below recalculates immediately. Nothing is written until you press Save.
          </p>
        </div>

        {/* Commercial invoice + costing */}
        <div style={S.card}>
          <div style={S.h}><FileText size={14} /> Costing sheet</div>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '-6px 0 12px' }}>
            Hover any calculated figure to see the arithmetic behind it.
            Import charges are allocated by each line's share of net purchase value.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1120 }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, textAlign: 'left' }}>Item no</th>
                  <th style={{ ...S.th, textAlign: 'left' }}>Product</th>
                  <th style={S.th}>Qty</th>
                  <th style={S.th}>UOM</th>
                  <th style={S.th}>Unit price</th>
                  <th style={S.th}>Disc%</th>
                  <th style={S.th}>Net</th>
                  <th style={S.th}>Net (AED)</th>
                  <th style={S.th}>Share</th>
                  <th style={S.th}>Customs</th>
                  <th style={S.th}>Freight</th>
                  <th style={S.th}>Other</th>
                  <th style={S.th}>Landed</th>
                  <th style={S.th}>Landed / unit</th>
                </tr>
              </thead>
              <tbody>
                {c.lines.map(l => (
                  <tr key={l.id}>
                    <td style={{ ...S.td, textAlign: 'left', fontFamily: 'ui-monospace, monospace', color: '#64748b' }}>{l.sku || '—'}</td>
                    <td style={{ ...S.td, textAlign: 'left', fontWeight: 600 }}>
                      {l.productName}{l.modelName ? <span style={{ color: '#94a3b8', fontWeight: 400 }}> · {l.modelName}</span> : null}
                    </td>
                    <td style={S.td}>{l.quantity}</td>
                    <td style={{ ...S.td, color: '#94a3b8' }}>{l.uom}</td>
                    <td style={S.td}>{moneyRaw(l.unitPrice, cur)}</td>
                    <td style={{ ...S.td, color: l.discountPercent ? '#0f172a' : '#cbd5e1' }}>{l.discountPercent || 0}%</td>
                    <Cell text={moneyRaw(l.netTotal, cur)} formula={l.formulas.netTotal} />
                    <Cell text={M(l.netTotalBase)}   formula={l.formulas.netTotalBase} />
                    <Cell text={(l.share * 100).toFixed(2) + '%'} formula={l.formulas.share} tone="muted" />
                    <Cell text={M(l.customsShare)}   formula={l.formulas.customsShare} />
                    <Cell text={M(l.freightShare)}   formula={l.formulas.freightShare} />
                    <Cell text={M(l.otherShare)}     formula={l.formulas.otherShare} />
                    <Cell text={M(l.landedTotal)}    formula={l.formulas.landedTotal} bold />
                    <Cell text={M(l.landedUnitCost)} formula={l.formulas.landedUnitCost} bold tone="ok" />
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                  <td colSpan={2} style={{ ...S.td, textAlign: 'left', fontWeight: 700 }}>Total</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{c.totalQuantity}</td>
                  <td colSpan={3} style={S.td} />
                  <Cell text={moneyRaw(c.purchaseNet, cur)} formula={c.formulas.purchaseNet} bold />
                  <Cell text={M(c.purchaseNetBase)} formula={c.formulas.purchaseNetBase} bold />
                  <td style={{ ...S.td, fontWeight: 700 }}>100%</td>
                  <Cell text={M(c.customsBase)} formula={c.formulas.customsBase} bold />
                  <Cell text={M(c.freightBase)} formula={c.formulas.freightBase} bold />
                  <Cell text={M(c.otherBase + c.taxBase)} formula={`Other + tax\n= ${M(c.otherBase)} + ${M(c.taxBase)}`} bold />
                  <Cell text={M(c.landedTotal)} formula={c.formulas.landedTotal} bold />
                  <Cell text={M(c.averageLandedUnitCost)} formula={c.formulas.averageLandedUnitCost} bold tone="ok" />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Closure check — the spreadsheet had no equivalent, so a broken
              formula could sit unnoticed for months. */}
          <div style={{
            marginTop: 12, padding: '9px 13px', borderRadius: 8, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 8,
            backgroundColor: c.reconciles ? '#f0fdf4' : '#fef2f2',
            color: c.reconciles ? '#15803d' : '#b91c1c',
            border: `1px solid ${c.reconciles ? '#bbf7d0' : '#fecaca'}`,
          }}>
            {c.reconciles ? <Check size={14} /> : <AlertTriangle size={14} />}
            <span style={{ cursor: 'help' }} title={c.formulas.reconciles}>
              {c.reconciles
                ? `Closure check passed — line landed totals sum to ${M(c.landedTotal)}, exactly the shipment total.`
                : 'Closure check FAILED — the line totals do not sum to the shipment total. Hover for detail.'}
            </span>
          </div>
        </div>

        {/* Receiving */}
        <div style={S.card}>
          <div style={S.h}><PackageCheck size={14} /> Goods received</div>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '-6px 0 12px' }}>
            Record what physically arrived. Received cannot exceed ordered.
            This does not move inventory on its own — stock is created from the Inventory module.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, textAlign: 'left' }}>Product</th>
                  <th style={S.th}>Ordered</th>
                  <th style={S.th}>Received</th>
                  <th style={S.th}>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {c.lines.map(l => (
                  <tr key={l.id}>
                    <td style={{ ...S.td, textAlign: 'left', fontWeight: 600 }}>
                      {l.productName}
                      {l.sku ? <span style={{ color: '#94a3b8', fontWeight: 400, fontFamily: 'ui-monospace, monospace' }}> · {l.sku}</span> : null}
                    </td>
                    <td style={S.td}>{l.quantity} {l.uom}</td>
                    <td style={{ ...S.td, width: 110 }}>
                      <input type="number" min={0} max={l.quantity} step={1}
                        value={received[l.id] ?? l.receivedQuantity}
                        onChange={e => setRecv(l.id, Math.max(0, Math.min(l.quantity, parseInt(e.target.value, 10) || 0)))}
                        style={{ ...S.inp, textAlign: 'right', padding: '5px 8px', fontSize: 12 }} />
                    </td>
                    <Cell
                      text={`${l.remainingQuantity} ${l.uom}`}
                      formula={l.formulas.remainingQuantity}
                      bold={l.remainingQuantity > 0}
                      tone={l.remainingQuantity === 0 ? 'ok' : undefined}
                    />
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                  <td style={{ ...S.td, textAlign: 'left', fontWeight: 700 }}>Total</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{c.totalQuantity}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{c.totalReceived}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: c.totalQuantity - c.totalReceived === 0 ? '#15803d' : '#0f172a' }}>
                    {c.totalQuantity - c.totalReceived}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div style={{ ...S.card, backgroundColor: '#0f172a', border: 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 14 }}>
            Landed cost summary
          </div>
          {([
            ['Gross purchase',  round2(c.purchaseGross * shipment.exchangeRate)],
            ['Less discounts',  -round2(c.discountTotal * shipment.exchangeRate)],
            ['Net purchase',    c.purchaseNetBase],
            ['Freight',         c.freightBase],
            ['Customs duty',    c.customsBase],
            ['Other charges',   c.otherBase],
            ['Sales tax',       c.taxBase],
          ] as const).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ fontSize: 13, color: '#cbd5e1' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: (val as number) < 0 ? '#fca5a5' : '#fff' }}>{M(val as number)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #334155', marginTop: 10, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Total landed cost</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{M(c.landedTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Quantity</span>
            <span style={{ fontSize: 12, color: '#cbd5e1' }}>{c.totalReceived} received of {c.totalQuantity}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Average landed unit cost</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>{M(c.averageLandedUnitCost)}</span>
          </div>
          <p style={{ fontSize: 10, color: '#64748b', margin: '12px 0 0', lineHeight: 1.5 }}>
            The average is blended. Use the per-line landed unit cost for valuation — lines with a
            higher net purchase value absorb a larger share of the import charges.
          </p>
        </div>

        {shipment.notes && (
          <div style={S.card}>
            <div style={S.h}><FileText size={14} /> Notes</div>
            <p style={{ fontSize: 13, color: '#475569', margin: 0, whiteSpace: 'pre-wrap' }}>{shipment.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
