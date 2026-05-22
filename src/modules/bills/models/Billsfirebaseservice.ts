// Bills Module - Firebase Service Layer
// All Firestore operations for bills collection

import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { Bill } from './types';

export interface BillBranch {
  id: string;
  name: string;
  createdAt: string;
}

const BRANCHES_COLLECTION = 'billBranches';
const COLLECTION = 'bills';

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export class BillsFirebaseService {

  static async fetchAllBills(): Promise<Bill[]> {
    try {
      console.log('🔥 Fetching all bills from Firestore...');
      const q = query(collection(db, COLLECTION), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const bills = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bill));
      console.log(`✅ Fetched ${bills.length} bills`);
      return bills;
    } catch (error) {
      console.error('❌ Error fetching bills:', error);
      throw new Error('Failed to fetch bills from Firestore');
    }
  }

  static async fetchBillById(id: string): Promise<Bill | null> {
    try {
      const docRef = doc(db, COLLECTION, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as Bill;
    } catch (error) {
      console.error('❌ Error fetching bill by ID:', error);
      throw new Error('Failed to fetch bill from Firestore');
    }
  }

  static async createBill(data: Omit<Bill, 'id'>): Promise<Bill> {
    try {
      const now = new Date().toISOString();
      const payload = stripUndefined({ ...data, createdAt: now, updatedAt: now });
      const docRef = await addDoc(collection(db, COLLECTION), payload);
      console.log('✅ Bill created:', docRef.id);
      return { id: docRef.id, ...payload } as Bill;
    } catch (error) {
      console.error('❌ Error creating bill:', error);
      throw new Error('Failed to create bill in Firestore');
    }
  }

  static async updateBill(id: string, data: Partial<Omit<Bill, 'id'>>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION, id);
      const payload = stripUndefined({ ...data, updatedAt: new Date().toISOString() });
      await updateDoc(docRef, payload);
      console.log('✅ Bill updated:', id);
    } catch (error) {
      console.error('❌ Error updating bill:', error);
      throw new Error('Failed to update bill in Firestore');
    }
  }

  static async deleteBill(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
      console.log('✅ Bill deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting bill:', error);
      throw new Error('Failed to delete bill from Firestore');
    }
  }

  // ==================== BRANCH MANAGEMENT ====================

  static async fetchAllBranches(): Promise<BillBranch[]> {
    try {
      const q = query(collection(db, BRANCHES_COLLECTION), orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BillBranch));
    } catch (error) {
      console.error('❌ Error fetching branches:', error);
      throw new Error('Failed to fetch branches from Firestore');
    }
  }

  static async createBranch(name: string): Promise<BillBranch> {
    try {
      const now = new Date().toISOString();
      const payload = { name: name.trim(), createdAt: now };
      const docRef = await addDoc(collection(db, BRANCHES_COLLECTION), payload);
      console.log('✅ Branch created:', docRef.id);
      return { id: docRef.id, ...payload };
    } catch (error) {
      console.error('❌ Error creating branch:', error);
      throw new Error('Failed to create branch in Firestore');
    }
  }
}