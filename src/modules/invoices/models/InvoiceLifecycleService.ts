// Invoice Module - Additive Service
// InvoiceLifecycleService.ts
//
// Kept separate from InvoiceFirebaseService.ts (not resent to me) so existing
// invoice creation / liquidity logic isn't touched blindly. This file only adds:
//   1. Soft-delete → 'deleted_invoices' collection (mirrors deleted_products)
//   2. markInvoiceReturned() → called from Inventory's return flow when a
//      sold serial linked to an invoice is returned to stock.
//
// NOTE: full bank/cash balance reversal requires the banking module's own
// service (not available here). This file reverses the *invoice-level*
// liquidity fields (remainingLiquidityAmount) and logs a reversal record in
// 'liquidity_reversals' for manual/automated reconciliation by that module.

import {
  collection, doc, getDoc, getDocs, addDoc, deleteDoc,
  query, where, orderBy,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { Invoice, DeletedInvoice } from './types';

const INVOICES_COLLECTION         = 'invoices';
const DELETED_INVOICES_COLLECTION = 'deleted_invoices';

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(v => stripUndefined(v)) as unknown as T;
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const out: any = {};
    Object.keys(value as any).forEach(k => {
      const v = (value as any)[k];
      if (v !== undefined) out[k] = stripUndefined(v);
    });
    return out;
  }
  return value;
}

export class InvoiceLifecycleService {
  /**
   * Soft-delete: archives the invoice into `deleted_invoices` and removes it
   * from the live `invoices` collection. Deleted invoices cannot be deleted
   * again — there is intentionally no delete method on the deleted side.
   */
  static async softDeleteInvoice(
    id: string,
    deletedBy?: { uid: string; email: string }
  ): Promise<void> {
    const ref  = doc(db, INVOICES_COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Invoice not found');
    const data = snap.data() as Invoice;

    await addDoc(collection(db, DELETED_INVOICES_COLLECTION), stripUndefined({
      ...data,
      id,
      deletedAt: new Date().toISOString(),
      deletedBy: deletedBy?.uid,
      deletedByEmail: deletedBy?.email,
    }));
    await deleteDoc(ref);
  }

  static async fetchDeletedInvoices(): Promise<DeletedInvoice[]> {
    const q = query(collection(db, DELETED_INVOICES_COLLECTION), orderBy('deletedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as DeletedInvoice), id: d.data().id || d.id }));
  }

  /** Look up a live invoice by its invoiceNumber (for display before deleting). */
  static async fetchInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    if (!invoiceNumber) return null;
    const q = query(collection(db, INVOICES_COLLECTION), where('invoiceNumber', '==', invoiceNumber));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { ...(snap.docs[0].data() as Invoice), id: snap.docs[0].id };
  }

  /**
   * Called by Inventory's "Add Returned Inventory" flow for BOTH branches
   * (returned-to-stock and damaged): the linked invoice is archived to
   * Deleted Invoices (same as a manual delete) since the sale is being
   * unwound either way. Cannot be deleted again from that section.
   *
   * Takes the already-fetched Invoice object directly (from linkedInvoice in
   * the return screen) and deletes it BY ITS DOCUMENT ID. This avoids a
   * second `where('invoiceNumber', '==', ...)` query, which was the fragile
   * point previously — any mismatch there caused this whole step to silently
   * no-op with no error.
   */
  static async deleteInvoiceByReturn(
    invoice: Invoice,
    serial: string,
    deletedBy?: { uid: string; email: string }
  ): Promise<void> {
    if (!invoice?.id) {
      console.error('[InvoiceLifecycleService] deleteInvoiceByReturn called without a valid invoice.id', invoice);
      throw new Error('Invoice is missing its document id — cannot delete');
    }
    const ref = doc(db, INVOICES_COLLECTION, invoice.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.warn(`[InvoiceLifecycleService] Invoice ${invoice.id} (${invoice.invoiceNumber}) no longer exists — already deleted?`);
      return;
    }
    const data = { ...(snap.data() as Invoice), id: invoice.id };

    await addDoc(collection(db, DELETED_INVOICES_COLLECTION), stripUndefined({
      ...data,
      returnedSerials: [...new Set([...(data.returnedSerials || []), serial])],
      returnedAt: new Date().toISOString(),
      deletedAt: new Date().toISOString(),
      deletedBy: deletedBy?.uid,
      deletedByEmail: deletedBy?.email,
    }));
    await deleteDoc(ref);
    console.log(`[InvoiceLifecycleService] Invoice ${invoice.invoiceNumber} (${invoice.id}) moved to Deleted Invoices via serial return.`);
  }

  /**
   * @deprecated kept for backward compatibility — prefer deleteInvoiceByReturn
   * (which takes the invoice object directly and avoids this re-query).
   */
  static async deleteInvoiceBySerialReturn(
    invoiceNumber: string,
    serial: string,
    deletedBy?: { uid: string; email: string }
  ): Promise<void> {
    const inv = await InvoiceLifecycleService.fetchInvoiceByNumber(invoiceNumber);
    if (!inv) {
      console.warn(`[InvoiceLifecycleService] No invoice found with invoiceNumber="${invoiceNumber}" — nothing deleted.`);
      return;
    }
    await InvoiceLifecycleService.deleteInvoiceByReturn(inv, serial, deletedBy);
  }
}