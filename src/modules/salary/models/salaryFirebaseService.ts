// Salary Module - Firebase Service Layer
// All Firestore operations for salaries collection

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
  Timestamp
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { Salary } from './types';

const COLLECTION = 'salaries';

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export class SalaryFirebaseService {

  static async fetchAllSalaries(): Promise<Salary[]> {
    try {
      console.log('🔥 Fetching all salaries from Firestore...');
      const q = query(collection(db, COLLECTION), orderBy('date', 'desc'));
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
      const docRef = doc(db, COLLECTION, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as Salary;
    } catch (error) {
      console.error('❌ Error fetching salary by ID:', error);
      throw new Error('Failed to fetch salary from Firestore');
    }
  }

  static async createSalary(data: Omit<Salary, 'id'>): Promise<Salary> {
    try {
      const now = new Date().toISOString();
      const payload = stripUndefined({
        ...data,
        createdAt: now,
        updatedAt: now
      });
      const docRef = await addDoc(collection(db, COLLECTION), payload);
      console.log('✅ Salary created:', docRef.id);
      return { id: docRef.id, ...payload } as Salary;
    } catch (error) {
      console.error('❌ Error creating salary:', error);
      throw new Error('Failed to create salary in Firestore');
    }
  }

  static async updateSalary(id: string, data: Partial<Omit<Salary, 'id'>>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION, id);
      const payload = stripUndefined({
        ...data,
        updatedAt: new Date().toISOString()
      });
      await updateDoc(docRef, payload);
      console.log('✅ Salary updated:', id);
    } catch (error) {
      console.error('❌ Error updating salary:', error);
      throw new Error('Failed to update salary in Firestore');
    }
  }

  static async deleteSalary(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION, id);
      await deleteDoc(docRef);
      console.log('✅ Salary deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting salary:', error);
      throw new Error('Failed to delete salary from Firestore');
    }
  }
}