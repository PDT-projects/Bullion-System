// Commission Module - Firebase Service Layer
// All Firestore operations for commission_slabs and commissions collections

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
  where
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { CommissionSlab, Commission } from './types';

const SLABS_COLLECTION = 'commission_slabs';
const COMMISSIONS_COLLECTION = 'commissions';

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

// ==================== COMMISSION SLABS ====================

export class CommissionFirebaseService {

  static async fetchAllSlabs(): Promise<CommissionSlab[]> {
    try {
      const q = query(collection(db, SLABS_COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CommissionSlab));
    } catch (error) {
      console.error('❌ Error fetching slabs:', error);
      throw new Error('Failed to fetch commission slabs');
    }
  }

  static async fetchSlabById(id: string): Promise<CommissionSlab | null> {
    try {
      const snapshot = await getDoc(doc(db, SLABS_COLLECTION, id));
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as CommissionSlab;
    } catch (error) {
      console.error('❌ Error fetching slab:', error);
      throw new Error('Failed to fetch commission slab');
    }
  }

  static async createSlab(data: Omit<CommissionSlab, 'id'>): Promise<CommissionSlab> {
    try {
      const now = new Date().toISOString();
      const payload = stripUndefined({ ...data, createdAt: now, updatedAt: now });
      const docRef = await addDoc(collection(db, SLABS_COLLECTION), payload);
      console.log('✅ Slab created:', docRef.id);
      return { id: docRef.id, ...payload } as CommissionSlab;
    } catch (error) {
      console.error('❌ Error creating slab:', error);
      throw new Error('Failed to create commission slab');
    }
  }

  static async updateSlab(id: string, data: Partial<Omit<CommissionSlab, 'id'>>): Promise<void> {
    try {
      const payload = stripUndefined({ ...data, updatedAt: new Date().toISOString() });
      await updateDoc(doc(db, SLABS_COLLECTION, id), payload);
      console.log('✅ Slab updated:', id);
    } catch (error) {
      console.error('❌ Error updating slab:', error);
      throw new Error('Failed to update commission slab');
    }
  }

  static async deleteSlab(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, SLABS_COLLECTION, id));
      console.log('✅ Slab deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting slab:', error);
      throw new Error('Failed to delete commission slab');
    }
  }

  // ==================== COMMISSIONS ====================

  static async fetchAllCommissions(): Promise<Commission[]> {
    try {
      const q = query(collection(db, COMMISSIONS_COLLECTION), orderBy('calculatedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Commission));
    } catch (error) {
      console.error('❌ Error fetching commissions:', error);
      throw new Error('Failed to fetch commissions');
    }
  }

  static async saveCommissions(commissions: Omit<Commission, 'id'>[]): Promise<Commission[]> {
    try {
      const saved: Commission[] = [];
      for (const commission of commissions) {
        const payload = stripUndefined(commission);
        const docRef = await addDoc(collection(db, COMMISSIONS_COLLECTION), payload);
        saved.push({ id: docRef.id, ...payload } as Commission);
      }
      console.log(`✅ Saved ${saved.length} commissions`);
      return saved;
    } catch (error) {
      console.error('❌ Error saving commissions:', error);
      throw new Error('Failed to save commissions');
    }
  }

  static async updateCommission(id: string, data: Partial<Omit<Commission, 'id'>>): Promise<void> {
    try {
      const payload = stripUndefined(data);
      await updateDoc(doc(db, COMMISSIONS_COLLECTION, id), payload);
      console.log('✅ Commission updated:', id);
    } catch (error) {
      console.error('❌ Error updating commission:', error);
      throw new Error('Failed to update commission');
    }
  }

  static async deleteCommission(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COMMISSIONS_COLLECTION, id));
    } catch (error) {
      console.error('❌ Error deleting commission:', error);
      throw new Error('Failed to delete commission');
    }
  }
}