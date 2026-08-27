// Salary Module - Firebase Service Layer
// All Firestore operations for salaries collection
// Fix: uses deepStripUndefined so optional fields (chequeNumber etc.) don't cause Firestore errors

import {
  collection, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, doc, query, orderBy,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { Salary } from './types';

const COLLECTION = 'salaries';

// Deep strip — removes undefined at any nesting level (Firestore rejects undefined anywhere)
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

export class SalaryFirebaseService {

  static async fetchAllSalaries(): Promise<Salary[]> {
    try {
      console.log('🔥 Fetching all salaries from Firestore...');
      const q        = query(collection(db, COLLECTION), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const salaries = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Salary));
      console.log(`✅ Fetched ${salaries.length} salaries`);
      return salaries;
    } catch (error) {
      console.error('❌ Error fetching salaries:', error);
      throw new Error('Failed to fetch salaries from Firestore');
    }
  }

  static async fetchSalaryById(id: string): Promise<Salary | null> {
    try {
      const snapshot = await getDoc(doc(db, COLLECTION, id));
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
      const docRef  = await addDoc(collection(db, COLLECTION), payload);
      console.log('✅ Salary created:', docRef.id);
      return { id: docRef.id, ...payload } as Salary;
    } catch (error) {
      console.error('❌ Error creating salary:', error);
      throw new Error('Failed to create salary in Firestore');
    }
  }

  static async updateSalary(id: string, data: Partial<Omit<Salary, 'id'>>): Promise<void> {
    try {
      const payload = deepStripUndefined({ ...data, updatedAt: new Date().toISOString() });
      await updateDoc(doc(db, COLLECTION, id), payload);
      console.log('✅ Salary updated:', id);
    } catch (error) {
      console.error('❌ Error updating salary:', error);
      throw new Error('Failed to update salary in Firestore');
    }
  }

  static async deleteSalary(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
      console.log('✅ Salary deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting salary:', error);
      throw new Error('Failed to delete salary from Firestore');
    }
  }
}