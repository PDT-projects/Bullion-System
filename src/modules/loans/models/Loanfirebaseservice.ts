/**
 * Loans Module - Firebase Firestore Service Layer
 * Handles all Firestore CRUD and payment operations for loans.
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
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import type {
  Loan,
  CreateLoanDTO,
  UpdateLoanDTO,
  MakePaymentDTO,
  LoanStatus,
  PaymentRecord,
} from './types';

const LOANS_COLLECTION = 'loans';

// ==================== UTILITIES ====================

/**
 * Removes all undefined values from an object before sending to Firestore.
 * Firestore rejects documents containing undefined fields.
 */
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

// ==================== TRANSFORM ====================

function transformDocToLoan(docSnap: any): Loan {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    entityName: d.entityName || '',
    receiverName: d.receiverName || '',
    receiverType: d.receiverType || 'Person',
    receiverId: d.receiverId || '',
    receiverPhone: d.receiverPhone || '',
    loanAmount: d.loanAmount || 0,
    paid: d.paid || 0,
    remaining: d.remaining || 0,
    type: d.type || 'Payable',
    loanType: d.loanType || 'Official',
    status: d.status || 'Partial',
    date: d.date || '',
    mode: d.mode || 'Cash',
    bankId: d.bankId || '',
    bankName: d.bankName || '',
    employeeId: d.employeeId || '',
    employeeName: d.employeeName || '',
    notes: d.notes || '',
    paymentHistory: d.paymentHistory || [],
    createdAt: d.createdAt || '',
    updatedAt: d.updatedAt || '',
  };
}

// ==================== READ ====================

export class LoanFirebaseService {

  static async fetchAllLoans(): Promise<Loan[]> {
    try {
      console.log('🔥 Fetching all loans from Firestore...');
      const ref = collection(db, LOANS_COLLECTION);
      const q = query(ref, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);

      const loans: Loan[] = [];
      snapshot.forEach(doc => loans.push(transformDocToLoan(doc)));

      console.log(`✅ Fetched ${loans.length} loans`);
      return loans;
    } catch (error) {
      console.error('❌ Error fetching loans:', error);
      throw new Error('Failed to fetch loans from Firestore');
    }
  }

  static async fetchLoanById(id: string): Promise<Loan | null> {
    try {
      console.log(`🔥 Fetching loan ${id}...`);
      const ref = doc(db, LOANS_COLLECTION, id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.log('⚠️ Loan not found');
        return null;
      }

      const loan = transformDocToLoan(snap);
      console.log('✅ Loan fetched:', loan.entityName);
      return loan;
    } catch (error) {
      console.error(`❌ Error fetching loan ${id}:`, error);
      throw new Error('Failed to fetch loan from Firestore');
    }
  }

  // ==================== WRITE ====================

  static async createLoan(dto: CreateLoanDTO): Promise<Loan> {
    try {
      console.log('🔥 Creating loan in Firestore:', dto.entityName);
      const now = new Date().toISOString();
      const remaining = dto.loanAmount - dto.paid;
      const status: LoanStatus = remaining === 0 ? 'Full' : 'Partial';

      // Build initial payment record — strip undefined optional fields
      const initialPayment: PaymentRecord[] = dto.paid > 0 ? [
        stripUndefined({
          id: `PAY-${Date.now().toString(36).toUpperCase()}`,
          amount: dto.paid,
          mode: dto.mode === 'Bank' ? 'Bank Transfer' : 'Cash',
          date: dto.date,
          bankId: dto.bankId,
          bankName: dto.bankName,
        })
      ] : [];

      // Build the document — strip undefined before sending to Firestore
      const data = stripUndefined({
        entityName: dto.entityName,
        receiverName: dto.receiverName,
        receiverType: dto.receiverType,
        receiverId: dto.receiverId,
        receiverPhone: dto.receiverPhone,
        loanAmount: dto.loanAmount,
        paid: dto.paid,
        remaining,
        type: dto.type,
        loanType: dto.loanType,
        status,
        date: dto.date,
        mode: dto.mode,
        bankId: dto.bankId,
        bankName: dto.bankName,
        employeeId: dto.employeeId,
        employeeName: dto.employeeName,
        notes: dto.notes,
        paymentHistory: initialPayment,
        createdAt: now,
        updatedAt: now,
      });

      const ref = collection(db, LOANS_COLLECTION);
      const docRef = await addDoc(ref, data);

      const created: Loan = { ...transformDocToLoan({ id: docRef.id, data: () => data }), id: docRef.id };
      console.log('✅ Loan created:', docRef.id);
      return created;
    } catch (error) {
      console.error('❌ Error creating loan:', error);
      throw new Error('Failed to create loan in Firestore');
    }
  }

  static async updateLoan(dto: UpdateLoanDTO, existing: Loan): Promise<Loan> {
    try {
      console.log('🔥 Updating loan:', dto.id);
      const now = new Date().toISOString();

      const loanAmount = dto.loanAmount ?? existing.loanAmount;
      const paid = dto.paid ?? existing.paid;
      const remaining = loanAmount - paid;
      const status: LoanStatus = remaining === 0 ? 'Full' : 'Partial';

      // Merge existing with updates, then strip undefined
      const updated = stripUndefined({
        entityName: dto.entityName ?? existing.entityName,
        receiverName: dto.receiverName ?? existing.receiverName,
        receiverType: dto.receiverType ?? existing.receiverType,
        receiverId: dto.receiverId ?? existing.receiverId,
        receiverPhone: dto.receiverPhone ?? existing.receiverPhone,
        loanAmount,
        paid,
        remaining,
        type: dto.type ?? existing.type,
        loanType: dto.loanType ?? existing.loanType,
        status,
        date: dto.date ?? existing.date,
        mode: dto.mode ?? existing.mode,
        bankId: dto.bankId ?? existing.bankId,
        bankName: dto.bankName ?? existing.bankName,
        employeeId: dto.employeeId ?? existing.employeeId,
        employeeName: dto.employeeName ?? existing.employeeName,
        notes: dto.notes ?? existing.notes,
        paymentHistory: existing.paymentHistory,
        createdAt: existing.createdAt,
        updatedAt: now,
      });

      const ref = doc(db, LOANS_COLLECTION, dto.id);
      await updateDoc(ref, updated);

      console.log('✅ Loan updated:', dto.id);
      return { ...updated, id: dto.id } as Loan;
    } catch (error) {
      console.error('❌ Error updating loan:', error);
      throw new Error('Failed to update loan in Firestore');
    }
  }

  static async deleteLoan(id: string): Promise<void> {
    try {
      console.log('🔥 Deleting loan:', id);
      const ref = doc(db, LOANS_COLLECTION, id);
      await deleteDoc(ref);
      console.log('✅ Loan deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting loan:', error);
      throw new Error('Failed to delete loan from Firestore');
    }
  }

  static async makePayment(dto: MakePaymentDTO, loan: Loan): Promise<Loan> {
    try {
      console.log('🔥 Recording payment for loan:', dto.loanId);
      const now = new Date().toISOString();

      // Strip undefined from payment record (bankId/bankName are optional)
      const paymentRecord: PaymentRecord = stripUndefined({
        id: `PAY-${Date.now().toString(36).toUpperCase()}`,
        amount: dto.amount,
        mode: dto.mode === 'Bank' ? 'Bank Transfer' : 'Cash',
        date: dto.date || new Date().toISOString().split('T')[0],
        bankId: dto.bankId,
        bankName: dto.bankName,
      });

      const newPaid = loan.paid + dto.amount;
      const newRemaining = loan.loanAmount - newPaid;
      const newStatus: LoanStatus = newRemaining === 0 ? 'Full' : 'Partial';

      const updatedLoan: Loan = {
        ...loan,
        paid: newPaid,
        remaining: newRemaining,
        status: newStatus,
        paymentHistory: [...(loan.paymentHistory || []), paymentRecord],
        updatedAt: now,
      };

      const ref = doc(db, LOANS_COLLECTION, dto.loanId);
      await updateDoc(ref, {
        paid: updatedLoan.paid,
        remaining: updatedLoan.remaining,
        status: updatedLoan.status,
        paymentHistory: updatedLoan.paymentHistory,
        updatedAt: now,
      });

      console.log('✅ Payment recorded for loan:', dto.loanId);
      return updatedLoan;
    } catch (error) {
      console.error('❌ Error recording payment:', error);
      throw new Error('Failed to record payment in Firestore');
    }
  }

  static isConnected(): boolean {
    return !!db;
  }
}