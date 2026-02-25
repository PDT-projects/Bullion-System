// Banking Module - Firebase Data Connect Service Layer
// Handles all Firebase Data Connect operations for banks

import { getDataConnect, DataConnect } from 'firebase/data-connect';
import { initializeApp } from 'firebase/app';
import {
  connectorConfig,
  getBanks,
  getBankById,
  createBank,
  updateBank,
  deleteBank,
  CreateBankVariables,
  UpdateBankVariables,
  DeleteBankVariables,
  GetBanksData,
  GetBankByIdData,
  CreateBankData,
  UpdateBankData,
  DeleteBankData,
} from '../../../dataconnect-generated';
import { Bank } from './types';

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
 * Firebase Data Connect instance for banking operations
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
 * Transform Firebase bank data to our Bank type
 */
function transformBankData(data: any): Bank {
  return {
    id: data.id,
    name: data.name || '',
    accountNumber: data.accountNumber || '',
    balance: data.balance || 0,
  };
}

/**
 * Transform Bank to Firebase create variables
 */
function transformCreateVariables(bank: Omit<Bank, 'id'>, id: string): CreateBankVariables {
  const now = new Date().toISOString();
  return {
    id,
    name: bank.name,
    accountNumber: bank.accountNumber,
    balance: bank.balance,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Transform Bank to Firebase update variables
 */
function transformUpdateVariables(bank: Bank): UpdateBankVariables {
  return {
    id: bank.id,
    name: bank.name,
    accountNumber: bank.accountNumber,
    balance: bank.balance,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * BankFirebaseService - Firebase Data Connect operations for banks
 */
export class BankFirebaseService {

  // ==================== READ OPERATIONS ====================

  /**
   * Fetch all banks from Firebase
   */
  static async fetchAllBanks(): Promise<Bank[]> {
    try {
      console.log('🔥 Fetching all banks from Firebase...');
      const dc = getDataConnectInstance();
      const result = await getBanks(dc);
      
      if (!result.data || !result.data.banks) {
        console.log('⚠️ No banks found');
        return [];
      }

      const banks = result.data.banks.map(transformBankData);
      console.log(`✅ Fetched ${banks.length} banks`);
      return banks;
    } catch (error) {
      console.error('❌ Error fetching banks:', error);
      throw new Error('Failed to fetch banks from Firebase');
    }
  }

  /**
   * Fetch a single bank by ID
   */
  static async fetchBankById(id: string): Promise<Bank | null> {
    try {
      console.log(`🔥 Fetching bank ${id} from Firebase...`);
      const dc = getDataConnectInstance();
      const result = await getBankById(dc, { id });
      
      if (!result.data || !result.data.bank) {
        console.log('⚠️ Bank not found');
        return null;
      }

      const bank = transformBankData(result.data.bank);
      console.log('✅ Bank fetched:', bank.name);
      return bank;
    } catch (error) {
      console.error(`❌ Error fetching bank ${id}:`, error);
      throw new Error('Failed to fetch bank from Firebase');
    }
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new bank in Firebase
   */
  static async createBank(bankData: Omit<Bank, 'id'>): Promise<Bank> {
    try {
      console.log('🔥 Creating bank in Firebase:', bankData.name);
      const dc = getDataConnectInstance();
      
      // Generate a unique ID
      const id = `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const variables = transformCreateVariables(bankData, id);
      const result = await createBank(dc, variables);
      
      if (!result.data || !result.data.bank_insert) {
        throw new Error('Failed to create bank - no data returned');
      }

      // Return the created bank with the generated ID
      const createdBank: Bank = {
        ...bankData,
        id: result.data.bank_insert.id,
      };
      
      console.log('✅ Bank created with ID:', createdBank.id);
      return createdBank;
    } catch (error) {
      console.error('❌ Error creating bank:', error);
      throw new Error('Failed to create bank in Firebase');
    }
  }

  /**
   * Update an existing bank in Firebase
   */
  static async updateBank(bank: Bank): Promise<Bank> {
    try {
      console.log('🔥 Updating bank in Firebase:', bank.id);
      const dc = getDataConnectInstance();
      
      const variables = transformUpdateVariables(bank);
      const result = await updateBank(dc, variables);
      
      if (!result.data || !result.data.bank_update) {
        throw new Error('Failed to update bank - no data returned');
      }

      console.log('✅ Bank updated:', bank.id);
      return bank;
    } catch (error) {
      console.error(`❌ Error updating bank ${bank.id}:`, error);
      throw new Error('Failed to update bank in Firebase');
    }
  }

  /**
   * Update only the balance of a bank (for transfers)
   */
  static async updateBankBalance(id: string, newBalance: number): Promise<Bank> {
    try {
      console.log('🔥 Updating bank balance in Firebase:', id, 'New balance:', newBalance);
      
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
      throw new Error('Failed to update bank balance in Firebase');
    }
  }

  /**
   * Delete a bank from Firebase
   */
  static async deleteBank(id: string): Promise<void> {
    try {
      console.log('🔥 Deleting bank from Firebase:', id);
      const dc = getDataConnectInstance();
      
      const variables: DeleteBankVariables = { id };
      const result = await deleteBank(dc, variables);
      
      if (!result.data || !result.data.bank_delete) {
        throw new Error('Failed to delete bank - no confirmation returned');
      }
      
      console.log('✅ Bank deleted:', id);
    } catch (error) {
      console.error(`❌ Error deleting bank ${id}:`, error);
      throw new Error('Failed to delete bank from Firebase');
    }
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Update multiple banks (useful for transfers)
   */
  static async updateMultipleBanks(banks: Bank[]): Promise<Bank[]> {
    try {
      console.log(`🔥 Updating ${banks.length} banks in Firebase...`);
      
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
      throw new Error('Failed to update banks in Firebase');
    }
  }

  // ==================== UTILITY METHODS ====================

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
