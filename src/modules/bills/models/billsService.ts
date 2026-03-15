// Bills Module - Service Layer
// Pure business logic and utilities — no Firestore calls, no React

import {
  Bill,
  BillTransaction,
  BillFilters,
  BillStats,
  ValidationResult,
  BILL_CATEGORIES,
  COMPANIES
} from './types';

export class BillsService {

  // ==================== FILTERING ====================

  static filterBills(bills: Bill[], filters: BillFilters): Bill[] {
    return bills.filter(bill => {
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matches =
          bill.paidTo?.toLowerCase().includes(search) ||
          bill.paidBy?.toLowerCase().includes(search) ||
          bill.subCategory?.toLowerCase().includes(search) ||
          bill.company?.toLowerCase().includes(search) ||
          bill.transactionBy?.toLowerCase().includes(search);
        if (!matches) return false;
      }
      if (filters.categoryFilter !== 'all' && bill.subCategory !== filters.categoryFilter) return false;
      if (filters.dateFrom && bill.date < filters.dateFrom) return false;
      if (filters.dateTo && bill.date > filters.dateTo) return false;
      if (filters.paymentMethodFilter && bill.mode !== filters.paymentMethodFilter) return false;
      return true;
    });
  }

  static getUniqueVendors(bills: Bill[]): string[] {
    return Array.from(new Set(bills.map(b => b.paidTo).filter(Boolean))).sort();
  }

  // ==================== STATISTICS ====================

  static calculateStats(bills: Bill[]): BillStats {
    const electricity = bills.filter(b => b.subCategory === 'Electricity');
    const internet = bills.filter(b => b.subCategory === 'Internet');
    const utilities = bills.filter(b => b.subCategory === 'Utilities');

    return {
      totalBills: bills.length,
      totalAmount: bills.reduce((sum, b) => sum + b.amount, 0),
      electricityCount: electricity.length,
      electricityTotal: electricity.reduce((sum, b) => sum + b.amount, 0),
      internetCount: internet.length,
      internetTotal: internet.reduce((sum, b) => sum + b.amount, 0),
      utilitiesCount: utilities.length,
      utilitiesTotal: utilities.reduce((sum, b) => sum + b.amount, 0),
      cashTotal: bills.filter(b => b.mode === 'Cash').reduce((sum, b) => sum + b.amount, 0),
      bankTotal: bills.filter(b => b.mode === 'Bank').reduce((sum, b) => sum + b.amount, 0),
      chequeTotal: bills.filter(b => b.mode === 'Cheque').reduce((sum, b) => sum + b.amount, 0)
    };
  }

  // ==================== VALIDATION ====================

  static validateBill(data: Partial<Bill>, transactions: BillTransaction[]): ValidationResult {
    const fieldErrors: { [key: string]: string } = {};

    if (!data.company || data.company.trim() === '') fieldErrors.company = 'Company is required';
    if (!data.date || data.date.trim() === '') fieldErrors.date = 'Date is required';
    if (!data.subCategory) fieldErrors.subCategory = 'Category is required';

    if (!transactions || transactions.length === 0) {
      fieldErrors.transactions = 'At least one transaction is required';
    } else {
      transactions.forEach((txn, index) => {
        const p = `transaction_${index}_`;
        if (!txn.paidTo || txn.paidTo.trim() === '') fieldErrors[`${p}paidTo`] = 'Vendor is required';
        if (!txn.paidBy || txn.paidBy.trim() === '') fieldErrors[`${p}paidBy`] = 'Paid by is required';
        if (!txn.amount || txn.amount <= 0) fieldErrors[`${p}amount`] = 'Valid amount is required';
        if ((txn.mode === 'Bank' || txn.mode === 'Cheque') && !txn.bankName) {
          fieldErrors[`${p}bankName`] = 'Bank name is required for bank/cheque payments';
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

  // ==================== FORMATTING ====================

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  static formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  static getCategoryColor(category: string): string {
    switch (category) {
      case 'Electricity': return 'bg-yellow-100 text-yellow-800';
      case 'Internet':    return 'bg-blue-100 text-blue-800';
      case 'Utilities':   return 'bg-cyan-100 text-cyan-800';
      default:            return 'bg-gray-100 text-gray-800';
    }
  }

  static getCategoryIconName(category: string): 'Zap' | 'Wifi' | 'Droplets' | 'Receipt' {
    switch (category) {
      case 'Electricity': return 'Zap';
      case 'Internet':    return 'Wifi';
      case 'Utilities':   return 'Droplets';
      default:            return 'Receipt';
    }
  }

  static countActiveFilters(filters: BillFilters): number {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.categoryFilter !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.paymentMethodFilter) count++;
    return count;
  }

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