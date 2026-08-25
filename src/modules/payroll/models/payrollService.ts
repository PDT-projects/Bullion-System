// Payroll Module - Unified Service Layer
// Merges SalaryService + commissionService pure business logic

import {
  Salary, SalaryTransaction, SalaryFilters, SalaryStats, ValidationResult,
  CommissionSlab, Commission, CommissionSlabFilter, CommissionFilter,
  CommissionStats, CreateCommissionSlabDTO, UpdateCommissionSlabDTO, SlabOverlap,
  SALARY_TYPES,
} from './types';

// ─── SALARY SERVICE ───────────────────────────────────────────────────────────

export class SalaryService {

  static filterSalaries(salaries: Salary[], filters: SalaryFilters): Salary[] {
    return salaries.filter(salary => {
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matches =
          salary.employeeName?.toLowerCase().includes(search) ||
          salary.transactionId?.toLowerCase().includes(search) ||
          salary.salaryMonth?.includes(search);
        if (!matches) return false;
      }
      if (filters.typeFilter !== 'all') {
        const subCat   = salary.subCategory?.toLowerCase() || '';
        const isRegular = subCat.includes('employee salary') || subCat === 'salary';
        if (filters.typeFilter === 'regular' && !isRegular) return false;
        if (filters.typeFilter === 'advance' && isRegular)  return false;
      }
      if (filters.dateFrom && salary.date < filters.dateFrom) return false;
      if (filters.dateTo   && salary.date > filters.dateTo)   return false;
      if (filters.employeeFilter     && salary.employeeId !== filters.employeeFilter) return false;
      if (filters.monthFilter        && salary.salaryMonth !== filters.monthFilter)   return false;
      if (filters.paymentMethodFilter && salary.mode !== filters.paymentMethodFilter) return false;
      return true;
    });
  }

  static getUniqueEmployees(salaries: Salary[]): { id: string; name: string }[] {
    const map = new Map<string, string>();
    salaries.forEach(s => { if (s.employeeId && s.employeeName) map.set(s.employeeId, s.employeeName); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }

  static getUniqueMonths(salaries: Salary[]): string[] {
    return Array.from(new Set(salaries.map(s => s.salaryMonth).filter(Boolean))).sort().reverse();
  }

  static calculateStats(salaries: Salary[]): SalaryStats {
    const totalAmount    = salaries.reduce((sum, s) => sum + s.amount, 0);
    const regularSalaries = salaries.filter(s => {
      const c = s.subCategory?.toLowerCase() || '';
      return c.includes('employee salary') || c === 'salary';
    });
    const advanceSalaries = salaries.filter(s =>
      (s.subCategory?.toLowerCase() || '').includes('advance salary')
    );
    const currentMonth  = new Date().toISOString().slice(0, 7);
    return {
      totalRecords:   salaries.length,
      totalAmount,
      regularCount:   regularSalaries.length,
      regularTotal:   regularSalaries.reduce((sum, s) => sum + s.amount, 0),
      advanceCount:   advanceSalaries.length,
      advanceTotal:   advanceSalaries.reduce((sum, s) => sum + s.amount, 0),
      thisMonthTotal: salaries.filter(s => s.salaryMonth === currentMonth).reduce((sum, s) => sum + s.amount, 0),
      pendingSlips:   salaries.filter(s => !s.paymentStatus || s.paymentStatus === 'Partial').length,
      cashTotal:      salaries.filter(s => s.mode === 'Cash').reduce((sum, s) => sum + s.amount, 0),
      bankTotal:      salaries.filter(s => s.mode === 'Bank').reduce((sum, s) => sum + s.amount, 0),
      chequeTotal:    salaries.filter(s => s.mode === 'Cheque').reduce((sum, s) => sum + s.amount, 0),
    };
  }

  static getEmployeeTotalPaid(salaries: Salary[], employeeId: string, month: string): number {
    return salaries
      .filter(s => s.employeeId === employeeId && s.salaryMonth === month)
      .reduce((sum, s) => sum + s.amount, 0);
  }

  static isEmployeeFullyPaid(salaries: Salary[], employeeId: string, month: string, fullSalary: number): boolean {
    return this.getEmployeeTotalPaid(salaries, employeeId, month) >= fullSalary;
  }

  static validateSalary(data: Partial<Salary>, transactions: SalaryTransaction[]): ValidationResult {
    const fieldErrors: { [key: string]: string } = {};
    if (!data.employeeId?.trim()) fieldErrors.employeeId = 'Employee is required';
    if (!data.date?.trim())       fieldErrors.date       = 'Date is required';
    if (data.baseSalary === undefined || data.baseSalary < 0)
      fieldErrors.baseSalary = 'Base salary cannot be negative';
    if (!transactions || transactions.length === 0) {
      fieldErrors.transactions = 'At least one transaction is required';
    } else {
      transactions.forEach((txn, i) => {
        const p = `transaction_${i}_`;
        if (!txn.paidBy?.trim())  fieldErrors[`${p}paidBy`]  = 'Paid by is required';
        if (!txn.amount || txn.amount <= 0) fieldErrors[`${p}amount`] = 'Valid amount is required';
        if ((txn.mode === 'Bank' || txn.mode === 'Cheque') && !txn.bankName)
          fieldErrors[`${p}bankName`] = 'Bank name is required for bank/cheque payments';
      });
    }
    const isValid = Object.keys(fieldErrors).length === 0;
    return { isValid, error: isValid ? null : 'Please fix the errors below', fieldErrors: isValid ? undefined : fieldErrors };
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(amount);
  }

  static formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  static hasActiveFilters(filters: SalaryFilters): boolean {
    return !!(filters.searchTerm || filters.typeFilter !== 'all' || filters.dateFrom ||
      filters.dateTo || filters.employeeFilter || filters.monthFilter || filters.paymentMethodFilter);
  }

  static countActiveFilters(filters: SalaryFilters): number {
    let n = 0;
    if (filters.searchTerm)            n++;
    if (filters.typeFilter !== 'all')  n++;
    if (filters.dateFrom)              n++;
    if (filters.dateTo)                n++;
    if (filters.employeeFilter)        n++;
    if (filters.monthFilter)           n++;
    if (filters.paymentMethodFilter)   n++;
    return n;
  }

  static getDefaultFormData() {
    return {
      employeeId:  '',
      subCategory: SALARY_TYPES.REGULAR,
      date:        new Date().toISOString().split('T')[0],
      note:        '',
      baseSalary:  0,
      commission:  0,
      deductions:  0,
    };
  }

  static getDefaultTransaction(): SalaryTransaction {
    return {
      id:              Date.now().toString(),
      amount:          0,
      paidBy:          '',
      transactionBy:   '',
      mode:            'Cash',
      bankId:          '',
      bankName:        '',
      chequeNumber:    '',
      chequeDate:      '',
      chequeBank:      '',
      imageUrl:        '',
      paymentStatus:   'Full',
      remainingAmount: 0,
      salaryMonth:     new Date().toISOString().slice(0, 7),
    };
  }

  static getSalaryTypeLabel(subCategory: string): string {
    const c = subCategory?.toLowerCase() || '';
    return c.includes('employee salary') || c === 'salary' ? 'Regular' : 'Advance';
  }

  static getSalaryTypeColor(subCategory: string): string {
    const c       = subCategory?.toLowerCase() || '';
    const isRegular = c.includes('employee salary') || c === 'salary';
    return isRegular ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  }
}

// ─── COMMISSION SERVICE ───────────────────────────────────────────────────────

export const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Bullion RND/SITE', 'Asif'] as const;

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

export const formatMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const filterCommissionSlabs = (slabs: CommissionSlab[], filter: CommissionSlabFilter): CommissionSlab[] => {
  return slabs.filter(slab => {
    if (filter.salesperson && slab.salesperson !== filter.salesperson) return false;
    if (filter.city && !slab.city.toLowerCase().includes(filter.city.toLowerCase())) return false;
    return true;
  });
};

export const validateCommissionSlab = (
  dto: CreateCommissionSlabDTO,
  existingSlabs: CommissionSlab[],
  excludeId?: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!dto.salesperson) errors.push('Salesperson is required');
  if (!dto.city)        errors.push('City is required');
  if (dto.fromAmount === undefined || dto.fromAmount < 0) errors.push('From Amount must be 0 or greater');
  if (dto.toAmount   === undefined || dto.toAmount <= 0)  errors.push('To Amount must be greater than 0');
  if (dto.fromAmount >= dto.toAmount) errors.push('From Amount must be less than To Amount');
  if (dto.commissionPercentage === undefined || dto.commissionPercentage < 0 || dto.commissionPercentage > 100)
    errors.push('Commission Percentage must be between 0 and 100');
  const overlap = checkSlabOverlap(dto, existingSlabs, excludeId);
  if (overlap.exists) errors.push('Commission slabs cannot overlap for the same salesperson and city');
  return { isValid: errors.length === 0, errors };
};

export const checkSlabOverlap = (
  newSlab: CreateCommissionSlabDTO | UpdateCommissionSlabDTO,
  existingSlabs: CommissionSlab[],
  excludeId?: string
): SlabOverlap => {
  const conflictingSlab = existingSlabs.find(slab => {
    if (excludeId && slab.id === excludeId) return false;
    if (slab.salesperson !== newSlab.salesperson) return false;
    if (slab.city        !== newSlab.city)        return false;
    const newFrom = newSlab.fromAmount ?? slab.fromAmount;
    const newTo   = newSlab.toAmount   ?? slab.toAmount;
    return (
      (newFrom >= slab.fromAmount && newFrom < slab.toAmount) ||
      (newTo   >  slab.fromAmount && newTo   <= slab.toAmount) ||
      (newFrom <= slab.fromAmount && newTo   >= slab.toAmount)
    );
  });
  return { exists: !!conflictingSlab, conflictingSlab };
};

export const filterCommissions = (commissions: Commission[], filter: CommissionFilter): Commission[] => {
  return commissions.filter(c => {
    if (filter.salesperson && !c.salespersonName.toLowerCase().includes(filter.salesperson.toLowerCase())) return false;
    if (filter.city        && !c.city.toLowerCase().includes(filter.city.toLowerCase())) return false;
    if (filter.month       && !c.month.includes(filter.month)) return false;
    if (filter.status      && c.status !== filter.status)       return false;
    return true;
  });
};

export const getCommissionStats = (commissions: Commission[]): CommissionStats => {
  const totalAmount = commissions.reduce((sum, c) => sum + (c.overriddenCommissionAmount || c.calculatedCommissionAmount), 0);
  const totalRate   = commissions.reduce((sum, c) => sum + (c.overriddenCommissionPercentage || c.commissionPercentage), 0);
  return {
    totalCommissions: commissions.length,
    totalAmount,
    confirmedCount:   commissions.filter(c => c.status === 'Confirmed').length,
    adjustedCount:    commissions.filter(c => c.status === 'Adjusted').length,
    calculatedCount:  commissions.filter(c => c.status === 'Calculated').length,
    averageRate:      commissions.length > 0 ? totalRate / commissions.length : 0,
  };
};

export const exportCommissionsToCSV = (commissions: Commission[]): string => {
  const headers = ['Salesperson', 'City', 'Month', 'Invoices', 'Total Sales', 'Applied Slab From',
    'Applied Slab To', 'Commission %', 'Commission Amount', 'Status', 'Calculated By',
    'Confirmed By', 'Calculated At', 'Confirmed At'];
  const rows = commissions.map(c => [
    c.salespersonName, c.city, formatMonth(c.month), c.invoiceCount ?? 0,
    c.totalSales, c.appliedSlabFrom, c.appliedSlabTo,
    c.overriddenCommissionPercentage ?? c.commissionPercentage,
    c.overriddenCommissionAmount     ?? c.calculatedCommissionAmount,
    c.status, c.calculatedBy, c.confirmedBy || '',
    new Date(c.calculatedAt).toLocaleDateString(),
    c.confirmedAt ? new Date(c.confirmedAt).toLocaleDateString() : '',
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};