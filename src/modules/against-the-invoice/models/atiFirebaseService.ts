// Against the Invoice Module — Firebase Service
// Handles all Firestore reads/writes for ATI entries
// Also updates invoice.paidAmount / invoice.remainingAmount on the invoice doc

import {
  collection, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, doc, query, orderBy, where,
  runTransaction as firestoreRunTransaction,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { AgainstInvoiceEntry, ATIStats, InvoiceBalanceSummary, ATIStatus } from './types';

const COLLECTION      = 'againstInvoiceEntries';
const COUNTER_COL     = 'atiCounters';
const INVOICE_COL     = 'invoices';

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

function docToATI(d: any): AgainstInvoiceEntry {
  const data = d.data ? d.data() : d;
  return {
    id:                d.id,
    invoiceId:         data.invoiceId         || '',
    invoiceNumber:     data.invoiceNumber      || '',
    customerName:      data.customerName       || '',
    invoiceTotal:      data.invoiceTotal       || 0,
    transactionId:     data.transactionId      || '',
    date:              data.date               || '',
    time:              data.time,
    company:           data.company            || '',
    amount:            data.amount             || 0,
    paymentMode:       data.paymentMode        || 'Cash',
    bankId:            data.bankId,
    bankName:          data.bankName,
    chequeNumber:      data.chequeNumber,
    chequeBank:        data.chequeBank,
    chequeDate:        data.chequeDate,
    totalPaidBefore:   data.totalPaidBefore    || 0,
    totalPaidAfter:    data.totalPaidAfter     || 0,
    remainingAfter:    data.remainingAfter     || 0,
    status:            data.status             || 'Active',
    description:       data.description,
    createdBy:         data.createdBy,
    createdAt:         data.createdAt,
    updatedAt:         data.updatedAt,
  } as AgainstInvoiceEntry;
}

// ── Auto-generate ATI Transaction ID ─────────────────────────────────────────
export async function generateATIId(): Promise<string> {
  const now = new Date();
  const dd  = String(now.getDate()).padStart(2, '0');
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const yy  = String(now.getFullYear()).slice(-2);
  const key = `${dd}${mm}${yy}`;
  const ref = doc(db, COUNTER_COL, key);

  try {
    const next = await firestoreRunTransaction(db, async (txn) => {
      const snap = await txn.get(ref);
      const n    = snap.exists() ? (snap.data().count || 0) + 1 : 1;
      txn.set(ref, { date: key, count: n }, { merge: true });
      return n;
    });
    return `ATI-${key}-${String(next).padStart(3, '0')}`;
  } catch {
    return `ATI-${key}-${String(Date.now()).slice(-3)}`;
  }
}

export class ATIFirebaseService {

  // ── Fetch all ATI entries ─────────────────────────────────────────────────
  static async fetchAll(): Promise<AgainstInvoiceEntry[]> {
    try {
      const q        = query(collection(db, COLLECTION), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToATI);
    } catch (error) {
      console.error('❌ ATI fetchAll error:', error);
      throw new Error('Failed to fetch ATI entries');
    }
  }

  // ── Fetch entries for a specific invoice ──────────────────────────────────
  static async fetchByInvoice(invoiceId: string): Promise<AgainstInvoiceEntry[]> {
    try {
      const q        = query(
        collection(db, COLLECTION),
        where('invoiceId', '==', invoiceId),
        orderBy('date', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToATI);
    } catch (error) {
      console.error('❌ ATI fetchByInvoice error:', error);
      throw new Error('Failed to fetch ATI entries for invoice');
    }
  }

  // ── Create new ATI entry + update invoice balances ────────────────────────
  static async createEntry(dto: Omit<AgainstInvoiceEntry, 'id'>): Promise<AgainstInvoiceEntry> {
    try {
      const now  = new Date().toISOString();
      const data = stripUndefined({ ...dto, createdAt: now, updatedAt: now });
      const ref  = await addDoc(collection(db, COLLECTION), data);

      // ── Update invoice paidAmount & remainingAmount ─────────────────────
      try {
        const invoiceRef = doc(db, INVOICE_COL, dto.invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);
        if (invoiceSnap.exists()) {
          const inv         = invoiceSnap.data();
          const currentPaid = inv.paidAmount || 0;
          const newPaid     = currentPaid + dto.amount;
          const newRemaining = Math.max(0, (inv.totalAmount || 0) - newPaid);
          const newPaymentStatus = newRemaining <= 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';

          await updateDoc(invoiceRef, {
            paidAmount:      newPaid,
            remainingAmount: newRemaining,
            paymentStatus:   newPaymentStatus,
            status:          newRemaining <= 0 ? 'Paid' : 'Unpaid',
            updatedAt:       now,
          });
          console.log(`✅ Invoice ${dto.invoiceId} balances updated`);
        }
      } catch (invErr) {
        console.error('⚠️ Could not update invoice balances:', invErr);
      }

      console.log('✅ ATI entry created:', ref.id);
      return { ...dto, id: ref.id, createdAt: now, updatedAt: now };
    } catch (error) {
      console.error('❌ ATI createEntry error:', error);
      throw new Error('Failed to create ATI entry');
    }
  }

  // ── Delete ATI entry + reverse invoice balances ───────────────────────────
  static async deleteEntry(id: string, entry: AgainstInvoiceEntry): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION, id));

      // Reverse the invoice balance update
      try {
        const now        = new Date().toISOString();
        const invoiceRef = doc(db, INVOICE_COL, entry.invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);
        if (invoiceSnap.exists()) {
          const inv          = invoiceSnap.data();
          const currentPaid  = inv.paidAmount || 0;
          const newPaid      = Math.max(0, currentPaid - entry.amount);
          const newRemaining = Math.max(0, (inv.totalAmount || 0) - newPaid);
          const newPaymentStatus = newRemaining <= 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';

          await updateDoc(invoiceRef, {
            paidAmount:      newPaid,
            remainingAmount: newRemaining,
            paymentStatus:   newPaymentStatus,
            status:          newRemaining <= 0 ? 'Paid' : 'Unpaid',
            updatedAt:       now,
          });
        }
      } catch (invErr) {
        console.error('⚠️ Could not reverse invoice balances:', invErr);
      }

      console.log('✅ ATI entry deleted:', id);
    } catch (error) {
      console.error('❌ ATI deleteEntry error:', error);
      throw new Error('Failed to delete ATI entry');
    }
  }

  // ── Compute invoice balance summary for all invoices that have ATI entries ─
  static async fetchInvoiceBalanceSummaries(): Promise<InvoiceBalanceSummary[]> {
    try {
      const entries = await ATIFirebaseService.fetchAll();

      // Group by invoiceId
      const grouped = new Map<string, AgainstInvoiceEntry[]>();
      entries.forEach(e => {
        const list = grouped.get(e.invoiceId) || [];
        list.push(e);
        grouped.set(e.invoiceId, list);
      });

      const summaries: InvoiceBalanceSummary[] = [];
      grouped.forEach((list, invoiceId) => {
        const sorted    = [...list].sort((a, b) => a.date.localeCompare(b.date));
        const first     = sorted[0];
        const last      = sorted[sorted.length - 1];
        const totalPaid = list.reduce((s, e) => s + e.amount, 0);
        const remaining = Math.max(0, first.invoiceTotal - totalPaid);

        let status: ATIStatus = 'Active';
        if (remaining <= 0)      status = 'Settled';
        else if (totalPaid > 0)  status = 'Partial';

        summaries.push({
          invoiceId,
          invoiceNumber:   first.invoiceNumber,
          customerName:    first.customerName,
          date:            first.date,
          invoiceTotal:    first.invoiceTotal,
          totalPaid,
          remaining,
          status,
          entryCount:      list.length,
          lastPaymentDate: last.date,
        });
      });

      return summaries.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      console.error('❌ ATI fetchInvoiceBalanceSummaries error:', error);
      throw new Error('Failed to compute balance summaries');
    }
  }
}