/**
 * Loans Module - Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the Loans module.
 */

// Import from App.tsx
import type { Loan as AppLoan, Bank, Employee } from '../../../App';

// Re-export for convenience
export type { Bank, Employee };

// Local type definitions
export interface PaymentRecord {
  id: string;
  amount: number;
  mode: 'Cash' | 'Bank Transfer';
  date: string;
  bankId?: string;
  bankName?: string;
}

// Loan Types

export type LoanType = 'Payable' | 'Receivable';
export type LoanCategory = 'Official' | 'Personal' | 'Other';
export type LoanStatus = 'Full' | 'Partial';
export type PaymentMode = 'Cash' | 'Bank';

// Receiver Types
export type ReceiverType = 'Employee' | 'Person';

// Filter Types
export interface LoanFilters {
  searchTerm: string;
  type: LoanType | 'all';
  status: LoanStatus | 'all';
  loanCategory: LoanCategory | 'all';
  dateFrom?: string;
  dateTo?: string;
}

// Sort Options
export type LoanSortField = 'date' | 'loanAmount' | 'paid' | 'remaining' | 'entityName';
export type SortOrder = 'asc' | 'desc';

// DTOs for Create/Update
export interface CreateLoanDTO {
  entityName: string;
  loanAmount: number;
  paid: number;
  date: string;
  type: LoanType;
  loanType: LoanCategory;
  mode: PaymentMode;
  bankId?: string;
  bankName?: string;
  receiverType: ReceiverType;
  receiverName: string;
  receiverId?: string;
  receiverPhone?: string;
  employeeId?: string;
  employeeName?: string;
  notes?: string;
}

export interface UpdateLoanDTO extends Partial<CreateLoanDTO> {
  id: string;
}

// Payment DTO
export interface MakePaymentDTO {
  loanId: string;
  amount: number;
  mode: PaymentMode;
  bankId?: string;
  bankName?: string;
  date?: string;
}

// Statistics
export interface LoanStatistics {
  totalLoans: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  payableCount: number;
  receivableCount: number;
  fullCount: number;
  partialCount: number;
  officialCount: number;
  personalCount: number;
  otherCount: number;
  averageLoanAmount: number;
  collectionRate: number; // percentage of total paid
}

// Re-export Loan type
export type Loan = AppLoan;

// Loan with extended info for UI
export interface LoanViewModel extends Loan {
  progressPercentage: number; // paid / loanAmount * 100
  isOverdue: boolean;
  daysSinceCreated: number;
}


// Validation Errors
export interface LoanValidationErrors {
  entityName?: string;
  loanAmount?: string;
  paid?: string;
  date?: string;
  type?: string;
  loanType?: string;
  mode?: string;
  bankId?: string;
  receiverType?: string;
  receiverName?: string;
}

// Form State
export interface LoanFormState {
  entityName: string;
  loanAmount: string;
  paid: string;
  date: string;
  type: LoanType;
  loanType: LoanCategory;
  mode: PaymentMode;
  bankId: string;
  receiverType: ReceiverType;
  receiverName: string;
  receiverId: string;
  receiverPhone: string;
  employeeId: string;
}


// Payment Form State
export interface PaymentFormState {
  amount: string;
  mode: PaymentMode;
  bankId: string;
}

// Dashboard Card
export interface LoanDashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  path: string;
  color: 'blue' | 'red' | 'green' | 'purple' | 'orange';
  count?: number;
  amount?: number;
}

// Quick Action
export interface LoanQuickAction {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  path: string;
  color: 'red' | 'green';
}

// Export/Import
export interface LoanExportData {
  loans: AppLoan[];
  exportedAt: string;
  totalCount: number;
  totalAmount: number;
}


// API Response Types (for future backend integration)
export interface LoanApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface LoanListResponse {
  loans: AppLoan[];
  total: number;
  page: number;
  pageSize: number;
  statistics: LoanStatistics;
}

// Search Result
export interface LoanSearchResult {
  loan: AppLoan;
  relevanceScore: number;
  matchedFields: string[];
}


// Comparison Data
export interface LoanComparisonData {
  period: string;
  payableAmount: number;
  receivableAmount: number;
  netPosition: number; // receivable - payable
}
