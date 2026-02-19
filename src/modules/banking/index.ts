// Banking Module - Public API
// MVVM Architecture Implementation
// Types
export type {
  Bank,
  BankTransfer,
  CashTransaction,
  BankStats,
  TransferStats,
  CashStats,
  DashboardStats,
  BankFormData,
  TransferFormData,
  BankFilters,
  TransferFilters,
  CashFilters
} from './models/types';

// Service
export { BankingService } from './models/bankingService';

// ViewModels
export { useBankListViewModel } from './viewModels/useBankListViewModel';
export { useBankFormViewModel } from './viewModels/useBankFormViewModel';
export { useBankDeleteViewModel } from './viewModels/useBankDeleteViewModel';
export { useTransferListViewModel } from './viewModels/useTransferListViewModel';
export { useTransferFormViewModel } from './viewModels/useTransferFormViewModel';
export { useBankingDashboardViewModel } from './viewModels/useBankingDashboardViewModel';
export { useCashListViewModel } from './viewModels/useCashListViewModel';
export { useCashFormViewModel } from './viewModels/useCashFormViewModel';

// Views

export { BankListView } from './views/BankListView';
export { BankFormView } from './views/BankFormView';
export { BankDeleteView } from './views/BankDeleteView';
export { TransferListView } from './views/TransferListView';
export { TransferFormView } from './views/TransferFormView';
export { BankingDashboardView } from './views/BankingDashboardView';
export { CashListView } from './views/CashListView';
export { CashFormView } from './views/CashFormView';

// Wrappers

export { BankListWrapper } from './views/BankListWrapper';
export { BankCreateWrapper } from './views/BankCreateWrapper';
export { BankEditWrapper } from './views/BankEditWrapper';
export { BankDeleteWrapper } from './views/BankDeleteWrapper';
export { TransferListWrapper } from './views/TransferListWrapper';
export { TransferCreateWrapper } from './views/TransferCreateWrapper';
export { BankingDashboardWrapper } from './views/BankingDashboardWrapper';
export { CashListWrapper } from './views/CashListWrapper';
export { CashCreateWrapper } from './views/CashCreateWrapper';
