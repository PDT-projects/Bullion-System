// Banking Module - Service Layer
// Business logic, calculations, and formatting
// Updated to work with Firebase Data Connect

import {
  Bank,
  BankTransfer,
  CashTransaction,
  BankStats,
  TransferStats,
  CashStats,
  DashboardStats,
  BankFormData,
  TransferFormData
} from './types';
import { BankDataConnectService } from '../../../api/dataconnect/bankDataConnectService';
import { CashDataConnectService } from '../../../api/dataconnect/cashDataConnectService';
import { TransferDataConnectService } from '../../../api/dataconnect/transferDataConnectService';

export class BankingService {
  // Format currency for display
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Format date for display
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Generate unique ID
  static generateId(): string {
    return Date.now().toString();
  }

  // ==================== DATA CONNECT METHODS ====================

  /**
   * Fetch all banks from Data Connect
   */
  static async fetchBanksFromDataConnect(): Promise<Bank[]> {
    return await BankDataConnectService.fetchAllBanks();
  }

  /**
   * Create a new bank in Data Connect
   */
  static async createBankInDataConnect(formData: BankFormData): Promise<Bank> {
    const bankData: Omit<Bank, 'id'> = {
      name: formData.name.trim(),
      accountNumber: formData.accountNumber.trim(),
      balance: formData.balance
    };
    return await BankDataConnectService.createBank(bankData);
  }

  /**
   * Update a bank in Data Connect
   */
  static async updateBankInDataConnect(bank: Bank, formData: BankFormData): Promise<Bank> {
    const updatedBank: Bank = {
      ...bank,
      name: formData.name.trim(),
      accountNumber: formData.accountNumber.trim(),
      balance: formData.balance
    };
    return await BankDataConnectService.updateBank(updatedBank);
  }

  /**
   * Delete a bank from Data Connect
   */
  static async deleteBankFromDataConnect(id: string): Promise<void> {
    return await BankDataConnectService.deleteBank(id);
  }

  /**
   * Update multiple banks in Data Connect
   */
  static async updateMultipleBanksInDataConnect(banks: Bank[]): Promise<Bank[]> {
    const updatedBanks: Bank[] = [];
    for (const bank of banks) {
      const updated = await BankDataConnectService.updateBank(bank);
      updatedBanks.push(updated);
    }
    return updatedBanks;
  }

  /**
   * Fetch all cash transactions from Data Connect
   */
  static async fetchCashTransactionsFromDataConnect(): Promise<CashTransaction[]> {
    return await CashDataConnectService.fetchAllCashTransactions();
  }

  /**
   * Create a cash transaction in Data Connect
   */
  static async createCashTransactionInDataConnect(transaction: Omit<CashTransaction, 'id' | 'createdAt'>): Promise<CashTransaction> {
    return await CashDataConnectService.createCashTransaction(transaction);
  }

  /**
   * Delete a cash transaction from Data Connect
   */
  static async deleteCashTransactionFromDataConnect(id: string): Promise<void> {
    return await CashDataConnectService.deleteCashTransaction(id);
  }

  /**
   * Fetch all transfers from Data Connect
   */
  static async fetchTransfersFromDataConnect(): Promise<BankTransfer[]> {
    return await TransferDataConnectService.fetchAllTransfers();
  }

  /**
   * Create a transfer in Data Connect
   */
  static async createTransferInDataConnect(transfer: Omit<BankTransfer, 'id' | 'createdAt'>): Promise<BankTransfer> {
    return await TransferDataConnectService.createTransfer(transfer);
  }

  /**
   * Delete a transfer from Data Connect
   */
  static async deleteTransferFromDataConnect(id: string): Promise<void> {
    return await TransferDataConnectService.deleteTransfer(id);
  }

  // Alias methods for backward compatibility
  static async fetchBanksFromFirebase(): Promise<Bank[]> {
    return await this.fetchBanksFromDataConnect();
  }

  static async createBankInFirebase(formData: BankFormData): Promise<Bank> {
    return await this.createBankInDataConnect(formData);
  }

  static async updateBankInFirebase(bank: Bank, formData: BankFormData): Promise<Bank> {
    return await this.updateBankInDataConnect(bank, formData);
  }

  static async deleteBankFromFirebase(id: string): Promise<void> {
    return await this.deleteBankFromDataConnect(id);
  }

  static async updateMultipleBanks(banks: Bank[]): Promise<Bank[]> {
    return await this.updateMultipleBanksInDataConnect(banks);
  }

  static async fetchCashRecordsFromFirebase(): Promise<CashTransaction[]> {
    return await this.fetchCashTransactionsFromDataConnect();
  }

  static async getOrCreateCashForLocation(_location: string): Promise<CashTransaction | null> {
    const transactions = await this.fetchCashTransactionsFromDataConnect();
    return transactions[0] || null;
  }

  static async updateCashBalance(id: string, newBalance: number, _updatedBy?: string): Promise<CashTransaction> {
    const transactions = await this.fetchCashTransactionsFromDataConnect();
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) throw new Error('Transaction not found');
    return { ...transaction, amount: newBalance };
  }

  static async adjustCashBalance(id: string, amount: number, _updatedBy?: string): Promise<CashTransaction> {
    const transactions = await this.fetchCashTransactionsFromDataConnect();
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) throw new Error('Transaction not found');
    return { ...transaction, amount: transaction.amount + amount };
  }

  // ==================== CALCULATION METHODS ====================

  // Calculate bank statistics
  static calculateBankStats(banks: Bank[]): BankStats {
    return {
      totalBanks: banks.length,
      totalBalance: banks.reduce((sum, bank) => sum + bank.balance, 0),
      highestBalance: banks.length > 0 ? Math.max(...banks.map(b => b.balance)) : 0,
      lowestBalance: banks.length > 0 ? Math.min(...banks.map(b => b.balance)) : 0
    };
  }

  // Calculate transfer statistics
  static calculateTransferStats(transfers: BankTransfer[]): TransferStats {
    const now = new Date();
    return {
      totalTransfers: transfers.length,
      totalAmount: transfers.reduce((sum, t) => sum + t.amount, 0),
      thisMonth: transfers.filter(t => {
        const transferDate = new Date(t.date);
        return transferDate.getMonth() === now.getMonth() && 
               transferDate.getFullYear() === now.getFullYear();
      }).length
    };
  }

  // Calculate cash statistics
  static calculateCashStats(transactions: CashTransaction[], openingBalance: number = 0): CashStats {
    const inflowTransactions = transactions.filter(t => t.mainCategory === 'Cash Inflow');
    const outflowTransactions = transactions.filter(t => t.mainCategory === 'Cash Outflow');
    
    const totalInflow = inflowTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalOutflow = outflowTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalCashInHand: openingBalance + totalInflow - totalOutflow,
      totalInflow,
      totalOutflow,
      transactionCount: transactions.length,
      inflowCount: inflowTransactions.length,
      outflowCount: outflowTransactions.length,
      openingBalance
    };
  }

  // Calculate dashboard statistics
  static calculateDashboardStats(banks: Bank[], cashTransactions: CashTransaction[]): DashboardStats {
    const totalBankBalance = banks.reduce((sum, bank) => sum + bank.balance, 0);
    const cashStats = this.calculateCashStats(cashTransactions);
    
    return {
      totalBankBalance,
      totalCashInHand: cashStats.totalCashInHand,
      totalLiquidity: totalBankBalance + cashStats.totalCashInHand,
      bankCount: banks.length
    };
  }

  // ==================== FILTER METHODS ====================

  // Filter banks by search term
  static filterBanks(banks: Bank[], searchTerm: string): Bank[] {
    if (!searchTerm.trim()) return banks;
    
    const term = searchTerm.toLowerCase();
    return banks.filter(bank => 
      bank.name.toLowerCase().includes(term) ||
      bank.accountNumber.toLowerCase().includes(term)
    );
  }

  // Filter transfers by search term
  static filterTransfers(transfers: BankTransfer[], searchTerm: string): BankTransfer[] {
    if (!searchTerm.trim()) return transfers;
    
    const term = searchTerm.toLowerCase();
    return transfers.filter(transfer => 
      transfer.fromBankName.toLowerCase().includes(term) ||
      transfer.toBankName.toLowerCase().includes(term) ||
      transfer.note?.toLowerCase().includes(term)
    );
  }

  // Filter cash transactions
  static filterCashTransactions(
    transactions: CashTransaction[], 
    searchTerm: string, 
    filterType: 'all' | 'inflow' | 'outflow'
  ): CashTransaction[] {
    return transactions.filter(transaction => {
      const matchesSearch = !searchTerm.trim() || 
        transaction.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.subCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.note?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = 
        filterType === 'all' || 
        (filterType === 'inflow' && transaction.mainCategory === 'Cash Inflow') ||
        (filterType === 'outflow' && transaction.mainCategory === 'Cash Outflow');

      return matchesSearch && matchesType;
    });
  }

  // ==================== VALIDATION METHODS ====================

  // Validate bank form
  static validateBankForm(formData: BankFormData, existingBanks: Bank[], excludeId?: string): Record<string, string> {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Bank name is required';
    }
    
    if (!formData.accountNumber.trim()) {
      errors.accountNumber = 'Account number is required';
    }
    
    if (formData.balance < 0) {
      errors.balance = 'Balance cannot be negative';
    }

    // Check for duplicate account number
    const existingBank = existingBanks.find(b => 
      b.id !== excludeId &&
      b.accountNumber.toLowerCase() === formData.accountNumber.toLowerCase()
    );
    if (existingBank) {
      errors.accountNumber = 'Account number already exists';
    }

    return errors;
  }

  // Validate transfer form
  static validateTransferForm(
    formData: TransferFormData, 
    banks: Bank[]
  ): Record<string, string> {
    const errors: Record<string, string> = {};
    
    if (!formData.fromBankId) {
      errors.fromBankId = 'Please select source bank';
    }
    
    if (!formData.toBankId) {
      errors.toBankId = 'Please select destination bank';
    }

    if (formData.fromBankId === formData.toBankId) {
      errors.toBankId = 'Cannot transfer to the same bank';
    }
    
    if (formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    const fromBank = banks.find(b => b.id === formData.fromBankId);
    if (fromBank && formData.amount > fromBank.balance) {
      errors.amount = 'Insufficient balance in source bank';
    }

    return errors;
  }

  // ==================== FACTORY METHODS ====================

  // Create new bank object (local)
  static createBank(formData: BankFormData): Bank {
    return {
      id: this.generateId(),
      name: formData.name.trim(),
      accountNumber: formData.accountNumber.trim(),
      balance: formData.balance
    };
  }

  // Update bank object (local)
  static updateBank(bank: Bank, formData: BankFormData): Bank {
    return {
      ...bank,
      name: formData.name.trim(),
      accountNumber: formData.accountNumber.trim(),
      balance: formData.balance
    };
  }

  // Create new transfer object (local)
  static createTransfer(formData: TransferFormData, banks: Bank[]): BankTransfer {
    const fromBank = banks.find(b => b.id === formData.fromBankId)!;
    const toBank = banks.find(b => b.id === formData.toBankId)!;

    return {
      id: this.generateId(),
      date: formData.date,
      fromBankId: formData.fromBankId,
      fromBankName: fromBank.name,
      toBankId: formData.toBankId,
      toBankName: toBank.name,
      amount: formData.amount,
      note: formData.note
    };
  }

  // ==================== BANK BALANCE OPERATIONS ====================

  // Update bank balances after transfer (local)
  static updateBankBalancesForTransfer(
    banks: Bank[], 
    fromBankId: string, 
    toBankId: string, 
    amount: number
  ): Bank[] {
    return banks.map(bank => {
      if (bank.id === fromBankId) {
        return { ...bank, balance: bank.balance - amount };
      }
      if (bank.id === toBankId) {
        return { ...bank, balance: bank.balance + amount };
      }
      return bank;
    });
  }

  // Update single bank balance (local)
  static updateBankBalance(banks: Bank[], bankId: string, newBalance: number): Bank[] {
    return banks.map(bank => 
      bank.id === bankId ? { ...bank, balance: newBalance } : bank
    );
  }

  // Add to bank balance (local)
  static addToBankBalance(banks: Bank[], bankId: string, amount: number): Bank[] {
    return banks.map(bank => 
      bank.id === bankId ? { ...bank, balance: bank.balance + amount } : bank
    );
  }

  // Subtract from bank balance (local)
  static subtractFromBankBalance(banks: Bank[], bankId: string, amount: number): Bank[] {
    return banks.map(bank => 
      bank.id === bankId ? { ...bank, balance: Math.max(0, bank.balance - amount) } : bank
    );
  }

  // ==================== DEFAULT DATA ====================

  // Get default bank form data
  static getDefaultBankFormData(): BankFormData {
    return {
      name: '',
      accountNumber: '',
      balance: 0
    };
  }

  // Get default transfer form data
  static getDefaultTransferFormData(): TransferFormData {
    return {
      fromBankId: '',
      toBankId: '',
      amount: 0,
      note: '',
      date: new Date().toISOString().split('T')[0]
    };
  }

  // Sort transactions by date (newest first)
  static sortTransactionsByDate<T extends { date: string }>(transactions: T[]): T[] {
    return [...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
}
