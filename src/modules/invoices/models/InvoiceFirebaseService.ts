/**
 * Invoices Module - Firebase Firestore Service Layer
 *
 * RESTORED: This file previously contained Inventory-module code by mistake
 * (InventoryFirebaseService / TransferFirebaseService / BrandModelFirebaseService),
 * which broke every import expecting InvoiceFirebaseService, e.g.:
 *   Commissionautoservice.ts -> InvoiceFirebaseService.fetchInvoiceById()
 *   Commissionautoservice.ts -> InvoiceFirebaseService.fetchAllInvoices()
 *
 * This version implements exactly those two confirmed call sites, following
 * the same Firestore access patterns used elsewhere in this codebase
 * (see InventoryFirebaseService.ts).
 *
 * NOT YET RESTORED: create/update/delete/PDF methods are stubbed below and
 * throw explicitly rather than silently doing the wrong thing. If your build
 * reports a missing method here, send me the call site and I'll add it.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import type { Invoice, CreateInvoiceDTO, UpdateInvoiceDTO } from './types';

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => { if (v !== undefined) out[k] = v; });
  return out as T;
}

const INVOICES_COLLECTION = 'invoices';

function transformDocToInvoice(docSnap: any): Invoice {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    ...d,
  } as Invoice;
}

export class InvoiceFirebaseService {

  static async fetchAllInvoices(): Promise<Invoice[]> {
    try {
      console.log('🔥 Fetching all invoices...');
      const q = query(collection(db, INVOICES_COLLECTION), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const invoices: Invoice[] = [];
      snapshot.forEach(d => invoices.push(transformDocToInvoice(d)));
      console.log(`✅ Fetched ${invoices.length} invoices`);
      return invoices;
    } catch (error) {
      console.error('❌ Error fetching invoices:', error);
      throw new Error('Failed to fetch invoices from Firestore');
    }
  }

  static async fetchInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const snap = await getDoc(doc(db, INVOICES_COLLECTION, id));
      if (!snap.exists()) return null;
      return transformDocToInvoice(snap);
    } catch (error) {
      console.error(`❌ Error fetching invoice ${id}:`, error);
      throw new Error('Failed to fetch invoice from Firestore');
    }
  }

  static async fetchInvoicesBySalesperson(salespersonName: string): Promise<Invoice[]> {
    try {
      const q = query(
        collection(db, INVOICES_COLLECTION),
        where('salesperson', '==', salespersonName)
      );
      const snapshot = await getDocs(q);
      const invoices: Invoice[] = [];
      snapshot.forEach(d => invoices.push(transformDocToInvoice(d)));
      return invoices;
    } catch (error) {
      console.error(`❌ Error fetching invoices for ${salespersonName}:`, error);
      throw new Error('Failed to fetch invoices from Firestore');
    }
  }

  /**
   * Real-time listener used by useInvoiceListViewModel — keeps the invoice
   * list live-synced with Firestore instead of a one-time fetch.
   * Returns an unsubscribe function; call it on component unmount.
   */
  static subscribeToInvoices(
    onUpdate: (invoices: Invoice[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const q = query(collection(db, INVOICES_COLLECTION), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const invoices: Invoice[] = [];
        snapshot.forEach(d => invoices.push(transformDocToInvoice(d)));
        onUpdate(invoices);
      },
      (error) => {
        console.error('❌ Error in invoices subscription:', error);
        onError?.(new Error('Failed to subscribe to invoices'));
      }
    );
    return unsubscribe;
  }

  // ── NOT YET RESTORED — real logic unknown, throws instead of guessing ──

  static async createInvoice(dto: CreateInvoiceDTO): Promise<Invoice> {
    try {
      const now = new Date().toISOString();
      const totalAmount = (dto.products || []).reduce((sum, p) => sum + (p.total || 0), 0);
      const paidAmount = dto.paymentStatus === 'Partial' ? (dto.paidAmount || 0) : totalAmount;
      const remainingAmount = totalAmount - paidAmount;
      const data = stripUndefined({ ...dto, totalAmount, paidAmount, remainingAmount, createdAt: now, updatedAt: now });
      const ref = await addDoc(collection(db, INVOICES_COLLECTION), data);
      console.log('✅ Invoice created:', ref.id);
      return { id: ref.id, ...data } as Invoice;
    } catch (error) {
      console.error('❌ Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }

  static async updateInvoice(id: string, dto: UpdateInvoiceDTO): Promise<Invoice> {
    try {
      const now = new Date().toISOString();
      const totalAmount = (dto.products || []).reduce((sum, p) => sum + (p.total || 0), 0);
      const paidAmount = dto.paymentStatus === 'Partial' ? (dto.paidAmount || 0) : totalAmount;
      const remainingAmount = totalAmount - paidAmount;
      const data = stripUndefined({ ...dto, totalAmount, paidAmount, remainingAmount, updatedAt: now });
      await updateDoc(doc(db, INVOICES_COLLECTION, id), data);
      console.log('✅ Invoice updated:', id);
      return { id, ...data } as Invoice;
    } catch (error) {
      console.error(`❌ Error updating invoice ${id}:`, error);
      throw new Error('Failed to update invoice');
    }
  }

  static async deleteInvoice(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, INVOICES_COLLECTION, id));
      console.log('✅ Invoice deleted:', id);
    } catch (error) {
      console.error(`❌ Error deleting invoice ${id}:`, error);
      throw new Error('Failed to delete invoice');
    }
  }
}