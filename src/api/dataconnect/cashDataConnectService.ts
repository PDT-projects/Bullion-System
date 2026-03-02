// Banking Module - Firebase Data Connect Service Layer
// Handles all Data Connect operations for Cash Transactions

import { DataConnect, getDataConnect, connectDataConnectEmulator, QueryResult } from 'firebase/data-connect';
import { 
  connectorConfig,
  cashInHandInsert,
  cashInHandDelete,
  listCashInHand,
  getCashInHandById,
  CashInHandInsertVariables,
  CashInHandDeleteVariables,
  ListCashInHandData,
  GetCashInHandByIdData
} from '@erp-system/banking';
import { CashTransaction } from '../../modules/banking/models/types';

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
 * CashDataConnectService - Data Connect operations for Cash Transactions
 * Uses Firebase Data Connect with PostgreSQL backend
 */
export class CashDataConnectService {

  // ==================== READ OPERATIONS ====================

  /**
   * Fetch all cash transactions from Data Connect
   */
  static async fetchAllCashTransactions(): Promise<CashTransaction[]> {
    try {
      console.log('📡 Fetching all cash transactions from Data Connect...');
      
      const dc = getDC();
      
      // Call listCashInHand
      const result = await listCashInHand(dc) as unknown as QueryResult<ListCashInHandData, undefined>;
      const data = result.data;
      
      const transactions: CashTransaction[] = data.cashInHands.map((txn) => ({
        id: txn.id,
        date: txn.date,
        company: txn.company,
        mainCategory: txn.mainCategory as 'Cash Inflow' | 'Cash Outflow',
        subCategory: txn.subCategory,
        amount: txn.amount,
        mode: txn.mode as 'Cash',
        note: txn.note || ''
      }));
      
      console.log(`✅ Fetched ${transactions.length} cash transactions from Data Connect`);
      return transactions;
    } catch (error) {
      console.error('❌ Error fetching cash transactions from Data Connect:', error);
      throw new Error('Failed to fetch cash transactions from Data Connect');
    }
  }

  /**
   * Fetch a single cash transaction by ID
   */
  static async fetchCashTransactionById(id: string): Promise<CashTransaction | null> {
    try {
      console.log(`📡 Fetching cash transaction ${id} from Data Connect...`);
      
      const dc = getDC();
      const variables = { id };
      
      // Call getCashInHandById
      const result = await getCashInHandById(dc, variables) as unknown as QueryResult<GetCashInHandByIdData, { id: string }>;
      const data = result.data;
      
      if (!data.cashInHand) {
        console.log(`Cash transaction not found: ${id}`);
        return null;
      }
      
      const txn: CashTransaction = {
        id: data.cashInHand.id,
        date: data.cashInHand.date,
        company: data.cashInHand.company,
        mainCategory: data.cashInHand.mainCategory as 'Cash Inflow' | 'Cash Outflow',
        subCategory: data.cashInHand.subCategory,
        amount: data.cashInHand.amount,
        mode: data.cashInHand.mode as 'Cash',
        note: data.cashInHand.note || ''
      };
      
      console.log(`✅ Fetched cash transaction: ${txn.id}`);
      return txn;
    } catch (error) {
      console.error(`❌ Error fetching cash transaction ${id} from Data Connect:`, error);
      throw new Error(`Failed to fetch cash transaction ${id} from Data Connect`);
    }
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new cash transaction in Data Connect
   */
  static async createCashTransaction(txn: Omit<CashTransaction, 'id'>): Promise<CashTransaction> {
    try {
      console.log('📡 Creating cash transaction in Data Connect:', txn.amount);
      
      // Generate a unique ID
      const id = `cash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare variables for Data Connect
      const variables: CashInHandInsertVariables = {
        id,
        date: txn.date,
        company: txn.company,
        mainCategory: txn.mainCategory,
        subCategory: txn.subCategory,
        amount: Number(txn.amount),
        mode: txn.mode,
        note: txn.note || null
      };

      // Get Data Connect instance and execute the mutation
      const dc = getDC();
      await cashInHandInsert(dc, variables);
      
      const createdTransaction: CashTransaction = {
        ...txn,
        id: variables.id!
      };
      
      console.log('✅ Cash transaction created with ID:', createdTransaction.id);
      return createdTransaction;
    } catch (error) {
      console.error('❌ Error creating cash transaction in Data Connect:', error);
      throw new Error('Failed to create cash transaction in Data Connect');
    }
  }

  /**
   * Delete a cash transaction from Data Connect
   */
  static async deleteCashTransaction(id: string): Promise<void> {
    try {
      console.log('📡 Deleting cash transaction from Data Connect:', id);
      
      // Prepare variables for Data Connect
      const variables: CashInHandDeleteVariables = { id };

      // Get Data Connect instance and execute the mutation
      const dc = getDC();
      await cashInHandDelete(dc, variables);
      
      console.log('✅ Cash transaction deleted:', id);
    } catch (error) {
      console.error(`❌ Error deleting cash transaction ${id} from Data Connect:`, error);
      throw new Error('Failed to delete cash transaction from Data Connect');
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
