// modules/Payable-to-futuristic/models/futuristicPayableBridge.ts
//
// Called right after a new invoice is saved.
// Scans the invoice products for any with brandName === 'Futuristic',
// looks up the fixed USD price by modelName, and writes one doc per
// product to the `payable_to_futuristic` Firestore collection.
//
// This is intentionally fire-and-forget (non-blocking) — a failure here
// must never prevent the invoice from being created.

import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { getFuturisticPrice, usdToAllCurrencies, ZERO_AMOUNTS } from './payableToFuturistic';
// InvoiceProduct type inlined to avoid cross-module import path issues

const PAYABLE_COLLECTION = 'payable_to_futuristic';

export interface FuturisticPayableEntry {
  // Invoice linkage
  invoiceId: string;
  invoiceNumber: string;
  saleDate: string;
  // Product info
  productId: string;
  modelName: string;
  brandName: string;
  location?: string;
  // Amounts (USD is source of truth; others are converted)
  usdPrice: number;
  amounts: { usd: number; aed: number; pkr: number; sar: number };
  paidAmounts: { usd: number; aed: number; pkr: number; sar: number };
  // Status
  status: 'pending';
  dueDate: string;
  description: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Called after invoice creation.
 * For each product in the invoice with brandName === 'Futuristic' (case-insensitive)
 * that has a known fixed USD price, writes a payable entry to Firestore.
 *
 * Returns the number of payable entries created (0 if none were Futuristic).
 */
export async function createFuturisticPayablesFromInvoice(params: {
  invoiceId: string;
  invoiceNumber: string;
  saleDate: string;
  products: { productId: string; brandName: string; modelName: string; quantity: number; serialNumbers?: string[]; imageUrls?: string[] }[];
}): Promise<number> {
  const { invoiceId, invoiceNumber, saleDate, products } = params;

  console.log(
    `[FuturisticPayable] Scanning ${products.length} product(s) on invoice ${invoiceNumber}`,
    products.map(p => ({ brandName: p.brandName, modelName: p.modelName }))
  );

  const futuristicProducts = products.filter(
    (p) => (p.brandName || '').trim().toLowerCase() === 'futuristic'
  );

  console.log(`[FuturisticPayable] Found ${futuristicProducts.length} Futuristic product(s)`);

  if (futuristicProducts.length === 0) return 0;

  const now = new Date().toISOString();
  // Due date: 30 days from sale
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  let created = 0;

  for (const product of futuristicProducts) {
    const modelName  = (product.modelName || '').trim();
    const usdPrice   = getFuturisticPrice(modelName);

    if (usdPrice === null) {
      // Model not in price list — skip silently (log for debugging)
      console.warn(
        `[FuturisticPayable] Unknown model "${modelName}" — no fixed price, skipping.`
      );
      continue;
    }

    // If quantity > 1, create one entry per unit
    const qty = product.quantity || 1;

    for (let i = 0; i < qty; i++) {
      const serialSuffix = product.serialNumbers?.[i]
        ? ` (S/N: ${product.serialNumbers[i]})`
        : qty > 1 ? ` (unit ${i + 1}/${qty})` : '';

      const entry: FuturisticPayableEntry = {
        invoiceId,
        invoiceNumber,
        saleDate,
        productId:   product.productId || '',
        modelName,
        brandName:   'Futuristic',
        usdPrice,
        amounts:     usdToAllCurrencies(usdPrice),
        paidAmounts: ZERO_AMOUNTS,
        status:      'pending',
        dueDate,
        description: `${modelName}${serialSuffix} — Invoice #${invoiceNumber}`,
        notes:       '',
        createdAt:   now,
        updatedAt:   now,
      };

      await addDoc(collection(db, PAYABLE_COLLECTION), entry);
      created++;
    }
  }

  console.log(
    `[FuturisticPayable] Created ${created} payable entr${created === 1 ? 'y' : 'ies'} for invoice ${invoiceNumber}`
  );

  return created;
}