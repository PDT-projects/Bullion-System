// Banking Module - Firebase Data Connect Service Layer
// Handles all Data Connect operations for Bank Transfers

import { DataConnect, getDataConnect, connectDataConnectEmulator, QueryResult } from 'firebase/data-connect';
import { 
  connectorConfig,
  transferInsert,
  transferDelete,
  listTransfers,
  getTransferById,
  TransferInsertVariables,
  TransferDeleteVariables,
  ListTransfersData,
  GetTransferByIdData
} from '@erp-system/banking';
import { BankTransfer } from '../../modules/banking/models/types';

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
 * TransferDataConnectService - Data Connect operations for Bank Transfers
 * Uses Firebase Data Connect with PostgreSQL backend
 */
export class TransferDataConnectService {

  // ==================== READ OPERATIONS ====================

  /**
   * Fetch all transfers from Data Connect
   */
  static async fetchAllTransfers(): Promise<BankTransfer[]> {
    try {
      console.log('📡 Fetching all transfers from Data Connect...');
      
      const dc = getDC();
      
      // Call listTransfers
      const result = await listTransfers(dc) as unknown as QueryResult<ListTransfersData, undefined>;
      const data = result.data;
      
      const transfers: BankTransfer[] = data.bankTransfers.map((transfer) => ({
        id: transfer.id,
        date: transfer.date,
        fromBankId: transfer.fromBankId,
        fromBankName: transfer.fromBankName,
        toBankId: transfer.toBankId,
        toBankName: transfer.toBankName,
        amount: transfer.amount,
        note: transfer.note || ''
      }));
      
      console.log(`✅ Fetched ${transfers.length} transfers from Data Connect`);
      return transfers;
    } catch (error) {
      console.error('❌ Error fetching transfers from Data Connect:', error);
      throw new Error('Failed to fetch transfers from Data Connect');
    }
  }

  /**
   * Fetch a single transfer by ID
   */
  static async fetchTransferById(id: string): Promise<BankTransfer | null> {
    try {
      console.log(`📡 Fetching transfer ${id} from Data Connect...`);
      
      const dc = getDC();
      const variables = { id };
      
      // Call getTransferById
      const result = await getTransferById(dc, variables) as unknown as QueryResult<GetTransferByIdData, { id: string }>;
      const data = result.data;
      
      if (!data.bankTransfer) {
        console.log(`Transfer not found: ${id}`);
        return null;
      }
      
      const transfer: BankTransfer = {
        id: data.bankTransfer.id,
        date: data.bankTransfer.date,
        fromBankId: data.bankTransfer.fromBankId,
        fromBankName: data.bankTransfer.fromBankName,
        toBankId: data.bankTransfer.toBankId,
        toBankName: data.bankTransfer.toBankName,
        amount: data.bankTransfer.amount,
        note: data.bankTransfer.note || ''
      };
      
      console.log(`✅ Fetched transfer: ${transfer.id}`);
      return transfer;
    } catch (error) {
      console.error(`❌ Error fetching transfer ${id} from Data Connect:`, error);
      throw new Error(`Failed to fetch transfer ${id} from Data Connect`);
    }
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new transfer in Data Connect
   */
  static async createTransfer(transfer: Omit<BankTransfer, 'id'>): Promise<BankTransfer> {
    try {
      console.log('📡 Creating transfer in Data Connect:', JSON.stringify(transfer, null, 2));
      
      // Generate a unique ID
      const id = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare variables for Data Connect
      const variables: TransferInsertVariables = {
        id: id,
        date: transfer.date,
        fromBankId: transfer.fromBankId,
        fromBankName: transfer.fromBankName,
        toBankId: transfer.toBankId,
        toBankName: transfer.toBankName,
        amount: Number(transfer.amount),
        note: transfer.note || null
      };

      console.log('📡 Transfer variables:', JSON.stringify(variables, null, 2));

      // Get Data Connect instance
      const dc = getDC();
      console.log('📡 Data Connect instance obtained');
      
      // Execute the mutation
      const result = await transferInsert(dc, variables);
      console.log('📡 Transfer insert result:', result);
      
      const createdTransfer: BankTransfer = {
        ...transfer,
        id: id
      };
      
      console.log('✅ Transfer created with ID:', createdTransfer.id);
      return createdTransfer;
    } catch (error) {
      console.error('❌ Error creating transfer in Data Connect:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      throw new Error(`Failed to create transfer in Data Connect: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a transfer from Data Connect
   */
  static async deleteTransfer(id: string): Promise<void> {
    try {
      console.log('📡 Deleting transfer from Data Connect:', id);
      
      // Prepare variables for Data Connect
      const variables: TransferDeleteVariables = { id };

      // Get Data Connect instance and execute the mutation
      const dc = getDC();
      await transferDelete(dc, variables);
      
      console.log('✅ Transfer deleted:', id);
    } catch (error) {
      console.error(`❌ Error deleting transfer ${id} from Data Connect:`, error);
      throw new Error('Failed to delete transfer from Data Connect');
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
