// Payroll Batch Firebase Service

import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, query, orderBy, where, writeBatch,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { PayrollBatch, PayrollBatchRow, PaymentStatus, ApprovalStatus } from './payrollBatchTypes';

const BATCHES_COL = 'payroll_batches';
const ROWS_COL    = 'payroll_batch_rows';

function strip(obj: any): any {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

export class PayrollBatchFirebaseService {

  // ── Batches ────────────────────────────────────────────────────────────────

  static async fetchAllBatches(): Promise<PayrollBatch[]> {
    // No orderBy on single field avoids index issues; sort client-side
    const snap = await getDocs(collection(db, BATCHES_COL));
    const batches = snap.docs.map(d => ({ id: d.id, ...d.data() } as PayrollBatch));
    return batches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async fetchBatchById(id: string): Promise<PayrollBatch | null> {
    const snap = await getDoc(doc(db, BATCHES_COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as PayrollBatch : null;
  }

  static async createBatch(data: Omit<PayrollBatch, 'id'>): Promise<PayrollBatch> {
    const now    = new Date().toISOString();
    const ref    = await addDoc(collection(db, BATCHES_COL), strip({ ...data, createdAt: now, updatedAt: now }));
    return { id: ref.id, ...data, createdAt: now, updatedAt: now };
  }

  static async updateBatch(id: string, data: Partial<PayrollBatch>): Promise<void> {
    await updateDoc(doc(db, BATCHES_COL, id), strip({ ...data, updatedAt: new Date().toISOString() }));
  }

  static async deleteBatch(id: string): Promise<void> {
    // Delete all rows then the batch
    const rows = await PayrollBatchFirebaseService.fetchRowsByBatch(id);
    const batch = writeBatch(db);
    rows.forEach(r => batch.delete(doc(db, ROWS_COL, r.id)));
    batch.delete(doc(db, BATCHES_COL, id));
    await batch.commit();
  }

  // ── Rows ───────────────────────────────────────────────────────────────────

  static async fetchRowsByBatch(batchId: string): Promise<PayrollBatchRow[]> {
    // No orderBy — avoids Firestore composite index requirement.
    // Sort client-side instead.
    const q    = query(collection(db, ROWS_COL), where('batchId', '==', batchId));
    const snap = await getDocs(q);
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as PayrollBatchRow));
    return rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }

  static async fetchAllRows(): Promise<PayrollBatchRow[]> {
    // Fetch all rows across all batches in one query — no composite index needed
    const snap = await getDocs(collection(db, ROWS_COL));
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as PayrollBatchRow));
    // Sort newest batch first, then by name within each batch
    return rows.sort((a, b) => {
      if (a.salaryMonth !== b.salaryMonth) return b.salaryMonth.localeCompare(a.salaryMonth);
      return a.employeeName.localeCompare(b.employeeName);
    });
  }

  static async createRow(data: Omit<PayrollBatchRow, 'id'>): Promise<PayrollBatchRow> {
    const now = new Date().toISOString();
    const ref = await addDoc(collection(db, ROWS_COL), strip({ ...data, createdAt: now, updatedAt: now }));
    return { id: ref.id, ...data, createdAt: now, updatedAt: now };
  }

  static async updateRow(id: string, data: Partial<PayrollBatchRow>): Promise<void> {
    await updateDoc(doc(db, ROWS_COL, id), strip({ ...data, updatedAt: new Date().toISOString() }));
  }

  static async deleteRow(id: string): Promise<void> {
    await deleteDoc(doc(db, ROWS_COL, id));
  }

  // ── Bulk create rows from employee list ─────────────────────────────────────

  static async generateBatchRows(
    batchId: string,
    month:   string,
    year:    number,
    employees: any[],
    commissionMap: Record<string, number> = {}
  ): Promise<PayrollBatchRow[]> {
    const now  = new Date().toISOString();
    const rows: PayrollBatchRow[] = [];

    for (const emp of employees) {
      const basicSalary      = emp.salary || emp.basicSalary || 0;
      const commission       = commissionMap[emp.id] || 0;
      const grossEarning     = basicSalary + commission;
      const netSalary        = grossEarning;
      const row: Omit<PayrollBatchRow, 'id'> = {
        batchId,
        empId:             emp.id,
        empCode:           emp.empCode || emp.empId || '',
        employeeName:      emp.name    || emp.employeeName || '',
        department:        emp.department  || '',
        designation:       emp.designation || emp.position || '',
        year,
        salaryMonth:       month,
        basicSalary,
        overtime:          0,
        performanceBonus:  0,
        commission,
        grossEarning,
        leaves:            0,
        lateArrival:       0,
        earlyDepart:       0,
        penalty:           0,
        totalDeductions:   0,
        netSalary,
        advanceSalary:     0,
        remainingAmount:   netSalary,
        workStatus:        emp.status === 'active' ? 'Active' : 'Inactive',
        approvedByHR:      'Pending',
        approvedByManager: 'Pending',
        paymentStatus:     'Pending',
        paySlipGenerated:  false,
        createdAt:         now,
        updatedAt:         now,
      };
      const ref = await addDoc(collection(db, ROWS_COL), strip(row));
      rows.push({ id: ref.id, ...row });
    }
    return rows;
  }

  // ── Record payment for a row ────────────────────────────────────────────────

  static async recordPayment(rowId: string, paidBy: string): Promise<void> {
    await updateDoc(doc(db, ROWS_COL, rowId), {
      paymentStatus: 'Paid' as PaymentStatus,
      paidBy,
      paidAt:    new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // ── Approve row ─────────────────────────────────────────────────────────────

  static async approveByHR(rowId: string): Promise<void> {
    await updateDoc(doc(db, ROWS_COL, rowId), {
      approvedByHR: 'Approved' as ApprovalStatus,
      updatedAt:    new Date().toISOString(),
    });
  }

  static async approveByManager(rowId: string): Promise<void> {
    await updateDoc(doc(db, ROWS_COL, rowId), {
      approvedByManager: 'Approved' as ApprovalStatus,
      updatedAt:         new Date().toISOString(),
    });
  }
}