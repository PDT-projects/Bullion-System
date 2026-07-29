// Payroll Module - Unified Firebase Service
// Merges SalaryFirebaseService + CommissionFirebaseService

import {
  collection, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, doc, query, orderBy, where, writeBatch,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { getAuth } from 'firebase/auth';
import { Salary, CommissionSlab, Commission } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function toNumber(value: any, field: string): number {
  if (value === '' || value === null || value === undefined)
    throw new Error(`${field} is required`);
  const num = Number(value);
  if (isNaN(num)) throw new Error(`${field} must be a valid number`);
  return num;
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

// ─── Collection names ─────────────────────────────────────────────────────────

const SALARIES_COL   = 'salaries';
const SLABS_COL      = 'commission_slabs';
const COMMISSIONS_COL = 'commissions';

// ─── Salary operations ────────────────────────────────────────────────────────

export class PayrollFirebaseService {

  // ── Salaries ────────────────────────────────────────────────────────────────

  static async fetchAllSalaries(): Promise<Salary[]> {
    try {
      const q        = query(collection(db, SALARIES_COL), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Salary));
    } catch (error) {
      console.error('❌ Error fetching salaries:', error);
      throw new Error('Failed to fetch salaries from Firestore');
    }
  }

  static async fetchSalaryById(id: string): Promise<Salary | null> {
    try {
      const snapshot = await getDoc(doc(db, SALARIES_COL, id));
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as Salary;
    } catch (error) {
      console.error('❌ Error fetching salary by ID:', error);
      throw new Error('Failed to fetch salary from Firestore');
    }
  }

  static async createSalary(data: Omit<Salary, 'id'>): Promise<Salary> {
    try {
      const now     = new Date().toISOString();
      const payload = deepStripUndefined({ ...data, createdAt: now, updatedAt: now });
      const docRef  = await addDoc(collection(db, SALARIES_COL), payload);
      return { id: docRef.id, ...payload } as Salary;
    } catch (error) {
      console.error('❌ Error creating salary:', error);
      throw new Error('Failed to create salary in Firestore');
    }
  }

  static async updateSalary(id: string, data: Partial<Omit<Salary, 'id'>>): Promise<void> {
    try {
      const payload = deepStripUndefined({ ...data, updatedAt: new Date().toISOString() });
      await updateDoc(doc(db, SALARIES_COL, id), payload);
    } catch (error) {
      console.error('❌ Error updating salary:', error);
      throw new Error('Failed to update salary in Firestore');
    }
  }

  static async deleteSalary(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, SALARIES_COL, id));
    } catch (error) {
      console.error('❌ Error deleting salary:', error);
      throw new Error('Failed to delete salary from Firestore');
    }
  }

  // ── Commission Slabs ─────────────────────────────────────────────────────────

  static async fetchAllSlabs(): Promise<CommissionSlab[]> {
    const q = query(collection(db, SLABS_COL), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CommissionSlab));
  }

  static async fetchSlabById(id: string): Promise<CommissionSlab | null> {
    const snapshot = await getDoc(doc(db, SLABS_COL, id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as CommissionSlab;
  }

  static async createSlab(data: Omit<CommissionSlab, 'id'>): Promise<CommissionSlab> {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('User not authenticated');
      const now = new Date().toISOString();
      const payload = {
        salesperson:          data.salesperson,
        city:                 data.city,
        fromAmount:           toNumber(data.fromAmount, 'From Amount'),
        toAmount:             toNumber(data.toAmount, 'To Amount'),
        commissionPercentage: toNumber(data.commissionPercentage, 'Commission Percentage'),
        createdAt:            now,
        updatedAt:            now,
      };
      const docRef = await addDoc(collection(db, SLABS_COL), payload);
      return { id: docRef.id, ...payload };
    } catch (error: any) {
      console.error('❌ Error creating slab:', error.message);
      throw new Error(error.message || 'Failed to create commission slab');
    }
  }

  static async updateSlab(id: string, data: Partial<Omit<CommissionSlab, 'id'>>) {
    try {
      const payload = stripUndefined({
        ...data,
        fromAmount:           data.fromAmount           !== undefined ? toNumber(data.fromAmount,           'From Amount')           : undefined,
        toAmount:             data.toAmount             !== undefined ? toNumber(data.toAmount,             'To Amount')             : undefined,
        commissionPercentage: data.commissionPercentage !== undefined ? toNumber(data.commissionPercentage, 'Commission Percentage') : undefined,
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, SLABS_COL, id), payload);
    } catch (error: any) {
      console.error('❌ Error updating slab:', error.message);
      throw new Error(error.message || 'Failed to update slab');
    }
  }

  static async deleteSlab(id: string) {
    await deleteDoc(doc(db, SLABS_COL, id));
  }

  // ── Commissions ──────────────────────────────────────────────────────────────

  static async fetchAllCommissions(): Promise<Commission[]> {
    const q = query(collection(db, COMMISSIONS_COL), orderBy('calculatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Commission));
  }

  static async saveCommissions(commissions: Omit<Commission, 'id'>[]): Promise<Commission[]> {
    const saved: Commission[] = [];
    for (const commission of commissions) {
      await PayrollFirebaseService.deleteExistingCommissions(
        commission.salesperson,
        commission.month,
        commission.city
      );
      const payload = stripUndefined(commission);
      const docRef  = await addDoc(collection(db, COMMISSIONS_COL), payload);
      saved.push({ id: docRef.id, ...payload } as Commission);
    }
    return saved;
  }

  static async deleteExistingCommissions(
    salesperson: string,
    month: string,
    city: string
  ): Promise<void> {
    const q = query(
      collection(db, COMMISSIONS_COL),
      where('salesperson', '==', salesperson),
      where('month',       '==', month),
      where('city',        '==', city)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  static async updateCommission(id: string, data: Partial<Omit<Commission, 'id'>>) {
    const payload = stripUndefined(data);
    await updateDoc(doc(db, COMMISSIONS_COL, id), payload);
  }

  static async deleteCommission(id: string) {
    await deleteDoc(doc(db, COMMISSIONS_COL, id));
  }
}

// ─── Named re-exports for backward compatibility ──────────────────────────────
// Old modules importing SalaryFirebaseService or CommissionFirebaseService
// directly will still work without changes.

export const SalaryFirebaseService     = PayrollFirebaseService;
export const CommissionFirebaseService = PayrollFirebaseService;