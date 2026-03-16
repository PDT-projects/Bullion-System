// Transactions Module - Public API

// Models
export type {
  Transaction, PartialPayment, Attachment, TransactionItem,
  TransactionFilters, TransactionStats, PendingPaymentData,
} from './models/types';
export { COMPANIES, MAIN_CATEGORIES, SUB_CATEGORIES } from './models/types';
export { TransactionFirebaseService } from './models/transactionFirebaseService';
export {
  getTransactionTotals, isPending, filterTransactions, calculateStats,
  formatCurrency, formatDate, formatDateTime, getCategoryColor, getPaymentStatusColor,
  exportToCSV, downloadCSV,
} from './models/transactionsService';

// ViewModels
export { useTransactionListViewModel }   from './viewModels/useTransactionListViewModel';
export { useTransactionFormViewModel }   from './viewModels/useTransactionFormViewModel';
export { usePendingPaymentsViewModel }   from './viewModels/usePendingPaymentsViewModel';

// Views
export { TransactionListView }    from './views/TransactionListView';
export { TransactionFormView }    from './views/TransactionFormView';
export { PendingPaymentsView }    from './views/PendingPaymentsView';

// Wrappers
export { TransactionListWrapper }    from './views/TransactionListWrapper';
export { TransactionCreateWrapper }  from './views/TransactionCreateWrapper';
export { TransactionEditWrapper }    from './views/TransactionEditWrapper';
export { TransactionDeleteWrapper }  from './views/TransactionDeleteWrapper';
export { PendingPaymentsWrapper }    from './views/PendingPaymentsWrapper';