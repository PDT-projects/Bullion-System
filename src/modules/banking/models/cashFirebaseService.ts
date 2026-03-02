// Banking Module - Firebase Firestore Service Layer
// Handles all Firebase Firestore operations for Cash In Hand

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
  QueryConstraint,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';

/**
 * Firebase Firestore instance for cash operations
 */
const CASH_COLLECTION = 'cashInHand';

/**
 * Cash In Hand record interface
 */
export interface CashInHandRecord {
  id: string;
  location: string;
  balance: number;
  lastUpdated: string;
  updatedBy: string;
}

/**
 * Transform Firestore document to CashInHandRecord type
 */
function transformDocToCashInHand(docSnap: any): CashInHandRecord {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    location: data.location || 'Head Office',
    balance: data.balance || 0,
    lastUpdated: data.lastUpdated || new Date().toISOString(),
    updatedBy: data.updatedBy || 'System',
  };
}

/**
 * CashFirebaseService - Firebase Firestore operations for Cash In Hand
 */
export class CashFirebaseService {

  // ==================== READ OPERATIONS ====================

  /**
   * Fetch all cash in hand records from Firestore
   */
  static async fetchAllCashRecords(): Promise<CashInHandRecord[]> {
    try {
      console.log('🔥 Fetching all cash in hand records from Firestore...');
      
      const cashRef = collection(db, CASH_COLLECTION);
      const queryConstraints: QueryConstraint[] = [
        orderBy('location', 'asc')
      ];
      
      const q = query(cashRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const records: CashInHandRecord[] = [];
      querySnapshot.forEach((doc) => {
        records.push(transformDocToCashInHand(doc));
      });

      console.log(`✅ Fetched ${records.length} cash records from Firestore`);
      return records;
    } catch (error) {
      console.error('❌ Error fetching cash records from Firestore:', error);
      throw new Error('Failed to fetch cash records from Firestore');
    }
  }

  /**
   * Fetch a single cash record by ID
   */
  static async fetchCashById(id: string): Promise<CashInHandRecord | null> {
    try {
      console.log(`🔥 Fetching cash record ${id} from Firestore...`);
      
      const cashRef = doc(db, CASH_COLLECTION, id);
      const docSnap = await getDoc(cashRef);
      
      if (!docSnap.exists()) {
        console.log('⚠️ Cash record not found');
        return null;
      }

      const record = transformDocToCashInHand(docSnap);
      console.log('✅ Cash record fetched:', record.location);
      return record;
    } catch (error) {
      console.error(`❌ Error fetching cash record ${id} from Firestore:`, error);
      throw new Error('Failed to fetch cash record from Firestore');
    }
  }

  /**
   * Fetch cash record by location
   */
  static async fetchCashByLocation(location: string): Promise<CashInHandRecord | null> {
    try {
      console.log(`🔥 Fetching cash record for location: ${location}...`);
      
      const cashRef = collection(db, CASH_COLLECTION);
      const q = query(cashRef, where('location', '==', location));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('⚠️ No cash record found for location');
        return null;
      }

      const doc = querySnapshot.docs[0];
      return transformDocToCashInHand(doc);
    } catch (error) {
      console.error(`❌ Error fetching cash for location ${location}:`, error);
      throw new Error('Failed to fetch cash record by location');
    }
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new cash record in Firestore
   */
  static async createCashRecord(
    location: string, 
    balance: number, 
    updatedBy: string
  ): Promise<CashInHandRecord> {
    try {
      console.log('🔥 Creating cash record in Firestore:', location);
      
      const cashRef = collection(db, CASH_COLLECTION);
      const docRef = await addDoc(cashRef, {
        location,
        balance,
        updatedBy,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      const createdRecord: CashInHandRecord = {
        id: docRef.id,
        location,
        balance,
        lastUpdated: new Date().toISOString(),
        updatedBy,
      };
      
      console.log('✅ Cash record created with ID:', createdRecord.id);
      return createdRecord;
    } catch (error) {
      console.error('❌ Error creating cash record in Firestore:', error);
      throw new Error('Failed to create cash record in Firestore');
    }
  }

  /**
   * Update cash balance in Firestore
   */
  static async updateCashBalance(
    id: string, 
    newBalance: number, 
    updatedBy: string = 'System'
  ): Promise<CashInHandRecord> {
    try {
      console.log('🔥 Updating cash balance in Firestore:', id, 'New balance:', newBalance);
      
      const cashRef = doc(db, CASH_COLLECTION, id);
      await updateDoc(cashRef, {
        balance: newBalance,
        updatedBy,
        lastUpdated: new Date().toISOString(),
      });

      console.log('✅ Cash balance updated:', id);
      return {
        id,
        balance: newBalance,
        updatedBy,
        lastUpdated: new Date().toISOString(),
        location: '' // Will be filled by caller
      };
    } catch (error) {
      console.error(`❌ Error updating cash balance ${id}:`, error);
      throw new Error('Failed to update cash balance in Firestore');
    }
  }

  /**
   * Adjust cash balance by amount (for deposits/withdrawals)
   */
  static async adjustCashBalance(
    id: string, 
    amount: number, 
    updatedBy: string = 'System'
  ): Promise<CashInHandRecord> {
    try {
      console.log('🔥 Adjusting cash balance:', id, 'Amount:', amount);
      
      // Get current record
      const currentRecord = await this.fetchCashById(id);
      if (!currentRecord) {
        throw new Error('Cash record not found');
      }

      // Calculate new balance
      const newBalance = currentRecord.balance + amount;
      
      if (newBalance < 0) {
        throw new Error('Insufficient cash balance');
      }

      // Update balance
      return await this.updateCashBalance(id, newBalance, updatedBy);
    } catch (error) {
      console.error(`❌ Error adjusting cash balance ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a cash record from Firestore
   */
  static async deleteCashRecord(id: string): Promise<void> {
    try {
      console.log('🔥 Deleting cash record from Firestore:', id);
      
      const cashRef = doc(db, CASH_COLLECTION, id);
      await deleteDoc(cashRef);
      
      console.log('✅ Cash record deleted:', id);
    } catch (error) {
      console.error(`❌ Error deleting cash record ${id}:`, error);
      throw new Error('Failed to delete cash record from Firestore');
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get or create cash record for a location
   */
  static async getOrCreateCashForLocation(
    location: string, 
    updatedBy: string = 'System'
  ): Promise<CashInHandRecord> {
    try {
      // Try to fetch existing record
      let record = await this.fetchCashByLocation(location);
      
      if (record) {
        return record;
      }

      // Create new record if not found
      console.log('⚠️ No cash record found for location, creating new:', location);
      return await this.createCashRecord(location, 0, updatedBy);
    } catch (error) {
      console.error(`❌ Error getting/creating cash for location ${location}:`, error);
      throw error;
    }
  }

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
