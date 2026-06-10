// Salary Module - Service Layer
// Pure business logic and utilities — no Firestore calls, no React

import {
  Salary,
  SalaryTransaction,
  CreateSalaryDTO,
  UpdateSalaryDTO,
  SalaryFilters,
  SalaryStats,
  ValidationResult,
  SALARY_TYPES
} from './types';

export class SalaryService {

  // ==================== FILTERING & SEARCH ====================

  static filterSalaries(salaries: Salary[], filters: SalaryFilters): Salary[] {
    return salaries.filter(salary => {
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matchesSearch =
          salary.employeeName?.toLowerCase().includes(search) ||
          salary.transactionId?.toLowerCase().includes(search) ||
          salary.salaryMonth?.includes(search);
        if (!matchesSearch) return false;
      }

      if (filters.typeFilter !== 'all') {
        const subCat = salary.subCategory?.toLowerCase() || '';
        const isRegular = subCat.includes('employee salary') || subCat === 'salary';
        if (filters.typeFilter === 'regular' && !isRegular) return false;
        if (filters.typeFilter === 'advance' && isRegular) return false;
      }

      if (filters.dateFrom && salary.date < filters.dateFrom) return false;
      if (filters.dateTo && salary.date > filters.dateTo) return false;
      if (filters.employeeFilter && salary.employeeId !== filters.employeeFilter) return false;
      if (filters.monthFilter && salary.salaryMonth !== filters.monthFilter) return false;
      if (filters.paymentMethodFilter && salary.mode !== filters.paymentMethodFilter) return false;

      return true;
    });
  }

  static getUniqueEmployees(salaries: Salary[]): { id: string; name: string }[] {
    const map = new Map<string, string>();
    salaries.forEach(s => {
      if (s.employeeId && s.employeeName) map.set(s.employeeId, s.employeeName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }

  static getUniqueMonths(salaries: Salary[]): string[] {
    return Array.from(new Set(salaries.map(s => s.salaryMonth).filter(Boolean))).sort().reverse();
  }

  // ==================== STATISTICS ====================

  static calculateStats(salaries: Salary[]): SalaryStats {
    const totalRecords = salaries.length;
    const totalAmount = salaries.reduce((sum, s) => sum + s.amount, 0);

    const regularSalaries = salaries.filter(s => {
      const subCat = s.subCategory?.toLowerCase() || '';
      return subCat.includes('employee salary') || subCat === 'salary';
    });
    const advanceSalaries = salaries.filter(s => {
      const subCat = s.subCategory?.toLowerCase() || '';
      return subCat.includes('advance salary');
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthTotal = salaries
      .filter(s => s.salaryMonth === currentMonth)
      .reduce((sum, s) => sum + s.amount, 0);

    const pendingSlips = salaries.filter(
      s => !s.paymentStatus || s.paymentStatus === 'Partial'
    ).length;

    return {
      totalRecords,
      totalAmount,
      regularCount: regularSalaries.length,
      regularTotal: regularSalaries.reduce((sum, s) => sum + s.amount, 0),
      advanceCount: advanceSalaries.length,
      advanceTotal: advanceSalaries.reduce((sum, s) => sum + s.amount, 0),
      thisMonthTotal,
      pendingSlips,
      cashTotal: salaries.filter(s => s.mode === 'Cash').reduce((sum, s) => sum + s.amount, 0),
      bankTotal: salaries.filter(s => s.mode === 'Bank').reduce((sum, s) => sum + s.amount, 0),
      chequeTotal: salaries.filter(s => s.mode === 'Cheque').reduce((sum, s) => sum + s.amount, 0)
    };
  }

  static getEmployeeTotalPaid(salaries: Salary[], employeeId: string, month: string): number {
    return salaries
      .filter(s => s.employeeId === employeeId && s.salaryMonth === month)
      .reduce((sum, s) => sum + s.amount, 0);
  }

  static isEmployeeFullyPaid(
    salaries: Salary[],
    employeeId: string,
    month: string,
    fullSalary: number
  ): boolean {
    return this.getEmployeeTotalPaid(salaries, employeeId, month) >= fullSalary;
  }

  // ==================== VALIDATION ====================

  static validateSalary(
    data: Partial<Salary>,
    transactions: SalaryTransaction[]
  ): ValidationResult {
    const fieldErrors: { [key: string]: string } = {};

    if (!data.employeeId || data.employeeId.trim() === '') {
      fieldErrors.employeeId = 'Employee is required';
    }
    if (!data.date || data.date.trim() === '') {
      fieldErrors.date = 'Date is required';
    }
    if (data.baseSalary === undefined || data.baseSalary < 0) {
      fieldErrors.baseSalary = 'Base salary cannot be negative';
    }

    if (!transactions || transactions.length === 0) {
      fieldErrors.transactions = 'At least one transaction is required';
    } else {
      transactions.forEach((txn, index) => {
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

  // ==================== FORMATTING ====================

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  }

  static formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

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

  static getDefaultFormData() {
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

  static getSalaryTypeLabel(subCategory: string): string {
    const subCat = subCategory?.toLowerCase() || '';
    return subCat.includes('employee salary') || subCat === 'salary' ? 'Regular' : 'Advance';
  }

  static getSalaryTypeColor(subCategory: string): string {
    const subCat = subCategory?.toLowerCase() || '';
    const isRegular = subCat.includes('employee salary') || subCat === 'salary';
    return isRegular ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  }
}