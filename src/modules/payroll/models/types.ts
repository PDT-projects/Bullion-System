// Payroll Module - Unified Type Definitions
// Merges Salary + Commission types under one module

// ─── Re-export salary types ───────────────────────────────────────────────────

export interface SalaryTransaction {
  id: string;
  amount: number;
  paidBy: string;
  transactionBy: string;
  mode: 'Cash' | 'Bank' | 'Cheque';
  bankId: string;
  bankName: string;
  chequeNumber: string;
  chequeDate: string;
  chequeBank: string;
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
  bankId?: string;
  bankName: string;
  chequeNumber?: string;
  chequeDate?: string;
  chequeBank?: string;
  paidBy: string;
  transactionBy: string;
  salaryMonth: string;
  note: string;
  imageUrl: string;
  paymentStatus: 'Full' | 'Partial';
  remainingAmount: number;
  salaryCurrency?: 'PKR' | 'AED';
  salaryAED?: number;
  salaryPKR?: number;
  createdAt?: string;
  updatedAt?: string;
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

export interface EmployeeInfo {
  id: string;
  name: string;
  salary: number;
  position: string;
}

export const SALARY_TYPES = {
  REGULAR: 'Employee salary' as const,
  ADVANCE: 'Advance salary' as const,
};

export const PAYMENT_METHODS = ['Cash', 'Bank', 'Cheque'] as const;
export const PAYMENT_STATUSES = ['Full', 'Partial'] as const;

// ─── Re-export commission types ───────────────────────────────────────────────

export type CommissionStatus = 'Calculated' | 'Adjusted' | 'Confirmed';

export interface CommissionSlab {
  id: string;
  salesperson: string;
  city: string;
  fromAmount: number;
  toAmount: number;
  commissionPercentage: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Commission {
  id: string;
  salesperson: string;
  salespersonName: string;
  city: string;
  month: string;
  totalSales: number;
  invoiceCount: number;
  appliedSlabFrom: number;
  appliedSlabTo: number;
  commissionPercentage: number;
  calculatedCommissionAmount: number;
  overriddenCommissionPercentage?: number;
  overriddenCommissionAmount?: number;
  status: CommissionStatus;
  calculatedBy: string;
  confirmedBy?: string;
  calculatedAt: string;
  confirmedAt?: string;
  isLocked: boolean;
}

export interface CreateCommissionSlabDTO {
  salesperson: string;
  city: string;
  fromAmount: number;
  toAmount: number;
  commissionPercentage: number;
}

export interface UpdateCommissionSlabDTO {
  id: string;
  salesperson?: string;
  city?: string;
  fromAmount?: number;
  toAmount?: number;
  commissionPercentage?: number;
}

export interface CreateCommissionDTO {
  salesperson: string;
  salespersonName: string;
  city: string;
  month: string;
  totalSales: number;
  invoiceCount: number;
  appliedSlabFrom: number;
  appliedSlabTo: number;
  commissionPercentage: number;
  calculatedCommissionAmount: number;
  calculatedBy: string;
}

export interface UpdateCommissionDTO {
  id: string;
  overriddenCommissionPercentage?: number;
  overriddenCommissionAmount?: number;
  status?: CommissionStatus;
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface CommissionSlabFilter {
  salesperson?: string;
  city?: string;
}

export interface CommissionFilter {
  salesperson?: string;
  city?: string;
  month?: string;
  status?: CommissionStatus;
}

export interface CommissionStats {
  totalCommissions: number;
  totalAmount: number;
  confirmedCount: number;
  adjustedCount: number;
  calculatedCount: number;
  averageRate: number;
}

export interface CommissionCalculationResult {
  commissions: Commission[];
  errors: string[];
  summary: {
    totalSalespeople: number;
    totalSales: number;
    totalCommission: number;
    totalInvoicesUsed: number;
  };
}

export interface InvoiceReference {
  id: string;
  date: string;
  customerCity: string;
  salespersonLocation?: string;
  branch?: string;
  totalAmount: number;
  status: 'Paid' | 'Unpaid';
  salesperson?: string;
}

export interface EmployeeReference {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface ValidationResult {
  isValid: boolean;
  error?: string | null;
  errors?: string[];
  fieldErrors?: { [key: string]: string };
}

export interface SlabOverlap {
  exists: boolean;
  conflictingSlab?: CommissionSlab;
}