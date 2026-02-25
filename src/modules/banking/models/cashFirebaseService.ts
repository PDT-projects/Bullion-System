// Banking Module - Firebase Data Connect Service Layer
// Handles all Firebase Data Connect operations for Cash In Hand

import { getDataConnect, DataConnect } from 'firebase/data-connect';
import { initializeApp } from 'firebase/app';
import {
  connectorConfig,
  getCashInHandRecords,
  getCashInHandById,
  getCashInHandByLocation,
  createCashInHand,
  updateCashInHand,
  deleteCashInHand,
  CreateCashInHandVariables,
  UpdateCashInHandVariables,
  DeleteCashInHandVariables,
  GetCashInHandRecordsData,
  GetCashInHandByIdData,
  GetCashInHandByLocationData,
  CreateCashInHandData,
  UpdateCashInHandData,
  DeleteCashInHandData,
} from '../../../dataconnect-generated';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcTOJImNIZ1luoGVIbRmTMfRjKyHc3o-Y",
  authDomain: "erp-system-baacb.firebaseapp.com",
  projectId: "erp-system-baacb",
  storageBucket: "erp-system-baacb.firebasestorage.app",
  messagingSenderId: "637818110198",
  appId: "1:637818110198:web:623aa945d32788b20fecd7"
};

// Initialize Firebase app for Data Connect
const firebaseApp = initializeApp(firebaseConfig);

/**
 * Firebase Data Connect instance for cash operations
 */
let dataConnectInstance: DataConnect | null = null;

/**
 * Get or initialize the Data Connect instance
 */
function getDataConnectInstance(): DataConnect {
  if (!dataConnectInstance) {
    dataConnectInstance = getDataConnect(firebaseApp, connectorConfig);
  }
  return dataConnectInstance;
}

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
 * Transform Firebase cash data to our CashInHandRecord type
 */
function transformCashData(data: any): CashInHandRecord {
  return {
    id: data.id,
    location: data.location || 'Head Office',
    balance: data.balance || 0,
    lastUpdated: data.lastUpdated || new Date().toISOString(),
    updatedBy: data.updatedBy || 'System',
  };
}

/**
 * CashFirebaseService - Firebase Data Connect operations for Cash In Hand
 */
export class CashFirebaseService {

  // ==================== READ OPERATIONS ====================

  /**
   * Fetch all cash in hand records from Firebase
   */
  static async fetchAllCashRecords(): Promise<CashInHandRecord[]> {
    try {
      console.log('🔥 Fetching all cash in hand records from Firebase...');
      const dc = getDataConnectInstance();
      const result = await getCashInHandRecords(dc);
      
      if (!result.data || !result.data.cashInHands) {
        console.log('⚠️ No cash records found');
        return [];
      }

      const records = result.data.cashInHands.map(transformCashData);
      console.log(`✅ Fetched ${records.length} cash records`);
      return records;
    } catch (error) {
      console.error('❌ Error fetching cash records:', error);
      throw new Error('Failed to fetch cash records from Firebase');
    }
  }

  /**
   * Fetch cash in hand by location
   */
  static async fetchCashByLocation(location: string): Promise<CashInHandRecord | null> {
    try {
      console.log(`🔥 Fetching cash in hand for location: ${location}...`);
      const dc = getDataConnectInstance();
      const result = await getCashInHandByLocation(dc, { location });
      
      if (!result.data || !result.data.cashInHands || result.data.cashInHands.length === 0) {
        console.log('⚠️ No cash record found for location:', location);
        return null;
      }

      const record = transformCashData(result.data.cashInHands[0]);
      console.log('✅ Cash record fetched:', record.location, 'Balance:', record.balance);
      return record;
    } catch (error) {
      console.error(`❌ Error fetching cash for location ${location}:`, error);
      throw new Error('Failed to fetch cash record from Firebase');
    }
  }

  /**
   * Fetch a single cash record by ID
   */
  static async fetchCashById(id: string): Promise<CashInHandRecord | null> {
    try {
      console.log(`🔥 Fetching cash record ${id} from Firebase...`);
      const dc = getDataConnectInstance();
      const result = await getCashInHandById(dc, { id });
      
      if (!result.data || !result.data.cashInHand) {
        console.log('⚠️ Cash record not found');
        return null;
      }

      const record = transformCashData(result.data.cashInHand);
      console.log('✅ Cash record fetched:', record.location);
      return record;
    } catch (error) {
      console.error(`❌ Error fetching cash record ${id}:`, error);
      throw new Error('Failed to fetch cash record from Firebase');
    }
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new cash in hand record in Firebase
   */
  static async createCashRecord(
    location: string, 
    balance: number = 0, 
    updatedBy: string = 'System'
  ): Promise<CashInHandRecord> {
    try {
      console.log('🔥 Creating cash in hand record in Firebase:', location);
      const dc = getDataConnectInstance();
      
      // Generate a unique ID
      const id = `cash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const variables: CreateCashInHandVariables = {
        id,
        location,
        balance,
        lastUpdated: now,
        updatedBy,
      };
      
      const result = await createCashInHand(dc, variables);
      
      if (!result.data || !result.data.cashInHand_insert) {
        throw new Error('Failed to create cash record - no data returned');
      }

      const createdRecord: CashInHandRecord = {
        id: result.data.cashInHand_insert.id,
        location,
        balance,
        lastUpdated: now,
        updatedBy,
      };
      
      console.log('✅ Cash record created with ID:', createdRecord.id);
      return createdRecord;
    } catch (error) {
      console.error('❌ Error creating cash record:', error);
      throw new Error('Failed to create cash record in Firebase');
    }
  }

  /**
   * Update cash in hand balance
   */
  static async updateCashBalance(
    id: string, 
    newBalance: number, 
    updatedBy: string = 'System'
  ): Promise<CashInHandRecord> {
    try {
      console.log('🔥 Updating cash balance in Firebase:', id, 'New balance:', newBalance);
      const dc = getDataConnectInstance();
      
      const variables: UpdateCashInHandVariables = {
        id,
        balance: newBalance,
        lastUpdated: new Date().toISOString(),
        updatedBy,
      };
      
      const result = await updateCashInHand(dc, variables);
      
      if (!result.data || !result.data.cashInHand_update) {
        throw new Error('Failed to update cash balance - no data returned');
      }

      // Fetch the updated record
      const updatedRecord = await this.fetchCashById(id);
      if (!updatedRecord) {
        throw new Error('Failed to fetch updated cash record');
      }
      
      console.log('✅ Cash balance updated:', updatedRecord.balance);
      return updatedRecord;
    } catch (error) {
      console.error(`❌ Error updating cash balance ${id}:`, error);
      throw new Error('Failed to update cash balance in Firebase');
    }
  }

  /**
   * Add/subtract from cash balance (for transactions)
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
   * Delete a cash in hand record from Firebase
   */
  static async deleteCashRecord(id: string): Promise<void> {
    try {
      console.log('🔥 Deleting cash record from Firebase:', id);
      const dc = getDataConnectInstance();
      
      const variables: DeleteCashInHandVariables = { id };
      const result = await deleteCashInHand(dc, variables);
      
      if (!result.data || !result.data.cashInHand_delete) {
        throw new Error('Failed to delete cash record - no confirmation returned');
      }
      
      console.log('✅ Cash record deleted:', id);
    } catch (error) {
      console.error(`❌ Error deleting cash record ${id}:`, error);
      throw new Error('Failed to delete cash record from Firebase');
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
   * Check if Firebase is connected
   */
  static isConnected(): boolean {
    return !!dataConnectInstance;
  }

  /**
   * Reset the Data Connect instance (useful for testing)
   */
  static resetConnection(): void {
    dataConnectInstance = null;
  }
}
