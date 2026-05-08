// Against the Invoice Module — Firebase Service
// All balance mutations run inside Firestore transactions (atomic reads + writes)

import {
  collection, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, doc, query, orderBy, where,
  runTransaction as firestoreRunTransaction,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { AgainstInvoiceEntry, InvoiceBalanceSummary, ATIStatus } from './types';

const COLLECTION  = 'againstInvoiceEntries';
const COUNTER_COL = 'atiCounters';
const INVOICE_COL = 'invoices';

// Removes undefined values — Firestore rejects fields set to undefined
function clean(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

function docToATI(d: any): AgainstInvoiceEntry {
  const data = d.data ? d.data() : d;
  return {
    id:              d.id,
    invoiceId:       data.invoiceId        || '',
    invoiceNumber:   data.invoiceNumber    || '',
    customerName:    data.customerName     || '',
    invoiceTotal:    data.invoiceTotal     || 0,
    transactionId:   data.transactionId   || '',
    date:            data.date             || '',
    time:            data.time,
    company:         data.company          || '',
    amount:          data.amount           || 0,
    paymentMode:     data.paymentMode      || 'Cash',
    bankId:          data.bankId,
    bankName:        data.bankName,
    chequeNumber:    data.chequeNumber,
    chequeBank:      data.chequeBank,
    chequeDate:      data.chequeDate,
    totalPaidBefore: data.totalPaidBefore  || 0,
    totalPaidAfter:  data.totalPaidAfter   || 0,
    remainingAfter:  data.remainingAfter   || 0,
    status:          data.status           || 'Active',
    description:     data.description,
    createdBy:       data.createdBy,
    createdAt:       data.createdAt,
    updatedAt:       data.updatedAt,
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

  // ── Fetch all ─────────────────────────────────────────────────────────────
  static async fetchAll(): Promise<AgainstInvoiceEntry[]> {
    try {
      const q        = query(collection(db, COLLECTION), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToATI);
    } catch (error) {
      console.error('❌ ATI fetchAll:', error);
      throw new Error('Failed to fetch ATI entries');
    }
  }

  // ── Fetch by invoice ──────────────────────────────────────────────────────
  static async fetchByInvoice(invoiceId: string): Promise<AgainstInvoiceEntry[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('invoiceId', '==', invoiceId),
        orderBy('date', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToATI);
    } catch (error) {
      console.error('❌ ATI fetchByInvoice:', error);
      throw new Error('Failed to fetch ATI entries for invoice');
    }
  }

  // ── Create entry + update invoice — ATOMIC transaction ───────────────────
  static async createEntry(dto: Omit<AgainstInvoiceEntry, 'id'>): Promise<AgainstInvoiceEntry> {
    const now        = new Date().toISOString();
    const invoiceRef = doc(db, INVOICE_COL, dto.invoiceId);
    // Pre-generate the new doc ref outside the transaction (addDoc not allowed inside txn)
    const newAtiRef  = doc(collection(db, COLLECTION));

    try {
      const saved = await firestoreRunTransaction(db, async (txn) => {

        // 1. Read LIVE invoice data from Firestore
        const invoiceSnap = await txn.get(invoiceRef);
        if (!invoiceSnap.exists()) {
          throw new Error(`Invoice "${dto.invoiceId}" not found in Firestore`);
        }

        const inv             = invoiceSnap.data();
        const invoiceTotal    = Number(inv.totalAmount) || 0;
        const paidBefore      = Number(inv.paidAmount)  || 0;
        const remainingBefore = Math.max(0, invoiceTotal - paidBefore);

        // 2. Validate amount against LIVE remaining balance
        if (dto.amount <= 0) {
          throw new Error('Payment amount must be greater than 0');
        }
        if (dto.amount > remainingBefore + 0.01) {
          throw new Error(
            remainingBefore <= 0
              ? 'This invoice is already fully paid'
              : `Amount exceeds remaining balance of PKR ${remainingBefore.toLocaleString()}`
          );
        }

        // 3. Compute new balances
        const paidAfter      = paidBefore + dto.amount;
        const remainingAfter = Math.max(0, invoiceTotal - paidAfter);

        const newPaymentStatus = remainingAfter <= 0 ? 'Paid'
          : paidAfter > 0 ? 'Partial' : 'Unpaid';
        const newInvoiceStatus = remainingAfter <= 0 ? 'Paid' : 'Unpaid';
        const atiStatus: ATIStatus = remainingAfter <= 0 ? 'Settled'
          : paidAfter > 0 ? 'Partial' : 'Active';

        // 4. Build ATI payload — balance fields come from live Firestore read
        const payload = clean({
          invoiceId:       dto.invoiceId,
          invoiceNumber:   dto.invoiceNumber,
          customerName:    dto.customerName,
          invoiceTotal:    invoiceTotal,
          transactionId:   dto.transactionId,
          date:            dto.date,
          time:            dto.time,
          company:         dto.company,
          amount:          dto.amount,
          paymentMode:     dto.paymentMode,
          bankId:          dto.bankId,
          bankName:        dto.bankName,
          chequeNumber:    dto.chequeNumber,
          chequeBank:      dto.chequeBank,
          chequeDate:      dto.chequeDate,
          totalPaidBefore: paidBefore,
          totalPaidAfter:  paidAfter,
          remainingAfter:  remainingAfter,
          status:          atiStatus,
          description:     dto.description,
          createdBy:       dto.createdBy,
          createdAt:       now,
          updatedAt:       now,
        });

        // 5. Write ATI entry doc
        txn.set(newAtiRef, payload);

        // 6. Update invoice doc with new balances
        txn.update(invoiceRef, {
          paidAmount:      paidAfter,
          remainingAmount: remainingAfter,
          paymentStatus:   newPaymentStatus,
          status:          newInvoiceStatus,
          updatedAt:       now,
        });

        console.log(
          `✅ [txn] ATI ${newAtiRef.id} created.`,
          `Invoice ${dto.invoiceId}: paidAmount ${paidBefore} → ${paidAfter},`,
          `remainingAmount ${remainingBefore} → ${remainingAfter}`
        );

        return {
          ...dto,
          id:              newAtiRef.id,
          invoiceTotal,
          totalPaidBefore: paidBefore,
          totalPaidAfter:  paidAfter,
          remainingAfter,
          status:          atiStatus,
          createdAt:       now,
          updatedAt:       now,
        } as AgainstInvoiceEntry;
      });

      return saved;

    } catch (error: any) {
      console.error('❌ ATI createEntry:', error?.message || error);
      throw new Error(error?.message || 'Failed to save payment entry');
    }
  }

  // ── Delete entry + reverse invoice balances — ATOMIC ─────────────────────
  static async deleteEntry(id: string, entry: AgainstInvoiceEntry): Promise<void> {
    const atiRef     = doc(db, COLLECTION, id);
    const invoiceRef = doc(db, INVOICE_COL, entry.invoiceId);

    try {
      await firestoreRunTransaction(db, async (txn) => {
        const invoiceSnap = await txn.get(invoiceRef);

        if (invoiceSnap.exists()) {
          const inv          = invoiceSnap.data();
          const invoiceTotal = Number(inv.totalAmount) || 0;
          const currentPaid  = Number(inv.paidAmount)  || 0;
          const newPaid      = Math.max(0, currentPaid - entry.amount);
          const newRemaining = Math.max(0, invoiceTotal - newPaid);

          txn.update(invoiceRef, {
            paidAmount:      newPaid,
            remainingAmount: newRemaining,
            paymentStatus:   newRemaining <= 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid',
            status:          newRemaining <= 0 ? 'Paid' : 'Unpaid',
            updatedAt:       new Date().toISOString(),
          });
        }

        txn.delete(atiRef);
      });

      console.log('✅ ATI entry deleted:', id);
    } catch (error: any) {
      console.error('❌ ATI deleteEntry:', error?.message || error);
      throw new Error(error?.message || 'Failed to delete ATI entry');
    }
  }

  // ── Balance summaries ─────────────────────────────────────────────────────
  static async fetchInvoiceBalanceSummaries(): Promise<InvoiceBalanceSummary[]> {
    try {
      const entries = await ATIFirebaseService.fetchAll();

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
        if (remaining <= 0)     status = 'Settled';
        else if (totalPaid > 0) status = 'Partial';

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
    } catch (error: any) {
      console.error('❌ ATI fetchInvoiceBalanceSummaries:', error?.message || error);
      throw new Error('Failed to compute balance summaries');
    }
  }
}