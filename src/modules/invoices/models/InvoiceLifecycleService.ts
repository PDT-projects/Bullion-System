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
  collection, doc, getDoc, getDocs, addDoc, deleteDoc, updateDoc,
  query, where, orderBy,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { Invoice, DeletedInvoice } from './types';

const INVOICES_COLLECTION         = 'invoices';
const DELETED_INVOICES_COLLECTION = 'deleted_invoices';
const LIQUIDITY_REVERSALS_COLLECTION = 'liquidity_reversals';

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

  /**
   * Called by Inventory's "Add Returned Inventory" flow (non-damaged return)
   * when the returned serial has a linked invoice number. Marks the invoice
   * Returned and reverses the tracked liquidity amount for that unit.
   */
  static async markInvoiceReturnedBySerial(
    invoiceNumber: string,
    serial: string,
    unitAmount?: number
  ): Promise<void> {
    if (!invoiceNumber) return;
    const q = query(collection(db, INVOICES_COLLECTION), where('invoiceNumber', '==', invoiceNumber));
    const snap = await getDocs(q);
    if (snap.empty) return; // invoice may have been deleted separately — nothing to reverse
    const invDoc = snap.docs[0];
    const inv = invDoc.data() as Invoice;

    const returnedSerials = [...new Set([...(inv.returnedSerials || []), serial])];
    const allReturned = (inv.products || [])
      .flatMap(p => p.serialNumbers || [])
      .every(s => returnedSerials.includes(s));

    const newRemaining = unitAmount !== undefined && inv.remainingLiquidityAmount !== undefined
      ? Math.max(0, inv.remainingLiquidityAmount - unitAmount)
      : inv.remainingLiquidityAmount;

    await updateDoc(invDoc.ref, stripUndefined({
      status: allReturned ? 'Returned' : inv.status,
      returnedSerials,
      returnedAt: new Date().toISOString(),
      remainingLiquidityAmount: newRemaining,
    }));

    if (inv.originalLiquiditySource && unitAmount) {
      await addDoc(collection(db, LIQUIDITY_REVERSALS_COLLECTION), stripUndefined({
        invoiceId: invDoc.id,
        invoiceNumber,
        serial,
        source: inv.originalLiquiditySource,
        liquidityDocId: inv.originalLiquidityDocId,
        amount: unitAmount,
        createdAt: new Date().toISOString(),
        status: 'pending', // banking module should pick this up to adjust the actual bank/cash balance
      }));
    }
  }
}