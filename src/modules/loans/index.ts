/**
 * Loans Module - MVVM Architecture
 * 
 * Complete loans management module with MVVM pattern.
 * Supports payable and receivable loans with bank integration.
 */

// Models
export type {
  Loan,
  Bank,
  Employee,
  LoanType,
  LoanCategory,
  PaymentMode,
  ReceiverType,
  LoanStatus,
  LoanFormState,
  PaymentFormState,
  LoanFilters,
  LoanSortField,
  SortOrder,
  LoanStatistics,
  LoanDashboardCard,
  LoanQuickAction,
  CreateLoanDTO,
  UpdateLoanDTO,
  MakePaymentDTO,
  LoanValidationErrors
} from './models/types';

export {
  getAllLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
  makePayment,
  validateLoan,
  filterLoans,
  sortLoans,
  calculateProgress,
  formatCurrency,
  formatDate,
  exportLoansToCSV
} from './models/loanService';

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

// Wrappers (Container Components)
export { LoanDashboardWrapper } from './views/LoanDashboardWrapper';
export { LoanListWrapper } from './views/LoanListWrapper';
export { LoanFormWrapper } from './views/LoanFormWrapper';
export { LoanPaymentWrapper } from './views/LoanPaymentWrapper';
