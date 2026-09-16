// Late Shipment Charge Allocation
//
// THE PROBLEM: a shipment's per-unit landed cost (which bakes in import
// charges) is calculated using each line's proportional share of the
// shipment's total value, but that calculation only ever runs ONCE, at
// stock-in time, and gets snapshotted onto each serial. It never re-runs
// later. So when a charge arrives after stock-in:
//   - If a line still has unsold units, its share of the new charge has
//     nowhere to land — the already-stocked serials' cost never moves.
//   - If a line's units are already ALL sold, its share has nowhere to
//     land at all — not even a serial to update.
//
// THE FIX (this file): whenever a charge is added, this walks every line
// of the shipment, computes that line's value-proportional share of the
// NEW charge (the exact same "share" formula the costing engine already
// uses), and for each line:
//   - If it still has unsold serials: adds that line's share, split evenly
//     across just the unsold serials, on top of whatever cost they already
//     carry (topUpSerialCosts). Already-sold serials from the same line are
//     left untouched — their invoice already recorded a real number.
//   - If every serial from that line is already sold: creates a small
//     dummy Product carrying exactly that line's share, and immediately
//     sells it via a $0-revenue, clearly-labelled internal invoice, so the
//     cost still reaches Purchase Cost / COGS through the same pipeline a
//     real sale uses.
// A single new charge can do both at once if a shipment has multiple lines
// in different states — each line is handled independently.

import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { InventoryFirebaseService } from '../../inventory/models/InventoryFirebaseService';
import { InvoiceFirebaseService } from '../../invoices/models/InvoiceFirebaseService';
import { calculateShipmentCosting } from './purchasedOrderService';
import type { Shipment } from './types';

const PRODUCTS_COLLECTION = 'products';

async function generateAdjustmentInvoiceNumber(): Promise<string> {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const today = `${dd}${mm}${yy}`;
  const counterRef = doc(db, 'invoiceCounters', 'adjustments');
  const seq = await runTransaction(db, async tx => {
    const snap = await tx.get(counterRef);
    if (!snap.exists() || snap.data().date !== today) {
      tx.set(counterRef, { date: today, seq: 1 });
      return 1;
    }
    const next = (snap.data().seq as number) + 1;
    tx.update(counterRef, { seq: next });
    return next;
  });
  return `ADJ-${today}-${String(seq).padStart(3, '0')}`;
}

async function createDummyAdjustment(
  shipment: Shipment,
  lineLabel: string,
  amount: number,
  chargeDescription: string,
): Promise<string> {
  const now = new Date().toISOString();
  const serial = `ADJ-${shipment.id.slice(0, 8)}-${Date.now().toString(36)}`;
  const shipLabel = shipment.shipmentNumber || shipment.id;
  const note = `Auto-generated: absorbs AED ${amount.toFixed(2)} in import charges ` +
    `(${chargeDescription || 'no description'}) allocated to "${lineLabel}" on Shipment ${shipLabel}, ` +
    `whose stock was already fully sold. Keeps the true landed cost reflected in profit reporting.`;

  const product = await InventoryFirebaseService.createProduct({
    brandName: 'System',
    modelName: `Import Charge Adjustment (${lineLabel})`,
    category: 'Adjustment',
    sellPrice: 0,
    costPrice: amount,
    buyType: 'Import',
    warrantyYears: 0,
    stock: 1,
    serialNumbers: [serial],
    serialCities: {},
    description: note,
    status: 'Available',
    isDamaged: false,
    ownershipType: 'Owned',
    serialCostPrice: { [serial]: amount },
    serialShipmentId: { [serial]: shipment.id },
  });

  const invoiceNumber = await generateAdjustmentInvoiceNumber();

  await InvoiceFirebaseService.createInvoice({
    invoiceNumber,
    date: now.slice(0, 10),
    customerName: 'Internal - Import Charge Adjustment',
    customerPhone: '-',
    customerCNIC: '-',
    customerProvince: '-',
    customerCity: '-',
    products: [{
      id: `${product.id}-line`,
      productId: product.id,
      productName: `${product.brandName} ${product.modelName}`,
      brandName: product.brandName,
      modelName: product.modelName,
      category: product.category,
      description: note,
      quantity: 1,
      price: 0,
      total: 0,
      serialNumbers: [serial],
      currency: 'AED',
      purchaseCost: amount,
    }],
    exchangeWarrantyNote: note,
    deliveryStatus: 'Self-collect',
    status: 'Paid',
    deductionCharges: 0,
  } as any);

  await InventoryFirebaseService.markSerialsSold(
    product.id,
    [{ serial, invoiceNumber, soldDate: now, paymentStatus: 'Paid' }],
    now,
  );

  return invoiceNumber;
}

export interface ChargeAllocationResult {
  /** Invoice numbers of any dummy adjustment invoices created (one per
   *  fully-sold line that needed one). Empty if every line still had stock. */
  adjustmentInvoiceNumbers: string[];
  /** How many already-stocked, not-yet-sold serials had their recorded
   *  cost topped up to include a share of the new charge. */
  serialsToppedUp: number;
}

/**
 * Call after successfully adding a charge to a shipment. Walks every line,
 * gives each its value-proportional share of the new charge (matching the
 * shipment's own costing formula), and routes that share to wherever it
 * needs to go — topped up onto unsold stock, or absorbed via a dummy
 * adjustment invoice if that line has nothing left to carry it.
 */
export async function allocateNewChargeAcrossShipment(
  shipment: Shipment,
  chargeAmount: number,
  chargeDescription: string,
): Promise<ChargeAllocationResult> {
  const result: ChargeAllocationResult = { adjustmentInvoiceNumbers: [], serialsToppedUp: 0 };
  const lines = shipment.lines || [];
  if (lines.length === 0 || !(chargeAmount > 0)) return result;

  // Reuse the shipment's own costing engine to get each line's exact value
  // share — the same number that decided how the ORIGINAL charges split.
  const costing = calculateShipmentCosting(shipment);
  const costedByLineId = new Map(costing.lines.map(c => [c.id, c]));

  for (const line of lines) {
    const costedLine = costedByLineId.get(line.id);
    const share = costedLine?.share ?? 0;
    const lineAmount = chargeAmount * share;
    if (!(lineAmount > 0)) continue;

    const lineLabel = `${line.productName} ${line.modelName}`.trim();

    if (!line.linkedProductId) {
      // Not stocked in yet — nothing to do. The live costing engine will
      // pick up this charge automatically (it reads charges[] fresh) the
      // next time this line is stocked in, same as always.
      continue;
    }

    try {
      const snap = await getDoc(doc(db, PRODUCTS_COLLECTION, line.linkedProductId));
      if (!snap.exists()) continue;
      const p = snap.data() as any;
      const serialNumbers: string[] = p.serialNumbers || [];
      const serialStatus: Record<string, string> = p.serialStatus || {};
      const unsold = serialNumbers.filter(s => serialStatus[s] !== 'Sold');

      if (unsold.length > 0) {
        const perUnit = lineAmount / unsold.length;
        const additions: Record<string, number> = {};
        unsold.forEach(s => { additions[s] = perUnit; });
        await InventoryFirebaseService.topUpSerialCosts(line.linkedProductId, additions);
        result.serialsToppedUp += unsold.length;
      } else if (serialNumbers.length > 0) {
        // Every serial from this line is already sold — nothing left to
        // carry this line's share, so absorb it via a dummy adjustment.
        const invNo = await createDummyAdjustment(shipment, lineLabel, lineAmount, chargeDescription);
        result.adjustmentInvoiceNumbers.push(invNo);
      }
    } catch (err) {
      console.error(`[allocateNewChargeAcrossShipment] failed for line "${lineLabel}":`, err);
      // Don't let one bad line stop the others.
    }
  }

  return result;
}
