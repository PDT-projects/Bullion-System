// Purchased Orders — create shipment
// Product lines, import charges, and a live landed-cost preview.

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Check, Loader2, Calculator } from 'lucide-react';
import { PurchasedOrderFirebaseService } from '../models/purchasedOrderFirebaseService';
import {
  calculateShipmentCosting, validateShipment, suggestShipmentNumber,
  emptyLine, money, moneyRaw,
} from '../models/purchasedOrderService';
import {
  ShipmentLine, ShipmentCurrency, ShipMethod, UnitOfMeasure,
  SHIPMENT_CURRENCIES, SHIP_METHODS, UNITS_OF_MEASURE,
} from '../models/types';

const S = {
  card:  { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' } as React.CSSProperties,
  h:     { fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 } as React.CSSProperties,
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 } as React.CSSProperties,
  inp:   { width: '100%', padding: '8px 11px', borderRadius: 8, border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  grid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 } as React.CSSProperties,
};

const today = () => new Date().toISOString().slice(0, 10);

export const ShipmentCreateView: React.FC = () => {
  const navigate = useNavigate();

  const [brandName, setBrandName]   = useState('');
  const [shipmentNumber, setNumber] = useState('');
  const [supplierName, setSupplier] = useState('');
  const [originCountry, setOrigin]  = useState('');
  const [destinationCountry, setDest] = useState('UAE');
  const [orderDate, setOrderDate]   = useState(today());
  const [shipmentDate, setShipDate] = useState('');
  const [expectedArrivalDate, setEta] = useState('');
  const [shipMethod, setMethod]     = useState<ShipMethod>('Sea');
  const [trackingNumber, setTracking] = useState('');
  const [currency, setCurrency]     = useState<ShipmentCurrency>('USD');
  const [exchangeRate, setRate]     = useState(3.67);
  const [freightAmount, setFreight] = useState(0);
  const [customsAmount, setCustoms] = useState(0);
  const [otherCharges, setOther]    = useState(0);
  const [salesTaxAmount, setTax]    = useState(0);
  const [supplierOrderNumber, setSupplierOrder] = useState('');
  const [notes, setNotes]           = useState('');
  const [lines, setLines]           = useState<ShipmentLine[]>([emptyLine()]);
  const [saving, setSaving]         = useState(false);
  const [errors, setErrors]         = useState<string[]>([]);

  /**
   * The suggested number tracks the brand until the user edits it by hand.
   * Overwriting a typed number on every keystroke of the brand field would be
   * hostile, so `touched` freezes it.
   */
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (touched || !brandName.trim()) return;
    let cancelled = false;
    PurchasedOrderFirebaseService.fetchAll()
      .then(list => { if (!cancelled) setNumber(suggestShipmentNumber(brandName, list)); })
      .catch(() => { if (!cancelled) setNumber(suggestShipmentNumber(brandName, [])); });
    return () => { cancelled = true; };
  }, [brandName, touched]);

  // AED is the base currency, so its rate is fixed at 1 by definition.
  useEffect(() => { if (currency === 'AED') setRate(1); }, [currency]);

  const updateLine = (id: string, field: keyof ShipmentLine, val: any) =>
    setLines(prev => prev.map(l => (l.id === id ? { ...l, [field]: val } : l)));

  const preview = useMemo(
    () => calculateShipmentCosting({ currency, exchangeRate, lines, freightAmount, customsAmount, otherCharges, salesTaxAmount }),
    [currency, exchangeRate, lines, freightAmount, customsAmount, otherCharges, salesTaxAmount],
  );

  const handleSave = async () => {
    const dto = {
      shipmentNumber: shipmentNumber.trim(),
      brandName: brandName.trim(),
      supplierName: supplierName.trim(),
      originCountry: originCountry.trim(),
      destinationCountry: destinationCountry.trim(),
      orderDate,
      shipmentDate: shipmentDate || undefined,
      expectedArrivalDate: expectedArrivalDate || undefined,
      actualArrivalDate: undefined,
      shipMethod,
      trackingNumber: trackingNumber.trim() || undefined,
      currency,
      exchangeRate: Number(exchangeRate) || 1,
      status: (shipmentDate ? 'In Transit' : 'Ordered') as any,
      customsStatus: 'Not Applied' as const,
      freightStatus: 'Not Applied' as const,
      costingStatus: 'Pending' as const,
      freightAmount: Number(freightAmount) || 0,
      customsAmount: Number(customsAmount) || 0,
      otherCharges:   Number(otherCharges)   || 0,
      salesTaxAmount: Number(salesTaxAmount) || 0,
      supplierOrderNumber: supplierOrderNumber.trim() || undefined,
      lines: lines.filter(l => l.productName.trim()),
      notes: notes.trim() || undefined,
    };

    const v = validateShipment(dto as any);
    if (!v.isValid) {
      setErrors(v.errors);
      toast.error(v.errors[0]);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      const created = await PurchasedOrderFirebaseService.create(dto as any);
      toast.success(`Shipment ${created.shipmentNumber} created`);
      navigate(`/purchased-orders/${created.id}`);
    } catch (err: any) {
      const msg = err?.message || 'Failed to create shipment';
      setErrors([msg]);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc' }}>

      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={() => navigate('/purchased-orders')}
          style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={17} color="#64748b" />
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>New Shipment</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Record an incoming import consignment</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {errors.length > 0 && (
          <div style={{ ...S.card, borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#b91c1c', marginBottom: 6 }}>
              Fix {errors.length} issue{errors.length === 1 ? '' : 's'} before saving
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#dc2626' }}>
              {errors.slice(0, 6).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* Basics */}
        <div style={S.card}>
          <div style={S.h}>Shipment details</div>
          <div style={S.grid}>
            <div>
              <label style={S.label}>Brand <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="NOKTA" style={S.inp} />
            </div>
            <div>
              <label style={S.label}>Shipment number <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" value={shipmentNumber}
                onChange={e => { setNumber(e.target.value); setTouched(true); }}
                placeholder="SHP-NOKTA-26-001" style={S.inp} />
            </div>
            <div>
              <label style={S.label}>Supplier <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" value={supplierName} onChange={e => setSupplier(e.target.value)} placeholder="Supplier name" style={S.inp} />
            </div>
            <div>
              <label style={S.label}>Origin country <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" value={originCountry} onChange={e => setOrigin(e.target.value)} placeholder="Turkey" style={S.inp} />
            </div>
            <div>
              <label style={S.label}>Destination</label>
              <input type="text" value={destinationCountry} onChange={e => setDest(e.target.value)} style={S.inp} />
            </div>
            <div>
              <label style={S.label}>Shipping method</label>
              <select value={shipMethod} onChange={e => setMethod(e.target.value as ShipMethod)} style={{ ...S.inp, cursor: 'pointer' }}>
                {SHIP_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Order date <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} style={S.inp} />
            </div>
            <div>
              <label style={S.label}>Dispatch date</label>
              <input type="date" value={shipmentDate} onChange={e => setShipDate(e.target.value)} style={S.inp} />
            </div>
            <div>
              <label style={S.label}>Expected arrival</label>
              <input type="date" value={expectedArrivalDate} onChange={e => setEta(e.target.value)} style={S.inp} />
            </div>
            <div>
              <label style={S.label}>Tracking / AWB / BL</label>
              <input type="text" value={trackingNumber} onChange={e => setTracking(e.target.value)} style={S.inp} />
            </div>
            <div>
              <label style={S.label}>Supplier order no</label>
              <input type="text" value={supplierOrderNumber} onChange={e => setSupplierOrder(e.target.value)}
                placeholder="481224" style={S.inp} />
            </div>
            <div>
              <label style={S.label}>Currency <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={currency} onChange={e => setCurrency(e.target.value as ShipmentCurrency)} style={{ ...S.inp, cursor: 'pointer' }}>
                {SHIPMENT_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>
                Exchange rate <span style={{ color: '#9ca3af', fontWeight: 400 }}>(AED per 1 {currency})</span>
              </label>
              <input type="number" min={0} step="any" value={exchangeRate || ''}
                onChange={e => setRate(parseFloat(e.target.value) || 0)}
                disabled={currency === 'AED'}
                style={{ ...S.inp, backgroundColor: currency === 'AED' ? '#f1f5f9' : '#fff' }} />
            </div>
          </div>
        </div>

        {/* Lines */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ ...S.h, marginBottom: 0 }}>Product lines</div>
            <button type="button" onClick={() => setLines(p => [...p, emptyLine()])}
              style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={13} /> Add line
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lines.map((l, i) => {
              const gross = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
              const lineTotal = gross - gross * ((Number(l.discountPercent) || 0) / 100);
              return (
                <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '22px 110px 1.5fr 1fr 62px 70px 100px 62px 112px 28px', gap: 7, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>{i + 1}</span>
                  <input type="text" value={l.sku} onChange={e => updateLine(l.id, 'sku', e.target.value)}
                    placeholder="Item no" style={{ ...S.inp, fontSize: 12, fontFamily: 'ui-monospace, monospace' }} />
                  <input type="text" value={l.productName} onChange={e => updateLine(l.id, 'productName', e.target.value)}
                    placeholder="Product name" style={{ ...S.inp, fontSize: 12 }} />
                  <input type="text" value={l.modelName} onChange={e => updateLine(l.id, 'modelName', e.target.value)}
                    placeholder="Model" style={{ ...S.inp, fontSize: 12 }} />
                  <input type="number" min={1} step={1} value={l.quantity || ''}
                    onChange={e => updateLine(l.id, 'quantity', parseInt(e.target.value, 10) || 0)}
                    placeholder="Qty" style={{ ...S.inp, fontSize: 12 }} />
                  <select value={l.uom} onChange={e => updateLine(l.id, 'uom', e.target.value as UnitOfMeasure)}
                    style={{ ...S.inp, fontSize: 12, cursor: 'pointer' }}>
                    {UNITS_OF_MEASURE.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <input type="number" min={0} step="any" value={l.unitPrice || ''}
                    onChange={e => updateLine(l.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    placeholder="Unit price" style={{ ...S.inp, fontSize: 12 }} />
                  <input type="number" min={0} max={100} step="any" value={l.discountPercent || ''}
                    onChange={e => updateLine(l.id, 'discountPercent', Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                    placeholder="Disc%" style={{ ...S.inp, fontSize: 12 }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>
                    {moneyRaw(lineTotal, currency)}
                  </div>
                  <button type="button" disabled={lines.length === 1}
                    onClick={() => setLines(p => p.filter(x => x.id !== l.id))}
                    style={{ border: 'none', background: 'none', cursor: lines.length === 1 ? 'not-allowed' : 'pointer', color: lines.length === 1 ? '#e2e8f0' : '#cbd5e1', padding: 3 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{preview.totalQuantity} units</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{moneyRaw(preview.purchaseNet, currency)}</span>
          </div>
        </div>

        {/* Import charges */}
        <div style={S.card}>
          <div style={S.h}>Import charges <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 11 }}>(in {currency})</span></div>
          <div style={S.grid}>
            <div>
              <label style={S.label}>Freight</label>
              <input type="number" min={0} step="any" value={freightAmount || ''}
                onChange={e => setFreight(parseFloat(e.target.value) || 0)} placeholder="0.00" style={S.inp} />
            </div>
            <div>
              <label style={S.label}>Customs duty</label>
              <input type="number" min={0} step="any" value={customsAmount || ''}
                onChange={e => setCustoms(parseFloat(e.target.value) || 0)} placeholder="0.00" style={S.inp} />
            </div>
            <div>
              <label style={S.label}>Other import costs</label>
              <input type="number" min={0} step="any" value={otherCharges || ''}
                onChange={e => setOther(parseFloat(e.target.value) || 0)} placeholder="0.00" style={S.inp} />
            </div>
            <div>
              <label style={S.label}>Sales tax</label>
              <input type="number" min={0} step="any" value={salesTaxAmount || ''}
                onChange={e => setTax(parseFloat(e.target.value) || 0)} placeholder="0.00" style={S.inp} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={S.label}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Optional" style={{ ...S.inp, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        </div>

        {/* Live preview */}
        {preview.landedTotal > 0 && (
          <div style={{ ...S.card, backgroundColor: '#0f172a', border: 'none' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calculator size={13} /> Landed cost preview
            </div>
            {[
              ['Purchase cost',      preview.purchaseNetBase],
              ['Freight',            preview.freightBase],
              ['Customs duty',       preview.customsBase],
              ['Other import costs', preview.otherBase],
              ['Sales tax',          preview.taxBase],
            ].map(([label, val]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ fontSize: 12, color: '#cbd5e1' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{money(val as number)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #334155', marginTop: 8, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Total landed cost</span>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{money(preview.landedTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Average landed unit cost</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>{money(preview.averageLandedUnitCost)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', justifyContent: 'space-between' }}>
        <button type="button" onClick={() => navigate('/purchased-orders')}
          style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={15} /> Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          style={{ padding: '11px 28px', borderRadius: 8, border: 'none', backgroundColor: saving ? '#94a3b8' : '#0f172a', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          {saving
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
            : <><Check size={16} /> Create Shipment</>}
        </button>
      </div>
    </div>
  );
};
