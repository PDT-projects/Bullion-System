// Transactions Module - Firebase Service
// All Firestore operations for transactions collection
// Fix: deep stripUndefined removes undefined from nested objects + arrays
//      (Firestore rejects undefined anywhere in the document tree)

import {
  collection, getDocs, getDoc, addDoc, updateDoc, setDoc,
  deleteDoc, doc, query, where, runTransaction,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { Transaction, PartialPayment } from './types';

const COLLECTION  = 'transactions';
const COUNTER_COL = 'transactionCounters';

// ── Deep strip of undefined values ───────────────────────────────────────────
// Firestore rejects undefined at ANY depth — including inside arrays of objects
// (e.g. partialPayments[].chequeNumber = undefined → crash).
// This recursively cleans the whole tree before every Firestore write.
function deepStripUndefined(value: any): any {
  if (Array.isArray(value)) {
    return value.map(deepStripUndefined);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, deepStripUndefined(v)])
    );
  }
  return value;
}

function docToTransaction(d: any): Transaction {
  const data = d.data ? d.data() : d;
  return {
    id:                   d.id,
    transactionId:        data.transactionId        || '',
    date:                 data.date                 || '',
    time:                 data.time                 || '',
    company:              data.company              || '',
    mainCategory:         data.mainCategory         || '',
    subCategory:          data.subCategory          || '',
    detailCategory:       data.detailCategory,
    amount:               data.amount               || 0,
    mode:                 data.mode                 || 'Cash',
    bankName:             data.bankName,
    bankId:               data.bankId,
    chequeNumber:         data.chequeNumber,
    chequeDate:           data.chequeDate,
    chequeBank:           data.chequeBank,
    transactionReference: data.transactionReference,
    note:                 data.note                 || '',
    paidBy:               data.paidBy,
    paidTo:               data.paidTo,
    amountPaid:           data.amountPaid,
    paymentStatus:        data.paymentStatus,
    remainingAmount:      data.remainingAmount,
    partialPayments:      data.partialPayments      || [],
    totalPaid:            data.totalPaid,
    isFullyCleared:       data.isFullyCleared,
    linkedType:           data.linkedType,
    linkedId:             data.linkedId,
    linkedRef:            data.linkedRef,
    baseSalary:           data.baseSalary,
    commission:           data.commission,
    deductions:           data.deductions,
    netAmount:            data.netAmount,
    salaryMonth:          data.salaryMonth,
    isAdvanceSalary:      data.isAdvanceSalary,
    loanType:             data.loanType,
    borrowerName:         data.borrowerName,
    lenderName:           data.lenderName,
    expectedReturnDate:   data.expectedReturnDate,
    dueDate:              data.dueDate,
    createdAt:            data.createdAt,
    updatedAt:            data.updatedAt,
  } as Transaction;
}

export class TransactionFirebaseService {

  // ── Auto-generate Transaction ID: TXN-DDMMYY-NNN ──────────────────────────
  static async generateTransactionId(): Promise<string> {
    const now = new Date();
    const dd  = String(now.getDate()).padStart(2, '0');
    const mm  = String(now.getMonth() + 1).padStart(2, '0');
    const yy  = String(now.getFullYear()).slice(-2);
    const key = `${dd}${mm}${yy}`;
    const ref = doc(db, COUNTER_COL, key);

    try {
      const next = await runTransaction(db, async (txn) => {
        const snap = await txn.get(ref);
        const n    = snap.exists() ? (snap.data().count || 0) + 1 : 1;
        txn.set(ref, { date: key, count: n }, { merge: true });
        return n;
      });
      return `TXN-${key}-${String(next).padStart(3, '0')}`;
    } catch (err) {
      console.error('Counter transaction failed, using timestamp fallback:', err);
      const suffix = String(Date.now()).slice(-5);
      return `TXN-${key}-${suffix}`;
    }
  }

  // ── Check if a transaction ID already exists ──────────────────────────────
  static async transactionIdExists(transactionId: string): Promise<boolean> {
    try {
      const q    = query(collection(db, COLLECTION), where('transactionId', '==', transactionId));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch {
      return false;
    }
  }

  // ── Fetch all transactions (newest first) ─────────────────────────────────
  static async fetchAllTransactions(): Promise<Transaction[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION));
      const list = snapshot.docs.map(docToTransaction);
      list.sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return (b.time || '').localeCompare(a.time || '');
      });
      console.log(`✅ Fetched ${list.length} transactions`);
      return list;
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  // ── Fetch single transaction ──────────────────────────────────────────────
  static async fetchTransactionById(id: string): Promise<Transaction | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION, id));
      if (!snap.exists()) return null;
      return docToTransaction(snap);
    } catch (error) {
      console.error('❌ Error fetching transaction:', error);
      throw new Error('Failed to fetch transaction');
    }
  }

  // ── Create transaction ────────────────────────────────────────────────────
  static async createTransaction(data: Omit<Transaction, 'id'>): Promise<Transaction> {
    try {
      const now  = new Date().toISOString();
      // Deep strip so no undefined anywhere in the tree
      const body = deepStripUndefined({ ...data, createdAt: now, updatedAt: now });
      const ref  = await addDoc(collection(db, COLLECTION), body);
      console.log('✅ Transaction created:', ref.id);
      return { ...data, id: ref.id, createdAt: now, updatedAt: now };
    } catch (error) {
      console.error('❌ Error creating transaction:', error);
      throw new Error('Failed to create transaction');
    }
  }

  // ── Update transaction ────────────────────────────────────────────────────
  static async updateTransaction(id: string, data: Partial<Omit<Transaction, 'id'>>): Promise<void> {
    try {
      // Deep strip — catches undefined inside partialPayments[] objects and any other nested fields
      const body = deepStripUndefined({ ...data, updatedAt: new Date().toISOString() });
      await updateDoc(doc(db, COLLECTION, id), body);
      console.log('✅ Transaction updated:', id);
    } catch (error) {
      console.error('❌ Error updating transaction:', error);
      throw new Error('Failed to update transaction');
    }
  }

  // ── Delete transaction ────────────────────────────────────────────────────
  static async deleteTransaction(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
      console.log('✅ Transaction deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting transaction:', error);
      throw new Error('Failed to delete transaction');
    }
  }

  // ── Add partial payment to a transaction ─────────────────────────────────
  // The partial payment object may contain undefined fields (chequeNumber, bankId etc.)
  // deepStripUndefined inside updateTransaction handles these before the Firestore write.
  static async addPartialPayment(transactionId: string, payment: PartialPayment): Promise<void> {
    try {
      const snap = await getDoc(doc(db, COLLECTION, transactionId));
      if (!snap.exists()) throw new Error('Transaction not found');
      const tx = docToTransaction(snap);

      // Strip undefined from the new payment object before merging
      const cleanPayment    = deepStripUndefined(payment) as PartialPayment;
      const updatedPayments = [...(tx.partialPayments || []), cleanPayment];
      const totalPaid       = updatedPayments.reduce((s, p) => s + p.amount, 0);
      const remaining       = Math.max(0, tx.amount - totalPaid);
      const isFullyCleared  = remaining <= 0 && updatedPayments.every(p => p.isCleared || p.method === 'Bank');

      // updateTransaction also deep-strips, so doubly safe
      await TransactionFirebaseService.updateTransaction(transactionId, {
        partialPayments: updatedPayments,
        totalPaid,
        remainingAmount: remaining,
        isFullyCleared,
        paymentStatus:   remaining <= 0 ? 'Full' : 'Partial',
      });
      console.log('✅ Partial payment added:', transactionId);
    } catch (error) {
      console.error('❌ Error adding partial payment:', error);
      throw new Error('Failed to add partial payment');
    }
  }

  // ── Mark a partial payment as cleared ────────────────────────────────────
  static async markPaymentCleared(transactionId: string, paymentId: string): Promise<void> {
    try {
      const snap = await getDoc(doc(db, COLLECTION, transactionId));
      if (!snap.exists()) throw new Error('Transaction not found');
      const tx = docToTransaction(snap);

      const updatedPayments = (tx.partialPayments || []).map(p =>
        p.id === paymentId ? { ...p, isCleared: true } : p
      );
      const totalPaid      = updatedPayments.reduce((s, p) => s + p.amount, 0);
      const remaining      = Math.max(0, tx.amount - totalPaid);
      const isFullyCleared = remaining <= 0 && updatedPayments.every(p => p.isCleared);

      await TransactionFirebaseService.updateTransaction(transactionId, {
        partialPayments: updatedPayments,
        totalPaid,
        remainingAmount: remaining,
        isFullyCleared,
      });
      console.log('✅ Payment cleared:', paymentId);
    } catch (error) {
      console.error('❌ Error marking payment cleared:', error);
      throw new Error('Failed to mark payment as cleared');
    }
  }
}