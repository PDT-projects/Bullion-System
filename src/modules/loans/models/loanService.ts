/**
 * Loans Module - Business Logic Service
 * Pure functions: filtering, sorting, validation, statistics, formatting.
 * No localStorage. No Firestore calls. All persistence goes through LoanFirebaseService.
 */

import type {
  Loan,
  CreateLoanDTO,
  LoanFilters,
  LoanStatistics,
  LoanValidationErrors,
  LoanSortField,
  SortOrder,
  LoanStatus,
} from './types';

// ==================== FORMATTING ====================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// ==================== UTILITIES ====================

export const getDaysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  return Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
};

export const isLoanOverdue = (loan: Loan): boolean => {
  if (loan.status === 'Full') return false;
  return getDaysSince(loan.date) > 90;
};

export const calculateProgress = (loan: Loan): number => {
  if (loan.loanAmount === 0) return 0;
  return Math.round((loan.paid / loan.loanAmount) * 100);
};

export const getLoanById = (loans: Loan[], id: string): Loan | undefined =>
  loans.find(l => l.id === id);

export const getTotalReceivable = (loans: Loan[]): number =>
  loans.filter(l => l.type === 'Receivable').reduce((sum, l) => sum + l.remaining, 0);

export const getTotalPayable = (loans: Loan[]): number =>
  loans.filter(l => l.type === 'Payable').reduce((sum, l) => sum + l.remaining, 0);

export const getNetLoanPosition = (loans: Loan[]): number =>
  getTotalReceivable(loans) - getTotalPayable(loans);

export const getOverdueLoans = (loans: Loan[]): Loan[] =>
  loans.filter(l => isLoanOverdue(l));

export const getUpcomingPayments = (loans: Loan[]): Loan[] =>
  loans.filter(l => {
    if (l.status === 'Full') return false;
    const days = getDaysSince(l.date);
    return days > 60 && days <= 90;
  });

// ==================== VALIDATION ====================

export const validateLoan = (dto: CreateLoanDTO): LoanValidationErrors => {
  const errors: LoanValidationErrors = {};

  if (!dto.entityName || dto.entityName.trim().length < 2)
    errors.entityName = 'Entity name must be at least 2 characters';

  if (!dto.loanAmount || dto.loanAmount <= 0)
    errors.loanAmount = 'Loan amount must be greater than 0';

  if (dto.paid < 0)
    errors.paid = 'Paid amount cannot be negative';
  else if (dto.paid > dto.loanAmount)
    errors.paid = 'Paid amount cannot exceed loan amount';

  if (!dto.date)
    errors.date = 'Date is required';
  else if (new Date(dto.date) > new Date())
    errors.date = 'Date cannot be in the future';

  if (!['Payable', 'Receivable'].includes(dto.type))
    errors.type = 'Valid loan type is required';

  if (!['Official', 'Personal', 'Other'].includes(dto.loanType))
    errors.loanType = 'Valid loan category is required';

  if (!['Cash', 'Bank'].includes(dto.mode))
    errors.mode = 'Valid payment mode is required';

  if (dto.mode === 'Bank' && !dto.bankId)
    errors.bankId = 'Bank account is required for bank payments';

  if (!['Employee', 'Person'].includes(dto.receiverType))
    errors.receiverType = 'Valid receiver type is required';

  if (!dto.receiverName || dto.receiverName.trim().length === 0)
    errors.receiverName = 'Receiver name is required';

  return errors;
};

// ==================== FILTERING & SORTING ====================

export const filterLoans = (loans: Loan[], filters: LoanFilters): Loan[] => {
  return loans.filter(loan => {
    const matchesSearch =
      !filters.searchTerm ||
      loan.receiverName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      loan.entityName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      loan.bankName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      loan.employeeName?.toLowerCase().includes(filters.searchTerm.toLowerCase());

    const matchesType = filters.type === 'all' || loan.type === filters.type;
    const matchesStatus = filters.status === 'all' || loan.status === filters.status;
    const matchesCategory = filters.loanCategory === 'all' || loan.loanType === filters.loanCategory;
    const matchesDateFrom = !filters.dateFrom || loan.date >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || loan.date <= filters.dateTo;

    return matchesSearch && matchesType && matchesStatus && matchesCategory && matchesDateFrom && matchesDateTo;
  });
};

export const sortLoans = (loans: Loan[], sortField: LoanSortField, sortOrder: SortOrder): Loan[] => {
  return [...loans].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'date':        comparison = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
      case 'loanAmount':  comparison = a.loanAmount - b.loanAmount; break;
      case 'paid':        comparison = a.paid - b.paid; break;
      case 'remaining':   comparison = a.remaining - b.remaining; break;
      case 'entityName':  comparison = (a.entityName || '').localeCompare(b.entityName || ''); break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

// ==================== STATISTICS ====================

export const calculateStatistics = (loans: Loan[]): LoanStatistics => {
  const totalLoans = loans.length;
  const totalAmount = loans.reduce((sum, l) => sum + l.loanAmount, 0);
  const totalPaid = loans.reduce((sum, l) => sum + l.paid, 0);
  const totalRemaining = loans.reduce((sum, l) => sum + l.remaining, 0);

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
    collectionRate: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0,
  };
};

// ==================== EXPORT ====================

export const exportLoansToCSV = (loans: Loan[]): string => {
  const headers = ['ID','Entity Name','Receiver Name','Receiver Type','Loan Type','Category','Amount','Paid','Remaining','Status','Date','Payment Mode','Bank Name','Employee Name'];
  const rows = loans.map(l => [l.id, l.entityName, l.receiverName, l.receiverType, l.type, l.loanType, l.loanAmount, l.paid, l.remaining, l.status, l.date, l.mode, l.bankName || '', l.employeeName || '']);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};