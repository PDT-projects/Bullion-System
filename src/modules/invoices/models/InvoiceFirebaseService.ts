// Invoice Module - Firebase Service Layer (UPDATED)
// Added liquidity linkage when creating invoices
//
// FIX v2 (image pipeline):
//   docToInvoice now maps each product item and explicitly preserves `imageUrls`
//   so that images saved on invoice creation are correctly read back from
//   Firestore and flow through to the PDF renderer and the invoice detail view.
//   Without this, raw `data.products || []` returns plain JS objects from
//   Firestore — imageUrls is present but could be undefined on older documents
//   that were saved before imageUrls was added to InvoiceProduct.

import {
  collection, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, doc, onSnapshot, query, orderBy,
} from 'firebase/firestore';
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject,
} from 'firebase/storage';
import { db } from '../../../api/firebase/firebase';
import { Invoice, InvoiceProduct, CreateInvoiceDTO } from './types';

const COLLECTION             = 'invoices';
const COUNTER_COLLECTION     = 'invoiceCounters';
const PDF_STORAGE_PATH       = 'invoices/pdfs';
const TRANSACTIONS_COLLECTION = 'transactions';

// ── Invoice ↔ Transaction sync ────────────────────────────────────────────────
// The Dashboard's Total Inflow / Total Outflow cards and the Transactions list
// are both driven entirely off the `transactions` collection (see
// useDashboardData / calculateStats). Invoices used to only write liquidity
// fields onto the invoice doc itself, so a paid invoice never showed up as
// inflow anywhere. The helpers below create/update a single linked
// `transactions` doc per invoice (id stored on the invoice as
// `linkedTransactionId`) so payments are reflected the moment they're saved,
// and editing an invoice's payment updates that same transaction doc in
// place rather than creating a duplicate.
function buildInvoiceTransactionPayload(invoiceId: string, dto: any) {
  const paidAmount: number = dto.paidAmount ?? dto.totalAmount ?? 0;
  const mode: 'Cash' | 'Bank' | 'Cheque' =
    dto.paymentMode === 'Online' ? 'Bank'   :
    dto.paymentMode === 'Cheque' ? 'Cheque' : 'Cash';
  const isFull = paidAmount >= (dto.totalAmount || 0);

  return stripUndefined({
    date:            dto.date || new Date().toISOString(),
    company:         dto.branch || '',
    mainCategory:    'Cash Inflow',
    subCategory:     'Product sale received',
    amount:          paidAmount,
    amountPaid:      paidAmount,
    remainingAmount: Math.max(0, (dto.totalAmount || 0) - paidAmount),
    paymentStatus:   isFull ? 'Full' : 'Partial',
    mode,
    bankId:          dto.bankId,
    bankName:        dto.bankName,
    chequeNumber:    dto.chequeNumber,
    chequeDate:      dto.chequeDate,
    chequeBank:      dto.chequeBank,
    note:            `Invoice ${dto.invoiceNumber || ''} — ${dto.customerName || ''}`.trim(),
    paidBy:          dto.customerName,
    paidTo:          dto.paidTo,
    linkedType:      'invoice' as const,
    linkedId:        invoiceId,
    linkedRef:       dto.invoiceNumber,
    updatedAt:       new Date().toISOString(),
  });
}

/** Create or update the single transaction doc linked to an invoice. */
async function syncInvoiceTransaction(invoiceId: string, dto: any, existingTransactionId?: string): Promise<string | undefined> {
  const paidAmount: number = dto.paidAmount ?? 0;
  console.log('🔄 syncInvoiceTransaction:', { invoiceId, paidAmount, totalAmount: dto.totalAmount, existingTransactionId });

  // Nothing paid yet — don't create a phantom AED 0 inflow row.
  if (!paidAmount || paidAmount <= 0) {
    console.log('⏭️ Skipping transaction sync — paidAmount is 0/falsy:', paidAmount);
    return existingTransactionId;
  }

  const payload = buildInvoiceTransactionPayload(invoiceId, dto);

  try {
    if (existingTransactionId) {
      await updateDoc(doc(db, TRANSACTIONS_COLLECTION, existingTransactionId), payload);
      console.log('✅ Linked transaction updated for invoice:', invoiceId, existingTransactionId);
      return existingTransactionId;
    } else {
      const ref = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
        ...payload,
        transactionId: `TXN-${Date.now()}`,
        createdAt: new Date().toISOString(),
      });
      console.log('✅ Linked transaction created for invoice:', invoiceId, ref.id);
      return ref.id;
    }
  } catch (error) {
    // Don't let a transaction-sync failure block the invoice save itself.
    console.error('❌ Error syncing invoice transaction:', error);
    return existingTransactionId;
  }
}

// ── Legacy currency normalization ─────────────────────────────────────────────
// The app is AED-first. Older invoices were stored with PKR amounts (and a
// product `currency` of 'PKR'). We convert those to AED on read using the
// fixed fallback rates so historical totals display correctly in the AED UI,
// without needing a Firestore migration. New invoices already store AED and
// pass through untouched.
const PKR_PER_USD = 279.5;
const AED_PER_USD = 3.67;
const PKR_TO_AED  = AED_PER_USD / PKR_PER_USD; // AED = pkrAmount * PKR_TO_AED
const pkrToAed = (n: number) => Math.round((n || 0) * PKR_TO_AED * 100) / 100;

const storage = getStorage();

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

// ── Map a raw Firestore product sub-document to a typed InvoiceProduct ─────────
// This explicit mapping ensures every field — including imageUrls — is always
// present on the returned object, even for invoices saved before imageUrls was
// added to the InvoiceProduct type.
function docToInvoiceProduct(raw: any): InvoiceProduct {
  return {
    id:            raw.id            || '',
    productId:     raw.productId     || '',
    productName:   raw.productName   || '',
    brandName:     raw.brandName     || '',
    modelName:     raw.modelName     || '',
    category:      raw.category      || '',
    description:   raw.description   || '',
    quantity:      raw.quantity      ?? 1,
    price:         raw.price ?? 0,
    total:         raw.total ?? 0,
    serialNumbers: raw.serialNumbers || [],
    serialCities:  raw.serialCities  || {},
    currency:      'AED',
    imageUrls:     Array.isArray(raw.imageUrls) ? raw.imageUrls : [],
  };
}

function docToInvoice(d: any): Invoice {
  const data = d.data ? d.data() : d;
  return {
    id:                     d.id,
    invoiceNumber:          data.invoiceNumber          || '',
    date:                   data.date                   || '',
    customerName:           data.customerName           || '',
    customerPhone:          data.customerPhone          || '',
    customerPhone2:         data.customerPhone2,
    customerCNIC:           data.customerCNIC           || '',
    customerProvince:       data.customerProvince       || '',
    customerCity:           data.customerCity           || '',
    customerAddress:        data.customerAddress,
    warrantyLocation:       data.warrantyLocation,
    products:               (data.products || []).map(docToInvoiceProduct),
    exchangeWarrantyNote:   data.exchangeWarrantyNote   || '',
    deliveryStatus:         data.deliveryStatus         || 'Self-collect',
    deliveryReceivedStatus: data.deliveryReceivedStatus || 'Pending',
    totalAmount:            data.totalAmount || 0,
    status:                 data.status                 || 'Unpaid',
    salesperson:            data.salesperson,
    salespersonLocation:    data.salespersonLocation,
    clientDealBy:           data.clientDealBy,
    referralBy:             data.referralBy,
    createdBy:              data.createdBy,
    paymentMode:            data.paymentMode,
    bankId:                 data.bankId,
    bankName:               data.bankName,
    bankAccountNumber:      data.bankAccountNumber,
    chequeNumber:           data.chequeNumber,
    chequeBank:             data.chequeBank,
    chequeDate:             data.chequeDate,
    paymentStatus:          data.paymentStatus,
    paidAmount:             data.paidAmount,
    remainingAmount:        data.remainingAmount,
    collectionMethod:       data.collectionMethod,
    branch:                 data.branch,
    deductionCharges:       data.deductionCharges || 0,
    deductionCurrency:      data.deductionCurrency      || 'AED',
    cargoAmount:            data.cargoAmount            || 0,
    cargoCurrency:          data.cargoCurrency          || 'AED',
    customsAmount:          data.customsAmount          || 0,
    customsCurrency:        data.customsCurrency        || 'AED',
    agentDetails:           data.agentDetails           || '',
    agentAmount:            data.agentAmount            || 0,
    agentCurrency:          data.agentCurrency          || 'AED',
    digitalStamp:           data.digitalStamp,
    imageUrl:               data.imageUrl,
    pdfUrl:                 data.pdfUrl,
    paidBy:                 data.paidBy,
    paidTo:                 data.paidTo,
    productLocation:        data.productLocation,
    selectedCurrencies:     data.selectedCurrencies,

    // ✨ Liquidity linkage fields
    originalLiquiditySource:  data.originalLiquiditySource,
    originalLiquidityDocId:   data.originalLiquidityDocId,
    originalLiquidityAmount:  data.originalLiquidityAmount,
    remainingLiquidityAmount: data.remainingLiquidityAmount,
    originalBankTxnId:        data.originalBankTxnId,

    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } as Invoice;
}

export class InvoiceFirebaseService {

  // ── Generate unique invoice number (INV-DDMMYY-NNN) ──────────────────────
  static async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const dd  = String(now.getDate()).padStart(2, '0');
    const mm  = String(now.getMonth() + 1).padStart(2, '0');
    const yy  = String(now.getFullYear()).slice(-2);
    const key = `${dd}${mm}${yy}`;
    const ref = doc(db, COUNTER_COLLECTION, key);

    try {
      const snap = await getDoc(ref);
      const next = snap.exists() ? (snap.data().count || 0) + 1 : 1;
      await (snap.exists()
        ? updateDoc(ref, { count: next })
        : (await addDoc(collection(db, COUNTER_COLLECTION), {}),
           updateDoc(ref, { count: next }))
      );
      return `INV-${key}-${String(next).padStart(3, '0')}`;
    } catch {
      return `INV-${key}-${String(Date.now()).slice(-3)}`;
    }
  }

  // ── Subscribe to live invoice updates ────────────────────────────────────
  static subscribeToInvoices(
    onData:  (invoices: Invoice[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const q = query(collection(db, COLLECTION), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const invoices = snapshot.docs.map(docToInvoice);
        console.log(`[onSnapshot] ${invoices.length} invoices`);
        onData(invoices);
      },
      (error) => {
        console.error('[onSnapshot] Invoice listener error:', error);
        onError(error);
      }
    );
    return unsubscribe;
  }

  static async fetchAllInvoices(): Promise<Invoice[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION));
      const invoices = snapshot.docs.map(docToInvoice);
      invoices.sort((a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      );
      console.log(`✅ Fetched ${invoices.length} invoices`);
      return invoices;
    } catch (error) {
      console.error('❌ Error fetching invoices:', error);
      throw new Error('Failed to fetch invoices from Firestore');
    }
  }

  // ── Fetch single invoice ─────────────────────────────────────────────────
  static async fetchInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION, id));
      if (!snap.exists()) return null;
      return docToInvoice(snap);
    } catch (error) {
      console.error('❌ Error fetching invoice:', error);
      throw new Error('Failed to fetch invoice from Firestore');
    }
  }

  // ── Create invoice (with liquidity linkage) ───────────────────────────────
  static async createInvoice(dto: Omit<Invoice, 'id'>): Promise<Invoice> {
    try {
      const now = new Date().toISOString();

      // ✨ Compute liquidity linkage fields based on payment mode
      let liquidityFields: Record<string, any> = {};

      if (dto.paymentMode === 'Bank' || dto.paymentMode === 'Cheque') {
        liquidityFields = {
          originalLiquiditySource:  'bank',
          originalLiquidityDocId:   dto.bankId,
          originalLiquidityAmount:  dto.totalAmount || 0,
          remainingLiquidityAmount: dto.totalAmount || 0,
        };
        console.log(`📌 Invoice will track Bank liquidity: ${dto.bankId} (${dto.bankName})`);
      } else if (dto.paymentMode === 'Cash') {
        liquidityFields = {
          originalLiquiditySource:  'cash',
          originalLiquidityDocId:   dto.productLocation || 'Head Office - Islamabad',
          originalLiquidityAmount:  dto.totalAmount || 0,
          remainingLiquidityAmount: dto.totalAmount || 0,
        };
        console.log(`📌 Invoice will track Cash liquidity from: ${liquidityFields.originalLiquidityDocId}`);
      }

      const data = stripUndefined({
        ...dto,
        ...liquidityFields,
        createdAt: now,
        updatedAt: now,
      });

      const ref = await addDoc(collection(db, COLLECTION), data);
      console.log('✅ Invoice created:', ref.id, 'with liquidity:', liquidityFields);

      // Sync linked transaction so paid amount shows in Total Inflow + Transactions list.
      const linkedTransactionId = await syncInvoiceTransaction(ref.id, dto);
      if (linkedTransactionId) {
        await updateDoc(ref, { linkedTransactionId });
      }

      return {
        ...dto,
        id: ref.id,
        ...liquidityFields,
        linkedTransactionId,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('❌ Error creating invoice:', error);
      throw new Error('Failed to create invoice in Firestore');
    }
  }

  // ── Update invoice ───────────────────────────────────────────────────────
  static async updateInvoice(id: string, dto: Partial<Omit<Invoice, 'id'>>): Promise<void> {
    try {
      // Read the existing doc FIRST (before writing) — gives us prior
      // linkedTransactionId, and lets us fill in any field `dto` doesn't
      // include (handleSave always sends a full object, but this is also
      // safe for true partial updates).
      const beforeSnap = await getDoc(doc(db, COLLECTION, id));
      const before = beforeSnap.exists() ? (beforeSnap.data() as any) : {};

      const data = stripUndefined({ ...dto, updatedAt: new Date().toISOString() });
      await updateDoc(doc(db, COLLECTION, id), data);
      console.log('✅ Invoice updated:', id);

      // ── Keep the linked transaction (and therefore Total Inflow on the
      //    Dashboard) in sync with payment-relevant edits. Without this, an
      //    edited paidAmount/totalAmount/bankId never reaches `transactions`
      //    and the dashboard card silently goes stale.
      // IMPORTANT: build the merged record from `before` + `dto` directly —
      // do NOT re-fetch with getDoc after updateDoc. Firestore's SDK can
      // resolve updateDoc before the local cache reflects it, so a
      // post-write getDoc can return stale (pre-update) data, silently
      // syncing the transaction to the OLD amount. Using before+dto avoids
      // that race entirely.
      const paymentFields = ['paidAmount', 'totalAmount', 'bankId', 'bankName',
        'paymentMode', 'chequeNumber', 'chequeDate', 'chequeBank', 'invoiceNumber', 'customerName'];
      const touchesPayment = paymentFields.some(f => f in dto);
      console.log('🔍 touchesPayment:', touchesPayment, 'dto keys:', Object.keys(dto));

      if (touchesPayment) {
        const merged = { ...before, ...dto };
        const linkedTransactionId = await syncInvoiceTransaction(id, merged, before.linkedTransactionId);
        if (linkedTransactionId && linkedTransactionId !== before.linkedTransactionId) {
          await updateDoc(doc(db, COLLECTION, id), { linkedTransactionId });
        }
      }
    } catch (error) {
      console.error('❌ Error updating invoice:', error);
      throw new Error('Failed to update invoice in Firestore');
    }
  }

  // ── Delete invoice ───────────────────────────────────────────────────────
  static async deleteInvoice(id: string): Promise<void> {
    try {
      try {
        const snap = await getDoc(doc(db, COLLECTION, id));
        const linkedTransactionId = snap.exists() ? (snap.data() as any).linkedTransactionId : undefined;
        if (linkedTransactionId) {
          await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, linkedTransactionId));
          console.log('✅ Linked transaction deleted:', linkedTransactionId);
        }
      } catch {
        // Linked transaction may not exist — ignore
      }
      try {
        const pdfRef = storageRef(storage, `${PDF_STORAGE_PATH}/${id}.pdf`);
        await deleteObject(pdfRef);
        console.log('✅ PDF deleted from Storage:', id);
      } catch {
        // PDF may not exist — ignore
      }
      await deleteDoc(doc(db, COLLECTION, id));
      console.log('✅ Invoice deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting invoice:', error);
      throw new Error('Failed to delete invoice from Firestore');
    }
  }

  // ── Upload PDF to Firebase Storage ──────────────────────────────────────
  static async uploadInvoicePdf(invoiceId: string, pdfBlob: Blob): Promise<string> {
    try {
      console.log('🔥 Uploading invoice PDF to Storage:', invoiceId);
      const ref  = storageRef(storage, `${PDF_STORAGE_PATH}/${invoiceId}.pdf`);
      const snap = await uploadBytes(ref, pdfBlob, { contentType: 'application/pdf' });
      const url  = await getDownloadURL(snap.ref);
      console.log('✅ PDF uploaded:', url);
      return url;
    } catch (error) {
      console.error('❌ Error uploading PDF:', error);
      throw new Error('Failed to upload PDF to Firebase Storage');
    }
  }

  // ── Custom Delivery Statuses (persisted in Firestore) ────────────────────
  static async fetchDeliveryStatuses(defaults: string[]): Promise<string[]> {
    try {
      const snap = await getDoc(doc(db, 'invoiceSettings', 'deliveryStatuses'));
      if (snap.exists()) return snap.data().list as string[];
    } catch (e) { console.warn('[InvoiceFirebase] fetchDeliveryStatuses:', e); }
    return defaults;
  }

  static async addDeliveryStatus(name: string, current: string[]): Promise<string[]> {
    const trimmed = name.trim();
    if (!trimmed || current.includes(trimmed)) return current;
    const updated = [...current, trimmed];
    await updateDoc(doc(db, 'invoiceSettings', 'deliveryStatuses'), { list: updated })
      .catch(async () => {
        await addDoc(collection(db, 'invoiceSettings'), {}).catch(() => {});
        const ref = doc(db, 'invoiceSettings', 'deliveryStatuses');
        await updateDoc(ref, { list: updated }).catch(async () => {
          const { setDoc } = await import('firebase/firestore');
          await setDoc(ref, { list: updated });
        });
      });
    return updated;
  }

  // ── Custom Collection Methods (persisted in Firestore) ────────────────────
  static async fetchCollectionMethods(defaults: string[]): Promise<string[]> {
    try {
      const snap = await getDoc(doc(db, 'invoiceSettings', 'collectionMethods'));
      if (snap.exists()) return snap.data().list as string[];
    } catch (e) { console.warn('[InvoiceFirebase] fetchCollectionMethods:', e); }
    return defaults;
  }

  static async addCollectionMethod(name: string, current: string[]): Promise<string[]> {
    const trimmed = name.trim();
    if (!trimmed || current.includes(trimmed)) return current;
    const updated = [...current, trimmed];
    const ref = doc(db, 'invoiceSettings', 'collectionMethods');
    try {
      await updateDoc(ref, { list: updated });
    } catch {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(ref, { list: updated });
    }
    return updated;
  }

  // ── Save PDF URL back to Firestore invoice doc ───────────────────────────
  static async savePdfUrl(invoiceId: string, pdfUrl: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION, invoiceId), {
        pdfUrl,
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ PDF URL saved to Firestore:', invoiceId);
    } catch (error) {
      console.error('❌ Error saving PDF URL:', error);
      throw new Error('Failed to save PDF URL to Firestore');
    }
  }

  // ── ONE-TIME MIGRATION: Backfill existing invoices with liquidity fields ──
  static async backfillInvoiceLiquidity(): Promise<void> {
    try {
      console.log('🔄 Starting invoice liquidity backfill...');
      const invoices = await this.fetchAllInvoices();
      let updated = 0;

      for (const inv of invoices) {
        if (inv.originalLiquiditySource) continue; // already backfilled

        let liquidityFields: Record<string, any> = {};

        if (inv.paymentMode === 'Bank' || inv.paymentMode === 'Cheque') {
          liquidityFields = {
            originalLiquiditySource:  'bank',
            originalLiquidityDocId:   inv.bankId || 'unknown',
            originalLiquidityAmount:  inv.totalAmount,
            remainingLiquidityAmount: Math.max(0, inv.totalAmount - (inv.paidAmount || 0)),
          };
        } else if (inv.paymentMode === 'Cash') {
          liquidityFields = {
            originalLiquiditySource:  'cash',
            originalLiquidityDocId:   inv.productLocation || 'Head Office - Islamabad',
            originalLiquidityAmount:  inv.totalAmount,
            remainingLiquidityAmount: Math.max(0, inv.totalAmount - (inv.paidAmount || 0)),
          };
        }

        if (Object.keys(liquidityFields).length > 0) {
          await this.updateInvoice(inv.id, liquidityFields);
          updated++;
          console.log(`  ✅ Updated invoice ${inv.invoiceNumber} (${inv.id})`);
        }
      }

      console.log(`🎉 Backfill complete: ${updated} invoices updated`);
    } catch (error) {
      console.error('❌ Error during liquidity backfill:', error);
      throw new Error('Failed to backfill invoice liquidity');
    }
  }
}