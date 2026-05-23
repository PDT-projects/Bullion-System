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

const COLLECTION         = 'invoices';
const COUNTER_COLLECTION = 'invoiceCounters';
const PDF_STORAGE_PATH   = 'invoices/pdfs';

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
    price:         raw.price         ?? 0,
    total:         raw.total         ?? 0,
    serialNumbers: raw.serialNumbers || [],
    serialCities:  raw.serialCities  || {},
    currency:      raw.currency      || 'PKR',
    // FIX: explicitly read imageUrls so it is never lost.
    // Older invoices that were saved without this field get an empty array,
    // which the PDF service handles gracefully (no thumbnail shown).
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
    // FIX: map each product through docToInvoiceProduct so imageUrls is always
    // present; previously this was a raw pass-through `data.products || []`.
    products:               (data.products || []).map(docToInvoiceProduct),
    exchangeWarrantyNote:   data.exchangeWarrantyNote   || '',
    deliveryStatus:         data.deliveryStatus         || 'Self-collect',
    deliveryReceivedStatus: data.deliveryReceivedStatus || 'Pending',
    totalAmount:            data.totalAmount            || 0,
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
    deductionCharges:       data.deductionCharges       || 0,
    deductionCurrency:      data.deductionCurrency      || 'PKR',
    cargoAmount:            data.cargoAmount            || 0,
    cargoCurrency:          data.cargoCurrency          || 'PKR',
    customsAmount:          data.customsAmount          || 0,
    customsCurrency:        data.customsCurrency        || 'PKR',
    agentDetails:           data.agentDetails           || '',
    agentAmount:            data.agentAmount            || 0,
    agentCurrency:          data.agentCurrency          || 'PKR',
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

      return {
        ...dto,
        id: ref.id,
        ...liquidityFields,
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
      const data = stripUndefined({ ...dto, updatedAt: new Date().toISOString() });
      await updateDoc(doc(db, COLLECTION, id), data);
      console.log('✅ Invoice updated:', id);
    } catch (error) {
      console.error('❌ Error updating invoice:', error);
      throw new Error('Failed to update invoice in Firestore');
    }
  }

  // ── Delete invoice ───────────────────────────────────────────────────────
  static async deleteInvoice(id: string): Promise<void> {
    try {
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