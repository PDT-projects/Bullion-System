// Salary Module - Service Layer
// Business logic, data operations, and utilities

import { 
  Salary, 
  SalaryTransaction,
  CreateSalaryDTO, 
  UpdateSalaryDTO, 
  SalaryFilters, 
  SalaryStats,
  ValidationResult,
  EmployeeInfo,
  SALARY_TYPES
} from './types';

/**
 * SalaryService - Contains all business logic for salary operations
 * This is a pure service class with no React dependencies
 */
export class SalaryService {
  
  // ==================== FILTERING & SEARCH ====================
  
  /**
   * Filter salaries based on multiple criteria
   */
  static filterSalaries(salaries: Salary[], filters: SalaryFilters): Salary[] {
    return salaries.filter(salary => {
      // Search term (case-insensitive, partial match)
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          salary.employeeName?.toLowerCase().includes(search) ||
          salary.transactionId?.toLowerCase().includes(search) ||
          salary.salaryMonth?.includes(search);
        
        if (!matchesSearch) return false;
      }

      // Type filter (regular vs advance) - case insensitive
      if (filters.typeFilter !== 'all') {
        const subCat = salary.subCategory?.toLowerCase() || '';
        const isRegular = subCat.includes('employee salary') || subCat === 'salary';
        if (filters.typeFilter === 'regular' && !isRegular) return false;
        if (filters.typeFilter === 'advance' && isRegular) return false;
      }


      // Date range filter
      if (filters.dateFrom && salary.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && salary.date > filters.dateTo) {
        return false;
      }

      // Employee filter
      if (filters.employeeFilter && salary.employeeId !== filters.employeeFilter) {
        return false;
      }

      // Month filter
      if (filters.monthFilter && salary.salaryMonth !== filters.monthFilter) {
        return false;
      }

      // Payment method filter
      if (filters.paymentMethodFilter && salary.mode !== filters.paymentMethodFilter) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get unique employees from all salaries
   */
  static getUniqueEmployees(salaries: Salary[]): { id: string; name: string }[] {
    const employeeMap = new Map<string, string>();
    salaries.forEach(s => {
      if (s.employeeId && s.employeeName) {
        employeeMap.set(s.employeeId, s.employeeName);
      }
    });
    return Array.from(employeeMap.entries()).map(([id, name]) => ({ id, name }));
  }

  /**
   * Get unique months from all salaries (sorted)
   */
  static getUniqueMonths(salaries: Salary[]): string[] {
    return Array.from(new Set(salaries.map(s => s.salaryMonth).filter(Boolean))).sort().reverse();
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Create new salary records from form data
   */
  static createSalaries(salaries: Salary[], data: CreateSalaryDTO): Salary[] {
    const newSalaries: Salary[] = data.transactions.map((txn, index) => ({
      id: Date.now().toString() + index,
      transactionId: `TXN-${Date.now()}${Math.random().toString().slice(-4)}`,
      date: data.date,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      employeeId: data.employeeId,
      employeeName: '', // Will be populated from employee context
      mainCategory: 'Salary',
      subCategory: data.subCategory,
      amount: txn.amount,
      baseSalary: data.baseSalary,
      commission: data.commission,
      deductions: data.deductions,
      netAmount: data.baseSalary + data.commission - data.deductions,
      mode: txn.mode,
      bankName: txn.bankName,
      paidBy: txn.paidBy,
      transactionBy: txn.transactionBy,
      salaryMonth: txn.salaryMonth,
      note: data.note,
      imageUrl: txn.imageUrl,
      paymentStatus: txn.paymentStatus,
      remainingAmount: txn.remainingAmount
    }));

    return [...salaries, ...newSalaries];
  }

  /**
   * Update an existing salary
   */
  static updateSalary(salaries: Salary[], id: string, data: UpdateSalaryDTO): Salary[] {
    return salaries.map(s => 
      s.id === id ? {
        ...s,
        employeeId: data.employeeId,
        date: data.date,
        subCategory: data.subCategory,
        note: data.note,
        baseSalary: data.baseSalary,
        commission: data.commission,
        deductions: data.deductions,
        netAmount: data.baseSalary + data.commission - data.deductions,
        // Update first transaction data
        amount: data.transactions[0]?.amount || s.amount,
        mode: data.transactions[0]?.mode || s.mode,
        bankName: data.transactions[0]?.bankName || s.bankName,
        paidBy: data.transactions[0]?.paidBy || s.paidBy,
        transactionBy: data.transactions[0]?.transactionBy || s.transactionBy,
        salaryMonth: data.transactions[0]?.salaryMonth || s.salaryMonth,
        imageUrl: data.transactions[0]?.imageUrl || s.imageUrl,
        paymentStatus: data.transactions[0]?.paymentStatus || s.paymentStatus,
        remainingAmount: data.transactions[0]?.remainingAmount || s.remainingAmount
      } : s
    );
  }

  /**
   * Delete a salary by ID
   */
  static deleteSalary(salaries: Salary[], id: string): Salary[] {
    return salaries.filter(s => s.id !== id);
  }

  /**
   * Find salary by ID
   */
  static findById(salaries: Salary[], id: string): Salary | undefined {
    return salaries.find(s => s.id === id);
  }

  // ==================== VALIDATION ====================

  /**
   * Validate salary data before create/update
   */
  static validateSalary(data: Partial<Salary>, transactions: SalaryTransaction[]): ValidationResult {
    const fieldErrors: { [key: string]: string } = {};

    // Employee validation
    if (!data.employeeId || data.employeeId.trim() === '') {
      fieldErrors.employeeId = 'Employee is required';
    }

    // Date validation
    if (!data.date || data.date.trim() === '') {
      fieldErrors.date = 'Date is required';
    }

    // Base salary validation
    if (data.baseSalary === undefined || data.baseSalary < 0) {
      fieldErrors.baseSalary = 'Base salary cannot be negative';
    }

    // Validate each transaction
    if (!transactions || transactions.length === 0) {
      fieldErrors.transactions = 'At least one transaction is required';
    } else {
      transactions.forEach((txn: SalaryTransaction, index: number) => {
        const prefix = `transaction_${index}_`;
        
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
   * Calculate salary statistics
   */
  static calculateStats(salaries: Salary[]): SalaryStats {
    const totalRecords = salaries.length;
    const totalAmount = salaries.reduce((sum, s) => sum + s.amount, 0);

    // Handle case-insensitive filtering for regular and advance salaries
    const regularSalaries = salaries.filter(s => {
      const subCat = s.subCategory?.toLowerCase() || '';
      return subCat.includes('employee salary') || subCat === 'salary';
    });
    const advanceSalaries = salaries.filter(s => {
      const subCat = s.subCategory?.toLowerCase() || '';
      return subCat.includes('advance salary');
    });


    const cashSalaries = salaries.filter(s => s.mode === 'Cash');
    const bankSalaries = salaries.filter(s => s.mode === 'Bank');
    const chequeSalaries = salaries.filter(s => s.mode === 'Cheque');

    // Calculate this month's total
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthTotal = salaries
      .filter(s => s.salaryMonth === currentMonth)
      .reduce((sum, s) => sum + s.amount, 0);

    // Count pending slips (partial payments or no payment status)
    const pendingSlips = salaries.filter(s => !s.paymentStatus || s.paymentStatus === 'Partial').length;

    return {
      totalRecords,
      totalAmount,
      regularCount: regularSalaries.length,
      regularTotal: regularSalaries.reduce((sum, s) => sum + s.amount, 0),
      advanceCount: advanceSalaries.length,
      advanceTotal: advanceSalaries.reduce((sum, s) => sum + s.amount, 0),
      thisMonthTotal,
      pendingSlips,
      cashTotal: cashSalaries.reduce((sum, s) => sum + s.amount, 0),
      bankTotal: bankSalaries.reduce((sum, s) => sum + s.amount, 0),
      chequeTotal: chequeSalaries.reduce((sum, s) => sum + s.amount, 0)
    };
  }

  /**
   * Calculate total paid to an employee in a specific month
   */
  static getEmployeeTotalPaid(salaries: Salary[], employeeId: string, month: string): number {
    return salaries
      .filter(s => s.employeeId === employeeId && s.salaryMonth === month)
      .reduce((sum, s) => sum + s.amount, 0);
  }

  /**
   * Check if employee is fully paid for a month
   */
  static isEmployeeFullyPaid(salaries: Salary[], employeeId: string, month: string, fullSalary: number): boolean {
    const totalPaid = this.getEmployeeTotalPaid(salaries, employeeId, month);
    return totalPaid >= fullSalary;
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
   * Check if any filters are active
   */
  static hasActiveFilters(filters: SalaryFilters): boolean {
    return !!(
      filters.searchTerm ||
      filters.typeFilter !== 'all' ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.employeeFilter ||
      filters.monthFilter ||
      filters.paymentMethodFilter
    );
  }

  /**
   * Count active filters
   */
  static countActiveFilters(filters: SalaryFilters): number {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.typeFilter !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.employeeFilter) count++;
    if (filters.monthFilter) count++;
    if (filters.paymentMethodFilter) count++;
    return count;
  }

  /**
   * Get default empty salary form data
   */
  static getDefaultFormData(): { 
    employeeId: string; 
    subCategory: 'Employee salary' | 'Advance salary'; 
    date: string; 
    note: string;
    baseSalary: number;
    commission: number;
    deductions: number;
  } {
    return {
      employeeId: '',
      subCategory: SALARY_TYPES.REGULAR,
      date: new Date().toISOString().split('T')[0],
      note: '',
      baseSalary: 0,
      commission: 0,
      deductions: 0
    };
  }

  /**
   * Get default empty transaction
   */
  static getDefaultTransaction(): SalaryTransaction {
    return {
      id: Date.now().toString(),
      amount: 0,
      paidBy: '',
      transactionBy: '',
      mode: 'Cash',
      bankName: '',
      imageUrl: '',
      paymentStatus: 'Full',
      remainingAmount: 0,
      salaryMonth: new Date().toISOString().slice(0, 7)
    };
  }

  /**
   * Get salary type label
   */
  static getSalaryTypeLabel(subCategory: string): string {
    const subCat = subCategory?.toLowerCase() || '';
    const isRegular = subCat.includes('employee salary') || subCat === 'salary';
    return isRegular ? 'Regular' : 'Advance';
  }

  /**
   * Get salary type color
   */
  static getSalaryTypeColor(subCategory: string): string {
    const subCat = subCategory?.toLowerCase() || '';
    const isRegular = subCat.includes('employee salary') || subCat === 'salary';
    return isRegular 
      ? 'bg-green-100 text-green-800' 
      : 'bg-orange-100 text-orange-800';
  }

}
