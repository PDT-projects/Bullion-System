// Salary Module - Model Layer
// Data interfaces and types

/**
 * Salary transaction entity representing a salary payment
 */
export interface SalaryTransaction {
  id: string;
  amount: number;
  paidBy: string;
  transactionBy: string;
  mode: 'Cash' | 'Bank' | 'Cheque';
  bankName: string;
  imageUrl: string;
  paymentStatus: 'Full' | 'Partial';
  remainingAmount: number;
  salaryMonth: string;
}

/**
 * Salary entity representing a salary payment record
 */
export interface Salary {
  id: string;
  transactionId: string;
  date: string;
  time: string;
  employeeId: string;
  employeeName: string;
  mainCategory: 'Salary';
  subCategory: 'Employee salary' | 'Advance salary';
  amount: number;
  baseSalary: number;
  commission: number;
  deductions: number;
  netAmount: number;
  mode: 'Cash' | 'Bank' | 'Cheque';
  bankName: string;
  paidBy: string;
  transactionBy: string;
  salaryMonth: string;
  note: string;
  imageUrl: string;
  paymentStatus: 'Full' | 'Partial';
  remainingAmount: number;
}

/**
 * DTO for creating a new salary payment
 */
export interface CreateSalaryDTO {
  employeeId: string;
  date: string;
  subCategory: 'Employee salary' | 'Advance salary';
  note: string;
  baseSalary: number;
  commission: number;
  deductions: number;
  transactions: SalaryTransaction[];
}

/**
 * DTO for updating an existing salary
 */
export interface UpdateSalaryDTO extends CreateSalaryDTO {
  id: string;
}

/**
 * Filter criteria for salary list
 */
export interface SalaryFilters {
  searchTerm: string;
  typeFilter: 'all' | 'regular' | 'advance';
  dateFrom: string | null;
  dateTo: string | null;
  employeeFilter: string;
  monthFilter: string;
  paymentMethodFilter: '' | 'Cash' | 'Bank' | 'Cheque';
}

/**
 * Salary statistics for dashboard/display
 */
export interface SalaryStats {
  totalRecords: number;
  totalAmount: number;
  regularCount: number;
  regularTotal: number;
  advanceCount: number;
  advanceTotal: number;
  thisMonthTotal: number;
  pendingSlips: number;
  cashTotal: number;
  bankTotal: number;
  chequeTotal: number;
}

/**
 * Validation result for salary data
 */
export interface ValidationResult {
  isValid: boolean;
  error: string | null;
  fieldErrors?: { [key: string]: string };
}

/**
 * Employee info for salary context
 */
export interface EmployeeInfo {
  id: string;
  name: string;
  salary: number;
  position: string;
}

/**
 * Predefined salary types
 */
export const SALARY_TYPES = {
  REGULAR: 'Employee salary' as const,
  ADVANCE: 'Advance salary' as const
};

/**
 * Payment methods
 */
export const PAYMENT_METHODS = ['Cash', 'Bank', 'Cheque'] as const;

/**
 * Payment statuses
 */
export const PAYMENT_STATUSES = ['Full', 'Partial'] as const;
