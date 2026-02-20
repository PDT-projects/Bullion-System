// Transactions Module - Public API
// MVVM Architecture Implementation

// Types
export type {
  Transaction,
  PartialPayment,
  Attachment,
  TransactionFormData,
  TransactionItem,
  TransactionFilters,
  TransactionStats,
  PendingPaymentData
} from './models/types';

// Constants
export {
  COMPANIES,
  MAIN_CATEGORIES,
  SUB_CATEGORIES,
  BANKS
} from './models/types';

// Service
export { TransactionService } from './models/transactionsService';

// ViewModels
export { useTransactionListViewModel } from './viewModels/useTransactionListViewModel';
export { useTransactionFormViewModel } from './viewModels/useTransactionFormViewModel';
export { useTransactionDeleteViewModel } from './viewModels/useTransactionDeleteViewModel';
export { usePendingPaymentsViewModel } from './viewModels/usePendingPaymentsViewModel';

// Views
export { TransactionListView } from './views/TransactionListView';
export { TransactionFormView } from './views/TransactionFormView';
export { PendingPaymentsView } from './views/PendingPaymentsView';

// Wrappers
export { TransactionListWrapper } from './views/TransactionListWrapper';
export { TransactionCreateWrapper } from './views/TransactionCreateWrapper';
export { TransactionEditWrapper } from './views/TransactionEditWrapper';
export { TransactionDeleteWrapper } from './views/TransactionDeleteWrapper';
export { PendingPaymentsWrapper } from './views/PendingPaymentsWrapper';
