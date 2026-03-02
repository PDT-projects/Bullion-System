// Banking Module - Firebase Firestore Service Layer
// Handles all Firebase Firestore operations for banks

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { Bank } from './types';

// Collection name for banks
const BANKS_COLLECTION = 'banks';

/**
 * Transform Firestore document to Bank type
 */
function transformDocToBank(docSnap: any): Bank {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || '',
    accountNumber: data.accountNumber || '',
    balance: data.balance || 0,
  };
}

/**
 * BankFirebaseService - Firebase Firestore operations for banks
 */
export class BankFirebaseService {

  // ==================== READ OPERATIONS ====================

  /**
   * Fetch all banks from Firestore
   */
  static async fetchAllBanks(): Promise<Bank[]> {
    try {
      console.log('🔥 Fetching all banks from Firestore...');
      
      const banksRef = collection(db, BANKS_COLLECTION);
      const queryConstraints: QueryConstraint[] = [
        orderBy('name', 'asc')
      ];
      
      const q = query(banksRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const banks: Bank[] = [];
      querySnapshot.forEach((doc) => {
        banks.push(transformDocToBank(doc));
      });

      console.log(`✅ Fetched ${banks.length} banks from Firestore`);
      return banks;
    } catch (error) {
      console.error('❌ Error fetching banks from Firestore:', error);
      throw new Error('Failed to fetch banks from Firestore');
    }
  }

  /**
   * Fetch a single bank by ID
   */
  static async fetchBankById(id: string): Promise<Bank | null> {
    try {
      console.log(`🔥 Fetching bank ${id} from Firestore...`);
      
      const bankRef = doc(db, BANKS_COLLECTION, id);
      const docSnap = await getDoc(bankRef);
      
      if (!docSnap.exists()) {
        console.log('⚠️ Bank not found');
        return null;
      }

      const bank = transformDocToBank(docSnap);
      console.log('✅ Bank fetched:', bank.name);
      return bank;
    } catch (error) {
      console.error(`❌ Error fetching bank ${id} from Firestore:`, error);
      throw new Error('Failed to fetch bank from Firestore');
    }
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new bank in Firestore
   */
  static async createBank(bank: Omit<Bank, 'id'>): Promise<Bank> {
    try {
      console.log('🔥 Creating bank in Firestore:', bank.name);
      
      const banksRef = collection(db, BANKS_COLLECTION);
      const docRef = await addDoc(banksRef, {
        ...bank,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const createdBank: Bank = {
        ...bank,
        id: docRef.id,
      };
      
      console.log('✅ Bank created with ID:', createdBank.id);
      return createdBank;
    } catch (error) {
      console.error('❌ Error creating bank in Firestore:', error);
      throw new Error('Failed to create bank in Firestore');
    }
  }

  /**
   * Update an existing bank in Firestore
   */
  static async updateBank(bank: Bank): Promise<Bank> {
    try {
      console.log('🔥 Updating bank in Firestore:', bank.id);
      
      const bankRef = doc(db, BANKS_COLLECTION, bank.id);
      await updateDoc(bankRef, {
        name: bank.name,
        accountNumber: bank.accountNumber,
        balance: bank.balance,
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Bank updated:', bank.id);
      return bank;
    } catch (error) {
      console.error(`❌ Error updating bank ${bank.id}:`, error);
      throw new Error('Failed to update bank in Firestore');
    }
  }

  /**
   * Update bank balance in Firestore
   */
  static async updateBankBalance(id: string, newBalance: number): Promise<Bank> {
    try {
      console.log('🔥 Updating bank balance in Firestore:', id, 'New balance:', newBalance);
      
      // Fetch the current bank
      const bank = await this.fetchBankById(id);
      if (!bank) {
        throw new Error('Bank not found');
      }

      // Update with new balance
      const updatedBank: Bank = {
        ...bank,
        balance: newBalance
      };

      return await this.updateBank(updatedBank);
    } catch (error) {
      console.error(`❌ Error updating bank balance ${id}:`, error);
      throw new Error('Failed to update bank balance in Firestore');
    }
  }

  /**
   * Delete a bank from Firestore
   */
  static async deleteBank(id: string): Promise<void> {
    try {
      console.log('🔥 Deleting bank from Firestore:', id);
      
      const bankRef = doc(db, BANKS_COLLECTION, id);
      await deleteDoc(bankRef);
      
      console.log('✅ Bank deleted:', id);
    } catch (error) {
      console.error(`❌ Error deleting bank ${id}:`, error);
      throw new Error('Failed to delete bank from Firestore');
    }
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Update multiple banks (useful for transfers)
   */
  static async updateMultipleBanks(banks: Bank[]): Promise<Bank[]> {
    try {
      console.log(`🔥 Updating ${banks.length} banks in Firestore...`);
      
      // Update banks sequentially to avoid conflicts
      const updatedBanks: Bank[] = [];
      for (const bank of banks) {
        const updated = await this.updateBank(bank);
        updatedBanks.push(updated);
      }
      
      console.log(`✅ Updated ${updatedBanks.length} banks`);
      return updatedBanks;
    } catch (error) {
      console.error('❌ Error updating multiple banks:', error);
      throw new Error('Failed to update banks in Firestore');
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if Firestore is connected
   */
  static isConnected(): boolean {
    return !!db;
  }

  /**
   * Reset the connection (useful for testing)
   */
  static resetConnection(): void {
    // Firestore doesn't need reset as it's a singleton
  }
}
