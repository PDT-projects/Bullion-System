// Purchased Orders — Firestore access layer
//
// Collection: purchasedOrders
//
// Lines are stored on the shipment document rather than in a subcollection.
// A consignment carries tens of lines, not thousands, and they are always read
// and written together — a subcollection would cost an extra round trip per
// shipment on the list screen for no benefit.

import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { Shipment, CreateShipmentDTO, UpdateShipmentDTO } from './types';
import { validateShipment } from './purchasedOrderService';

const COLLECTION = 'purchasedOrders';

/** Firestore rejects undefined. Strip before every write. */
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function toShipment(d: any): Shipment {
  const x = d.data();
  return {
    id: d.id,
    shipmentNumber:     x.shipmentNumber     || '',
    brandId:            x.brandId            || undefined,
    brandName:          x.brandName          || '',
    supplierName:       x.supplierName       || '',
    originCountry:      x.originCountry      || '',
    destinationCountry: x.destinationCountry || 'UAE',
    orderDate:          x.orderDate          || '',
    shipmentDate:       x.shipmentDate       || undefined,
    expectedArrivalDate:x.expectedArrivalDate|| undefined,
    actualArrivalDate:  x.actualArrivalDate  || undefined,
    shipMethod:         x.shipMethod         || undefined,
    trackingNumber:     x.trackingNumber     || undefined,
    currency:           x.currency           || 'AED',
    exchangeRate:       Number(x.exchangeRate) > 0 ? Number(x.exchangeRate) : 1,
    status:             x.status             || 'Draft',
    customsStatus:      x.customsStatus      || 'Not Applied',
    freightStatus:      x.freightStatus      || 'Not Applied',
    costingStatus:      x.costingStatus      || 'Pending',
    freightTerms:       x.freightTerms       || undefined,
    supplierOrderNumber:x.supplierOrderNumber || undefined,
    freightAmount:      Number(x.freightAmount)  || 0,
    customsAmount:      Number(x.customsAmount)  || 0,
    otherCharges:       Number(x.otherCharges)   || 0,
    salesTaxAmount:     Number(x.salesTaxAmount) || 0,
    // Older documents predate sku/uom/discount/received. Default them here so
    // every consumer sees a complete line and no screen has to guard for gaps.
    lines: (Array.isArray(x.lines) ? x.lines : []).map((l: any) => ({
      id:               l.id || Math.random().toString(36).slice(2),
      sku:              l.sku              || '',
      productName:      l.productName      || '',
      modelName:        l.modelName        || '',
      uom:              l.uom              || 'EA',
      quantity:         Number(l.quantity)         || 0,
      unitPrice:        Number(l.unitPrice)        || 0,
      discountPercent:  Number(l.discountPercent)  || 0,
      receivedQuantity: Number(l.receivedQuantity) || 0,
      linkedProductId:  l.linkedProductId  || undefined,
    })),
    notes:              x.notes               || undefined,
    createdAt:          x.createdAt           || '',
    updatedAt:          x.updatedAt           || '',
    createdBy:          x.createdBy           || undefined,
  };
}

export class PurchasedOrderFirebaseService {
  static async fetchAll(): Promise<Shipment[]> {
    try {
      const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')));
      const out: Shipment[] = [];
      snap.forEach(d => out.push(toShipment(d)));
      console.log(`[PO] fetched ${out.length} shipments`);
      return out;
    } catch (err) {
      // Logged, not swallowed. An empty list and a permission error look
      // identical on screen otherwise.
      console.error('[PO] fetchAll failed:', err);
      throw new Error('Failed to load shipments');
    }
  }

  static async fetchById(id: string): Promise<Shipment | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION, id));
      return snap.exists() ? toShipment(snap) : null;
    } catch (err) {
      console.error('[PO] fetchById failed:', err);
      throw new Error('Failed to load shipment');
    }
  }

  /**
   * The same validation the form runs is repeated here on purpose: this is the
   * last point before the write, and it is reachable without the form.
   */
  static async create(dto: CreateShipmentDTO): Promise<Shipment> {
    const v = validateShipment(dto);
    if (!v.isValid) throw new Error(v.errors[0]);

    const existing = await PurchasedOrderFirebaseService.fetchAll();
    const clash = existing.find(
      s => s.shipmentNumber.trim().toLowerCase() === dto.shipmentNumber.trim().toLowerCase(),
    );
    if (clash) throw new Error(`Shipment number "${dto.shipmentNumber}" already exists`);

    const now  = new Date().toISOString();
    const data = stripUndefined({ ...dto, createdAt: now, updatedAt: now });
    const ref  = await addDoc(collection(db, COLLECTION), data);
    console.log('[PO] created', ref.id);
    return { ...(data as any), id: ref.id } as Shipment;
  }

  static async update(id: string, dto: UpdateShipmentDTO): Promise<void> {
    // Partial updates only carry the fields being changed, so validate the
    // merged document rather than the patch on its own.
    const current = await PurchasedOrderFirebaseService.fetchById(id);
    if (!current) throw new Error('Shipment not found');
    const v = validateShipment({ ...current, ...dto });
    if (!v.isValid) throw new Error(v.errors[0]);

    await updateDoc(doc(db, COLLECTION, id), stripUndefined({
      ...dto, updatedAt: new Date().toISOString(),
    }));
    console.log('[PO] updated', id);
  }

  /** Status-only patch — skips full validation so a workflow click is one write. */
  static async patchStatus(id: string, patch: UpdateShipmentDTO): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), stripUndefined({
      ...patch, updatedAt: new Date().toISOString(),
    }));
  }

  static async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
    console.log('[PO] deleted', id);
  }
}
