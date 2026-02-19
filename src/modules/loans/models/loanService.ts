/**
 * Loans Module - Business Logic Service
 * 
 * This file contains all business logic for loan operations including:
 * - CRUD operations
 * - Payment processing with bank balance updates
 * - Validation
 * - Statistics calculation
 * - Filtering and sorting
 */

import type { 
  Loan, 
  Bank, 
  Employee, 
  CreateLoanDTO, 
  UpdateLoanDTO, 
  MakePaymentDTO,
  LoanFilters,
  LoanStatistics,
  LoanValidationErrors,
  LoanSortField,
  SortOrder,
  LoanType,
  LoanStatus,
  PaymentRecord
} from './types';

// Storage Keys
const STORAGE_KEY = 'loans_data';
const PAYMENT_HISTORY_KEY = 'loan_payments_history';

// Format currency in PKR
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get days difference
export const getDaysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Check if loan is overdue (more than 90 days for partial loans)
export const isLoanOverdue = (loan: Loan): boolean => {
  if (loan.status === 'Full') return false;
  const days = getDaysSince(loan.date);
  return days > 90;
};

// Calculate progress percentage
export const calculateProgress = (loan: Loan): number => {
  if (loan.loanAmount === 0) return 0;
  return Math.round((loan.paid / loan.loanAmount) * 100);
};

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Generate payment ID
const generatePaymentId = (): string => {
  return `PAY-${Date.now().toString(36).toUpperCase()}`;
};

// ==================== STORAGE OPERATIONS ====================

// Get all loans from storage
export const getAllLoans = (): Loan[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading loans:', error);
    return [];
  }
};

// Save loans to storage
export const saveLoans = (loans: Loan[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
  } catch (error) {
    console.error('Error saving loans:', error);
  }
};

// Get payment history
export const getPaymentHistory = (): Record<string, PaymentRecord[]> => {
  try {
    const data = localStorage.getItem(PAYMENT_HISTORY_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading payment history:', error);
    return {};
  }
};

// Save payment history
export const savePaymentHistory = (history: Record<string, PaymentRecord[]>): void => {
  try {
    localStorage.setItem(PAYMENT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving payment history:', error);
  }
};

// ==================== VALIDATION ====================

export const validateLoan = (dto: CreateLoanDTO, existingLoans: Loan[], excludeId?: string): LoanValidationErrors => {
  const errors: LoanValidationErrors = {};

  // Entity name validation
  if (!dto.entityName || dto.entityName.trim().length === 0) {
    errors.entityName = 'Entity name is required';
  } else if (dto.entityName.trim().length < 2) {
    errors.entityName = 'Entity name must be at least 2 characters';
  }

  // Loan amount validation
  if (!dto.loanAmount || dto.loanAmount <= 0) {
    errors.loanAmount = 'Loan amount must be greater than 0';
  }

  // Paid amount validation
  if (dto.paid < 0) {
    errors.paid = 'Paid amount cannot be negative';
  } else if (dto.paid > dto.loanAmount) {
    errors.paid = 'Paid amount cannot exceed loan amount';
  }

  // Date validation
  if (!dto.date) {
    errors.date = 'Date is required';
  } else {
    const loanDate = new Date(dto.date);
    const today = new Date();
    if (loanDate > today) {
      errors.date = 'Date cannot be in the future';
    }
  }

  // Type validation
  if (!dto.type || !['Payable', 'Receivable'].includes(dto.type)) {
    errors.type = 'Valid loan type is required';
  }

  // Loan category validation
  if (!dto.loanType || !['Official', 'Personal', 'Other'].includes(dto.loanType)) {
    errors.loanType = 'Valid loan category is required';
  }

  // Payment mode validation
  if (!dto.mode || !['Cash', 'Bank'].includes(dto.mode)) {
    errors.mode = 'Valid payment mode is required';
  }

  // Bank validation for bank mode
  if (dto.mode === 'Bank' && !dto.bankId) {
    errors.bankId = 'Bank account is required for bank payments';
  }

  // Receiver validation
  if (!dto.receiverType || !['Employee', 'Person'].includes(dto.receiverType)) {
    errors.receiverType = 'Valid receiver type is required';
  }

  if (!dto.receiverName || dto.receiverName.trim().length === 0) {
    errors.receiverName = 'Receiver name is required';
  }

  return errors;
};

// ==================== CRUD OPERATIONS ====================

// Create new loan
export const createLoan = (
  dto: CreateLoanDTO, 
  existingLoans: Loan[], 
  banks: Bank[],
  setBanks?: (banks: Bank[]) => void
): { success: boolean; loan?: Loan; error?: string; updatedBanks?: Bank[] } => {
  
  // Validate
  const errors = validateLoan(dto, existingLoans);
  if (Object.keys(errors).length > 0) {
    return { success: false, error: Object.values(errors)[0] };
  }

  // Calculate remaining and status
  const remaining = dto.loanAmount - dto.paid;
  const status: LoanStatus = remaining === 0 ? 'Full' : 'Partial';

  // Create loan object
  const newLoan: Loan = {
    id: generateId(),
    entityName: dto.entityName.trim(),
    receiverName: dto.receiverName.trim(),
    receiverType: dto.receiverType,
    loanAmount: dto.loanAmount,
    paid: dto.paid,
    remaining,
    type: dto.type,
    loanType: dto.loanType,
    status,
    date: dto.date,
    mode: dto.mode,
    bankId: dto.mode === 'Bank' ? dto.bankId : undefined,
    bankName: dto.mode === 'Bank' ? dto.bankName : undefined,
    employeeId: dto.employeeId,
    employeeName: dto.employeeName,
    receiverId: dto.receiverId,
    receiverPhone: dto.receiverPhone,
    paymentHistory: dto.paid > 0 ? [{
      id: generatePaymentId(),
      amount: dto.paid,
      mode: dto.mode === 'Bank' ? 'Bank Transfer' : 'Cash',
      date: dto.date,
      bankId: dto.bankId,
      bankName: dto.bankName
    }] : []
  };

  // Update bank balance if bank mode
  let updatedBanks = banks;
  if (dto.mode === 'Bank' && dto.bankId && setBanks) {
    const bank = banks.find(b => b.id === dto.bankId);
    if (!bank) {
      return { success: false, error: 'Selected bank not found' };
    }

    // For Payable: money comes IN (increase balance)
    // For Receivable: money goes OUT (decrease balance)
    const adjustment = dto.type === 'Payable' ? dto.loanAmount : -dto.loanAmount;
    const newBalance = bank.balance + adjustment;

    if (dto.type === 'Receivable' && newBalance < 0) {
      return { success: false, error: 'Insufficient bank balance for this loan' };
    }

    updatedBanks = banks.map(b => {
      if (b.id === dto.bankId) {
        return { ...b, balance: newBalance };
      }
      return b;
    });

    setBanks(updatedBanks);
  }

  // Save loan
  const updatedLoans = [...existingLoans, newLoan];
  saveLoans(updatedLoans);

  return { success: true, loan: newLoan, updatedBanks };
};

// Update loan
export const updateLoan = (
  dto: UpdateLoanDTO,
  existingLoans: Loan[],
  banks: Bank[],
  setBanks?: (banks: Bank[]) => void
): { success: boolean; loan?: Loan; error?: string; updatedBanks?: Bank[] } => {
  
  const existingLoan = existingLoans.find(l => l.id === dto.id);
  if (!existingLoan) {
    return { success: false, error: 'Loan not found' };
  }

  // Validate
  const errors = validateLoan(dto as CreateLoanDTO, existingLoans, dto.id);
  if (Object.keys(errors).length > 0) {
    return { success: false, error: Object.values(errors)[0] };
  }

  // Calculate remaining and status
  const loanAmount = dto.loanAmount ?? existingLoan.loanAmount;
  const paid = dto.paid ?? existingLoan.paid;
  const remaining = loanAmount - paid;
  const status: LoanStatus = remaining === 0 ? 'Full' : 'Partial';

  // Handle bank balance adjustments if amount changed
  let updatedBanks = banks;
  if (setBanks && dto.loanAmount !== undefined && dto.loanAmount !== existingLoan.loanAmount) {
    const oldBankId = existingLoan.bankId;
    const newBankId = dto.bankId || oldBankId;
    const newLoanAmount = dto.loanAmount;
    
    if (oldBankId && newBankId) {
      const loanType = dto.type || existingLoan.type;
      
      // Reverse old transaction and apply new
      updatedBanks = banks.map(b => {
        if (b.id === oldBankId) {
          // Reverse old
          const oldAdjustment = existingLoan.type === 'Payable' ? -existingLoan.loanAmount : existingLoan.loanAmount;
          return { ...b, balance: b.balance + oldAdjustment };
        }
        if (b.id === newBankId) {
          // Apply new
          const adjustmentAmount = loanType === 'Payable' ? newLoanAmount : -newLoanAmount;
          return { ...b, balance: b.balance + adjustmentAmount };
        }
        return b;
      });

      setBanks(updatedBanks);
    }
  }



  // Update loan
  const updatedLoan: Loan = {
    ...existingLoan,
    ...dto,
    remaining,
    status,
    paymentHistory: existingLoan.paymentHistory || []
  };

  const updatedLoans = existingLoans.map(l => l.id === dto.id ? updatedLoan : l);
  saveLoans(updatedLoans);

  return { success: true, loan: updatedLoan, updatedBanks };
};

// Delete loan
export const deleteLoan = (
  loanId: string,
  existingLoans: Loan[],
  banks: Bank[],
  setBanks?: (banks: Bank[]) => void
): { success: boolean; error?: string; updatedBanks?: Bank[] } => {
  
  const loanToDelete = existingLoans.find(l => l.id === loanId);
  if (!loanToDelete) {
    return { success: false, error: 'Loan not found' };
  }

  // Reverse bank transaction if it was a bank loan
  let updatedBanks = banks;
  if (loanToDelete.mode === 'Bank' && loanToDelete.bankId && setBanks) {
    // Reverse: add back if receivable (money went out), deduct if payable (money came in)
    const adjustment = loanToDelete.type === 'Receivable' ? loanToDelete.loanAmount : -loanToDelete.loanAmount;
    
    updatedBanks = banks.map(bank => {
      if (bank.id === loanToDelete.bankId) {
        return { ...bank, balance: bank.balance + adjustment };
      }
      return bank;
    });

    setBanks(updatedBanks);
  }

  // Remove loan
  const updatedLoans = existingLoans.filter(l => l.id !== loanId);
  saveLoans(updatedLoans);

  return { success: true, updatedBanks };
};

// ==================== PAYMENT OPERATIONS ====================

// Make payment on loan
export const makePayment = (
  dto: MakePaymentDTO,
  existingLoans: Loan[],
  banks: Bank[],
  setBanks?: (banks: Bank[]) => void
): { success: boolean; loan?: Loan; error?: string; updatedBanks?: Bank[] } => {
  
  const loan = existingLoans.find(l => l.id === dto.loanId);
  if (!loan) {
    return { success: false, error: 'Loan not found' };
  }

  // Validate payment amount
  if (!dto.amount || dto.amount <= 0) {
    return { success: false, error: 'Payment amount must be greater than 0' };
  }

  if (dto.amount > loan.remaining) {
    return { success: false, error: 'Payment amount cannot exceed remaining balance' };
  }

  // Validate bank selection for bank payments
  if (dto.mode === 'Bank' && !dto.bankId) {
    return { success: false, error: 'Please select a bank account' };
  }

  const bank = dto.bankId ? banks.find(b => b.id === dto.bankId) : undefined;
  
  // Validate bank balance for payable loans (money goes OUT)
  if (dto.mode === 'Bank' && bank && loan.type === 'Payable') {
    if (bank.balance < dto.amount) {
      return { success: false, error: 'Insufficient bank balance for this payment' };
    }
  }

  // Update bank balance
  let updatedBanks = banks;
  if (dto.mode === 'Bank' && dto.bankId && bank && setBanks) {
    updatedBanks = banks.map(b => {
      if (b.id === dto.bankId) {
        // For Payable: money goes OUT (decrease balance)
        // For Receivable: money comes IN (increase balance)
        const adjustment = loan.type === 'Payable' ? -dto.amount : dto.amount;
        return { ...b, balance: b.balance + adjustment };
      }
      return b;
    });

    setBanks(updatedBanks);
  }

  // Create payment record
  const paymentRecord: PaymentRecord = {
    id: generatePaymentId(),
    amount: dto.amount,
    mode: dto.mode === 'Bank' ? 'Bank Transfer' : 'Cash',
    date: dto.date || new Date().toISOString().split('T')[0],
    bankId: dto.bankId,
    bankName: dto.bankName || bank?.name
  };

  // Update loan
  const newPaid = loan.paid + dto.amount;
  const newRemaining = loan.loanAmount - newPaid;
  const newStatus: LoanStatus = newRemaining === 0 ? 'Full' : 'Partial';

  const updatedLoan: Loan = {
    ...loan,
    paid: newPaid,
    remaining: newRemaining,
    status: newStatus,
    paymentHistory: [...(loan.paymentHistory || []), paymentRecord]
  };

  const updatedLoans = existingLoans.map(l => l.id === dto.loanId ? updatedLoan : l);
  saveLoans(updatedLoans);

  return { success: true, loan: updatedLoan, updatedBanks };
};

// ==================== FILTERING & SORTING ====================

// Filter loans
export const filterLoans = (loans: Loan[], filters: LoanFilters): Loan[] => {
  return loans.filter(loan => {
    // Search term
    const matchesSearch = !filters.searchTerm || 
      loan.receiverName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      loan.entityName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      loan.bankName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      loan.employeeName?.toLowerCase().includes(filters.searchTerm.toLowerCase());

    // Type filter
    const matchesType = filters.type === 'all' || loan.type === filters.type;

    // Status filter
    const matchesStatus = filters.status === 'all' || loan.status === filters.status;

    // Loan category filter
    const matchesCategory = filters.loanCategory === 'all' || loan.loanType === filters.loanCategory;

    // Date range
    const matchesDateFrom = !filters.dateFrom || loan.date >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || loan.date <= filters.dateTo;

    return matchesSearch && matchesType && matchesStatus && matchesCategory && matchesDateFrom && matchesDateTo;
  });
};

// Sort loans
export const sortLoans = (
  loans: Loan[], 
  sortField: LoanSortField, 
  sortOrder: SortOrder
): Loan[] => {
  return [...loans].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'loanAmount':
        comparison = a.loanAmount - b.loanAmount;
        break;
      case 'paid':
        comparison = a.paid - b.paid;
        break;
      case 'remaining':
        comparison = a.remaining - b.remaining;
        break;
      case 'entityName':
        comparison = (a.entityName || '').localeCompare(b.entityName || '');
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

// ==================== STATISTICS ====================

// Calculate loan statistics
export const calculateStatistics = (loans: Loan[]): LoanStatistics => {
  const totalLoans = loans.length;
  const totalAmount = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
  const totalPaid = loans.reduce((sum, loan) => sum + loan.paid, 0);
  const totalRemaining = loans.reduce((sum, loan) => sum + loan.remaining, 0);

  return {
    totalLoans,
    totalAmount,
    totalPaid,
    totalRemaining,
    payableCount: loans.filter(l => l.type === 'Payable').length,
    receivableCount: loans.filter(l => l.type === 'Receivable').length,
    fullCount: loans.filter(l => l.status === 'Full').length,
    partialCount: loans.filter(l => l.status === 'Partial').length,
    officialCount: loans.filter(l => l.loanType === 'Official').length,
    personalCount: loans.filter(l => l.loanType === 'Personal').length,
    otherCount: loans.filter(l => l.loanType === 'Other').length,
    averageLoanAmount: totalLoans > 0 ? Math.round(totalAmount / totalLoans) : 0,
    collectionRate: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0
  };
};

// ==================== EXPORT/IMPORT ====================

// Export loans to CSV
export const exportLoansToCSV = (loans: Loan[]): string => {
  const headers = [
    'ID',
    'Entity Name',
    'Receiver Name',
    'Receiver Type',
    'Loan Type',
    'Category',
    'Amount',
    'Paid',
    'Remaining',
    'Status',
    'Date',
    'Payment Mode',
    'Bank Name',
    'Employee Name'
  ];

  const rows = loans.map(loan => [
    loan.id,
    loan.entityName,
    loan.receiverName,
    loan.receiverType,
    loan.type,
    loan.loanType,
    loan.loanAmount,
    loan.paid,
    loan.remaining,
    loan.status,
    loan.date,
    loan.mode,
    loan.bankName || '',
    loan.employeeName || ''
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Download CSV
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ==================== UTILITY FUNCTIONS ====================

// Get loan by ID
export const getLoanById = (loans: Loan[], id: string): Loan | undefined => {
  return loans.find(l => l.id === id);
};

// Get loans by employee
export const getLoansByEmployee = (loans: Loan[], employeeId: string): Loan[] => {
  return loans.filter(l => l.employeeId === employeeId);
};

// Get loans by type
export const getLoansByType = (loans: Loan[], type: LoanType): Loan[] => {
  return loans.filter(l => l.type === type);
};

// Get loans by status
export const getLoansByStatus = (loans: Loan[], status: LoanStatus): Loan[] => {
  return loans.filter(l => l.status === status);
};

// Get total receivable amount (what others owe us)
export const getTotalReceivable = (loans: Loan[]): number => {
  return loans
    .filter(l => l.type === 'Receivable')
    .reduce((sum, l) => sum + l.remaining, 0);
};

// Get total payable amount (what we owe others)
export const getTotalPayable = (loans: Loan[]): number => {
  return loans
    .filter(l => l.type === 'Payable')
    .reduce((sum, l) => sum + l.remaining, 0);
};

// Get net loan position (receivable - payable)
export const getNetLoanPosition = (loans: Loan[]): number => {
  return getTotalReceivable(loans) - getTotalPayable(loans);
};

// Get overdue loans
export const getOverdueLoans = (loans: Loan[]): Loan[] => {
  return loans.filter(l => isLoanOverdue(l));
};

// Get upcoming payments (due within 30 days)
export const getUpcomingPayments = (loans: Loan[]): Loan[] => {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  return loans.filter(l => {
    if (l.status === 'Full') return false;
    const loanDate = new Date(l.date);
    const daysSince = getDaysSince(l.date);
    // Loans approaching 90 days (overdue threshold)
    return daysSince > 60 && daysSince <= 90;
  });
};
