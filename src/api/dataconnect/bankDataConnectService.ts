// Banking Module - Firebase Data Connect Service Layer
// Handles all Data Connect operations for Bank accounts

import { DataConnect, getDataConnect, connectDataConnectEmulator, QueryResult } from 'firebase/data-connect';
import { 
  connectorConfig,
  bankInsert,
  bankUpdate,
  bankDelete,
  listBanks,
  getBankById,
  updateBankBalance,
  BankInsertVariables,
  BankUpdateVariables,
  BankDeleteVariables,
  ListBanksData,
  GetBankByIdData,
  UpdateBankBalanceVariables
} from '@erp-system/banking';
import { Bank } from '../../modules/banking/models/types';

// Data Connect client instance
let dcInstance: DataConnect | null = null;
let isEmulatorConnected = false;

/**
 * Get Data Connect instance (singleton)
 * Connects to emulator if running locally
 */
function getDC(): DataConnect {
  if (!dcInstance) {
    // Create the Data Connect instance
    dcInstance = getDataConnect(connectorConfig);
    
    // Connect to emulator if running locally
    if (!isEmulatorConnected) {
      try {
        // Try to connect to emulator on localhost:9399
        connectDataConnectEmulator(dcInstance, 'localhost', 9399);
        isEmulatorConnected = true;
        console.log('Connected to Data Connect Emulator at localhost:9399');
      } catch (error) {
        // Emulator might not be running, continue without emulator connection
        console.log('Could not connect to Data Connect Emulator, using production');
      }
    }
  }
  return dcInstance;
}

/**
 * BankDataConnectService - Data Connect operations for Bank accounts
 * Uses Firebase Data Connect with PostgreSQL backend
 */
export class BankDataConnectService {

  // ==================== READ OPERATIONS ====================

  /**
   * Fetch all banks from Data Connect
   */
  static async fetchAllBanks(): Promise<Bank[]> {
    try {
      console.log('📡 Fetching all banks from Data Connect...');
      
      const dc = getDC();
      
      // Call listBanks
      const result = await listBanks(dc) as unknown as QueryResult<ListBanksData, undefined>;
      const data = result.data;
      
      const banks: Bank[] = data.banks.map((bank) => ({
        id: bank.id,
        name: bank.name,
        accountNumber: bank.accountNumber,
        balance: bank.balance
      }));
      
      console.log(`✅ Fetched ${banks.length} banks from Data Connect`);
      return banks;
    } catch (error) {
      console.error('❌ Error fetching banks from Data Connect:', error);
      throw new Error('Failed to fetch banks from Data Connect');
    }
  }

  /**
   * Fetch a single bank by ID
   */
  static async fetchBankById(id: string): Promise<Bank | null> {
    try {
      console.log(`📡 Fetching bank ${id} from Data Connect...`);
      
      const dc = getDC();
      const variables = { id };
      
      // Call getBankById
      const result = await getBankById(dc, variables) as unknown as QueryResult<GetBankByIdData, { id: string }>;
      const data = result.data;
      
      if (!data.bank) {
        console.log(`Bank not found: ${id}`);
        return null;
      }
      
      const bank: Bank = {
        id: data.bank.id,
        name: data.bank.name,
        accountNumber: data.bank.accountNumber,
        balance: data.bank.balance
      };
      
      console.log(`✅ Fetched bank: ${bank.name}`);
      return bank;
    } catch (error) {
      console.error(`❌ Error fetching bank ${id} from Data Connect:`, error);
      throw new Error(`Failed to fetch bank ${id} from Data Connect`);
    }
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new bank in Data Connect
   */
  static async createBank(bank: Omit<Bank, 'id'>): Promise<Bank> {
    try {
      console.log('📡 Creating bank in Data Connect:', bank.name);
      
      // Generate a unique ID
      const id = `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare variables for Data Connect
      const variables: BankInsertVariables = {
        id,
        name: bank.name,
        accountNumber: bank.accountNumber,
        balance: Number(bank.balance)
      };

      // Get Data Connect instance and execute the mutation
      const dc = getDC();
      await bankInsert(dc, variables);
      
      const createdBank: Bank = {
        ...bank,
        id: variables.id!
      };
      
      console.log('✅ Bank created with ID:', createdBank.id);
      return createdBank;
    } catch (error) {
      console.error('❌ Error creating bank in Data Connect:', error);
      throw new Error('Failed to create bank in Data Connect');
    }
  }

  /**
   * Update an existing bank in Data Connect
   */
  static async updateBank(bank: Bank): Promise<Bank> {
    try {
      console.log('📡 Updating bank in Data Connect:', bank.id);
      
      // Prepare variables for Data Connect
      const variables: BankUpdateVariables = {
        id: bank.id,
        name: bank.name,
        accountNumber: bank.accountNumber,
        balance: Number(bank.balance)
      };

      // Get Data Connect instance and execute the mutation
      const dc = getDC();
      await bankUpdate(dc, variables);
      
      console.log('✅ Bank updated:', bank.id);
      return bank;
    } catch (error) {
      console.error(`❌ Error updating bank ${bank.id} in Data Connect:`, error);
      throw new Error('Failed to update bank in Data Connect');
    }
  }

  /**
   * Update bank balance in Data Connect
   */
  static async updateBankBalance(id: string, newBalance: number): Promise<Bank> {
    try {
      console.log('📡 Updating bank balance in Data Connect:', id, 'New balance:', newBalance);
      
      // Prepare variables for Data Connect
      const variables: UpdateBankBalanceVariables = {
        id,
        newBalance: Number(newBalance)
      };

      // Get Data Connect instance and execute the mutation
      const dc = getDC();
      await updateBankBalance(dc, variables);
      
      console.log('✅ Bank balance updated:', id);
      return {
        id,
        name: '',
        accountNumber: '',
        balance: newBalance
      };
    } catch (error) {
      console.error(`❌ Error updating bank balance ${id} in Data Connect:`, error);
      throw new Error('Failed to update bank balance in Data Connect');
    }
  }

  /**
   * Delete a bank from Data Connect
   */
  static async deleteBank(id: string): Promise<void> {
    try {
      console.log('📡 Deleting bank from Data Connect:', id);
      
      // Prepare variables for Data Connect
      const variables: BankDeleteVariables = { id };

      // Get Data Connect instance and execute the mutation
      const dc = getDC();
      await bankDelete(dc, variables);
      
      console.log('✅ Bank deleted:', id);
    } catch (error) {
      console.error(`❌ Error deleting bank ${id} from Data Connect:`, error);
      throw new Error('Failed to delete bank from Data Connect');
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if Data Connect is connected
   */
  static isConnected(): boolean {
    try {
      getDC();
      return true;
    } catch {
      return false;
    }
  }
}
