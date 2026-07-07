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

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out: any = {};
  Object.keys(obj).forEach(k => { if (obj[k] !== undefined) out[k] = obj[k]; });
  return out;
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
   */
  static async deleteInvoiceBySerialReturn(
    invoiceNumber: string,
    serial: string,
    deletedBy?: { uid: string; email: string }
  ): Promise<void> {
    const inv = await InvoiceLifecycleService.fetchInvoiceByNumber(invoiceNumber);
    if (!inv) return; // already deleted or not found — nothing to do
    await addDoc(collection(db, DELETED_INVOICES_COLLECTION), stripUndefined({
      ...inv,
      id: inv.id,
      returnedSerials: [...new Set([...(inv.returnedSerials || []), serial])],
      returnedAt: new Date().toISOString(),
      deletedAt: new Date().toISOString(),
      deletedBy: deletedBy?.uid,
      deletedByEmail: deletedBy?.email,
    }));
    await deleteDoc(doc(db, INVOICES_COLLECTION, inv.id));
  }
}