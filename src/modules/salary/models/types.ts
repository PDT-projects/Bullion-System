// Salary Module - Model Layer
// Data interfaces and types

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

export interface UpdateSalaryDTO extends CreateSalaryDTO {
  id: string;
}

export interface SalaryFilters {
  searchTerm: string;
  typeFilter: 'all' | 'regular' | 'advance';
  dateFrom: string | null;
  dateTo: string | null;
  employeeFilter: string;
  monthFilter: string;
  paymentMethodFilter: '' | 'Cash' | 'Bank' | 'Cheque';
}

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

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
  fieldErrors?: { [key: string]: string };
}

export interface EmployeeInfo {
  id: string;
  name: string;
  salary: number;
  position: string;
}

export const SALARY_TYPES = {
  REGULAR: 'Employee salary' as const,
  ADVANCE: 'Advance salary' as const
};

export const PAYMENT_METHODS = ['Cash', 'Bank', 'Cheque'] as const;
export const PAYMENT_STATUSES = ['Full', 'Partial'] as const;