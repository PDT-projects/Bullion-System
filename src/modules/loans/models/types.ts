/**
 * Loans Module - Type Definitions
 */

export type LoanType = 'Payable' | 'Receivable';
export type LoanCategory = 'Official' | 'Personal' | 'Other';
export type LoanStatus = 'Full' | 'Partial';
export type PaymentMode = 'Cash' | 'Bank';
export type ReceiverType = 'Employee' | 'Person';
export type LoanSortField = 'date' | 'loanAmount' | 'paid' | 'remaining' | 'entityName';
export type SortOrder = 'asc' | 'desc';

export interface PaymentRecord {
  id: string;
  amount: number;
  mode: 'Cash' | 'Bank Transfer';
  date: string;
  bankId?: string;
  bankName?: string;
}

export interface Loan {
  id: string;
  entityName: string;
  receiverName: string;
  receiverType: ReceiverType;
  receiverId?: string;
  receiverPhone?: string;
  loanAmount: number;
  paid: number;
  remaining: number;
  type: LoanType;
  loanType: LoanCategory;
  status: LoanStatus;
  date: string;
  mode: PaymentMode;
  bankId?: string;
  bankName?: string;
  employeeId?: string;
  employeeName?: string;
  notes?: string;
  paymentHistory: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface Bank {
  id: string;
  name: string;
  balance: number;
}

export interface Employee {
  id: string;
  name: string;
}

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

export interface MakePaymentDTO {
  loanId: string;
  amount: number;
  mode: PaymentMode;
  bankId?: string;
  bankName?: string;
  date?: string;
}

export interface LoanFilters {
  searchTerm: string;
  type: LoanType | 'all';
  status: LoanStatus | 'all';
  loanCategory: LoanCategory | 'all';
  dateFrom?: string;
  dateTo?: string;
}

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
  collectionRate: number;
}

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

export interface PaymentFormState {
  amount: string;
  mode: PaymentMode;
  bankId: string;
}

export interface LoanDashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color: 'blue' | 'red' | 'green' | 'purple' | 'orange';
  count?: number;
  amount?: number;
}

export interface LoanQuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color: 'red' | 'green';
}