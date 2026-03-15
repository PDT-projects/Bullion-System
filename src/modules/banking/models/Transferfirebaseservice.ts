// Banking Module - Firebase Service for Transfers

import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { BankTransfer } from './types';

const TRANSFERS_COLLECTION = 'bank_transfers';

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export class TransferFirebaseService {

  static async fetchAllTransfers(): Promise<BankTransfer[]> {
    try {
      console.log('🔥 Fetching all transfers from Firestore...');
      const q = query(collection(db, TRANSFERS_COLLECTION), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const transfers = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BankTransfer));
      console.log(`✅ Fetched ${transfers.length} transfers`);
      return transfers;
    } catch (error) {
      console.error('❌ Error fetching transfers:', error);
      throw new Error('Failed to fetch transfers from Firestore');
    }
  }

  static async createTransfer(transfer: Omit<BankTransfer, 'id'>): Promise<BankTransfer> {
    try {
      const payload = stripUndefined({ ...transfer, createdAt: new Date().toISOString() });
      const docRef = await addDoc(collection(db, TRANSFERS_COLLECTION), payload);
      console.log('✅ Transfer created:', docRef.id);
      return { id: docRef.id, ...transfer };
    } catch (error) {
      console.error('❌ Error creating transfer:', error);
      throw new Error('Failed to create transfer in Firestore');
    }
  }

  static async deleteTransfer(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, TRANSFERS_COLLECTION, id));
      console.log('✅ Transfer deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting transfer:', error);
      throw new Error('Failed to delete transfer from Firestore');
    }
  }
}