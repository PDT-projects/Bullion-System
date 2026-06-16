// models/payableToFuturisticService.ts
//
// UPDATED: Now reads directly from `payable_to_futuristic` collection
// (written by futuristicPayableBridge.ts on invoice creation) instead of
// scanning the products collection. This is simpler, faster, and accurate.
//
// NEW: recordPayment() — marks a payable item as partially/fully paid.
// NEW: createManualPayable() — lets the user add a manual entry from the UI.

import {
  collection, doc, getDocs, getDoc,
  addDoc, updateDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import type { CurrencyAmounts } from './payableToFuturistic';
import { ZERO_AMOUNTS, aedToAllCurrencies } from './payableToFuturistic';

const PAYABLE_COLLECTION = 'payable_to_futuristic';

function nowISO(): string { return new Date().toISOString(); }

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DerivedPayable {
  productId:     string;
  modelName:     string;
  location:      string;
  invoiceId:     string | null;
  invoiceNumber: string | null;
  saleDate:      string | null;
  usdPrice:      number;
  amounts:       CurrencyAmounts;
  paidAmounts:   CurrencyAmounts;
  status:        'pending' | 'partial' | 'paid';
  description:   string;
  notes:         string;
  dueDate:       string;
  firestoreId:   string; // the payable_to_futuristic doc ID
}

export interface InvoicePayableSummary {
  invoiceId:     string;
  invoiceNumber: string;
  saleDate:      string | null;
  items:         DerivedPayable[];
  totalAmounts:  CurrencyAmounts;
  paidAmounts:   CurrencyAmounts;
  status:        'pending' | 'partial' | 'paid';
}

// ── Read all payables (grouped by invoice) ────────────────────────────────────
export async function fetchPayablesSummaryByInvoice(): Promise<InvoicePayableSummary[]> {
  const q    = query(collection(db, PAYABLE_COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);

  const items: DerivedPayable[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      firestoreId:   d.id,
      productId:     data.productId     || '',
      modelName:     data.modelName     || '',
      location:      data.location      || '',
      invoiceId:     data.invoiceId     || null,
      invoiceNumber: data.invoiceNumber || null,
      saleDate:      data.saleDate      || data.createdAt || null,
      usdPrice:      data.usdPrice      || 0,
      amounts:       data.amounts       || ZERO_AMOUNTS,
      paidAmounts:   data.paidAmounts   || ZERO_AMOUNTS,
      status:        data.status        || 'pending',
      description:   data.description   || data.modelName || '',
      notes:         data.notes         || '',
      dueDate:       data.dueDate       || '',
    };
  });

  // Group by invoiceId (manual entries without invoiceId grouped individually)
  const groups: Record<string, DerivedPayable[]> = {};
  for (const item of items) {
    const key = item.invoiceId ?? `manual-${item.firestoreId}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  return Object.entries(groups).map(([, groupItems]) => {
    const first = groupItems[0];

    const totalAmounts: CurrencyAmounts = groupItems.reduce(
      (acc, i) => ({
        aed: acc.aed + i.amounts.aed,
        pkr: acc.pkr + i.amounts.pkr,
        sar: acc.sar + i.amounts.sar,
        usd: acc.usd + i.amounts.usd,
      }),
      { aed: 0, pkr: 0, sar: 0, usd: 0 }
    );

    const paidAmounts: CurrencyAmounts = groupItems.reduce(
      (acc, i) => ({
        aed: acc.aed + i.paidAmounts.aed,
        pkr: acc.pkr + i.paidAmounts.pkr,
        sar: acc.sar + i.paidAmounts.sar,
        usd: acc.usd + i.paidAmounts.usd,
      }),
      { aed: 0, pkr: 0, sar: 0, usd: 0 }
    );

    const allPaid  = groupItems.every((i) => i.status === 'paid');
    const anyPaid  = groupItems.some((i) => i.status === 'paid' || i.status === 'partial');
    const status: 'pending' | 'partial' | 'paid' = allPaid ? 'paid' : anyPaid ? 'partial' : 'pending';

    return {
      invoiceId:     first.invoiceId    ?? first.firestoreId,
      invoiceNumber: first.invoiceNumber ?? 'Manual Entry',
      saleDate:      first.saleDate,
      items:         groupItems,
      totalAmounts,
      paidAmounts,
      status,
    };
  });
}

// ── Record a payment against a single payable item ────────────────────────────
export interface RecordPaymentPayload {
  /** Amount paid in AED — will be converted to all currencies */
  paidAed: number;
  notes?: string;
}

export async function recordPayment(firestoreId: string, payload: RecordPaymentPayload) {
  const ref  = doc(db, PAYABLE_COLLECTION, firestoreId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error(`Payable ${firestoreId} not found`);

  const data       = snap.data();
  const totalAed   = (data.amounts?.aed  ?? 0) as number;
  const alreadyAed = (data.paidAmounts?.aed ?? 0) as number;
  const newPaidAed = Math.min(alreadyAed + payload.paidAed, totalAed);

  const newPaidAmounts = aedToAllCurrencies(newPaidAed);
  const status: 'pending' | 'partial' | 'paid' =
    newPaidAed >= totalAed ? 'paid' : newPaidAed > 0 ? 'partial' : 'pending';

  await updateDoc(ref, {
    paidAmounts: newPaidAmounts,
    status,
    notes:     payload.notes ?? data.notes ?? '',
    updatedAt: nowISO(),
  });

  return { newPaidAmounts, status };
}

// ── Create a manual payable entry from the UI ─────────────────────────────────
export interface ManualPayablePayload {
  modelName:   string;
  description: string;
  amountAed:   number;       // user enters in AED
  dueDate:     string;
  notes?:      string;
  location?:   string;
}

export async function createManualPayable(payload: ManualPayablePayload) {
  const now     = nowISO();
  const amounts = aedToAllCurrencies(payload.amountAed);

  const data = {
    invoiceId:     null,
    invoiceNumber: null,
    productId:     '',
    modelName:     payload.modelName,
    brandName:     'Futuristic',
    location:      payload.location ?? '',
    description:   payload.description,
    amounts,
    usdPrice:      amounts.usd,
    paidAmounts:   ZERO_AMOUNTS,
    status:        'pending' as const,
    dueDate:       payload.dueDate,
    notes:         payload.notes ?? '',
    createdAt:     now,
    updatedAt:     now,
    saleDate:      now.split('T')[0],
    isManual:      true,
  };

  const ref = await addDoc(collection(db, PAYABLE_COLLECTION), data);
  return { id: ref.id, ...data };
}

// ── Legacy / manual CRUD (kept for compatibility) ─────────────────────────────
export async function fetchAllPayables() {
  const q    = query(collection(db, PAYABLE_COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchPayableById(id: string) {
  const snap = await getDoc(doc(db, PAYABLE_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export interface CreatePayablePayload {
  description: string;
  amounts:     CurrencyAmounts;
  dueDate:     string;
  notes?:      string;
}

export async function createPayable(payload: CreatePayablePayload) {
  const now  = nowISO();
  const data = {
    description: payload.description,
    modelName:   '',
    productId:   '',
    amounts:     payload.amounts,
    paidAmounts: ZERO_AMOUNTS,
    status:      'pending' as const,
    dueDate:     payload.dueDate,
    notes:       payload.notes ?? '',
    createdAt:   now,
    updatedAt:   now,
  };
  const ref = await addDoc(collection(db, PAYABLE_COLLECTION), data);
  return { id: ref.id, ...data };
}

export interface UpdatePayablePayload {
  description?: string;
  amounts?:     CurrencyAmounts;
  paidAmounts?: CurrencyAmounts;
  status?:      'pending' | 'partial' | 'paid';
  dueDate?:     string;
  notes?:       string;
}

export async function updatePayable(id: string, payload: UpdatePayablePayload) {
  await updateDoc(doc(db, PAYABLE_COLLECTION, id), { ...payload, updatedAt: nowISO() });
}

export async function deletePayable(id: string) {
  await deleteDoc(doc(db, PAYABLE_COLLECTION, id));
}