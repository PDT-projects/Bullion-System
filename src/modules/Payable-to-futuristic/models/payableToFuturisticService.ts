// models/payableToFuturisticService.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import type { PayableToFuturistic, CurrencyAmounts } from './payableToFuturistic';
import {
  getFuturisticPrice,
  usdToAllCurrencies,
  ZERO_AMOUNTS,
} from './payableToFuturistic';

const PAYABLE_COLLECTION = 'payable_to_futuristic';
const PRODUCTS_COLLECTION = 'products';
const INVOICES_COLLECTION = 'invoices';

function nowISO(): string {
  return new Date().toISOString();
}

// ── Fetch payables from Firestore manual collection ──────────────────────────
export async function fetchAllPayables(): Promise<PayableToFuturistic[]> {
  const q = query(collection(db, PAYABLE_COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PayableToFuturistic));
}

// ── Core: derive payables from products (brand = Futuristic, sold) ───────────
export interface DerivedPayable {
  productId: string;
  modelName: string;
  location: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  saleDate: string | null;
  usdPrice: number;
  amounts: CurrencyAmounts;
  paidAmounts: CurrencyAmounts;
  status: PayableToFuturistic['status'];
}

export async function fetchFuturisticPayablesFromProducts(): Promise<DerivedPayable[]> {
  // 1. Get all Futuristic products
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('brandName', '==', 'Futuristic')
  );
  const snap = await getDocs(q);

  // 2. For each product, build a payable entry
  const results: DerivedPayable[] = [];

  // Batch fetch invoices we encounter
  const invoiceCache: Record<string, { invoiceNumber: string; date: string }> = {};

  for (const d of snap.docs) {
    const data = d.data();
    const modelName: string = (data.modelName ?? '').trim();

    // Only include products that have a known Futuristic price
    const usdPrice = getFuturisticPrice(modelName);
    if (usdPrice === null) continue;

    const invoiceId: string | null = data.invoiceId ?? data.invoice_id ?? null;
    let invoiceNumber: string | null = null;
    let saleDate: string | null = data.soldDate ?? data.saleDate ?? data.updatedAt ?? null;

    // Try to get invoice number from invoices collection
    if (invoiceId && !invoiceCache[invoiceId]) {
      try {
        const invSnap = await getDoc(doc(db, INVOICES_COLLECTION, invoiceId));
        if (invSnap.exists()) {
          const inv = invSnap.data();
          invoiceCache[invoiceId] = {
            invoiceNumber: inv.invoiceNumber ?? inv.invoice_number ?? invoiceId,
            date: inv.date ?? inv.createdAt ?? nowISO(),
          };
        }
      } catch {
        // ignore fetch errors for individual invoices
      }
    }

    if (invoiceId && invoiceCache[invoiceId]) {
      invoiceNumber = invoiceCache[invoiceId].invoiceNumber;
      saleDate = saleDate ?? invoiceCache[invoiceId].date;
    }

    // Determine status from paymentStatus field on product
    const paymentStatus: string = (data.paymentStatus ?? 'unpaid').toLowerCase();
    let status: PayableToFuturistic['status'] = 'pending';
    if (paymentStatus === 'paid') status = 'paid';
    else if (paymentStatus === 'partial') status = 'partial';

    results.push({
      productId: d.id,
      modelName,
      location: data.location ?? '',
      invoiceId,
      invoiceNumber,
      saleDate,
      usdPrice,
      amounts: usdToAllCurrencies(usdPrice),
      paidAmounts: ZERO_AMOUNTS,
      status,
    });
  }

  return results;
}

// ── Fetch invoice-linked payables summary ────────────────────────────────────
export interface InvoicePayableSummary {
  invoiceId: string;
  invoiceNumber: string;
  saleDate: string | null;
  items: DerivedPayable[];
  totalAmounts: CurrencyAmounts;
  status: PayableToFuturistic['status'];
}

export async function fetchPayablesSummaryByInvoice(): Promise<InvoicePayableSummary[]> {
  const derived = await fetchFuturisticPayablesFromProducts();

  // Group by invoiceId (ungrouped/no-invoice items get their own group)
  const groups: Record<string, DerivedPayable[]> = {};
  for (const item of derived) {
    const key = item.invoiceId ?? `no-invoice-${item.productId}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  return Object.entries(groups).map(([key, items]) => {
    const first = items[0];
    const totalAmounts: CurrencyAmounts = items.reduce(
      (acc, i) => ({
        aed: acc.aed + i.amounts.aed,
        pkr: acc.pkr + i.amounts.pkr,
        sar: acc.sar + i.amounts.sar,
        usd: acc.usd + i.amounts.usd,
      }),
      { aed: 0, pkr: 0, sar: 0, usd: 0 }
    );

    // Overall status: paid only if ALL items paid, partial if some
    const allPaid = items.every((i) => i.status === 'paid');
    const anyPaid = items.some((i) => i.status === 'paid' || i.status === 'partial');
    const status: PayableToFuturistic['status'] = allPaid ? 'paid' : anyPaid ? 'partial' : 'pending';

    return {
      invoiceId: first.invoiceId ?? key,
      invoiceNumber: first.invoiceNumber ?? 'No Invoice',
      saleDate: first.saleDate,
      items,
      totalAmounts,
      status,
    };
  });
}

// ── Manual payable CRUD (kept for backwards compat) ─────────────────────────
export async function fetchPayableById(id: string): Promise<PayableToFuturistic | null> {
  const ref = doc(db, PAYABLE_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as PayableToFuturistic;
}

export interface CreatePayablePayload {
  description: string;
  amounts: CurrencyAmounts;
  dueDate: string;
  notes?: string;
}

export async function createPayable(payload: CreatePayablePayload): Promise<PayableToFuturistic> {
  const now = nowISO();
  const data: Omit<PayableToFuturistic, 'id'> = {
    description: payload.description,
    modelName: '',
    productId: '',
    amounts: payload.amounts,
    paidAmounts: ZERO_AMOUNTS,
    status: 'pending',
    dueDate: payload.dueDate,
    notes: payload.notes ?? '',
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, PAYABLE_COLLECTION), data);
  return { id: ref.id, ...data };
}

export interface UpdatePayablePayload {
  description?: string;
  amounts?: CurrencyAmounts;
  paidAmounts?: CurrencyAmounts;
  status?: PayableToFuturistic['status'];
  dueDate?: string;
  notes?: string;
}

export async function updatePayable(id: string, payload: UpdatePayablePayload): Promise<void> {
  const ref = doc(db, PAYABLE_COLLECTION, id);
  await updateDoc(ref, { ...payload, updatedAt: nowISO() });
}

export async function deletePayable(id: string): Promise<void> {
  await deleteDoc(doc(db, PAYABLE_COLLECTION, id));
}