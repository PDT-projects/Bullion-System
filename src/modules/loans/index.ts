/**
 * Loans Module - Public API
 */

// Models
export * from './models/types';
export { LoanFirebaseService } from './models/loanFirebaseService';
export { formatCurrency, formatDate, calculateProgress, calculateStatistics, filterLoans, sortLoans, validateLoan, exportLoansToCSV, downloadCSV, getTotalReceivable, getTotalPayable, getNetLoanPosition, getOverdueLoans, getUpcomingPayments } from './models/loanService';

// ViewModels
export { useLoanDashboardViewModel } from './viewModels/useLoanDashboardViewModel';
export { useLoanListViewModel } from './viewModels/useLoanListViewModel';
export { useLoanFormViewModel } from './viewModels/useLoanFormViewModel';
export { useLoanPaymentViewModel } from './viewModels/useLoanPaymentViewModel';

// Views
export { LoanDashboardView } from './views/LoanDashboardView';
export { LoanListView } from './views/LoanListView';
export { LoanFormView } from './views/LoanFormView';
export { LoanPaymentView } from './views/LoanPaymentView';

// Wrappers
export { LoanDashboardWrapper } from './views/LoanDashboardWrapper';
export { LoanListWrapper } from './views/LoanListWrapper';
export { LoanFormWrapper } from './views/LoanFormWrapper';
export { LoanPaymentWrapper } from './views/LoanPaymentWrapper';