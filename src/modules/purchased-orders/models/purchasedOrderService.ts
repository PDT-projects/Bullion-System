// Purchased Orders — business logic layer
//
// Pure functions only. No Firestore, no React. The costing engine, the display
// conversion, the priority rule and the validators all live here so the same
// numbers come out on a card, a detail page or an export, and so they can be
// tested without a browser.

import {
  Shipment, CostedLine, ShipmentCosting, ShipmentSummary, ShipmentFilters,
  ShipmentLine, DisplayCurrency, UnitOfMeasure,
} from './types';

// ── Currency ──────────────────────────────────────────────────────────────────

/**
 * Units of each currency per 1 AED, used for DISPLAY ONLY.
 *
 * These never touch stored data. A shipment's own `exchangeRate` — frozen on
 * the document at entry — is what converts the supplier invoice into AED. If
 * these display rates drift, a closed shipment's AED figures stay exactly as
 * they were; only the on-screen conversion moves.
 */
export const DISPLAY_RATES: Record<DisplayCurrency, number> = {
  AED: 1,
  USD: 1 / 3.67,
  EUR: 1 / 3.95,
  GBP: 1 / 4.62,
  SAR: 1.02,
  PKR: 279.5 / 3.67,
};

export const CURRENCY_SYMBOL: Record<DisplayCurrency, string> = {
  AED: 'AED', USD: 'USD', EUR: 'EUR', GBP: 'GBP', SAR: 'SAR', PKR: 'PKR',
};

/**
 * Round to 2dp ONCE, at the end.
 *
 * Intermediate values stay at full precision deliberately. Rounding each
 * allocation as it is computed lets the error accumulate, and the per-line
 * landed costs then stop summing to the shipment total — the exact drift that
 * makes an import costing sheet untrustworthy.
 */
export const round2 = (n: number): number =>
  Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;

/** Convert a stored AED figure into the currency the user is viewing. */
export const convertForDisplay = (aed: number, to: DisplayCurrency): number =>
  round2(aed * (DISPLAY_RATES[to] ?? 1));

const fmt = (n: number, min = 2) =>
  round2(n).toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: 2 });

/** Format a stored AED figure in the viewing currency. */
export const money = (aed: number, to: DisplayCurrency = 'AED'): string =>
  `${CURRENCY_SYMBOL[to]} ${fmt(convertForDisplay(aed, to))}`;

/** Format a figure that is already in the shipment's own invoice currency. */
export const moneyRaw = (n: number, code: string): string => `${code} ${fmt(n)}`;

export const pct = (n: number): string => `${(n * 100).toFixed(3)}%`;

// ── Costing engine ────────────────────────────────────────────────────────────

/**
 * Compute the landed cost of a shipment and of every line in it, in AED.
 *
 *   grossTotal_i     = quantity_i x unitPrice_i                (invoice currency)
 *   netTotal_i       = grossTotal_i - discount_i
 *   netTotalBase_i   = netTotal_i x exchangeRate               (AED)
 *   share_i          = netTotalBase_i / purchaseNetBase
 *   freightShare_i   = freightBase x share_i
 *   customsShare_i   = customsBase x share_i
 *   otherShare_i     = (otherBase + taxBase) x share_i
 *   landedTotal_i    = netTotalBase_i + the three shares
 *   landedUnitCost_i = landedTotal_i / quantity_i
 *
 * The shares sum to 1, so the line landed totals sum back to the shipment
 * landed total. `reconciles` asserts that closure on every call — the
 * spreadsheet this replaces had no such check, so a broken formula could sit
 * unnoticed.
 *
 * Degenerate case: when the purchase total is zero (every line free, or none
 * priced) there is no value to allocate against. Splitting equally would
 * silently invent a rule the business never agreed to, so import costs are left
 * unallocated and the shipment total still reports them.
 */
export function calculateShipmentCosting(s: Pick<
  Shipment,
  'lines' | 'exchangeRate' | 'freightAmount' | 'customsAmount' | 'otherCharges' | 'salesTaxAmount' | 'currency'
>): ShipmentCosting {
  const rate  = Number(s.exchangeRate) > 0 ? Number(s.exchangeRate) : 1;
  const cur   = s.currency || 'AED';
  const lines = Array.isArray(s.lines) ? s.lines : [];

  const freightBase = (Number(s.freightAmount)  || 0) * rate;
  const customsBase = (Number(s.customsAmount)  || 0) * rate;
  const otherBase   = (Number(s.otherCharges)   || 0) * rate;
  const taxBase     = (Number(s.salesTaxAmount) || 0) * rate;
  const spreadBase  = otherBase + taxBase;

  let purchaseGross = 0;
  let discountTotal = 0;
  lines.forEach(l => {
    const g = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
    purchaseGross += g;
    discountTotal += g * ((Number(l.discountPercent) || 0) / 100);
  });
  const purchaseNet     = purchaseGross - discountTotal;
  const purchaseNetBase = purchaseNet * rate;

  const totalQuantity = lines.reduce((a, l) => a + (Number(l.quantity) || 0), 0);
  const totalReceived = lines.reduce((a, l) => a + (Number(l.receivedQuantity) || 0), 0);

  const costed: CostedLine[] = lines.map(l => {
    const qty   = Number(l.quantity)  || 0;
    const price = Number(l.unitPrice) || 0;
    const disc  = Number(l.discountPercent) || 0;
    const recvd = Number(l.receivedQuantity) || 0;

    const grossTotal     = qty * price;
    const discountAmount = grossTotal * (disc / 100);
    const netTotal       = grossTotal - discountAmount;
    const netTotalBase   = netTotal * rate;
    const share          = purchaseNetBase > 0 ? netTotalBase / purchaseNetBase : 0;

    const freightShare = freightBase * share;
    const customsShare = customsBase * share;
    const otherShare   = spreadBase  * share;
    const landedTotal  = netTotalBase + freightShare + customsShare + otherShare;

    return {
      ...l,
      grossTotal:      round2(grossTotal),
      discountAmount:  round2(discountAmount),
      netTotal:        round2(netTotal),
      netTotalBase:    round2(netTotalBase),
      share,
      freightShare:    round2(freightShare),
      customsShare:    round2(customsShare),
      otherShare:      round2(otherShare),
      dutyPerUnit:     qty > 0 ? round2(customsShare / qty) : 0,
      freightPerUnit:  qty > 0 ? round2(freightShare / qty) : 0,
      unitPriceBase:   round2(price * (1 - disc / 100) * rate),
      landedTotal:     round2(landedTotal),
      landedUnitCost:  qty > 0 ? round2(landedTotal / qty) : 0,
      remainingQuantity: Math.max(0, qty - recvd),
      formulas: {
        grossTotal:     `Gross = Qty x Unit price\n= ${qty} x ${fmt(price)} ${cur}\n= ${fmt(grossTotal)} ${cur}`,
        discountAmount: `Discount = Gross x Disc%\n= ${fmt(grossTotal)} x ${disc}%\n= ${fmt(discountAmount)} ${cur}`,
        netTotal:       `Net = Gross - Discount\n= ${fmt(grossTotal)} - ${fmt(discountAmount)}\n= ${fmt(netTotal)} ${cur}`,
        netTotalBase:   `Net in AED = Net x Exchange rate\n= ${fmt(netTotal)} ${cur} x ${rate}\n= AED ${fmt(netTotalBase)}`,
        share:          `Share = this line's net AED / shipment net AED\n= ${fmt(netTotalBase)} / ${fmt(purchaseNetBase)}\n= ${pct(share)}`,
        customsShare:   `Customs on this line = Customs total x Share\n= AED ${fmt(customsBase)} x ${pct(share)}\n= AED ${fmt(customsShare)}`,
        freightShare:   `Freight on this line = Freight total x Share\n= AED ${fmt(freightBase)} x ${pct(share)}\n= AED ${fmt(freightShare)}`,
        otherShare:     `Other + tax on this line = (Other + Tax) x Share\n= AED ${fmt(spreadBase)} x ${pct(share)}\n= AED ${fmt(otherShare)}`,
        dutyPerUnit:    `Customs per unit = Customs on line / Qty\n= ${fmt(customsShare)} / ${qty}\n= AED ${fmt(qty ? customsShare / qty : 0)}`,
        freightPerUnit: `Freight per unit = Freight on line / Qty\n= ${fmt(freightShare)} / ${qty}\n= AED ${fmt(qty ? freightShare / qty : 0)}`,
        landedTotal:    `Landed = Net AED + Customs + Freight + Other\n= ${fmt(netTotalBase)} + ${fmt(customsShare)} + ${fmt(freightShare)} + ${fmt(otherShare)}\n= AED ${fmt(landedTotal)}`,
        landedUnitCost: `Landed per unit = Landed / Qty\n= ${fmt(landedTotal)} / ${qty}\n= AED ${fmt(qty ? landedTotal / qty : 0)}`,
        remainingQuantity: `Remaining = Ordered - Received\n= ${qty} - ${recvd}\n= ${Math.max(0, qty - recvd)} ${l.uom || 'EA'}`,
      },
    };
  });

  const landedTotal = purchaseNetBase + freightBase + customsBase + spreadBase;
  const lineSum     = costed.reduce((a, l) => a + l.landedTotal, 0);

  return {
    purchaseGross:   round2(purchaseGross),
    discountTotal:   round2(discountTotal),
    purchaseNet:     round2(purchaseNet),
    purchaseNetBase: round2(purchaseNetBase),
    freightBase:     round2(freightBase),
    customsBase:     round2(customsBase),
    otherBase:       round2(otherBase),
    taxBase:         round2(taxBase),
    landedTotal:     round2(landedTotal),
    totalQuantity,
    totalReceived,
    averageLandedUnitCost: totalQuantity > 0 ? round2(landedTotal / totalQuantity) : 0,
    // Tolerance of 1 fils absorbs 2dp rounding on the individual lines;
    // anything larger is a real arithmetic fault, not a rounding artefact.
    reconciles: Math.abs(lineSum - landedTotal) < 0.02,
    lines: costed,
    formulas: {
      purchaseNet:     `Net purchase = Gross - Discounts\n= ${fmt(purchaseGross)} - ${fmt(discountTotal)}\n= ${fmt(purchaseNet)} ${cur}`,
      purchaseNetBase: `Net purchase in AED = Net x Exchange rate\n= ${fmt(purchaseNet)} ${cur} x ${rate}\n= AED ${fmt(purchaseNetBase)}`,
      freightBase:     `Freight in AED = Freight x Exchange rate\n= ${fmt(Number(s.freightAmount) || 0)} ${cur} x ${rate}\n= AED ${fmt(freightBase)}`,
      customsBase:     `Customs in AED = Customs x Exchange rate\n= ${fmt(Number(s.customsAmount) || 0)} ${cur} x ${rate}\n= AED ${fmt(customsBase)}`,
      otherBase:       `Other charges in AED = Other x Exchange rate\n= ${fmt(Number(s.otherCharges) || 0)} ${cur} x ${rate}\n= AED ${fmt(otherBase)}`,
      taxBase:         `Tax in AED = Tax x Exchange rate\n= ${fmt(Number(s.salesTaxAmount) || 0)} ${cur} x ${rate}\n= AED ${fmt(taxBase)}`,
      landedTotal:     `Total landed = Net purchase + Freight + Customs + Other + Tax\n= ${fmt(purchaseNetBase)} + ${fmt(freightBase)} + ${fmt(customsBase)} + ${fmt(otherBase)} + ${fmt(taxBase)}\n= AED ${fmt(landedTotal)}`,
      averageLandedUnitCost: `Average landed per unit = Total landed / Total qty\n= ${fmt(landedTotal)} / ${totalQuantity}\n= AED ${fmt(totalQuantity ? landedTotal / totalQuantity : 0)}\n\nBlended figure. Use the per-line landed unit cost for valuation.`,
      reconciles:      `Closure check\nSum of line landed totals = AED ${fmt(lineSum)}\nShipment landed total     = AED ${fmt(landedTotal)}\nDifference = ${fmt(Math.abs(lineSum - landedTotal))}`,
    },
  };
}

// ── Priority ──────────────────────────────────────────────────────────────────

/**
 * Lower sorts first. The ordering follows what needs a human next, not what is
 * furthest along: a shipment sitting in the warehouse with unfinished costing
 * is the most urgent thing on the page, because the stock is sellable but its
 * cost is unknown, so every sale from it books an unreliable margin.
 */
export function shipmentPriority(s: Shipment): number {
  if (s.status === 'Cancelled') return 99;
  if (s.status === 'Received Into Inventory') return 90;

  const arrived = !!s.actualArrivalDate || s.status === 'Arrived' || s.status === 'Customs Cleared';
  const customs = s.customsStatus === 'Applied';
  const freight = s.freightStatus === 'Applied';
  const costed  = s.costingStatus === 'Complete';

  if (arrived && customs && freight && !costed) return 1;
  if (arrived && customs && !freight)           return 2;
  if (arrived && !customs)                      return 3;
  if (arrived && costed)                        return 4;
  return 5;
}

export const PRIORITY_LABEL: Record<number, string> = {
  1: 'Costing due', 2: 'Freight due', 3: 'Customs due',
  4: 'Ready', 5: 'In transit', 90: 'Received', 99: 'Cancelled',
};

// ── Workflow ──────────────────────────────────────────────────────────────────

export interface WorkflowStage { label: string; state: 'Completed' | 'Pending' }

/** Every stage is derived from a stored field, never a separate display flag. */
export function shipmentWorkflow(s: Shipment): WorkflowStage[] {
  const done = (b: boolean): WorkflowStage['state'] => (b ? 'Completed' : 'Pending');
  const arrived = !!s.actualArrivalDate || ['Arrived', 'Customs Cleared', 'Costing Complete', 'Received Into Inventory'].includes(s.status);
  const received = (s.lines || []).some(l => (Number(l.receivedQuantity) || 0) > 0);
  const allReceived = (s.lines || []).length > 0
    && (s.lines || []).every(l => (Number(l.receivedQuantity) || 0) >= (Number(l.quantity) || 0));

  return [
    { label: 'Purchase order',   state: done(!!s.orderDate) },
    { label: 'Dispatched',       state: done(!!s.shipmentDate) },
    { label: 'Arrived',          state: done(arrived) },
    { label: 'Customs cleared',  state: done(s.customsStatus === 'Applied') },
    { label: 'Freight applied',  state: done(s.freightStatus === 'Applied') },
    { label: 'Costing complete', state: done(s.costingStatus === 'Complete') },
    { label: 'Goods received',   state: done(received) },
    { label: 'Fully received',   state: done(allReceived) },
  ];
}

// ── Validation ────────────────────────────────────────────────────────────────

export interface ValidationResult { isValid: boolean; errors: string[] }

/**
 * Validated here rather than in the form so a direct service call cannot skip
 * it. Numeric guards use Number.isFinite, which rejects NaN and Infinity —
 * `> 0` alone lets Infinity through.
 */
export function validateShipment(s: Partial<Shipment>): ValidationResult {
  const errors: string[] = [];
  const num = (v: any) => Number(v);

  if (!s.shipmentNumber?.trim()) errors.push('Shipment number is required');
  if (!s.brandName?.trim())      errors.push('Brand is required');
  if (!s.supplierName?.trim())   errors.push('Supplier is required');
  if (!s.originCountry?.trim())  errors.push('Origin country is required');
  if (!s.orderDate?.trim())      errors.push('Order date is required');
  if (!s.currency)               errors.push('Currency is required');

  const rate = num(s.exchangeRate);
  if (!Number.isFinite(rate) || rate <= 0) errors.push('Exchange rate must be greater than 0');
  if (s.currency === 'AED' && rate !== 1)  errors.push('Exchange rate must be 1 when the invoice currency is AED');

  (['freightAmount', 'customsAmount', 'otherCharges', 'salesTaxAmount'] as const).forEach(k => {
    const v = num(s[k]);
    const label = k.replace('Amount', '').replace('Charges', ' charges');
    if (!Number.isFinite(v) || v < 0) errors.push(`${label} cannot be negative`);
  });

  // A shipment cannot leave before it was ordered, or arrive before it left.
  if (s.orderDate && s.shipmentDate && s.shipmentDate < s.orderDate)
    errors.push('Dispatch date cannot be before the order date');
  if (s.shipmentDate && s.actualArrivalDate && s.actualArrivalDate < s.shipmentDate)
    errors.push('Arrival date cannot be before the dispatch date');

  const lines = s.lines || [];
  if (lines.length === 0) errors.push('Add at least one product line');

  const seen = new Set<string>();
  lines.forEach((l, i) => {
    const n = i + 1;
    if (!l.productName?.trim()) errors.push(`Line ${n}: product name is required`);

    const key = (l.sku || '').trim().toLowerCase();
    if (key) {
      if (seen.has(key)) errors.push(`Line ${n}: item number "${l.sku}" appears more than once`);
      seen.add(key);
    }

    const q = num(l.quantity);
    const p = num(l.unitPrice);
    const d = num(l.discountPercent);
    const r = num(l.receivedQuantity);

    if (!Number.isFinite(q) || q <= 0)      errors.push(`Line ${n}: quantity must be greater than 0`);
    else if (!Number.isInteger(q))          errors.push(`Line ${n}: quantity must be a whole number`);
    if (!Number.isFinite(p) || p < 0)       errors.push(`Line ${n}: unit price cannot be negative`);
    if (!Number.isFinite(d) || d < 0 || d > 100) errors.push(`Line ${n}: discount must be between 0 and 100`);
    if (!Number.isFinite(r) || r < 0)       errors.push(`Line ${n}: received quantity cannot be negative`);
    if (Number.isFinite(r) && Number.isFinite(q) && r > q)
      errors.push(`Line ${n}: received (${r}) cannot exceed ordered (${q})`);
  });

  return { isValid: errors.length === 0, errors };
}

// ── Filtering, summary, numbering ─────────────────────────────────────────────

export function filterShipments(list: Shipment[], f: ShipmentFilters): Shipment[] {
  const q = (f.search || '').trim().toLowerCase();
  return list.filter(s => {
    if (f.brand   && f.brand   !== 'ALL' && s.brandName !== f.brand)         return false;
    if (f.status  && f.status  !== 'ALL' && s.status !== f.status)           return false;
    if (f.costing && f.costing !== 'ALL' && s.costingStatus !== f.costing)   return false;
    if (!q) return true;
    const hay = [s.shipmentNumber, s.supplierOrderNumber, s.brandName, s.supplierName,
                 s.trackingNumber, s.originCountry,
                 ...(s.lines || []).flatMap(l => [l.sku, l.productName, l.modelName])];
    return hay.some(v => (v || '').toLowerCase().includes(q));
  });
}

export function summariseShipments(list: Shipment[]): ShipmentSummary {
  const live = list.filter(s => s.status !== 'Cancelled');
  const partial = live.filter(s => {
    const c = calculateShipmentCosting(s);
    return c.totalReceived > 0 && c.totalReceived < c.totalQuantity;
  }).length;
  return {
    total:             live.length,
    inTransit:         live.filter(s => s.status === 'In Transit' || s.status === 'Dispatched').length,
    arrived:           live.filter(s => !!s.actualArrivalDate || s.status === 'Arrived').length,
    pendingCustoms:    live.filter(s => s.customsStatus !== 'Applied').length,
    pendingFreight:    live.filter(s => s.freightStatus !== 'Applied').length,
    pendingCosting:    live.filter(s => s.costingStatus !== 'Complete').length,
    partiallyReceived: partial,
    landedValue:       round2(live.reduce((a, s) => a + calculateShipmentCosting(s).landedTotal, 0)),
  };
}

/** SHP-<BRAND>-<YY>-<NNN>, e.g. SHP-NOKTA-26-004. */
export function suggestShipmentNumber(brandName: string, existing: Shipment[]): string {
  const brand = (brandName || 'GEN').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'GEN';
  const yy     = String(new Date().getFullYear()).slice(-2);
  const prefix = `SHP-${brand}-${yy}-`;
  const used = existing
    .filter(s => s.shipmentNumber?.startsWith(prefix))
    .map(s => parseInt(s.shipmentNumber.slice(prefix.length), 10))
    .filter(n => Number.isFinite(n));
  return `${prefix}${String((used.length ? Math.max(...used) : 0) + 1).padStart(3, '0')}`;
}

export const emptyLine = (): ShipmentLine => ({
  id: Math.random().toString(36).slice(2),
  sku: '', productName: '', modelName: '',
  uom: 'EA' as UnitOfMeasure,
  quantity: 1, unitPrice: 0, discountPercent: 0, receivedQuantity: 0,
});
