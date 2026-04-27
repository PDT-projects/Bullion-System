// Transactions Module - Firebase Service
// Adds: approval workflow (approve/reject), AppNotification CRUD

import {
  collection, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, doc, query, where, runTransaction,
  onSnapshot, orderBy, Unsubscribe, deleteField,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { Transaction, PartialPayment, AppNotification, DynamicCategory } from './types';

const COLLECTION       = 'transactions';
const COUNTER_COL      = 'transactionCounters';
const NOTIF_COLLECTION = 'appNotifications';
const CATEGORIES_COL   = 'dynamicCategories';
const COMPANIES_COL    = 'companies';

// ── Deep strip of undefined values ───────────────────────────────────────────
function deepStripUndefined(value: any): any {
  if (Array.isArray(value)) return value.map(deepStripUndefined);
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
    // Approval fields
    approvalStatus:       data.approvalStatus       || 'not_required',
    approvalToken:        data.approvalToken,
    approvedAt:           data.approvedAt,
    rejectedAt:           data.rejectedAt,
    rejectionReason:      data.rejectionReason,
    createdAt:            data.createdAt,
    updatedAt:            data.updatedAt,
    // P&L classification
    plMainCategory:       data.plMainCategory,
    plSubCategory:        data.plSubCategory,
    // Balance Sheet classification
    bsMainCategory:       data.bsMainCategory,
    bsSubCategory:        data.bsSubCategory,
  } as Transaction;
}

function docToNotification(d: any): AppNotification {
  const data = d.data();
  return {
    id:             d.id,
    type:           data.type           || 'info',
    title:          data.title          || '',
    message:        data.message        || '',
    transactionId:  data.transactionId,
    transactionRef: data.transactionRef,
    isRead:         data.isRead         ?? false,
    createdAt:      data.createdAt      || new Date().toISOString(),
    expiresAt:      data.expiresAt,
  };
}

export class TransactionFirebaseService {

  // ── Auto-generate Transaction ID ──────────────────────────────────────────
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
      return `TXN-${key}-${String(Date.now()).slice(-5)}`;
    }
  }

  static async transactionIdExists(transactionId: string): Promise<boolean> {
    try {
      const q    = query(collection(db, COLLECTION), where('transactionId', '==', transactionId));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch {
      return false;
    }
  }

  // ── Fetch all transactions ────────────────────────────────────────────────
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
      const body = deepStripUndefined({ ...data, createdAt: now, updatedAt: now });

      // Debug: confirm classification fields reach Firestore (remove once confirmed working)
      console.log('📊 Saving classification:', {
        plMainCategory: body.plMainCategory ?? '(not set)',
        plSubCategory:  body.plSubCategory  ?? '(not set)',
        bsMainCategory: body.bsMainCategory ?? '(not set)',
        bsSubCategory:  body.bsSubCategory  ?? '(not set)',
      });

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
      // Strip undefined from everything except classification fields which may need
      // to be explicitly deleted when the user clears them in the form.
      // Firestore updateDoc is a MERGE — omitting a key leaves the old value untouched,
      // so we must send deleteField() when the user clears a classification.
      const base = deepStripUndefined({ ...data, updatedAt: new Date().toISOString() });

      // Override classification fields: empty string → deleteField() sentinel
      if ('plMainCategory' in data)
        base.plMainCategory = data.plMainCategory || deleteField();
      if ('plSubCategory' in data)
        base.plSubCategory  = data.plSubCategory  || deleteField();
      if ('bsMainCategory' in data)
        base.bsMainCategory = data.bsMainCategory || deleteField();
      if ('bsSubCategory' in data)
        base.bsSubCategory  = data.bsSubCategory  || deleteField();

      // Debug: confirm classification fields (remove once confirmed working)
      console.log('📊 Updating classification:', {
        plMainCategory: data.plMainCategory ?? '(unchanged)',
        plSubCategory:  data.plSubCategory  ?? '(unchanged)',
        bsMainCategory: data.bsMainCategory ?? '(unchanged)',
        bsSubCategory:  data.bsSubCategory  ?? '(unchanged)',
      });

      await updateDoc(doc(db, COLLECTION, id), base);
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

  // ── Approval workflow ─────────────────────────────────────────────────────

  /**
   * Called from the approve HTTP Cloud Function.
   * Updates the transaction status to 'approved' and clears the token.
   */
  static async approveTransaction(firestoreId: string): Promise<void> {
    await TransactionFirebaseService.updateTransaction(firestoreId, {
      approvalStatus: 'approved',
      approvedAt:     new Date().toISOString(),
      approvalToken:  undefined,
    });
  }

  /**
   * Called from the reject HTTP Cloud Function.
   */
  static async rejectTransaction(firestoreId: string, reason?: string): Promise<void> {
    await TransactionFirebaseService.updateTransaction(firestoreId, {
      approvalStatus:  'rejected',
      rejectedAt:      new Date().toISOString(),
      rejectionReason: reason || 'Rejected by admin',
      approvalToken:   undefined,
    });
  }

  /**
   * Fetch all transactions pending approval.
   */
  static async fetchPendingApprovals(): Promise<Transaction[]> {
    try {
      const q    = query(collection(db, COLLECTION), where('approvalStatus', '==', 'pending_approval'));
      const snap = await getDocs(q);
      return snap.docs.map(docToTransaction);
    } catch (error) {
      console.error('❌ Error fetching pending approvals:', error);
      throw new Error('Failed to fetch pending approvals');
    }
  }

  // ── Partial payments ──────────────────────────────────────────────────────
  static async addPartialPayment(transactionId: string, payment: PartialPayment): Promise<void> {
    try {
      const snap = await getDoc(doc(db, COLLECTION, transactionId));
      if (!snap.exists()) throw new Error('Transaction not found');
      const tx = docToTransaction(snap);

      const cleanPayment    = deepStripUndefined(payment) as PartialPayment;
      const updatedPayments = [...(tx.partialPayments || []), cleanPayment];
      const totalPaid       = updatedPayments.reduce((s, p) => s + p.amount, 0);
      const remaining       = Math.max(0, tx.amount - totalPaid);
      const isFullyCleared  = remaining <= 0 && updatedPayments.every(p => p.isCleared || p.method === 'Bank');

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

  // ── Mark the main cheque transaction itself as cleared ────────────────────
  static async markTransactionCleared(transactionId: string): Promise<void> {
    try {
      await TransactionFirebaseService.updateTransaction(transactionId, {
        isFullyCleared: true,
        paymentStatus:  'Full',
      });
      console.log('✅ Transaction cleared:', transactionId);
    } catch (error) {
      console.error('❌ Error clearing transaction:', error);
      throw new Error('Failed to clear transaction');
    }
  }

  // ── App Notifications (Firestore) ─────────────────────────────────────────

  /** Create a notification document */
  static async createNotification(
    data: Omit<AppNotification, 'id'>
  ): Promise<AppNotification> {
    const ref = await addDoc(collection(db, NOTIF_COLLECTION), deepStripUndefined(data));
    return { ...data, id: ref.id };
  }

  /** Mark one notification as read */
  static async markNotificationRead(id: string): Promise<void> {
    await updateDoc(doc(db, NOTIF_COLLECTION, id), { isRead: true });
  }

  /** Mark all notifications as read */
  static async markAllNotificationsRead(): Promise<void> {
    const snap = await getDocs(
      query(collection(db, NOTIF_COLLECTION), where('isRead', '==', false))
    );
    await Promise.all(snap.docs.map(d => updateDoc(d.ref, { isRead: true })));
  }

  /** Delete a notification */
  static async deleteNotification(id: string): Promise<void> {
    await deleteDoc(doc(db, NOTIF_COLLECTION, id));
  }

  /** Delete notifications related to a specific transaction */
  static async deleteNotificationsForTransaction(transactionId: string): Promise<void> {
    try {
      const q    = query(collection(db, NOTIF_COLLECTION), where('transactionId', '==', transactionId));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    } catch (err) {
      console.error('Failed to delete notifications for transaction:', err);
    }
  }

  /**
   * Real-time listener for notifications (newest first).
   * Returns an unsubscribe function — call it on component unmount.
   */
  static subscribeToNotifications(
    callback: (notifications: AppNotification[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, NOTIF_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      const notifications = snap.docs.map(docToNotification);
      callback(notifications);
    });
  }

  // ── Dynamic Categories ────────────────────────────────────────────────────

  /** Fetch all user-added categories */
  static async fetchDynamicCategories(): Promise<DynamicCategory[]> {
    try {
      const snap = await getDocs(collection(db, CATEGORIES_COL));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as DynamicCategory));
    } catch (error) {
      console.error('❌ Error fetching dynamic categories:', error);
      return [];
    }
  }

  /** Add a new dynamic category */
  static async addDynamicCategory(
    data: Omit<DynamicCategory, 'id'>
  ): Promise<DynamicCategory> {
    const ref = await addDoc(collection(db, CATEGORIES_COL), deepStripUndefined(data));
    console.log('✅ Dynamic category added:', ref.id);
    return { ...data, id: ref.id };
  }

  /** Delete a dynamic category */
  static async deleteDynamicCategory(id: string): Promise<void> {
    await deleteDoc(doc(db, CATEGORIES_COL, id));
  }

  // ── Companies / Branches ──────────────────────────────────────────────────

  /** Fetch all companies/branches from Firestore */
  static async fetchCompanies(): Promise<{ id: string; name: string; createdAt: string }[]> {
    try {
      const snap = await getDocs(collection(db, COMPANIES_COL));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; name: string; createdAt: string }));
    } catch (error) {
      console.error('❌ Error fetching companies:', error);
      return [];
    }
  }

  /** Add a new company/branch */
  static async addCompany(name: string): Promise<{ id: string; name: string; createdAt: string }> {
    const data = { name: name.trim(), createdAt: new Date().toISOString() };
    const ref = await addDoc(collection(db, COMPANIES_COL), deepStripUndefined(data));
    console.log('✅ Company added:', ref.id);
    return { ...data, id: ref.id };
  }

  /** Delete a company/branch */
  static async deleteCompany(id: string): Promise<void> {
    await deleteDoc(doc(db, COMPANIES_COL, id));
  }
}
