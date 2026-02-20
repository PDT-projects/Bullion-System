// Banking Module - Service Layer
// Business logic, calculations, and formatting

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

  // Create new bank
  static createBank(formData: BankFormData): Bank {
    return {
      id: this.generateId(),
      name: formData.name.trim(),
      accountNumber: formData.accountNumber.trim(),
      balance: formData.balance
    };
  }

  // Update bank
  static updateBank(bank: Bank, formData: BankFormData): Bank {
    return {
      ...bank,
      name: formData.name.trim(),
      accountNumber: formData.accountNumber.trim(),
      balance: formData.balance
    };
  }

  // Create new transfer
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

  // Update bank balances after transfer
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
