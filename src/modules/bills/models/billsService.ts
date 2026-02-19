// Bills Module - Service Layer
// Business logic, data operations, and utilities

import { 
  Bill, 
  BillTransaction,
  CreateBillDTO, 
  UpdateBillDTO, 
  BillFilters, 
  BillStats,
  ValidationResult,
  BILL_CATEGORIES,
  PREDEFINED_VENDORS,
  COMPANIES
} from './types';


/**
 * BillsService - Contains all business logic for bill operations
 * This is a pure service class with no React dependencies
 */
export class BillsService {
  
  // ==================== FILTERING & SEARCH ====================
  
  /**
   * Filter bills based on multiple criteria
   */
  static filterBills(bills: Bill[], filters: BillFilters): Bill[] {
    return bills.filter(bill => {
      // Search term (case-insensitive, partial match)
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          bill.paidTo?.toLowerCase().includes(search) ||
          bill.paidBy?.toLowerCase().includes(search) ||
          bill.subCategory?.toLowerCase().includes(search) ||
          bill.company?.toLowerCase().includes(search) ||
          bill.transactionBy?.toLowerCase().includes(search);
        
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.categoryFilter !== 'all' && bill.subCategory !== filters.categoryFilter) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom && bill.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && bill.date > filters.dateTo) {
        return false;
      }

      // Payment method filter
      if (filters.paymentMethodFilter && bill.mode !== filters.paymentMethodFilter) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get unique vendors from all bills (sorted)
   */
  static getUniqueVendors(bills: Bill[]): string[] {
    return Array.from(new Set(bills.map(b => b.paidTo).filter(Boolean))).sort();
  }

  /**
   * Get unique companies from all bills (sorted)
   */
  static getUniqueCompanies(bills: Bill[]): string[] {
    return Array.from(new Set(bills.map(b => b.company).filter(Boolean))).sort();
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Create new bills from form data
   */
  static createBills(bills: Bill[], data: CreateBillDTO): Bill[] {
    const newBills: Bill[] = data.transactions.map((txn, index) => ({
      id: Date.now().toString() + index,
      transactionId: `TXN-${Date.now()}${Math.random().toString().slice(-4)}`,
      date: data.date,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      company: data.company,
      mainCategory: 'Bills',
      subCategory: data.subCategory,
      amount: txn.amount,
      mode: txn.mode,
      bankName: txn.bankName,
      paidBy: txn.paidBy,
      paidTo: txn.paidTo,
      transactionBy: txn.transactionBy,
      billMonth: txn.billMonth,
      note: data.note,
      imageUrl: txn.imageUrl,
      paymentStatus: txn.paymentStatus,
      remainingAmount: txn.remainingAmount
    }));

    return [...bills, ...newBills];
  }

  /**
   * Update an existing bill
   */
  static updateBill(bills: Bill[], id: string, data: UpdateBillDTO): Bill[] {
    return bills.map(b => 
      b.id === id ? {
        ...b,
        company: data.company,
        date: data.date,
        subCategory: data.subCategory,
        note: data.note,
        // Update first transaction data
        amount: data.transactions[0]?.amount || b.amount,
        mode: data.transactions[0]?.mode || b.mode,
        bankName: data.transactions[0]?.bankName || b.bankName,
        paidBy: data.transactions[0]?.paidBy || b.paidBy,
        paidTo: data.transactions[0]?.paidTo || b.paidTo,
        transactionBy: data.transactions[0]?.transactionBy || b.transactionBy,
        billMonth: data.transactions[0]?.billMonth || b.billMonth,
        imageUrl: data.transactions[0]?.imageUrl || b.imageUrl,
        paymentStatus: data.transactions[0]?.paymentStatus || b.paymentStatus,
        remainingAmount: data.transactions[0]?.remainingAmount || b.remainingAmount
      } : b
    );
  }

  /**
   * Delete a bill by ID
   */
  static deleteBill(bills: Bill[], id: string): Bill[] {
    return bills.filter(b => b.id !== id);
  }

  /**
   * Find bill by ID
   */
  static findById(bills: Bill[], id: string): Bill | undefined {
    return bills.find(b => b.id === id);
  }

  // ==================== VALIDATION ====================

  /**
   * Validate bill data before create/update
   */
  static validateBill(data: Partial<Bill>, transactions: BillTransaction[]): ValidationResult {
    const fieldErrors: { [key: string]: string } = {};

    // Company validation
    if (!data.company || data.company.trim() === '') {
      fieldErrors.company = 'Company is required';
    }

    // Date validation
    if (!data.date || data.date.trim() === '') {
      fieldErrors.date = 'Date is required';
    }

    // Category validation
    if (!data.subCategory) {
      fieldErrors.subCategory = 'Category is required';
    }

    // Validate each transaction
    if (!transactions || transactions.length === 0) {
      fieldErrors.transactions = 'At least one transaction is required';
    } else {
      transactions.forEach((txn: BillTransaction, index: number) => {
        const prefix = `transaction_${index}_`;
        
        if (!txn.paidTo || txn.paidTo.trim() === '') {
          fieldErrors[`${prefix}paidTo`] = 'Vendor is required';
        }
        
        if (!txn.paidBy || txn.paidBy.trim() === '') {
          fieldErrors[`${prefix}paidBy`] = 'Paid by is required';
        }
        
        if (!txn.amount || txn.amount <= 0) {
          fieldErrors[`${prefix}amount`] = 'Valid amount is required';
        }
        
        if ((txn.mode === 'Bank' || txn.mode === 'Cheque') && !txn.bankName) {
          fieldErrors[`${prefix}bankName`] = 'Bank name is required for bank/cheque payments';
        }
      });
    }

    const isValid = Object.keys(fieldErrors).length === 0;
    return { 
      isValid, 
      error: isValid ? null : 'Please fix the errors below',
      fieldErrors: isValid ? undefined : fieldErrors
    };
  }


  // ==================== STATISTICS ====================

  /**
   * Calculate bill statistics
   */
  static calculateStats(bills: Bill[]): BillStats {
    const totalBills = bills.length;
    const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);

    const electricityBills = bills.filter(b => b.subCategory === 'Electricity');
    const internetBills = bills.filter(b => b.subCategory === 'Internet');
    const utilitiesBills = bills.filter(b => b.subCategory === 'Utilities');

    const cashBills = bills.filter(b => b.mode === 'Cash');
    const bankBills = bills.filter(b => b.mode === 'Bank');
    const chequeBills = bills.filter(b => b.mode === 'Cheque');

    return {
      totalBills,
      totalAmount,
      electricityCount: electricityBills.length,
      electricityTotal: electricityBills.reduce((sum, b) => sum + b.amount, 0),
      internetCount: internetBills.length,
      internetTotal: internetBills.reduce((sum, b) => sum + b.amount, 0),
      utilitiesCount: utilitiesBills.length,
      utilitiesTotal: utilitiesBills.reduce((sum, b) => sum + b.amount, 0),
      cashTotal: cashBills.reduce((sum, b) => sum + b.amount, 0),
      bankTotal: bankBills.reduce((sum, b) => sum + b.amount, 0),
      chequeTotal: chequeBills.reduce((sum, b) => sum + b.amount, 0)
    };
  }

  // ==================== FORMATTING UTILITIES ====================

  /**
   * Format number as PKR currency
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format date string to locale date
   */
  static formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get category icon color
   */
  static getCategoryColor(category: string): string {
    switch (category) {
      case 'Electricity':
        return 'bg-yellow-100 text-yellow-800';
      case 'Internet':
        return 'bg-blue-100 text-blue-800';
      case 'Utilities':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get category icon component mapping
   */
  static getCategoryIconName(category: string): 'Zap' | 'Wifi' | 'Droplets' | 'Receipt' {
    switch (category) {
      case 'Electricity':
        return 'Zap';
      case 'Internet':
        return 'Wifi';
      case 'Utilities':
        return 'Droplets';
      default:
        return 'Receipt';
    }
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: BillFilters): boolean {
    return !!(
      filters.searchTerm ||
      filters.categoryFilter !== 'all' ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.paymentMethodFilter
    );
  }

  /**
   * Count active filters
   */
  static countActiveFilters(filters: BillFilters): number {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.categoryFilter !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.paymentMethodFilter) count++;
    return count;
  }

  /**
   * Get default empty bill form data
   */
  static getDefaultFormData(): { company: string; billCategory: keyof typeof BILL_CATEGORIES; date: string; note: string } {
    return {
      company: COMPANIES[0],
      billCategory: 'Electricity',
      date: new Date().toISOString().split('T')[0],
      note: ''
    };
  }

  /**
   * Get default empty transaction
   */
  static getDefaultTransaction(): BillTransaction {
    return {
      id: Date.now().toString(),
      amount: 0,
      paidBy: '',
      paidTo: '',
      transactionBy: '',
      mode: 'Cash',
      bankName: '',
      imageUrl: '',
      paymentStatus: 'Full',
      remainingAmount: 0,
      billMonth: new Date().toISOString().slice(0, 7)
    };
  }
}
