import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { getAuth } from 'firebase/auth';
import { CommissionSlab, Commission } from './types';

const SLABS_COLLECTION = 'commission_slabs';
const COMMISSIONS_COLLECTION = 'commissions';

// ==================== HELPERS ====================

// Safe number conversion
function toNumber(value: any, field: string): number {
  if (value === "" || value === null || value === undefined) {
    throw new Error(`${field} is required`);
  }

  const num = Number(value);

  if (isNaN(num)) {
    throw new Error(`${field} must be a valid number`);
  }

  return num;
}

// Remove undefined
function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

// ==================== SERVICE ====================

export class CommissionFirebaseService {

  // ==================== SLABS ====================

  static async fetchAllSlabs(): Promise<CommissionSlab[]> {
    const q = query(collection(db, SLABS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CommissionSlab));
  }

  static async fetchSlabById(id: string): Promise<CommissionSlab | null> {
    const snapshot = await getDoc(doc(db, SLABS_COLLECTION, id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as CommissionSlab;
  }

  static async createSlab(data: Omit<CommissionSlab, 'id'>): Promise<CommissionSlab> {
    try {
      // ✅ Ensure user is logged in
      const user = getAuth().currentUser;
      if (!user) throw new Error("User not authenticated");

      const now = new Date().toISOString();

      // 🔥 SAFE PAYLOAD (NO NaN POSSIBLE) - Include all fields from DTO
      const payload = {
        salesperson: data.salesperson,
        city: data.city,
        fromAmount: toNumber(data.fromAmount, "From Amount"),
        toAmount: toNumber(data.toAmount, "To Amount"),
        commissionPercentage: toNumber(data.commissionPercentage, "Commission Percentage"),
        createdAt: now,
        updatedAt: now
      }; 
      console.log("✅ FINAL PAYLOAD:", payload);

      const docRef = await addDoc(collection(db, SLABS_COLLECTION), payload);

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
        salesperson: data.salesperson,
        city: data.city,
        fromAmount: data.fromAmount !== undefined ? toNumber(data.fromAmount, "From Amount") : undefined,
        toAmount: data.toAmount !== undefined ? toNumber(data.toAmount, "To Amount") : undefined,
        commissionPercentage: data.commissionPercentage !== undefined ? toNumber(data.commissionPercentage, "Commission Percentage") : undefined,
        updatedAt: new Date().toISOString()
      });

      await updateDoc(doc(db, SLABS_COLLECTION, id), payload);

    } catch (error: any) {
      console.error('❌ Error updating slab:', error.message);
      throw new Error(error.message || 'Failed to update slab');
    }
  }

  static async deleteSlab(id: string) {
    await deleteDoc(doc(db, SLABS_COLLECTION, id));
  }

  // ==================== COMMISSIONS ====================

  static async fetchAllCommissions(): Promise<Commission[]> {
    const q = query(collection(db, COMMISSIONS_COLLECTION), orderBy('calculatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Commission));
  }

  // Upsert: for each commission, delete ALL existing records with the same
  // salesperson + month + city before saving the new one.
  // This prevents stale/duplicate records accumulating in Firestore.
  static async saveCommissions(commissions: Omit<Commission, 'id'>[]): Promise<Commission[]> {
    const saved: Commission[] = [];

    for (const commission of commissions) {
      // 1. Delete any existing records for this salesperson+month+city
      await CommissionFirebaseService.deleteExistingCommissions(
        commission.salesperson,
        commission.month,
        commission.city
      );

      // 2. Save the new record
      const payload = stripUndefined(commission);
      const docRef = await addDoc(collection(db, COMMISSIONS_COLLECTION), payload);
      saved.push({ id: docRef.id, ...payload } as Commission);
    }

    return saved;
  }

  // Delete all Firestore commission docs for a given salesperson+month+city.
  // Called before saving a new calculation AND when no slab matched
  // (so a previously saved record doesn't linger as stale data).
  static async deleteExistingCommissions(
    salesperson: string,
    month: string,
    city: string
  ): Promise<void> {
    const q = query(
      collection(db, COMMISSIONS_COLLECTION),
      where('salesperson', '==', salesperson),
      where('month', '==', month),
      where('city', '==', city)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log(
      `[CommissionFirebase] Deleted ${snapshot.size} stale record(s) for ` +
      `${salesperson} / ${month} / ${city}`
    );
  }

  static async updateCommission(id: string, data: Partial<Omit<Commission, 'id'>>) {
    const payload = stripUndefined(data);
    await updateDoc(doc(db, COMMISSIONS_COLLECTION, id), payload);
  }

  static async deleteCommission(id: string) {
    await deleteDoc(doc(db, COMMISSIONS_COLLECTION, id));
  }
}